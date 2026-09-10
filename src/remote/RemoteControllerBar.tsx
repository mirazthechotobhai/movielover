import { FC } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Tv,
  Square,
  FastForward,
} from 'lucide-react';
import { TvSessionService } from '../firebase/tvSessionService';
import { PlaybackState } from '../types';

interface RemoteControllerBarProps {
  roomCode: string;
  playbackState?: PlaybackState | null;
  onOpenRemoteModal: () => void;
  onDisconnect: () => void;
}

export const RemoteControllerBar: FC<RemoteControllerBarProps> = ({
  roomCode,
  playbackState,
  onOpenRemoteModal,
  onDisconnect,
}) => {
  const isPlaying = playbackState?.playing ?? false;
  const isMuted = playbackState?.isMuted ?? false;
  const title = playbackState?.title || 'Ready to play';
  const currentTime = playbackState?.currentTime || 0;
  const duration = playbackState?.duration || 0;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlayPause = () => {
    TvSessionService.sendCommand(roomCode, isPlaying ? 'PAUSE' : 'PLAY');
  };

  const handleSeek = (seconds: number) => {
    TvSessionService.sendCommand(roomCode, seconds > 0 ? 'SEEK_FORWARD' : 'SEEK_BACKWARD');
  };

  const handleStop = () => {
    TvSessionService.sendCommand(roomCode, 'STOP');
  };

  const handleToggleMute = () => {
    TvSessionService.sendCommand(roomCode, isMuted ? 'UNMUTE' : 'MUTE');
  };

  const handleTimeJump = () => {
    TvSessionService.sendCommand(roomCode, 'TIME_JUMP', { minutes: 10 });
  };

  return (
    <aside
      id="remote-controller-bar"
      aria-label="TV Remote Control"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-40 bg-neutral-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl p-3 sm:p-4 text-white animate-in slide-in-from-bottom duration-300"
    >
      {/* Header Info */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-neutral-300">TV Remote:</span>
          <span className="font-mono font-bold text-cyan-400">#{roomCode}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRemoteModal}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
          >
            Pad
          </button>
          <span className="text-neutral-700">|</span>
          <button
            onClick={onDisconnect}
            className="text-[11px] text-neutral-400 hover:text-rose-400 transition cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Media Playing Status */}
      <div className="py-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-white truncate max-w-[220px]" title={title}>
            {title}
          </span>
          <span className="text-neutral-400 font-mono text-[11px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Progress scrub bar */}
        <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
          <div
            className="bg-cyan-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePlayPause}
            title={isPlaying ? 'Pause TV' : 'Play TV'}
            className="p-2 rounded-xl bg-cyan-500 text-neutral-950 font-bold hover:bg-cyan-400 transition transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => handleSeek(-10)}
            title="Rewind 10s on TV"
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleSeek(10)}
            title="Forward 10s on TV"
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleTimeJump}
            title="Time Jump +10 min on TV"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 transition"
          >
            <FastForward className="w-3 h-3" /> +10m
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute TV' : 'Mute TV'}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleStop}
            title="Stop playback on TV"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
