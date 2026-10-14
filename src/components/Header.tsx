import React from 'react';
import { Terminal, Download, Sparkles, ShieldAlert, CheckCircle2, FileCode, Play } from 'lucide-react';

interface HeaderProps {
  onRunReview: () => void;
  isLoading: boolean;
  useLlm: boolean;
  setUseLlm: (val: boolean) => void;
  hasGemini: boolean;
  onOpenChecklist: () => void;
  activeTab: 'editor' | 'terminal' | 'folder' | 'spec';
  setActiveTab: (tab: 'editor' | 'terminal' | 'folder' | 'spec') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRunReview,
  isLoading,
  useLlm,
  setUseLlm,
  hasGemini,
  onOpenChecklist,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                Problem 8
              </span>
              <h1 className="text-base font-semibold text-zinc-100 font-sans tracking-tight">
                Python Code Reviewer CLI
              </h1>
            </div>
            <p className="text-xs text-zinc-400 font-mono hidden sm:block mt-0.5">
              ast.parse analyzer · Gemini plain explanations & fixes · CLI runner
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg text-xs font-mono">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'editor'
                ? 'bg-zinc-800 text-emerald-400 font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Reviewer & Editor
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'terminal'
                ? 'bg-zinc-800 text-emerald-400 font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            CLI Terminal
          </button>
          <button
            onClick={() => setActiveTab('folder')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'folder'
                ? 'bg-zinc-800 text-emerald-400 font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Folder Batch Scan
          </button>
          <button
            onClick={() => setActiveTab('spec')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
              activeTab === 'spec'
                ? 'bg-zinc-800 text-emerald-400 font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Requirements
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* LLM Toggle */}
          <button
            onClick={() => setUseLlm(!useLlm)}
            title={useLlm ? 'Using Gemini LLM for dynamic plain explanations' : 'Using rule-based deterministic fallback'}
            className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded border transition-colors ${
              useLlm
                ? 'bg-violet-950/40 text-violet-300 border-violet-800/60 hover:bg-violet-900/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Gemini AI: {useLlm ? 'ON' : 'OFF'}</span>
          </button>

          {/* Download reviewer.py */}
          <a
            href="/api/download-cli"
            download="reviewer.py"
            className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-emerald-400 hover:border-emerald-700/50 transition-colors"
            title="Download pure Python reviewer.py script"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">reviewer.py</span>
          </a>

          {/* Run Review Button */}
          <button
            onClick={onRunReview}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-mono font-medium px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Review</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
