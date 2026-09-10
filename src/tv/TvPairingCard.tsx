import { FC } from 'react';
import { Tv, Wifi, CheckCircle2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface TvPairingCardProps {
  roomCode: string;
  isConnected: boolean;
  remoteId: string | null;
  className?: string;
  isCompact?: boolean;
}

export const TvPairingCard: FC<TvPairingCardProps> = ({
  roomCode,
  isConnected,
  remoteId,
  className = '',
  isCompact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isCompact) {
    return (
      <div
        id="tv-pairing-card-compact"
        className={`flex items-center gap-3 px-3 py-1.5 rounded-xl bg-neutral-900/90 border ${
          isConnected ? 'border-emerald-500/40 text-emerald-400' : 'border-cyan-500/40 text-cyan-400'
        } backdrop-blur-md ${className}`}
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isConnected ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}
            />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">TV Code:</span>
          <span className="font-mono text-sm font-bold text-white tracking-widest">{roomCode || '----'}</span>
        </div>

        <span className="text-xs text-neutral-400 font-medium">
          {isConnected ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Paired
            </span>
          ) : (
            <span className="text-neutral-400 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-cyan-400 animate-pulse" /> Waiting
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div
      id="tv-pairing-card-full"
      className={`rounded-3xl p-6 sm:p-8 bg-neutral-900/90 border-2 ${
        isConnected
          ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/10'
          : 'border-cyan-500/50 shadow-2xl shadow-cyan-500/10'
      } backdrop-blur-xl text-center max-w-md w-full mx-auto transition-all duration-300 ${className}`}
    >
      <div className="flex justify-center mb-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400 animate-pulse'
          }`}
        >
          <Tv className="w-8 h-8" />
        </div>
      </div>

      <div className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-1">
        Android Smart TV Remote Session
      </div>
      <h3 className="text-xl sm:text-2xl font-black text-white">TV REMOTE PAIRING</h3>

      {/* Code Display */}
      <div className="mt-6 mb-6">
        <div className="text-xs font-medium text-neutral-400 mb-2">ROOM CODE</div>
        <button
          onClick={copyCode}
          title="Click to copy code"
          className="group relative inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-neutral-950/90 border border-neutral-800 hover:border-cyan-500 transition-all cursor-pointer shadow-inner"
        >
          <span className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-cyan-400 group-hover:scale-105 transition-transform">
            {roomCode || '----'}
          </span>
          <span className="absolute -top-2 -right-2 p-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 opacity-0 group-hover:opacity-100 transition">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </span>
        </button>
        {copied && <div className="text-xs text-emerald-400 mt-1 font-medium">Code copied to clipboard!</div>}
      </div>

      {/* Connection Status Indicator */}
      <div
        className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold ${
          isConnected
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isConnected ? 'bg-emerald-400' : 'bg-cyan-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isConnected ? 'bg-emerald-500' : 'bg-cyan-500'
            }`}
          />
        </span>
        <span>{isConnected ? `Connected to Remote (${remoteId?.slice(0, 10)}...)` : 'Waiting for Remote to enter code...'}</span>
      </div>

      {/* Instructions */}
      <p className="text-xs text-neutral-400 mt-5 leading-relaxed">
        Open OnlineTV on your phone, tablet, or laptop, click the <strong>"TV Remote"</strong> button, and enter the
        4-digit code above to control playback instantly.
      </p>
    </div>
  );
};
