import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Copy, Trash2, X, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { PlayerEventLog } from '../types';

interface EventLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: PlayerEventLog[];
  onClear: () => void;
  lastEvent?: string;
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({
  isOpen,
  onClose,
  logs,
  onClear,
  lastEvent,
}) => {
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (autoScroll && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const el = document.getElementById('log');
    if (!el || !el.textContent) return;
    navigator.clipboard.writeText(el.textContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      id="event-log-drawer"
      className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[500px] max-w-full bg-[#0d0e17]/95 border border-white/[0.1] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-3.5 space-y-2 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            EmbedMaster Event Console
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Auto-scroll checkbox */}
          <label className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white cursor-pointer px-1.5 py-0.5 rounded bg-white/[0.04]">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3 accent-blue-500 rounded"
            />
            <span>Auto-scroll</span>
          </label>

          {/* Copy Button */}
          <button
            id="btn-copy-log-text"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-[#1a1b28] hover:bg-[#25273a] text-neutral-300 hover:text-white text-[11px] font-medium transition"
            title="Copy all logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
          </button>

          {/* Clear Button */}
          <button
            id="btn-clear-log-text"
            onClick={onClear}
            className="p-1.5 rounded-lg bg-[#1a1b28] hover:bg-[#25273a] text-rose-300 hover:text-rose-200 text-[11px] font-medium transition"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition"
            title="Close Console"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* The Exact User-Specified <pre id="log"> element */}
      <pre
        id="log"
        ref={preRef}
        style={{
          boxSizing: 'border-box',
          marginTop: '6px',
          background: '#07080f',
          color: '#86efac',
          padding: '12px 14px',
          width: '100%',
          maxHeight: '220px',
          height: '180px',
          overflowY: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '11px',
          lineHeight: '1.5',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      />

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400 px-1 font-mono pt-1">
        <span>Listening: <span className="text-blue-400">embedmaster_player</span></span>
        <span>Last Event: <span className="text-white uppercase font-bold">{lastEvent || 'idle'}</span></span>
      </div>
    </div>
  );
};
