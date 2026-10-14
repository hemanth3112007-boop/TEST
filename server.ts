import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to run python reviewer CLI and parse JSON
async function runReviewerCli(targetPath: string, extraArgs: string[] = []): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const pythonExe = 'python3';
    const reviewerScript = path.resolve(process.cwd(), 'reviewer.py');
    const args = [reviewerScript, targetPath, ...extraArgs];

    const proc = spawn(pythonExe, args, {
      cwd: process.cwd(),
      env: { ...process.env, GEMINI_API_KEY: apiKey }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode ?? 0 });
    });
  });
}

// Format CLI report string exactly as specified in the assignment
function buildFormattedReport(issues: any[], filename: string): string {
  if (!issues || issues.length === 0) {
    return `[OK] ${filename}: No issues found! Clean code.`;
  }

  return issues.map((iss) => {
    const sev = (iss.severity || 'medium').toUpperCase();
    return `Line ${iss.line} | ${iss.category} | ${iss.entity} [${sev}]\n  Why: ${iss.why}\n  Fix: ${iss.fix}`;
  }).join('\n\n');
}

// Generate code fixes with Gemini
async function getGeminiReviewAndFixes(code: string, issues: any[]) {
  if (!ai || issues.length === 0) return { enrichedIssues: issues, fixedCode: null };

  const issuesSummary = issues.map((iss, index) => ({
    id: index,
    line: iss.line,
    category: iss.category,
    entity: iss.entity,
    rule_id: iss.rule_id,
    severity: iss.severity,
    context: iss.context
  }));

  const prompt = `You are a friendly, senior Python code reviewer assisting with a Python AST analysis.
The following Python AST issues were detected in this code:

\`\`\`python
${code}
\`\`\`

Detected issues:
${JSON.stringify(issuesSummary, null, 2)}

Provide an expert structured review for each issue, plus the entire fixed Python code with all issues resolved.
Return JSON with this exact schema:
{
  "issues": [
    {
      "id": <integer matching issue id>,
      "why": "<1-2 concise, clear sentences explaining why this is a problem in plain language, friendly tone>",
      "fix": "<1-2 clear actionable sentences explaining how to fix it>",
      "severity": "<high | medium | low>",
      "corrected_snippet": "<short 1-4 line snippet showing the fixed lines>"
    }
  ],
  "full_fixed_code": "<the complete python file with all docstrings added, mutable defaults fixed, unused variables removed/fixed, bare excepts replaced, and clean formatting>"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const enriched = issues.map((iss, idx) => {
      const match = parsed.issues?.find((item: any) => item.id === idx);
      if (match) {
        return {
          ...iss,
          why: match.why || iss.why,
          fix: match.fix || iss.fix,
          severity: match.severity?.toLowerCase() || iss.severity,
          corrected_snippet: match.corrected_snippet || iss.corrected_snippet
        };
      }
      return iss;
    });

    return { enrichedIssues: enriched, fixedCode: parsed.full_fixed_code || null };
  } catch (err) {
    console.error('Gemini call error:', err);
    return { enrichedIssues: issues, fixedCode: null };
  }
}

// 1. API Endpoint: Review Python Code
app.post('/api/review', async (req, res) => {
  try {
    const { code, filename = 'sample.py', useLlm = true } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Source code string is required' });
    }

    // Write code to a temporary file
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'py-review-'));
    const tempFile = path.join(tempDir, path.basename(filename) || 'target.py');
    fs.writeFileSync(tempFile, code, 'utf-8');

    // Run reviewer.py with --json flag
    const cliRes = await runReviewerCli(tempFile, ['--json', '--no-llm']);

    // Clean up temp dir
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}

    let rawData: any = {};
    try {
      rawData = JSON.parse(cliRes.stdout || '{}');
    } catch {
      return res.status(500).json({
        error: 'Failed to parse AST reviewer output',
        details: cliRes.stderr || cliRes.stdout
      });
    }

    const issuesList: any[] = Object.values(rawData)[0] as any[] || [];

    // Optionally enrich with Gemini if enabled and key exists
    let finalIssues = issuesList;
    let fullFixedCode: string | null = null;

    if (useLlm && ai && issuesList.length > 0) {
      const { enrichedIssues, fixedCode } = await getGeminiReviewAndFixes(code, issuesList);
      finalIssues = enrichedIssues;
      fullFixedCode = fixedCode;
    }

    // Score calculation (0-100)
    let penalty = 0;
    let counts = { high: 0, medium: 0, low: 0 };
    for (const iss of finalIssues) {
      const sev = (iss.severity || 'medium').toLowerCase();
      if (sev === 'high') {
        penalty += 15;
        counts.high++;
      } else if (sev === 'medium') {
        penalty += 8;
        counts.medium++;
      } else {
        penalty += 3;
        counts.low++;
      }
    }
    const score = Math.max(0, 100 - penalty);
    const loc = code.split('\n').length;
    const cliReport = buildFormattedReport(finalIssues, filename);

    return res.json({
      success: true,
      filename,
      loc,
      score,
      counts,
      issues: finalIssues,
      cliReport,
      fixedCode: fullFixedCode,
      hasGemini: !!ai
    });
  } catch (error: any) {
    console.error('Review error:', error);
    return res.status(500).json({ error: error.message || 'Review failed' });
  }
});

// 2. API Endpoint: Execute Terminal Commands
app.post('/api/run-cli', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command string is required' });
    }

    const trimmed = command.trim();
    // Whitelist command patterns for safety: must start with python reviewer.py or python3 reviewer.py
    if (!trimmed.startsWith('python reviewer.py') && !trimmed.startsWith('python3 reviewer.py') && trimmed !== 'python reviewer.py --help') {
      return res.status(400).json({
        error: 'Command restricted to reviewer CLI operations (e.g. `python reviewer.py sample.py` or `python reviewer.py examples/`)'
      });
    }

    // Extract arguments
    const parts = trimmed.split(/\s+/).slice(2);
    const target = parts[0] || 'sample.py';
    const extraArgs = parts.slice(1);

    const startTime = Date.now();
    const result = await runReviewerCli(target, extraArgs);
    const durationMs = Date.now() - startTime;

    return res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      durationMs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. API Endpoint: Sample Files
app.get('/api/sample-files', (req, res) => {
  try {
    const samples: Array<{ name: string; path: string; description: string; code: string }> = [];

    // sample.py
    if (fs.existsSync('sample.py')) {
      samples.push({
        name: 'sample.py',
        path: 'sample.py',
        description: 'Problem Spec Example (missing docstring, mutable default, unused var, deep nesting, bare except)',
        code: fs.readFileSync('sample.py', 'utf-8')
      });
    }

    // examples folder
    const examplesDir = path.resolve(process.cwd(), 'examples');
    if (fs.existsSync(examplesDir)) {
      const files = fs.readdirSync(examplesDir);
      for (const file of files) {
        if (file.endsWith('.py')) {
          const filePath = path.join(examplesDir, file);
          let desc = 'Python sample file';
          if (file.includes('calculator')) desc = 'Calculator with mutable history=[] default & shadowed sum';
          else if (file.includes('deep_nesting')) desc = 'Deeply nested logic & cyclomatic complexity';
          else if (file.includes('bad_practices')) desc = 'Bare except:, comparison to None (== None), & dead code';
          else if (file.includes('clean_code')) desc = 'Clean PEP 8 compliant Python code with 100/100 score';

          samples.push({
            name: `examples/${file}`,
            path: `examples/${file}`,
            description: desc,
            code: fs.readFileSync(filePath, 'utf-8')
          });
        }
      }
    }

    return res.json({ samples });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. API Endpoint: Download reviewer.py
app.get('/api/download-cli', (req, res) => {
  const filePath = path.resolve(process.cwd(), 'reviewer.py');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="reviewer.py"');
    res.setHeader('Content-Type', 'text/x-python');
    return fs.createReadStream(filePath).pipe(res);
  }
  return res.status(404).send('reviewer.py not found');
});

// 5. Mount Vite middleware or static files
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
