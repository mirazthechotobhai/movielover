import { FC, useState, FormEvent } from 'react';
import {
  X,
  Tv,
  Wifi,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  FastForward,
  Square,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { TvSessionService } from '../firebase/tvSessionService';
import { PlaybackState } from '../types';

interface RemoteControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedRoomCode: string | null;
  onConnectSuccess: (code: string) => void;
  onDisconnect: () => void;
  playbackState?: PlaybackState | null;
}

export const RemoteControlModal: FC<RemoteControlModalProps> = ({
  isOpen,
  onClose,
  connectedRoomCode,
  onConnectSuccess,
  onDisconnect,
  playbackState,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customJumpMinutes, setCustomJumpMinutes] = useState('10');

  if (!isOpen) return null;

  const isConnected = !!connectedRoomCode;
  const isPlaying = playbackState?.playing ?? false;
  const isMuted = playbackState?.isMuted ?? false;
  const volume = playbackState?.volume ?? 1.0;

  const handlePair = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = inputCode.trim();
    if (cleanCode.length !== 4) {
      setErrorMessage('Please enter the 4-digit code shown on your TV.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await TvSessionService.claimTvCode(cleanCode);
      if (res.success) {
        setSuccessMessage(res.message);
        onConnectSuccess(cleanCode);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendCmd = (type: any, payload: any = null) => {
    if (!connectedRoomCode) return;
    TvSessionService.sendCommand(connectedRoomCode, type, payload);
  };

  const handleVolumeSlide = (val: number) => {
    sendCmd('SET_VOLUME', { volume: val });
  };

  return (
    <div
      id="remote-control-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="remote-control-modal-content"
        className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-white relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
            }`}
          >
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">TV Remote</h3>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-400">TV Status:</span>
              <span
                className={`font-semibold ${
                  isConnected ? 'text-emerald-400 flex items-center gap-1' : 'text-neutral-400'
                }`}
              >
                {isConnected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected (#{connectedRoomCode})
                  </>
                ) : (
                  'Disconnected'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* UNPAIRED STATE: Enter 4-digit code */}
        {!isConnected ? (
          <div>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Open the dedicated TV player on your Smart TV or click <strong>TV</strong> in the top header, then enter the
              4-digit code below to pair devices.
            </p>

            <form onSubmit={handlePair} className="space-y-4">
              <div>
                <label htmlFor="tv-code-input" className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Enter TV Code
                </label>
                <input
                  id="tv-code-input"
                  type="text"
                  maxLength={4}
                  placeholder="2245"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center font-mono text-3xl font-black tracking-widest py-3 px-4 rounded-xl bg-neutral-950 border border-neutral-700 text-cyan-400 focus:outline-none focus:border-cyan-400 transition"
                  autoFocus
                />
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-active-pair"
                disabled={isLoading || inputCode.length !== 4}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>ACTIVE</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* PAIRED REMOTE CONTROL INTERFACE */
          <div className="space-y-4">
            {/* Media Info Card */}
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs">
              <div className="text-neutral-400 font-medium text-[11px] uppercase tracking-wider mb-1">
                Now Playing on TV
              </div>
              <div className="font-bold text-white text-sm truncate">
                {playbackState?.title || 'Waiting for media selection...'}
              </div>
              <div className="text-neutral-400 text-[11px] mt-0.5">
                {isPlaying ? 'Status: Playing' : 'Status: Paused'}
              </div>
            </div>

            {/* Playback Controls Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => sendCmd('SEEK_BACKWARD')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 transition"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-semibold">-10s</span>
              </button>

              <button
                onClick={() => sendCmd(isPlaying ? 'PAUSE' : 'PLAY')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold transition transform active:scale-95 shadow-md shadow-cyan-500/20"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                <span className="text-[10px] uppercase tracking-wider">{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => sendCmd('SEEK_FORWARD')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 transition"
                title="Forward 10 seconds"
              >
                <RotateCw className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-semibold">+10s</span>
              </button>
            </div>

            {/* Time Jump Control (Section 6) */}
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                  <FastForward className="w-3.5 h-3.5 text-cyan-400" /> Time Jump
                </span>
                <span className="text-[11px] text-neutral-400">Seek forward</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customJumpMinutes}
                  onChange={(e) => setCustomJumpMinutes(e.target.value)}
                  className="w-16 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                />
                <span className="text-xs text-neutral-400">min</span>
                <button
                  onClick={() => sendCmd('TIME_JUMP', { minutes: customJumpMinutes })}
                  className="flex-1 py-1.5 px-3 bg-neutral-800 hover:bg-cyan-500 hover:text-neutral-950 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold transition"
                >
                  Jump Forward
                </button>
              </div>
            </div>

            {/* Volume Control */}
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Volume
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => sendCmd(isMuted ? 'UNMUTE' : 'MUTE')}
                  className="p-1.5 text-neutral-300 hover:text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeSlide(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Stop & Disconnect Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => sendCmd('STOP')}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 border border-neutral-700 text-xs font-semibold text-neutral-300 transition flex items-center justify-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" /> Stop TV
              </button>

              <button
                onClick={onDisconnect}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-400 hover:text-white transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
