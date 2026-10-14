import React, { useState } from 'react';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconInfoCircle,
  IconCheck,
  IconCopy,
  IconChevronDown,
  IconChevronUp,
  IconTerminal2
} from '@tabler/icons-react';
import { CodeIssue, Severity } from '../types';

interface IssueCardProps {
  issue: CodeIssue;
  isSelected: boolean;
  onSelect: () => void;
  darkMode: boolean;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  isSelected,
  onSelect,
  darkMode
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getSeverityStyle = (sev: Severity) => {
    switch (sev) {
      case 'high':
        return {
          ribbon: 'border-l-4 border-l-[#d63939]',
          badgeBg: darkMode ? 'bg-[#d63939]/15 text-[#ff6b6b] border-[#d63939]/30' : 'bg-red-50 text-red-700 border-red-200',
          icon: <IconAlertCircle className="w-3.5 h-3.5 text-[#d63939]" />,
          label: 'HIGH'
        };
      case 'medium':
        return {
          ribbon: 'border-l-4 border-l-[#f59f00]',
          badgeBg: darkMode ? 'bg-[#f59f00]/15 text-[#ffd166] border-[#f59f00]/30' : 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <IconAlertTriangle className="w-3.5 h-3.5 text-[#f59f00]" />,
          label: 'MEDIUM'
        };
      case 'low':
      default:
        return {
          ribbon: 'border-l-4 border-l-[#4299e1]',
          badgeBg: darkMode ? 'bg-[#4299e1]/15 text-[#70b8ff] border-[#4299e1]/30' : 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <IconInfoCircle className="w-3.5 h-3.5 text-[#4299e1]" />,
          label: 'LOW'
        };
    }
  };

  const sevStyle = getSeverityStyle(issue.severity);

  const copyAsCliFormat = (e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = `Line ${issue.line} | ${issue.category} | ${issue.entity}\n  Why: ${issue.why}\n  Fix: ${issue.fix}`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardBg = darkMode
    ? isSelected
      ? 'bg-[#1a273e] border-[#3b82f6] shadow-sm'
      : 'bg-[#151f30] border-[#243347] hover:border-[#33465f]'
    : isSelected
    ? 'bg-blue-50/50 border-[#206bc4] shadow-sm'
    : 'bg-white border-slate-200 hover:border-slate-300';

  return (
    <div
      onClick={onSelect}
      className={`border rounded-lg p-3.5 transition-all cursor-pointer text-sm shadow-xs ${sevStyle.ribbon} ${cardBg}`}
    >
      {/* Header Line (Problem 8 Signature) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <span className={`px-2 py-0.5 rounded font-bold border ${
            darkMode ? 'bg-[#1e2a3f] text-slate-200 border-[#2d3e58]' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            Line {issue.line}
          </span>
          <span className="text-slate-400 select-none">|</span>
          <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {issue.category}
          </span>
          <span className="text-slate-400 select-none">|</span>
          <code className={`px-1.5 py-0.5 rounded font-mono font-bold ${
            darkMode ? 'bg-[#206bc4]/20 text-[#60a5fa] border border-[#206bc4]/30' : 'bg-blue-50 text-[#206bc4] border border-blue-200'
          }`}>
            {issue.entity}
          </code>
        </div>

        {/* Severity Badge & Copy */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${sevStyle.badgeBg}`}>
            {sevStyle.icon}
            {sevStyle.label}
          </span>
          <button
            onClick={copyAsCliFormat}
            title="Copy as CLI report block"
            className={`p-1 rounded transition-colors ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-[#1e2a3f]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {copied ? <IconCheck className="w-3.5 h-3.5 text-[#2fb344]" /> : <IconCopy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Why & Fix Blocks (Clean Tabler Callouts) */}
      <div className="mt-2.5 space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <span className={`font-mono font-bold select-none min-w-[36px] ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Why:
          </span>
          <span className={`leading-relaxed font-sans ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {issue.why}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-mono font-bold select-none min-w-[36px] text-[#2fb344]">
            Fix:
          </span>
          <span className={`leading-relaxed font-sans font-medium ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
            {issue.fix}
          </span>
        </div>
      </div>

      {/* Suggested Fix Snippet Toggle */}
      {issue.corrected_snippet && (
        <div className={`mt-3 pt-2.5 border-t ${darkMode ? 'border-[#243347]' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-[#2fb344] flex items-center gap-1">
              <span>+</span> Suggested Code Solution
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className={`text-[11px] font-medium flex items-center gap-0.5 ${
                darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{expanded ? 'Hide code' : 'View code'}</span>
              {expanded ? <IconChevronUp className="w-3 h-3" /> : <IconChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {expanded && (
            <div className={`mt-2 rounded p-2.5 border font-mono text-xs overflow-x-auto ${
              darkMode ? 'bg-[#0f172a] border-[#243347] text-emerald-300' : 'bg-slate-900 border-slate-800 text-emerald-400'
            }`}>
              <pre className="whitespace-pre leading-relaxed select-all">
                {issue.corrected_snippet}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
