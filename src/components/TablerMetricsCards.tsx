import React from 'react';
import {
  IconHeartRateMonitor,
  IconFileCode,
  IconAlertTriangle,
  IconCpu,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle
} from '@tabler/icons-react';

interface TablerMetricsCardsProps {
  score: number;
  loc: number;
  counts: { high: number; medium: number; low: number };
  useLlm: boolean;
  hasGemini: boolean;
  filename: string;
  darkMode: boolean;
}

export const TablerMetricsCards: React.FC<TablerMetricsCardsProps> = ({
  score,
  loc,
  counts,
  useLlm,
  hasGemini,
  filename,
  darkMode
}) => {
  const totalIssues = counts.high + counts.medium + counts.low;

  const getScoreColor = () => {
    if (score >= 90) return { ribbon: 'bg-[#2fb344]', text: 'text-[#2fb344]', grade: 'Grade A' };
    if (score >= 70) return { ribbon: 'bg-[#f59f00]', text: 'text-[#f59f00]', grade: 'Grade B' };
    return { ribbon: 'bg-[#d63939]', text: 'text-[#d63939]', grade: 'Action Needed' };
  };

  const scoreInfo = getScoreColor();

  const cardBg = darkMode ? 'bg-[#151f30] border-[#243347] text-white' : 'bg-white border-slate-200 text-slate-900';
  const subtextCol = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {/* 1. Health Score Card */}
      <div className={`relative border rounded-lg p-4 shadow-xs overflow-hidden transition-all ${cardBg}`}>
        <div className={`absolute top-0 left-0 right-0 h-1 ${scoreInfo.ribbon}`} />
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[11px] font-semibold tracking-wider uppercase font-sans ${subtextCol}`}>
            Code Health Score
          </span>
          <IconHeartRateMonitor className={`w-4 h-4 ${scoreInfo.text}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-mono tracking-tight ${scoreInfo.text}`}>
            {score}
          </span>
          <span className={`text-xs ${subtextCol}`}>/ 100</span>
          <span className={`ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full border ${
            score >= 90
              ? 'bg-[#2fb344]/10 text-[#2fb344] border-[#2fb344]/30'
              : score >= 70
              ? 'bg-[#f59f00]/10 text-[#f59f00] border-[#f59f00]/30'
              : 'bg-[#d63939]/10 text-[#d63939] border-[#d63939]/30'
          }`}>
            {scoreInfo.grade}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${scoreInfo.ribbon}`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
      </div>

      {/* 2. File & Lines of Code Card */}
      <div className={`relative border rounded-lg p-4 shadow-xs overflow-hidden transition-all ${cardBg}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#206bc4]" />
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[11px] font-semibold tracking-wider uppercase font-sans ${subtextCol}`}>
            Source Metrics
          </span>
          <IconFileCode className="w-4 h-4 text-[#206bc4]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight">
            {loc}
          </span>
          <span className={`text-xs ${subtextCol}`}>Lines of Code</span>
        </div>
        <div className={`mt-3 text-xs flex items-center gap-1.5 font-mono truncate ${subtextCol}`}>
          <span className="w-2 h-2 rounded-full bg-[#206bc4]" />
          <span className="truncate">{filename}</span>
        </div>
      </div>

      {/* 3. Problems Detected Card */}
      <div className={`relative border rounded-lg p-4 shadow-xs overflow-hidden transition-all ${cardBg}`}>
        <div className={`absolute top-0 left-0 right-0 h-1 ${counts.high > 0 ? 'bg-[#d63939]' : counts.medium > 0 ? 'bg-[#f59f00]' : 'bg-[#2fb344]'}`} />
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[11px] font-semibold tracking-wider uppercase font-sans ${subtextCol}`}>
            Issues Detected
          </span>
          <IconAlertTriangle className={`w-4 h-4 ${counts.high > 0 ? 'text-[#d63939]' : 'text-[#f59f00]'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight">
            {totalIssues}
          </span>
          <span className={`text-xs ${subtextCol}`}>issues found</span>
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono">
          <span className="text-[#d63939] font-medium flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d63939]" />
            {counts.high} High
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-[#f59f00] font-medium flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59f00]" />
            {counts.medium} Med
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-[#4299e1] font-medium flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4299e1]" />
            {counts.low} Low
          </span>
        </div>
      </div>

      {/* 4. AI & AST Engine Status */}
      <div className={`relative border rounded-lg p-4 shadow-xs overflow-hidden transition-all ${cardBg}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[11px] font-semibold tracking-wider uppercase font-sans ${subtextCol}`}>
            Reasoning Engine
          </span>
          <IconCpu className="w-4 h-4 text-purple-500" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            {useLlm ? 'Gemini 3.8 Flash' : 'Deterministic AST'}
          </span>
          <span className="w-2 h-2 rounded-full bg-[#2fb344] animate-pulse" />
        </div>
        <div className={`mt-3 text-xs flex items-center gap-1.5 ${subtextCol}`}>
          <IconCheck className="w-3.5 h-3.5 text-[#2fb344]" />
          <span>Structured JSON fixes & docstrings</span>
        </div>
      </div>
    </div>
  );
};
