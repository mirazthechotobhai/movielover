import React, { useState } from 'react';
import {
  Radio,
  KeyRound,
  CheckCircle2,
  X,
  Tv,
  Smartphone,
  ExternalLink,
  Unlink,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { RemoteSessionData } from '../lib/firebase';

interface RemotePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCode: string | null;
  pairedSession: RemoteSessionData | null;
  onPairCode: (code: string) => Promise<boolean>;
  onUnlink: () => void;
  onOpenRemoteTab: () => void;
}

export const RemotePairingModal: React.FC<RemotePairingModalProps> = ({
  isOpen,
  onClose,
  activeCode,
  pairedSession,
  onPairCode,
  onUnlink,
  onOpenRemoteTab,
}) => {
  const [inputCode, setInputCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().replace(/[^0-9]/g, '');
    if (cleanCode.length < 6) {
      setErrorMessage('Please enter the 6-digit code shown on your remote screen.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const success = await onPairCode(cleanCode);
      if (success) {
        setInputCode('');
        onClose();
      } else {
        setErrorMessage('Code not found. Please ensure the remote is signed in with Google.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="remote-pairing-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="remote-pairing-modal-card"
        className="relative w-full max-w-md bg-[#0c0e1a] border border-white/[0.12] rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Pair Remote Controller
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Cloud Sync
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              রিমোটের ৬-সংখ্যার কোড বসিয়ে কানেক্ট করুন
            </p>
          </div>
        </div>

        {/* CURRENTLY PAIRED STATE */}
        {activeCode ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">
                    Remote Active & Linked!
                  </span>
                  <span className="block text-[11px] text-emerald-300/80 font-mono">
                    Code: {activeCode.slice(0, 3)} {activeCode.slice(3)}
                    {pairedSession?.userEmail && ` • ${pairedSession.userEmail}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-300 flex items-center justify-between">
              <span className="flex items-center gap-2 text-neutral-400">
                <Smartphone className="w-4 h-4 text-blue-400" />
                Controlling from paired device
              </span>
              <button
                onClick={onUnlink}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
              >
                <Unlink className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
              >
                Close & Return to Video
              </button>
            </div>
          </div>
        ) : (
          /* CODE INPUT FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step-by-Step Instructions */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1.5 text-xs text-neutral-300">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Open the <strong>Remote D-Pad</strong> tab (or open this app on your phone).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Sign in with <strong>Google / Gmail</strong> to generate your 6-digit code.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>Type that 6-digit code below and click <strong>Activate</strong>.</span>
              </div>
            </div>

            {/* Code Input Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-remote-code"
                className="block text-xs font-semibold text-neutral-300"
              >
                Enter 6-Digit Remote Code
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-neutral-500">
                  <KeyRound className="w-5 h-5 text-blue-400" />
                </div>
                <input
                  id="input-remote-code"
                  type="text"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    setInputCode(clean);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. 849201"
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 bg-black/60 border border-white/[0.12] focus:border-blue-500 rounded-2xl text-white placeholder-neutral-600 text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isLoading || inputCode.length < 6}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs shadow-lg shadow-blue-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Activate Remote (কোড নিশ্চিত করুন)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenRemoteTab();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 text-xs font-semibold border border-white/[0.06] transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Open Remote D-Pad in New Tab to Get Code</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
