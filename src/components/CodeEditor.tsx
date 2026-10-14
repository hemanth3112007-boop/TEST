import React, { useRef } from 'react';
import {
  IconFileCode,
  IconCopy,
  IconCheck,
  IconUpload,
  IconRotateDot,
  IconSparkles,
  IconArrowsDiff
} from '@tabler/icons-react';
import { CodeIssue } from '../types';

interface CodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  issues: CodeIssue[];
  selectedIssue: CodeIssue | null;
  onSelectIssue: (issue: CodeIssue) => void;
  viewMode: 'original' | 'fixed' | 'diff';
  setViewMode: (mode: 'original' | 'fixed' | 'diff') => void;
  fixedCode: string | null;
  onReset: () => void;
  filename: string;
  darkMode: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  issues,
  selectedIssue,
  onSelectIssue,
  viewMode,
  setViewMode,
  fixedCode,
  onReset,
  filename,
  darkMode
}) => {
  const [copied, setCopied] = React.useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lines = code.split('\n');

  // Map issues by line number for gutter indicators
  const issueMap = React.useMemo(() => {
    const map = new Map<number, CodeIssue[]>();
    for (const iss of issues) {
      const list = map.get(iss.line) || [];
      list.push(iss);
      map.set(iss.line, list);
    }
    return map;
  }, [issues]);

  const handleCopy = () => {
    navigator.clipboard.writeText(viewMode === 'fixed' && fixedCode ? fixedCode : code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          onChange(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const getLineGutterColor = (lineNo: number) => {
    const lineIssues = issueMap.get(lineNo);
    if (!lineIssues || lineIssues.length === 0) {
      return darkMode ? 'text-slate-600' : 'text-slate-400';
    }
    if (lineIssues.some((i) => i.severity === 'high')) {
      return 'text-[#d63939] font-bold bg-[#d63939]/10';
    }
    if (lineIssues.some((i) => i.severity === 'medium')) {
      return 'text-[#f59f00] font-bold bg-[#f59f00]/10';
    }
    return 'text-[#4299e1] font-bold bg-[#4299e1]/10';
  };

  const cardBg = darkMode ? 'bg-[#151f30] border-[#243347]' : 'bg-white border-slate-200';
  const headerBg = darkMode ? 'bg-[#101726] border-[#243347]' : 'bg-slate-50 border-slate-200';
  const editorBg = darkMode ? 'bg-[#0b101b] text-slate-100' : 'bg-white text-slate-800';
  const gutterBg = darkMode ? 'bg-[#0f172a] border-[#243347]' : 'bg-slate-50 border-slate-200';

  return (
    <div className={`flex flex-col h-full border rounded-lg overflow-hidden shadow-xs transition-colors ${cardBg}`}>
      {/* Tabler Card Header */}
      <div className={`flex flex-wrap items-center justify-between px-3.5 py-2.5 border-b gap-2 text-xs ${headerBg}`}>
        {/* File name & LOC */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#206bc4]/10 text-[#206bc4] flex items-center justify-center">
            <IconFileCode className="w-4 h-4" />
          </div>
          <span className={`font-mono font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{filename}</span>
          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>({lines.length} lines)</span>
        </div>

        {/* Tabler Tabs for Code View */}
        <div className={`flex items-center p-0.5 rounded-md border ${
          darkMode ? 'bg-[#151f30] border-[#243347]' : 'bg-slate-200/70 border-slate-300'
        }`}>
          <button
            onClick={() => setViewMode('original')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'original'
                ? darkMode
                  ? 'bg-[#206bc4] text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs font-semibold'
                : darkMode
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Source Code
          </button>
          <button
            onClick={() => setViewMode('fixed')}
            disabled={!fixedCode}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'fixed'
                ? darkMode
                  ? 'bg-[#2fb344] text-white shadow-xs'
                  : 'bg-[#2fb344] text-white shadow-xs font-semibold'
                : darkMode
                ? 'text-slate-400 hover:text-slate-200 disabled:opacity-30'
                : 'text-slate-600 hover:text-slate-900 disabled:opacity-30'
            }`}
            title={fixedCode ? 'View Gemini corrected code' : 'Run review with Gemini to generate corrected code'}
          >
            <IconSparkles className="w-3.5 h-3.5" />
            <span>Corrected Code</span>
          </button>
          <button
            onClick={() => setViewMode('diff')}
            disabled={!fixedCode}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'diff'
                ? darkMode
                  ? 'bg-[#206bc4] text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs font-semibold'
                : darkMode
                ? 'text-slate-400 hover:text-slate-200 disabled:opacity-30'
                : 'text-slate-600 hover:text-slate-900 disabled:opacity-30'
            }`}
          >
            <IconArrowsDiff className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1.5">
          <label className={`cursor-pointer px-2 py-1 rounded border text-xs font-medium transition-colors flex items-center gap-1 ${
            darkMode
              ? 'bg-[#151f30] border-[#243347] text-slate-300 hover:text-white hover:border-[#206bc4]'
              : 'bg-white border-slate-200 text-slate-700 hover:text-[#206bc4] hover:border-[#206bc4]'
          }`} title="Upload your own .py file">
            <IconUpload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload .py</span>
            <input type="file" accept=".py" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={onReset}
            className={`px-2 py-1 rounded border text-xs font-medium transition-colors flex items-center gap-1 ${
              darkMode
                ? 'bg-[#151f30] border-[#243347] text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Reset code"
          >
            <IconRotateDot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleCopy}
            className={`px-2 py-1 rounded border text-xs font-medium transition-colors flex items-center gap-1 ${
              darkMode
                ? 'bg-[#151f30] border-[#243347] text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Copy code"
          >
            {copied ? <IconCheck className="w-3.5 h-3.5 text-[#2fb344]" /> : <IconCopy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      {viewMode === 'diff' && fixedCode ? (
        <div className="flex-1 grid grid-cols-2 divide-x divide-slate-200 dark:divide-[#243347] font-mono text-xs overflow-auto">
          {/* Original */}
          <div className="p-3.5 overflow-auto bg-slate-50 dark:bg-[#0b101b]">
            <div className="text-[11px] font-bold text-[#d63939] mb-2 uppercase tracking-wide flex items-center gap-1">
              <span>Original (With AST Smells)</span>
            </div>
            <pre className="text-slate-700 dark:text-slate-300 whitespace-pre leading-relaxed">
              {code}
            </pre>
          </div>
          {/* Fixed */}
          <div className="p-3.5 overflow-auto bg-emerald-50/40 dark:bg-[#0c161d]">
            <div className="text-[11px] font-bold text-[#2fb344] mb-2 uppercase tracking-wide flex items-center gap-1">
              <IconSparkles className="w-3.5 h-3.5" />
              <span>Corrected Solution</span>
            </div>
            <pre className="text-emerald-800 dark:text-emerald-300 whitespace-pre leading-relaxed">
              {fixedCode}
            </pre>
          </div>
        </div>
      ) : viewMode === 'fixed' && fixedCode ? (
        <div className={`flex-1 font-mono text-xs overflow-auto p-4 leading-relaxed ${
          darkMode ? 'bg-[#0b101b] text-emerald-300' : 'bg-emerald-50/50 text-emerald-900'
        }`}>
          <div className="mb-2 text-xs font-semibold text-[#2fb344] flex items-center gap-1 font-sans">
            <IconCheck className="w-4 h-4" />
            <span>All AST issues resolved with complete docstrings and PEP 8 best practices:</span>
          </div>
          <pre className="whitespace-pre leading-relaxed select-all">
            {fixedCode}
          </pre>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden font-mono text-xs">
          {/* Line Gutter with Tabler Indicator Dots */}
          <div className={`w-14 border-r select-none py-3 overflow-hidden text-right pr-2 ${gutterBg}`}>
            {lines.map((_, i) => {
              const lineNo = i + 1;
              const lineIssues = issueMap.get(lineNo);
              const isSelected = selectedIssue?.line === lineNo;

              return (
                <div
                  key={lineNo}
                  onClick={() => lineIssues?.[0] && onSelectIssue(lineIssues[0])}
                  className={`h-5 flex items-center justify-end gap-1.5 px-1 cursor-pointer transition-colors ${getLineGutterColor(
                    lineNo
                  )} ${isSelected ? 'ring-1 ring-[#206bc4] font-bold' : ''}`}
                >
                  {lineIssues && lineIssues.length > 0 && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        lineIssues.some((x) => x.severity === 'high')
                          ? 'bg-[#d63939]'
                          : lineIssues.some((x) => x.severity === 'medium')
                          ? 'bg-[#f59f00]'
                          : 'bg-[#4299e1]'
                      }`}
                      title={`${lineIssues.length} issue(s) at line ${lineNo}`}
                    />
                  )}
                  <span>{lineNo}</span>
                </div>
              );
            })}
          </div>

          {/* Editable Textarea */}
          <div className={`flex-1 relative overflow-auto ${editorBg}`}>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              className="w-full h-full min-h-[480px] bg-transparent font-mono text-xs p-3.5 leading-5 resize-none focus:outline-none focus:ring-0 selection:bg-[#206bc4]/30 whitespace-pre"
              placeholder="# Paste or type Python code here..."
            />
          </div>
        </div>
      )}
    </div>
  );
};
