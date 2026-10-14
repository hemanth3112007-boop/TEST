import React from 'react';
import {
  IconCode,
  IconTerminal2,
  IconFolder,
  IconCheckbox,
  IconDownload,
  IconPlayerPlay,
  IconSparkles,
  IconMoon,
  IconSun,
  IconBrandPython,
  IconFlame
} from '@tabler/icons-react';

interface TablerNavbarProps {
  activeTab: 'editor' | 'terminal' | 'folder' | 'spec';
  setActiveTab: (tab: 'editor' | 'terminal' | 'folder' | 'spec') => void;
  onRunReview: () => void;
  isLoading: boolean;
  useLlm: boolean;
  setUseLlm: (val: boolean) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  score?: number;
}

export const TablerNavbar: React.FC<TablerNavbarProps> = ({
  activeTab,
  setActiveTab,
  onRunReview,
  isLoading,
  useLlm,
  setUseLlm,
  darkMode,
  setDarkMode,
  score
}) => {
  return (
    <header className={`border-b transition-colors ${
      darkMode ? 'bg-[#151f30] border-[#243347] text-white' : 'bg-white border-slate-200 text-slate-800'
    } sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#206bc4] text-white flex items-center justify-center shadow-sm">
              <IconBrandPython className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight">Tabler Code Reviewer</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold bg-[#206bc4]/10 text-[#206bc4] border border-[#206bc4]/20">
                  CLI v1.0
                </span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} font-sans hidden sm:block`}>
                AST Engine · Gemini Explanations · Problem 8
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 font-medium text-xs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                activeTab === 'editor'
                  ? darkMode
                    ? 'bg-[#206bc4]/20 text-[#4299e1] font-semibold'
                    : 'bg-[#206bc4]/10 text-[#206bc4] font-semibold'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2a3f]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <IconCode className="w-4 h-4" />
              <span>Reviewer & Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                activeTab === 'terminal'
                  ? darkMode
                    ? 'bg-[#206bc4]/20 text-[#4299e1] font-semibold'
                    : 'bg-[#206bc4]/10 text-[#206bc4] font-semibold'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2a3f]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <IconTerminal2 className="w-4 h-4" />
              <span>CLI Terminal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2fb344] animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('folder')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                activeTab === 'folder'
                  ? darkMode
                    ? 'bg-[#206bc4]/20 text-[#4299e1] font-semibold'
                    : 'bg-[#206bc4]/10 text-[#206bc4] font-semibold'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2a3f]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <IconFolder className="w-4 h-4" />
              <span>Folder Audit</span>
            </button>

            <button
              onClick={() => setActiveTab('spec')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                activeTab === 'spec'
                  ? darkMode
                    ? 'bg-[#206bc4]/20 text-[#4299e1] font-semibold'
                    : 'bg-[#206bc4]/10 text-[#206bc4] font-semibold'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2a3f]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <IconCheckbox className="w-4 h-4" />
              <span>Requirements</span>
            </button>
          </nav>

          {/* Right Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Gemini Toggle */}
            <button
              onClick={() => setUseLlm(!useLlm)}
              title={useLlm ? 'Gemini 3.8 Flash AI explanations active' : 'Rule-based fallback active'}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors ${
                useLlm
                  ? darkMode
                    ? 'bg-purple-950/40 text-purple-300 border-purple-800/60'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                  : darkMode
                  ? 'bg-[#151f30] text-slate-400 border-[#243347]'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <IconSparkles className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden sm:inline">Gemini AI:</span>
              <span className="font-semibold">{useLlm ? 'ON' : 'OFF'}</span>
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-1.5 rounded-md border transition-colors ${
                darkMode
                  ? 'bg-[#151f30] border-[#243347] text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {darkMode ? <IconSun className="w-4 h-4 text-amber-400" /> : <IconMoon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Download reviewer.py */}
            <a
              href="/api/download-cli"
              download="reviewer.py"
              className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors ${
                darkMode
                  ? 'bg-[#151f30] border-[#243347] text-slate-300 hover:text-white hover:border-[#206bc4]'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-[#206bc4] hover:border-[#206bc4]'
              }`}
            >
              <IconDownload className="w-3.5 h-3.5" />
              <span>reviewer.py</span>
            </a>

            {/* Run Review CTA */}
            <button
              onClick={onRunReview}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-[#206bc4] hover:bg-[#1a569d] text-white transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <IconPlayerPlay className="w-3.5 h-3.5 fill-current" />
                  <span>Review Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-200 dark:border-[#243347] text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-2 py-1 rounded ${activeTab === 'editor' ? 'text-[#206bc4] font-bold' : 'text-slate-500'}`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-2 py-1 rounded ${activeTab === 'terminal' ? 'text-[#206bc4] font-bold' : 'text-slate-500'}`}
          >
            CLI Terminal
          </button>
          <button
            onClick={() => setActiveTab('folder')}
            className={`px-2 py-1 rounded ${activeTab === 'folder' ? 'text-[#206bc4] font-bold' : 'text-slate-500'}`}
          >
            Folder Scan
          </button>
          <button
            onClick={() => setActiveTab('spec')}
            className={`px-2 py-1 rounded ${activeTab === 'spec' ? 'text-[#206bc4] font-bold' : 'text-slate-500'}`}
          >
            Requirements
          </button>
        </div>
      </div>
    </header>
  );
};
