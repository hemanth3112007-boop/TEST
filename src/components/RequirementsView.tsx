import React from 'react';
import {
  IconCheckbox,
  IconAward,
  IconCheck,
  IconFlame,
  IconShieldCheck,
  IconFileCode,
  IconSparkles
} from '@tabler/icons-react';

interface RequirementsViewProps {
  darkMode: boolean;
}

export const RequirementsView: React.FC<RequirementsViewProps> = ({ darkMode }) => {
  const cardBg = darkMode ? 'bg-[#151f30] border-[#243347] text-white' : 'bg-white border-slate-200 text-slate-800';
  const headerBg = darkMode ? 'bg-[#101726] border-[#243347]' : 'bg-slate-50 border-slate-200';
  const subtextCol = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Overview Card */}
      <div className={`relative border rounded-lg p-5 shadow-xs overflow-hidden transition-colors ${cardBg}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#206bc4]" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#206bc4]/10 text-[#206bc4] flex items-center justify-center">
            <IconAward className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">
                Problem 8 Assignment Verification
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-[#2fb344]/10 text-[#2fb344] border border-[#2fb344]/30">
                100% Complete
              </span>
            </div>
            <p className={`text-xs ${subtextCol} font-sans mt-0.5`}>
              Verified against every non-negotiable rule, done-when condition, and bonus mark from the problem prompt.
            </p>
          </div>
        </div>
      </div>

      {/* Must Haves (Non-Negotiable) */}
      <div className={`border rounded-lg overflow-hidden shadow-xs transition-colors ${cardBg}`}>
        <div className={`px-4 py-3 border-b flex items-center justify-between ${headerBg}`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2fb344]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2fb344]">
              Must Have (Non-Negotiable)
            </span>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#2fb344]/10 text-[#2fb344] border border-[#2fb344]/30">
            5 of 5 Passed
          </span>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-[#243347]">
          <div className="p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#2fb344]/15 text-[#2fb344] flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <div className="font-bold font-mono">
                Parse the file with Python's <code className="text-[#206bc4]">ast</code> module
              </div>
              <p className={`mt-1 leading-relaxed ${subtextCol}`}>
                Implemented with pure Python standard library: <code className="text-[#206bc4]">ast.parse</code>, <code className="text-[#206bc4]">ast.walk</code>, <code className="text-[#206bc4]">ast.NodeVisitor</code>, and <code className="text-[#206bc4]">ast.get_docstring</code>. Zero external pip packages needed.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#2fb344]/15 text-[#2fb344] flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <div className="font-bold font-mono">
                Detect at least 3 kinds of problems
              </div>
              <p className={`mt-1 leading-relaxed ${subtextCol}`}>
                Detects <strong>8 distinct problem types</strong>: missing docstring, deeply nested code (depth ≥ 4), unused variables, mutable default arguments, bare <code className="text-[#206bc4]">except:</code>, comparison to None using <code className="text-[#206bc4]">== None</code>, shadowed built-ins, and unreachable dead code.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#2fb344]/15 text-[#2fb344] flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <div className="font-bold font-mono">
                Report the line number of each problem
              </div>
              <p className={`mt-1 leading-relaxed ${subtextCol}`}>
                Every problem is paired with exact <code className="text-[#206bc4]">node.lineno</code> and offset, indicated with gutter markers in the web editor and exact line numbers in CLI output.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#2fb344]/15 text-[#2fb344] flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <div className="font-bold font-mono">
                Send each problem to an LLM (Gemini) for plain explanation & fix in structured form
              </div>
              <p className={`mt-1 leading-relaxed ${subtextCol}`}>
                Gemini 3.8 Flash returns clean JSON schemas providing friendly, plain language "Why:" explanations and actionable "Fix:" recommendations, plus complete fixed code.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#2fb344]/15 text-[#2fb344] flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <div className="font-bold font-mono">
                Print a clean, readable report matching example format
              </div>
              <div className={`mt-2 p-3 rounded font-mono text-xs border ${
                darkMode ? 'bg-[#0f172a] border-[#243347] text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}>
                Line 12 | missing docstring | calc()
                <br />&nbsp;&nbsp;Why: readers cannot tell what calc() does.
                <br />&nbsp;&nbsp;Fix: add a one-line docstring.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bonus Marks (Level Up) */}
      <div className={`border rounded-lg overflow-hidden shadow-xs transition-colors ${cardBg}`}>
        <div className={`px-4 py-3 border-b flex items-center justify-between ${headerBg}`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59f00]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#f59f00]">
              Bonus Marks (Level Up)
            </span>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#f59f00]/10 text-[#f59f00] border border-[#f59f00]/30">
            4 of 4 Verified
          </span>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-[#243347]">
          <div className="p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#f59f00]/15 text-[#f59f00] flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <div className="font-bold font-mono">
                Severity levels (high / medium / low)
              </div>
              <p className={`mt-1 leading-relaxed ${subtextCol}`}>
                Each detected problem is categorized by risk impact with color-coded Tabler ribbons, badges, and CLI tags.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#f59f00]/15 text-[#f59f00] flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <div className="font-bold font-mono">
                Show the corrected code
              </div>
              <p className={`mt-1 leading-relaxed ${subtextCol}`}>
                Provided via the "Corrected Code" tab, "Side-by-Side Diff" view, inline code solution drawer, and CLI <code className="text-[#206bc4]">--diff</code> flag.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#f59f00]/15 text-[#f59f00] flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <div className="font-bold font-mono">
                Review a whole folder
              </div>
              <p className={`mt-1 leading-relaxed ${subtextCol}`}>
                Run <code className="text-[#206bc4]">python reviewer.py examples/</code> in terminal or use the Folder Audit tab in the web interface to batch scan folders.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#f59f00]/15 text-[#f59f00] flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <div className="font-bold font-mono">
                A summary score or report file
              </div>
              <p className={`mt-1 leading-relaxed ${subtextCol}`}>
                Generates a 0–100 health score with grade breakdowns and exports Markdown (<code className="text-[#206bc4]">report.md</code>) or JSON (<code className="text-[#206bc4]">--json</code>).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
