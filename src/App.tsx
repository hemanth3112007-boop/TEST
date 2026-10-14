/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TablerNavbar } from './components/TablerNavbar';
import { TablerMetricsCards } from './components/TablerMetricsCards';
import { CodeEditor } from './components/CodeEditor';
import { IssueCard } from './components/IssueCard';
import { TerminalView } from './components/TerminalView';
import { FolderReviewView } from './components/FolderReviewView';
import { RequirementsView } from './components/RequirementsView';
import { CodeIssue, ReviewResponse, SampleFile, Severity } from './types';
import {
  IconFileCode,
  IconTerminal2,
  IconCopy,
  IconCheck,
  IconDownload,
  IconFilter,
  IconCircleCheck,
  IconSparkles,
  IconBrandPython,
  IconExternalLink
} from '@tabler/icons-react';

const DEFAULT_SAMPLE_CODE = `"""
Sample Python File for Code Reviewer CLI testing
"""

import sys

GLOBAL_CONFIG = {"debug": True}


def greet(name):
    print(f"Hello, {name}")


def calc(a, b, cache=[]):
    total = a + b
    unused_var = 42
    if a > 0:
        if b > 0:
            if a != b:
                if total > 10:
                    print("Deep calculation reached")
    return total
    print("This is dead code that will never run")


def process_data(items):
    list = [x for x in items]
    try:
        val = list[0]
        if val == None:
            return 0
    except:
        return -1
    return val
`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal' | 'folder' | 'spec'>('editor');
  const [code, setCode] = useState<string>(DEFAULT_SAMPLE_CODE);
  const [filename, setFilename] = useState<string>('sample.py');
  const [useLlm, setUseLlm] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<ReviewResponse | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [viewMode, setViewMode] = useState<'original' | 'fixed' | 'diff'>('original');
  const [samples, setSamples] = useState<SampleFile[]>([]);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [terminalInitialCmd, setTerminalInitialCmd] = useState<string>('python reviewer.py sample.py');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Sync dark mode class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch sample files from server on mount
  useEffect(() => {
    fetch('/api/sample-files')
      .then((res) => res.json())
      .then((data) => {
        if (data.samples && data.samples.length > 0) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.error('Failed to load samples:', err));
  }, []);

  // Run review function
  const runReview = async () => {
    setIsLoading(true);
    setSelectedIssue(null);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          filename,
          useLlm
        })
      });
      const data: ReviewResponse = await res.json();
      setReviewData(data);
      if (data.issues && data.issues.length > 0) {
        setSelectedIssue(data.issues[0]);
      }
    } catch (err) {
      console.error('Review failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runReview();
  }, []);

  const handleSelectSample = (sample: SampleFile) => {
    setCode(sample.code);
    setFilename(sample.name);
    setViewMode('original');
    setIsLoading(true);
    fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: sample.code,
        filename: sample.name,
        useLlm
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setReviewData(data);
        if (data.issues?.length > 0) setSelectedIssue(data.issues[0]);
      })
      .finally(() => setIsLoading(false));
  };

  const handleOpenFolderFileInEditor = (sample: SampleFile) => {
    handleSelectSample(sample);
    setActiveTab('editor');
  };

  const handleSwitchToTerminal = (cmd: string) => {
    setTerminalInitialCmd(cmd);
    setActiveTab('terminal');
  };

  const filteredIssues = React.useMemo(() => {
    if (!reviewData?.issues) return [];
    if (severityFilter === 'all') return reviewData.issues;
    return reviewData.issues.filter((i) => i.severity === severityFilter);
  }, [reviewData, severityFilter]);

  const copyReportText = () => {
    if (!reviewData?.cliReport) return;
    navigator.clipboard.writeText(reviewData.cliReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const exportReportMarkdown = () => {
    if (!reviewData) return;
    const scoreText = reviewData.score;
    const high = reviewData.counts.high;
    const med = reviewData.counts.medium;
    const low = reviewData.counts.low;

    let content = `# Tabler Python Code Review Report\n\n`;
    content += `Target File: \`${reviewData.filename}\`\n`;
    content += `Code Health Score: **${scoreText}/100**\n`;
    content += `Lines of Code: ${reviewData.loc}\n`;
    content += `Issues Found: ${reviewData.issues.length} (High: ${high}, Medium: ${med}, Low: ${low})\n\n`;
    content += `## Problem Analysis\n\n\`\`\`\n${reviewData.cliReport}\n\`\`\`\n\n`;

    if (reviewData.fixedCode) {
      content += `## Suggested Fixed Code\n\n\`\`\`python\n${reviewData.fixedCode}\n\`\`\`\n`;
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-report-${filename.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageBg = darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f4f6fa] text-slate-800';
  const subtextCol = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${pageBg}`}>
      {/* Tabler Top Navbar */}
      <TablerNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunReview={runReview}
        isLoading={isLoading}
        useLlm={useLlm}
        setUseLlm={setUseLlm}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        score={reviewData?.score}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Tabler Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 ${subtextCol}`}>
              <span>Problem 8</span>
              <span>·</span>
              <span>Python AST Reviewer CLI</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5 flex items-center gap-2">
              <span>Code Reviewer CLI & Studio</span>
              <span className="text-xs font-medium font-mono px-2 py-0.5 rounded-full bg-[#206bc4]/10 text-[#206bc4] border border-[#206bc4]/20">
                Tabler UI
              </span>
            </h1>
          </div>

          {/* Quick Toolbar for current file */}
          {activeTab === 'editor' && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <button
                onClick={() => handleSwitchToTerminal(`python reviewer.py ${filename}`)}
                className={`px-3 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors shadow-xs ${
                  darkMode
                    ? 'bg-[#151f30] border-[#243347] text-slate-200 hover:text-[#4299e1] hover:border-[#206bc4]'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-[#206bc4] hover:border-[#206bc4]'
                }`}
              >
                <IconTerminal2 className="w-3.5 h-3.5" />
                <span>Run in CLI</span>
              </button>

              <button
                onClick={copyReportText}
                className={`px-3 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors shadow-xs ${
                  darkMode
                    ? 'bg-[#151f30] border-[#243347] text-slate-200 hover:text-[#4299e1]'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-[#206bc4]'
                }`}
              >
                {copiedReport ? <IconCheck className="w-3.5 h-3.5 text-[#2fb344]" /> : <IconCopy className="w-3.5 h-3.5" />}
                <span>{copiedReport ? 'Copied' : 'Copy Report'}</span>
              </button>

              <button
                onClick={exportReportMarkdown}
                className={`px-3 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors shadow-xs ${
                  darkMode
                    ? 'bg-[#151f30] border-[#243347] text-slate-200 hover:text-[#4299e1]'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-[#206bc4]'
                }`}
              >
                <IconDownload className="w-3.5 h-3.5" />
                <span>Export .md</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabler Metrics Cards */}
        {activeTab === 'editor' && reviewData && (
          <TablerMetricsCards
            score={reviewData.score}
            loc={reviewData.loc}
            counts={reviewData.counts}
            useLlm={useLlm}
            hasGemini={reviewData.hasGemini}
            filename={filename}
            darkMode={darkMode}
          />
        )}

        {/* Tab 1: Editor & Reviewer Split View */}
        {activeTab === 'editor' && (
          <div className="space-y-4 flex-1 flex flex-col">
            {/* File Switcher Pill Strip */}
            <div className={`p-2 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs transition-colors ${
              darkMode ? 'bg-[#151f30] border-[#243347]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className={`font-semibold uppercase text-[10px] tracking-wider pl-1 ${subtextCol}`}>
                  Test File:
                </span>
                {samples.map((s) => (
                  <button
                    key={s.path}
                    onClick={() => handleSelectSample(s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                      filename === s.name
                        ? 'bg-[#206bc4] text-white shadow-xs'
                        : darkMode
                        ? 'bg-[#101726] text-slate-300 hover:text-white border border-[#243347]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
              {/* Code Editor (7 cols) */}
              <div className="lg:col-span-7 flex flex-col h-[600px] lg:h-auto">
                <CodeEditor
                  code={code}
                  onChange={setCode}
                  issues={reviewData?.issues || []}
                  selectedIssue={selectedIssue}
                  onSelectIssue={setSelectedIssue}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  fixedCode={reviewData?.fixedCode || null}
                  onReset={() => handleSelectSample(samples[0] || { name: 'sample.py', path: 'sample.py', code: DEFAULT_SAMPLE_CODE, description: '' })}
                  filename={filename}
                  darkMode={darkMode}
                />
              </div>

              {/* Issues Inspection Drawer (5 cols) */}
              <div className={`lg:col-span-5 flex flex-col border rounded-lg shadow-xs overflow-hidden transition-colors ${
                darkMode ? 'bg-[#151f30] border-[#243347]' : 'bg-white border-slate-200'
              }`}>
                {/* Header with Severity Filter Pills */}
                <div className={`px-4 py-3 border-b flex items-center justify-between text-xs ${
                  darkMode ? 'bg-[#101726] border-[#243347]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Issues Analysis</span>
                    <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                      darkMode ? 'bg-[#206bc4]/20 text-[#60a5fa]' : 'bg-blue-50 text-[#206bc4]'
                    }`}>
                      {filteredIssues.length}
                    </span>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`px-2 py-0.5 rounded capitalize font-medium transition-colors ${
                          severityFilter === sev
                            ? 'bg-[#206bc4] text-white shadow-xs'
                            : darkMode
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Issues List */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[300px] max-h-[550px]">
                  {isLoading ? (
                    <div className="h-48 flex flex-col items-center justify-center text-slate-400 font-sans text-xs space-y-2">
                      <div className="w-6 h-6 border-2 border-[#206bc4] border-t-transparent rounded-full animate-spin" />
                      <span>Parsing AST & consulting Gemini LLM...</span>
                    </div>
                  ) : filteredIssues.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2 p-6 text-center">
                      <IconCircleCheck className="w-8 h-8 text-[#2fb344] mb-1" />
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No issues detected</span>
                      <p className={`text-[11px] max-w-xs ${subtextCol}`}>
                        The Python AST confirms clean docstrings, safe defaults, no unused variables, and PEP 8 conformity.
                      </p>
                    </div>
                  ) : (
                    filteredIssues.map((issue, idx) => (
                      <IssueCard
                        key={`${issue.line}-${issue.rule_id}-${idx}`}
                        issue={issue}
                        isSelected={selectedIssue?.line === issue.line && selectedIssue?.rule_id === issue.rule_id}
                        onSelect={() => setSelectedIssue(issue)}
                        darkMode={darkMode}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Terminal Console */}
        {activeTab === 'terminal' && (
          <div className="flex-1 min-h-[580px] flex flex-col">
            <TerminalView initialCommand={terminalInitialCmd} darkMode={darkMode} />
          </div>
        )}

        {/* Tab 3: Folder Batch Scan */}
        {activeTab === 'folder' && (
          <div className="flex-1">
            <FolderReviewView
              samples={samples}
              onOpenFileInEditor={handleOpenFolderFileInEditor}
              onSwitchToTerminalWithCmd={handleSwitchToTerminal}
              darkMode={darkMode}
            />
          </div>
        )}

        {/* Tab 4: Problem 8 Requirements Verification */}
        {activeTab === 'spec' && (
          <div className="flex-1 py-2">
            <RequirementsView darkMode={darkMode} />
          </div>
        )}
      </main>

      {/* Tabler Clean Footer */}
      <footer className={`border-t py-4 text-xs font-sans transition-colors ${
        darkMode ? 'bg-[#151f30] border-[#243347] text-slate-400' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 dark:text-slate-200">
              Problem 8: Code Reviewer CLI
            </span>
            <span>·</span>
            <span>Tabler Design System</span>
            <span>·</span>
            <span>Python 3.10 ast & Gemini 3.8</span>
          </div>

          <div className="flex items-center gap-3 font-medium">
            <a href="/api/download-cli" className="hover:text-[#206bc4] transition-colors">
              Download reviewer.py
            </a>
            <span>·</span>
            <button onClick={() => setActiveTab('terminal')} className="hover:text-[#206bc4] transition-colors">
              CLI Console
            </button>
            <span>·</span>
            <button onClick={() => setActiveTab('spec')} className="hover:text-[#206bc4] transition-colors">
              Verification Checklist
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
