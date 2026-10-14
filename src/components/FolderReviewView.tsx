import React, { useState, useEffect } from 'react';
import {
  IconFolder,
  IconFileCode,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconPlayerPlay,
  IconDownload,
  IconArrowRight,
  IconExternalLink
} from '@tabler/icons-react';
import { SampleFile } from '../types';

interface FolderReviewViewProps {
  onOpenFileInEditor: (sample: SampleFile) => void;
  samples: SampleFile[];
  onSwitchToTerminalWithCmd: (cmd: string) => void;
  darkMode: boolean;
}

interface FileReport {
  path: string;
  name: string;
  loc: number;
  score: number;
  issuesCount: number;
  high: number;
  med: number;
  low: number;
  sample: SampleFile;
}

export const FolderReviewView: React.FC<FolderReviewViewProps> = ({
  onOpenFileInEditor,
  samples,
  onSwitchToTerminalWithCmd,
  darkMode
}) => {
  const [folderReports, setFolderReports] = useState<FileReport[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanFolder = async () => {
    setIsScanning(true);
    const reports: FileReport[] = [];

    for (const sample of samples) {
      try {
        const res = await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: sample.code,
            filename: sample.path,
            useLlm: false
          })
        });
        const data = await res.json();
        reports.push({
          path: sample.path,
          name: sample.name,
          loc: data.loc || sample.code.split('\n').length,
          score: data.score ?? 100,
          issuesCount: data.issues?.length ?? 0,
          high: data.counts?.high ?? 0,
          med: data.counts?.medium ?? 0,
          low: data.counts?.low ?? 0,
          sample
        });
      } catch (err) {
        console.error('Scan error for', sample.path, err);
      }
    }

    setFolderReports(reports);
    setIsScanning(false);
  };

  useEffect(() => {
    if (samples.length > 0 && folderReports.length === 0) {
      scanFolder();
    }
  }, [samples]);

  const totalFiles = folderReports.length;
  const totalIssues = folderReports.reduce((acc, r) => acc + r.issuesCount, 0);
  const totalHigh = folderReports.reduce((acc, r) => acc + r.high, 0);
  const totalMed = folderReports.reduce((acc, r) => acc + r.med, 0);
  const totalLow = folderReports.reduce((acc, r) => acc + r.low, 0);
  const avgScore = totalFiles > 0 ? Math.round(folderReports.reduce((acc, r) => acc + r.score, 0) / totalFiles) : 100;

  const exportFolderReport = () => {
    let md = `# Tabler Code Review Folder Audit Report\n\n`;
    md += `Target Directory: \`examples/\`\n`;
    md += `Average Code Health Score: ${avgScore}/100\n`;
    md += `Total Files Reviewed: ${totalFiles}\n`;
    md += `Total Issues Detected: ${totalIssues} (High: ${totalHigh}, Med: ${totalMed}, Low: ${totalLow})\n\n`;
    md += `| File | LOC | Score | High | Med | Low | Issues |\n`;
    md += `|------|-----|-------|------|-----|-----|--------|\n`;
    for (const r of folderReports) {
      md += `| \`${r.path}\` | ${r.loc} | ${r.score}/100 | ${r.high} | ${r.med} | ${r.low} | ${r.issuesCount} |\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'folder-audit-report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardBg = darkMode ? 'bg-[#151f30] border-[#243347] text-white' : 'bg-white border-slate-200 text-slate-800';
  const headerBg = darkMode ? 'bg-[#101726] border-[#243347]' : 'bg-slate-50 border-slate-200';
  const tableHeaderBg = darkMode ? 'bg-[#101726] text-slate-400 border-[#243347]' : 'bg-slate-50 text-slate-600 border-slate-200';
  const rowHover = darkMode ? 'hover:bg-[#1a273e]' : 'hover:bg-slate-50/80';

  return (
    <div className="space-y-5">
      {/* Tabler Card Header */}
      <div className={`border rounded-lg p-5 shadow-xs transition-colors ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#243347]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#206bc4]/10 text-[#206bc4] flex items-center justify-center">
              <IconFolder className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  Directory Audit: <code className="text-[#206bc4] font-mono text-sm">examples/</code>
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold bg-[#2fb344]/10 text-[#2fb344] border border-[#2fb344]/30">
                  Recursive AST
                </span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} font-sans mt-0.5`}>
                Scans all Python files in the folder and aggregates code quality scores and problem breakdowns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSwitchToTerminalWithCmd('python reviewer.py examples/ --score')}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                darkMode
                  ? 'bg-[#151f30] border-[#243347] text-slate-200 hover:text-[#4299e1] hover:border-[#206bc4]'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-[#206bc4] hover:border-[#206bc4]'
              }`}
            >
              <IconPlayerPlay className="w-3.5 h-3.5 fill-current" />
              <span>Run in CLI</span>
            </button>
            <button
              onClick={exportFolderReport}
              disabled={folderReports.length === 0}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                darkMode
                  ? 'bg-[#151f30] border-[#243347] text-slate-200 hover:text-[#4299e1]'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-[#206bc4]'
              }`}
            >
              <IconDownload className="w-3.5 h-3.5" />
              <span>Export Audit.md</span>
            </button>
            <button
              onClick={scanFolder}
              disabled={isScanning}
              className="px-3.5 py-1.5 rounded-md bg-[#206bc4] hover:bg-[#1a569d] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              {isScanning ? 'Scanning...' : 'Rescan Folder'}
            </button>
          </div>
        </div>

        {/* Tabler Aggregated Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className={`p-3.5 rounded-lg border ${
            darkMode ? 'bg-[#101726] border-[#243347]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Average Health Score
            </span>
            <div className="text-2xl font-bold font-mono text-[#2fb344] mt-1">
              {avgScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
          </div>
          <div className={`p-3.5 rounded-lg border ${
            darkMode ? 'bg-[#101726] border-[#243347]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Python Files Scanned
            </span>
            <div className={`text-2xl font-bold font-mono mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {totalFiles}
            </div>
          </div>
          <div className={`p-3.5 rounded-lg border ${
            darkMode ? 'bg-[#101726] border-[#243347]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Total Problems Found
            </span>
            <div className="text-2xl font-bold font-mono text-[#f59f00] mt-1">
              {totalIssues}
            </div>
          </div>
          <div className={`p-3.5 rounded-lg border ${
            darkMode ? 'bg-[#101726] border-[#243347]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Risk Breakdown
            </span>
            <div className="text-xs font-bold font-mono mt-2 flex items-center gap-1.5">
              <span className="text-[#d63939]">{totalHigh} High</span>
              <span className="text-slate-400">·</span>
              <span className="text-[#f59f00]">{totalMed} Med</span>
              <span className="text-slate-400">·</span>
              <span className="text-[#4299e1]">{totalLow} Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabler Data Table */}
      <div className={`border rounded-lg overflow-hidden shadow-xs transition-colors ${cardBg}`}>
        <div className={`px-4 py-3 border-b text-xs font-semibold flex items-center justify-between ${headerBg}`}>
          <div className="flex items-center gap-2">
            <IconFileCode className="w-4 h-4 text-[#206bc4]" />
            <span className={darkMode ? 'text-white' : 'text-slate-900'}>
              Files Breakdown ({folderReports.length})
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            Sorted by path
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className={`border-b font-mono text-[11px] uppercase tracking-wider ${tableHeaderBg}`}>
              <tr>
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold">Lines</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Severity Breakdown</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#243347]">
              {folderReports.map((report) => (
                <tr key={report.path} className={`transition-colors ${rowHover}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-[#206bc4]/10 text-[#206bc4] flex items-center justify-center shrink-0">
                        <IconFileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`font-mono font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {report.name}
                        </div>
                        <div className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {report.sample.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium">{report.loc}</td>
                  <td className="px-4 py-3 font-mono">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full border text-[11px] ${
                        report.score >= 90
                          ? 'bg-[#2fb344]/10 text-[#2fb344] border-[#2fb344]/30'
                          : report.score >= 70
                          ? 'bg-[#f59f00]/10 text-[#f59f00] border-[#f59f00]/30'
                          : 'bg-[#d63939]/10 text-[#d63939] border-[#d63939]/30'
                      }`}
                    >
                      {report.score} / 100
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {report.issuesCount === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[#2fb344] font-semibold text-xs">
                        <IconCheck className="w-3.5 h-3.5" />
                        Clean (0 issues)
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        {report.high > 0 && (
                          <span className="text-[#d63939] bg-[#d63939]/10 px-1.5 py-0.5 rounded border border-[#d63939]/30 font-bold">
                            {report.high} High
                          </span>
                        )}
                        {report.med > 0 && (
                          <span className="text-[#f59f00] bg-[#f59f00]/10 px-1.5 py-0.5 rounded border border-[#f59f00]/30 font-bold">
                            {report.med} Med
                          </span>
                        )}
                        {report.low > 0 && (
                          <span className="text-[#4299e1] bg-[#4299e1]/10 px-1.5 py-0.5 rounded border border-[#4299e1]/30 font-bold">
                            {report.low} Low
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onOpenFileInEditor(report.sample)}
                      className={`px-2.5 py-1 rounded border text-xs font-medium inline-flex items-center gap-1 transition-colors ${
                        darkMode
                          ? 'bg-[#101726] border-[#243347] text-slate-200 hover:text-white hover:border-[#206bc4]'
                          : 'bg-white border-slate-200 text-slate-700 hover:text-[#206bc4] hover:border-[#206bc4]'
                      }`}
                    >
                      <span>Inspect</span>
                      <IconExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
