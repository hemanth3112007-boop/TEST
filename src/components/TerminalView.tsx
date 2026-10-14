import React, { useState, useRef, useEffect } from 'react';
import {
  IconTerminal2,
  IconPlayerPlay,
  IconCopy,
  IconCheck,
  IconTrash,
  IconSparkles
} from '@tabler/icons-react';

interface TerminalViewProps {
  initialCommand?: string;
  darkMode: boolean;
}

interface CommandLog {
  command: string;
  output: string;
  error?: string;
  exitCode: number;
  durationMs?: number;
  timestamp: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  initialCommand = 'python reviewer.py sample.py',
  darkMode
}) => {
  const [command, setCommand] = useState(initialCommand);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: 'Basic Review', cmd: 'python reviewer.py sample.py' },
    { label: 'With Code Diffs', cmd: 'python reviewer.py sample.py --diff' },
    { label: 'Health Score', cmd: 'python reviewer.py sample.py --score' },
    { label: 'Review Whole Folder', cmd: 'python reviewer.py examples/ --score' },
    { label: 'JSON Machine Output', cmd: 'python reviewer.py sample.py --json' },
    { label: 'CLI Help', cmd: 'python reviewer.py --help' }
  ];

  const runCommand = async (cmdToRun: string) => {
    if (!cmdToRun.trim() || isRunning) return;
    setIsRunning(true);

    try {
      const res = await fetch('/api/run-cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmdToRun })
      });
      const data = await res.json();

      const newLog: CommandLog = {
        command: cmdToRun,
        output: data.stdout || '',
        error: data.stderr || (data.error ? data.error : undefined),
        exitCode: data.exitCode ?? 0,
        durationMs: data.durationMs,
        timestamp: new Date().toLocaleTimeString()
      };

      setLogs((prev) => [...prev, newLog]);
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          command: cmdToRun,
          output: '',
          error: err.message || 'Execution error',
          exitCode: 1,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (logs.length === 0) {
      runCommand(initialCommand);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isRunning]);

  const copyLogOutput = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const cardBg = darkMode ? 'bg-[#151f30] border-[#243347]' : 'bg-white border-slate-200';
  const headerBg = darkMode ? 'bg-[#101726] border-[#243347]' : 'bg-slate-50 border-slate-200';

  return (
    <div className={`flex flex-col h-full border rounded-lg overflow-hidden shadow-xs font-mono text-xs ${cardBg}`}>
      {/* Terminal Title Bar */}
      <div className={`flex flex-wrap items-center justify-between px-4 py-2.5 border-b gap-2 ${headerBg}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#d63939]/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#f59f00]/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#2fb344]/80 inline-block" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <IconTerminal2 className="w-4 h-4 text-[#206bc4]" />
            <span className={darkMode ? 'text-white' : 'text-slate-800'}>Console — python reviewer.py</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLogs([])}
            className={`px-2 py-1 rounded border text-xs font-medium flex items-center gap-1 transition-colors ${
              darkMode
                ? 'bg-[#151f30] border-[#243347] text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Clear Console"
          >
            <IconTrash className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Preset Command Chips */}
      <div className={`px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto text-[11px] ${
        darkMode ? 'bg-[#121b2b] border-[#243347]' : 'bg-slate-100/70 border-slate-200'
      }`}>
        <span className={`select-none font-semibold uppercase text-[10px] tracking-wider ${
          darkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Quick Presets:
        </span>
        {presets.map((preset) => (
          <button
            key={preset.cmd}
            onClick={() => {
              setCommand(preset.cmd);
              runCommand(preset.cmd);
            }}
            disabled={isRunning}
            className={`whitespace-nowrap px-2.5 py-1 rounded border transition-colors ${
              darkMode
                ? 'bg-[#1e2a3f] border-[#2e405d] text-slate-300 hover:text-white hover:border-[#206bc4]'
                : 'bg-white border-slate-200 text-slate-700 hover:text-[#206bc4] hover:border-[#206bc4]'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Output Console Log */}
      <div
        ref={scrollRef}
        className={`flex-1 p-4 overflow-y-auto space-y-4 ${
          darkMode ? 'bg-[#0b101b] text-slate-200' : 'bg-slate-900 text-slate-100'
        }`}
      >
        <div className="text-slate-500 select-none pb-2 border-b border-slate-800 text-[11px]">
          # Tabler Python Code Reviewer CLI v1.0.0
          <br /># Standard output streams directly from reviewer.py child process.
        </div>

        {logs.map((log, index) => (
          <div key={index} className="space-y-2 border-l-2 border-[#206bc4]/50 pl-3">
            {/* Command Header */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-[#206bc4] font-bold select-none">$</span>
                <span className="text-white font-semibold">{log.command}</span>
              </div>
              <div className="flex items-center gap-2">
                {log.durationMs !== undefined && (
                  <span className="text-slate-500">{log.durationMs}ms</span>
                )}
                <button
                  onClick={() => copyLogOutput(log.output, index)}
                  className="text-slate-400 hover:text-white p-0.5 rounded"
                  title="Copy output"
                >
                  {copiedIndex === index ? <IconCheck className="w-3.5 h-3.5 text-[#2fb344]" /> : <IconCopy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Output Text */}
            {log.output && (
              <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed select-text font-mono text-xs bg-black/30 p-3 rounded border border-slate-800">
                {log.output}
              </pre>
            )}

            {/* Error Message */}
            {log.error && (
              <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed bg-rose-950/20 p-2.5 rounded border border-rose-900/40">
                {log.error}
              </pre>
            )}
          </div>
        ))}

        {isRunning && (
          <div className="flex items-center gap-2 text-[#206bc4] text-xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#206bc4]" />
            <span>Executing CLI AST review...</span>
          </div>
        )}
      </div>

      {/* Input Prompt */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runCommand(command);
        }}
        className={`flex items-center gap-2 p-2.5 border-t ${headerBg}`}
      >
        <span className="text-[#206bc4] font-bold pl-2 select-none text-sm">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="python reviewer.py sample.py"
          className={`flex-1 bg-transparent focus:outline-none font-mono text-xs ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        />
        <button
          type="submit"
          disabled={isRunning || !command.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#206bc4] hover:bg-[#1a569d] text-white font-semibold text-xs transition-colors disabled:opacity-50 shadow-xs"
        >
          <IconPlayerPlay className="w-3.5 h-3.5 fill-current" />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};
