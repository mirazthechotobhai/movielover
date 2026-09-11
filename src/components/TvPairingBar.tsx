import React, { useState, useEffect } from 'react';
import { Tv, CheckCircle2, Loader2, ExternalLink, Sparkles, Unlink } from 'lucide-react';
import { subscribeToLatestTvCode } from '../lib/tvSync';

interface TvPairingBarProps {
  connectedRoomCode: string | null;
  onConnect: (code: string) => Promise<{ success: boolean; error?: string }>;
  onDisconnect: () => void;
  onOpenTvTab: () => void;
}

export const TvPairingBar: React.FC<TvPairingBarProps> = ({
  connectedRoomCode,
  onConnect,
  onDisconnect,
  onOpenTvTab,
}) => {
  const [latestTvCode, setLatestTvCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('embedmaster_latest_tv_code');
    }
    return null;
  });
  const [inputCode, setInputCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subscribe to real-time latest TV code across tabs & devices
  useEffect(() => {
    const unsub = subscribeToLatestTvCode((code) => {
      if (code) {
        setLatestTvCode(code);
        // Automatically pre-fill the empty box if empty so user can immediately click Active
        setInputCode((prev) => (!prev.trim() ? code : prev));
      }
    });
    return () => unsub();
  }, []);

  const handleActiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToUse = inputCode.trim() || latestTvCode;
    if (!codeToUse) {
      setErrorMsg('Please enter code');
      setTimeout(() => setErrorMsg(null), 2500);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await onConnect(codeToUse);
      if (res.success) {
        setInputCode('');
      } else {
        setErrorMsg(res.error || 'Failed to connect');
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFillLatest = () => {
    if (latestTvCode) {
      setInputCode(latestTvCode);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
      {/* 1. TV Screen Button (Opens TV tab reliably without popup blocker) */}
      <a
        id="btn-open-tv-mode"
        href="?view=tv"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          // If onOpenTvTab provides extra logic (like telemetry/OSD)
          onOpenTvTab();
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium transition shadow-xs select-none no-underline cursor-pointer"
        title="Open TV screen in a new tab"
      >
        <Tv className="w-3.5 h-3.5 text-white" />
        <span className="font-semibold">TV</span>
        <ExternalLink className="w-3 h-3 opacity-75" />
      </a>

      {/* 2. TV Code Display (Shows exact same code from Firebase in real-time) */}
      <div
        id="header-tv-code-display"
        onClick={handleQuickFillLatest}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-mono transition cursor-pointer select-none ${
          latestTvCode
            ? 'bg-amber-50/90 hover:bg-amber-100 border-amber-400 text-amber-900 shadow-xs ring-1 ring-amber-300/60'
            : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}
        title={latestTvCode ? 'Click to copy into input box' : 'Open TV to generate code from Firebase'}
      >
        <span className="text-[11px] font-sans font-semibold text-amber-800 hidden xs:inline">
          TV Code:
        </span>
        <span
          id="latest-tv-code-value"
          className="font-mono font-extrabold text-amber-800 tracking-wider text-xs sm:text-sm"
        >
          {latestTvCode || '------'}
        </span>
      </div>

      {/* 3. Empty Input Box ("faka box") & 4. Active Button */}
      {connectedRoomCode ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span className="font-mono text-xs">Active: {connectedRoomCode}</span>
          <button
            id="btn-disconnect-tv"
            type="button"
            onClick={onDisconnect}
            className="ml-1 p-0.5 rounded text-emerald-600 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Disconnect TV"
          >
            <Unlink className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleActiveSubmit} className="flex items-center gap-1.5">
          {/* Empty Box ("faka box") */}
          <div className="relative">
            <input
              id="header-tv-code-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value.replace(/\D/g, ''));
                setErrorMsg(null);
              }}
              placeholder={latestTvCode || 'Code'}
              className={`w-20 sm:w-24 px-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono font-semibold tracking-wider text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errorMsg
                  ? 'border-rose-400 focus:ring-rose-300'
                  : 'border-slate-300 focus:ring-blue-400 focus:border-blue-400'
              }`}
              title="Enter TV code here"
            />
          </div>

          {/* Active Button */}
          <button
            id="btn-active-tv"
            type="submit"
            disabled={isSubmitting || (!inputCode.trim() && !latestTvCode)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-xs transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed select-none"
            title="Connect main page with TV player"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>Active</span>
            )}
          </button>
        </form>
      )}

      {/* Error notification if wrong code */}
      {errorMsg && (
        <span className="text-[11px] font-medium text-rose-600 animate-fade-in">
          {errorMsg}
        </span>
      )}
    </div>
  );
};
