import React, { FC, useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Tv,
  X,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { TvSessionService } from '../firebase/tvSessionService';
import { MediaPlayPayload, PlaybackState } from '../types';

interface StickyPlayerControllerProps {
  activeMedia: MediaPlayPayload | null;
  roomCode: string;
  playbackState?: PlaybackState | null;
  isTvConnected: boolean;
  onOpenRemoteModal: () => void;
  onClose: () => void;
}

export const StickyPlayerController: FC<StickyPlayerControllerProps> = ({
  activeMedia,
  roomCode,
  playbackState,
  isTvConnected,
  onOpenRemoteModal,
  onClose,
}) => {
  // Local playback optimistic state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showJumpPopover, setShowJumpPopover] = useState<boolean>(false);
  const [customJumpMin, setCustomJumpMin] = useState<string>('10');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync from incoming playbackState
  useEffect(() => {
    if (playbackState) {
      if (typeof playbackState.playing === 'boolean') {
        setIsPlaying(playbackState.playing);
      }
      if (typeof playbackState.currentTime === 'number' && playbackState.currentTime >= 0) {
        setCurrentTime(Math.floor(playbackState.currentTime));
      }
      if (typeof playbackState.duration === 'number' && playbackState.duration > 0) {
        setDuration(Math.floor(playbackState.duration));
      }
      if (typeof playbackState.isMuted === 'boolean') {
        setIsMuted(playbackState.isMuted);
      }
    }
  }, [playbackState]);

  // Smooth local timer increment when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (duration > 0 && prev >= duration) return prev;
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Close Jump Min popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowJumpPopover(false);
      }
    };
    if (showJumpPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showJumpPopover]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const sStr = s < 10 ? `0${s}` : `${s}`;
    if (h > 0) {
      const mStr = m < 10 ? `0${m}` : `${m}`;
      return `${h}:${mStr}:${sStr}`;
    }
    return `${m}:${sStr}`;
  };

  const effectiveRoomCode = roomCode || 'LIVE';

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (roomCode) {
      TvSessionService.sendCommand(roomCode, nextState ? 'PLAY' : 'PAUSE');
    }
  };

  // Rewind 10 seconds
  const handleRewind10 = () => {
    const nextTime = Math.max(0, currentTime - 10);
    setCurrentTime(nextTime);
    if (roomCode) {
      TvSessionService.sendCommand(roomCode, 'SEEK_BACKWARD', { seconds: 10 });
    }
  };

  // Forward 10 seconds
  const handleForward10 = () => {
    const nextTime = currentTime + 10;
    setCurrentTime(nextTime);
    if (roomCode) {
      TvSessionService.sendCommand(roomCode, 'SEEK_FORWARD', { seconds: 10 });
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (roomCode) {
      TvSessionService.sendCommand(roomCode, nextMuted ? 'MUTE' : 'UNMUTE');
    }
  };

  // Jump to specific minutes
  const handleJumpToMinutes = (minutes: number) => {
    if (isNaN(minutes) || minutes < 0) return;
    const targetSeconds = minutes * 60;
    setCurrentTime(targetSeconds);
    if (roomCode) {
      TvSessionService.sendCommand(roomCode, 'TIME_JUMP', { minutes });
      TvSessionService.sendCommand(roomCode, 'SEEK', { seconds: targetSeconds });
    }
    setShowJumpPopover(false);
  };

  // Fullscreen TV / Open TV
  const handleFullscreen = () => {
    if (roomCode) {
      TvSessionService.sendCommand(roomCode, 'FULLSCREEN');
    } else {
      window.open('?tv=true', '_blank', 'opener');
    }
  };

  const title =
    activeMedia?.title ||
    playbackState?.title ||
    (activeMedia?.seasonNumber
      ? `Season ${activeMedia.seasonNumber} Episode ${activeMedia.episodeNumber}`
      : 'Active Stream');

  const episodeBadge =
    activeMedia?.seasonNumber && activeMedia?.episodeNumber
      ? `S${activeMedia.seasonNumber}E${activeMedia.episodeNumber}`
      : activeMedia?.mediaType
      ? activeMedia.mediaType.toUpperCase()
      : 'HD';

  return (
    <aside
      id="main-page-sticky-controller"
      aria-label="Sticky Video Controller"
      className="fixed bottom-0 inset-x-0 z-50 bg-neutral-950/95 backdrop-blur-xl border-t border-cyan-500/40 shadow-[0_-10px_35px_rgba(0,0,0,0.85)] px-3 sm:px-6 py-2.5 sm:py-3 text-white transition-all select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Top Info Strip: Poster, Title, and Room status */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeMedia?.posterUrl ? (
              <img
                src={activeMedia.posterUrl}
                alt={title}
                className="w-7 h-9 object-cover rounded shadow-md border border-neutral-700 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-9 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
                <Tv className="w-4 h-4 text-cyan-400" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-xs sm:text-sm truncate max-w-[240px] sm:max-w-md">
                  {title}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 text-[10px] font-mono font-bold uppercase">
                  {episodeBadge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  {isTvConnected ? (
                    <span>
                      Playing on TV <span className="font-mono text-cyan-400 font-bold">#{effectiveRoomCode}</span>
                    </span>
                  ) : (
                    <span>
                      Stream Ready • TV Room{' '}
                      <span className="font-mono text-cyan-400 font-bold">#{effectiveRoomCode}</span>
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="sticky-btn-remote-pad"
              onClick={onOpenRemoteModal}
              title="Open Virtual Remote Control Pad"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Remote Pad</span>
            </button>
            <button
              id="sticky-btn-close-controller"
              onClick={onClose}
              title="Close controller bar"
              className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-900 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress scrub bar */}
        <div className="w-full bg-neutral-800/80 rounded-full h-1 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
            style={{
              width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : isPlaying ? 35 : 0}%`,
            }}
          />
        </div>

        {/* EXACT CONTROLLER LAYOUT REQUESTED BY USER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Play / Pause Button */}
            <button
              id="sticky-btn-play-pause"
              onClick={handleTogglePlay}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black shadow-lg shadow-cyan-500/20 transition active:scale-95 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Rewind 10 seconds */}
            <button
              id="sticky-btn-rewind-10"
              onClick={handleRewind10}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>-10s</span>
            </button>

            {/* Forward 10 seconds */}
            <button
              id="sticky-btn-forward-10"
              onClick={handleForward10}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
              title="Forward 10 seconds"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>+10s</span>
            </button>

            {/* Mute Button */}
            <button
              id="sticky-btn-mute"
              onClick={handleToggleMute}
              className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Jump Min Popover */}
            <div className="relative" ref={popoverRef}>
              <button
                id="sticky-btn-jump-min"
                onClick={() => setShowJumpPopover((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
                title="Jump to specific time in minutes"
              >
                Jump Min
              </button>

              {showJumpPopover && (
                <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-xs font-bold text-neutral-300 mb-2 flex items-center justify-between">
                    <span>Jump to Minute</span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      Current: {formatTime(currentTime)}
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                    {[5, 10, 15, 30].map((min) => (
                      <button
                        key={min}
                        onClick={() => handleJumpToMinutes(min)}
                        className="py-1 px-1 rounded bg-neutral-800 hover:bg-cyan-600 hover:text-black border border-neutral-700 text-xs font-mono font-bold transition text-center cursor-pointer"
                      >
                        {min}m
                      </button>
                    ))}
                  </div>

                  {/* Custom Minute Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleJumpToMinutes(Number(customJumpMin));
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={customJumpMin}
                      onChange={(e) => setCustomJumpMin(e.target.value)}
                      placeholder="Min"
                      className="w-16 px-2 py-1 rounded bg-neutral-950 border border-neutral-700 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="flex-1 py-1 px-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition cursor-pointer"
                    >
                      Jump
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Time Display */}
            <span className="text-xs text-neutral-300 font-mono">
              {formatTime(currentTime)}
              {duration > 0 && <span className="text-neutral-500"> / {formatTime(duration)}</span>}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400 hidden sm:inline-block">
              Use remote or controls above
            </span>
            <button
              id="sticky-btn-fullscreen"
              onClick={handleFullscreen}
              className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
