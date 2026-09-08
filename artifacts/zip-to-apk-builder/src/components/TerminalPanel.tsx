import { useState, useRef, useEffect } from 'react';
import { Terminal, Copy, Check, Search, Maximize2, Minimize2, ArrowDown, Download } from 'lucide-react';
import type { BuildLog } from '@/context/BuildContext';

export interface LogEntry {
  id?: string;
  timestamp: string;
  level: string;
  message: string;
}

export interface TerminalPanelProps {
  logs: LogEntry[];
  title?: string;
  isStreaming?: boolean;
  className?: string;
}

export function TerminalPanel({
  logs,
  title = 'Build Terminal',
  isStreaming = false,
  className = '',
}: TerminalPanelProps) {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new logs arrive if enabled
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`scanline flex flex-col rounded-2xl border border-zinc-800 bg-[#0c1017] text-zinc-200 shadow-2xl transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 rounded-2xl' : 'min-h-[440px] '
      } ${className}`}
      data-testid="terminal-panel"
    >
      {/* Terminal Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-[#090d13] px-4 py-3">
        {/* Terminal Header Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>

          <div className="flex items-center gap-2 font-mono-ui text-xs font-semibold text-zinc-300">
            <Terminal size={14} className="text-amber-400" />
            <span>{title}</span>
          </div>

          {isStreaming && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono-ui text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </div>
          )}
        </div>

        {/* Terminal Controls */}
        <div className="flex items-center gap-2">
          {/* Search Filter Input */}
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="h-7 w-32 md:w-44 rounded-md border border-zinc-700/80 bg-zinc-900/90 pl-7 pr-2 font-mono-ui text-[11px] text-zinc-200 placeholder:text-zinc-500 focus:w-48 focus:border-amber-400 focus:outline-none transition-all"
              data-testid="input-search-logs"
            />
          </div>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Auto-scroll is ON' : 'Auto-scroll is OFF'}
            className={`flex h-7 items-center gap-1 rounded-md border px-2 font-mono-ui text-[10px] transition-colors ${
              autoScroll
                ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowDown size={11} className={autoScroll ? 'animate-bounce' : ''} />
            <span className="hidden sm:inline">Follow</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex h-7 items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 font-mono-ui text-[10px] text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Copy logs to clipboard"
            data-testid="button-copy-logs"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download Logs Button */}
          <button
            onClick={handleDownload}
            className="flex h-7 items-center rounded-md border border-zinc-700 bg-zinc-900 px-2 text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Download log file"
          >
            <Download size={12} />
          </button>

          {/* Maximize/Minimize */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-7 items-center rounded-md border border-zinc-700 bg-zinc-900 px-2 text-zinc-300 hover:bg-zinc-800 transition-colors"
            title={isExpanded ? 'Restore window' : 'Expand terminal'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 font-mono-ui text-xs leading-relaxed space-y-1 select-text scroll-smooth"
        style={{ maxHeight: isExpanded ? 'calc(100vh - 120px)' : '420px' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 font-mono-ui text-xs">
            {searchTerm ? `No logs match "${searchTerm}"` : 'Waiting for build pipeline execution...'}
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isError = log.level === 'error' || /error|fatal|exception/i.test(log.message);
            const isWarn = log.level === 'warn' || /warning|warn|deprecated/i.test(log.message);
            const isSuccess = log.level === 'success' || /successful|completed|passed/i.test(log.message);
            const isCmd = log.level === 'cmd' || log.message.startsWith('>') || log.message.startsWith('./gradlew');

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded px-1.5 py-0.5 hover:bg-zinc-800/40 transition-colors ${
                  isError
                    ? 'bg-rose-950/30 text-rose-300'
                    : isWarn
                    ? 'bg-amber-950/25 text-amber-300'
                    : isSuccess
                    ? 'text-emerald-300'
                    : isCmd
                    ? 'text-teal-300 font-semibold'
                    : 'text-zinc-300'
                }`}
              >
                {/* Line Number */}
                <span className="w-8 shrink-0 text-right text-[10px] text-zinc-600 select-none">
                  {idx + 1}
                </span>

                {/* Timestamp */}
                <span className="shrink-0 text-[10px] text-zinc-500 select-none">
                  {log.timestamp}
                </span>

                {/* Level Badge */}
                <span
                  className={`w-14 shrink-0 text-center text-[9px] uppercase font-bold rounded px-1 select-none ${
                    isError
                      ? 'bg-rose-500/20 text-rose-400'
                      : isWarn
                      ? 'bg-amber-500/20 text-amber-400'
                      : isSuccess
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isCmd
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {log.level}
                </span>

                {/* Log Message Content */}
                <span className="flex-1 break-all whitespace-pre-wrap">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Status Bar */}
      <div className="flex items-center justify-between border-t border-zinc-800/80 bg-[#090d13] px-4 py-2 font-mono-ui text-[10px] text-zinc-500">
        <div className="flex items-center gap-4">
          <span>LINES: {logs.length}</span>
          <span>FILTERED: {filteredLogs.length}</span>
          <span>ENCODING: UTF-8</span>
        </div>
        <div className="flex items-center gap-2">
          <span>STDOUT / STDERR CONSOLIDATED</span>
        </div>
      </div>
    </div>
  );
}
