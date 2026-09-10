import { useEffect, useRef, useState, useCallback, FC } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Tv,
} from 'lucide-react';
import { PlaybackState } from '../types';
import { getEmbedMasterUrl } from '../api/tmdbService';

interface CustomVideoPlayerProps {
  videoUrl: string;
  title: string;
  posterUrl?: string;
  autoPlay?: boolean;
  isTvMode?: boolean;
  onPlaybackStateChange?: (state: Partial<PlaybackState>) => void;
  onEnded?: () => void;
  className?: string;
  externalCommand?: {
    type: string;
    payload?: any;
    id: string;
  } | null;
  mediaId?: number | string;
  mediaType?: 'movie' | 'tv' | 'anime';
  seasonNumber?: number;
  episodeNumber?: number;
}

export const CustomVideoPlayer: FC<CustomVideoPlayerProps> = ({
  videoUrl,
  title,
  posterUrl,
  autoPlay = true,
  isTvMode = false,
  onPlaybackStateChange,
  onEnded,
  className = '',
  externalCommand,
  mediaId,
  mediaType = 'movie',
  seasonNumber,
  episodeNumber,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimer = useRef<number | null>(null);
  const lastExecutedCommandId = useRef<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [skin, setSkin] = useState<'onyx' | 'aurora'>('onyx');
  const [jumpMinutes, setJumpMinutes] = useState('10');
  const [showJumpInput, setShowJumpInput] = useState(false);

  // Compute clean EmbedMaster URL
  const computeUrl = useCallback(() => {
    if (videoUrl && videoUrl.includes('embedmaster.link')) {
      try {
        const u = new URL(videoUrl);
        if (!u.searchParams.has('skin')) u.searchParams.set('skin', skin);
        if (!u.searchParams.has('welcome_page')) u.searchParams.set('welcome_page', 'off');
        if (!u.searchParams.has('autoplay')) u.searchParams.set('autoplay', autoPlay ? 'on' : 'off');
        return u.toString();
      } catch {
        return videoUrl;
      }
    }

    if (mediaId) {
      const type = (mediaType as 'movie' | 'tv' | 'anime') || 'movie';
      return getEmbedMasterUrl(mediaId, type, seasonNumber || 1, episodeNumber || 1, {
        skin,
        welcome_page: 'off',
        autoplay: autoPlay ? 'on' : 'off',
      });
    }

    return videoUrl;
  }, [videoUrl, mediaId, mediaType, seasonNumber, episodeNumber, skin, autoPlay]);

  const [embedSrc, setEmbedSrc] = useState<string>(() => computeUrl());

  useEffect(() => {
    setEmbedSrc(computeUrl());
    setIsLoading(true);
  }, [computeUrl]);

  // Send command to EmbedMaster iframe via postMessage
  const sendCommand = useCallback((command: string, value?: any) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          {
            source: 'embedmaster_player_command',
            command,
            value,
          },
          '*'
        );
      } catch (err) {
        console.warn('Failed to postMessage to EmbedMaster iframe:', err);
      }
    }
  }, []);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Activity timer to auto-hide overlay controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = window.setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  // Sync state upward to parent / Firebase
  const syncState = useCallback(
    (updates: Partial<PlaybackState>) => {
      if (onPlaybackStateChange) {
        onPlaybackStateChange({
          playing: isPlaying,
          currentTime,
          duration,
          volume,
          isMuted,
          title,
          ...updates,
        });
      }
    },
    [currentTime, duration, isMuted, isPlaying, onPlaybackStateChange, title, volume]
  );

  // Listen to EmbedMaster events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== 'embedmaster_player') return;

      if (data.event === 'play') {
        setIsPlaying(true);
        setIsLoading(false);
        syncState({ playing: true });
      } else if (data.event === 'pause') {
        setIsPlaying(false);
        syncState({ playing: false });
      } else if (data.event === 'time' || data.event === 'timeupdate') {
        const timeVal =
          typeof data.info === 'number'
            ? data.info
            : typeof data.info?.time === 'number'
            ? data.info.time
            : null;
        const durVal =
          typeof data.info?.duration === 'number'
            ? data.info.duration
            : null;

        if (timeVal !== null) {
          setCurrentTime(timeVal);
          if (durVal !== null && durVal > 0) {
            setDuration(durVal);
            syncState({ currentTime: timeVal, duration: durVal });
          } else {
            syncState({ currentTime: timeVal });
          }
        }
      } else if (data.event === 'ended') {
        setIsPlaying(false);
        syncState({ playing: false });
        if (onEnded) onEnded();
      } else if (data.event === 'volume') {
        if (typeof data.info?.volume === 'number') {
          const v = data.info.volume / 100;
          setVolume(v);
          setIsMuted(v === 0);
          syncState({ volume: v, isMuted: v === 0 });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [syncState, onEnded]);

  // Handle external commands from Remote Control
  useEffect(() => {
    if (!externalCommand || externalCommand.id === lastExecutedCommandId.current) return;
    lastExecutedCommandId.current = externalCommand.id;

    const { type, payload } = externalCommand;
    console.log('EmbedMaster executing remote command:', type, payload);

    switch (type) {
      case 'PLAY':
        sendCommand('play');
        setIsPlaying(true);
        break;
      case 'PAUSE':
        sendCommand('pause');
        setIsPlaying(false);
        break;
      case 'SEEK_FORWARD': {
        const step = (payload && payload.seconds) || 10;
        const target = currentTime + step;
        sendCommand('seek', target);
        setCurrentTime(target);
        break;
      }
      case 'SEEK_BACKWARD': {
        const step = (payload && payload.seconds) || 10;
        const target = Math.max(0, currentTime - step);
        sendCommand('seek', target);
        setCurrentTime(target);
        break;
      }
      case 'TIME_JUMP': {
        if (payload && typeof payload.seconds === 'number') {
          sendCommand('seek', payload.seconds);
          setCurrentTime(payload.seconds);
        }
        break;
      }
      case 'SET_VOLUME': {
        if (payload && typeof payload.volume === 'number') {
          const pct = Math.round(payload.volume * 100);
          sendCommand('volume', pct);
          setVolume(payload.volume);
          setIsMuted(pct === 0);
        }
        break;
      }
      case 'MUTE':
        sendCommand('mute');
        setIsMuted(true);
        break;
      case 'UNMUTE':
        sendCommand('unmute');
        setIsMuted(false);
        break;
      case 'fullscreen':
        toggleFullscreen();
        break;
      default:
        break;
    }
  }, [externalCommand, currentTime, sendCommand]);

  // Fullscreen management
  const toggleFullscreen = async () => {
    if (!containerRef.current) {
      sendCommand('fullscreen');
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fallback to EmbedMaster command
      sendCommand('fullscreen');
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Time Jump Handler
  const handleExecuteTimeJump = () => {
    const mins = parseFloat(jumpMinutes);
    if (!isNaN(mins) && mins >= 0) {
      const targetSeconds = mins * 60;
      sendCommand('seek', targetSeconds);
      setCurrentTime(targetSeconds);
      setShowJumpInput(false);
      resetControlsTimer();
    }
  };

  return (
    <div
      ref={containerRef}
      id="embedmaster-player-container"
      className={`relative w-full bg-black text-white group overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-0' : 'aspect-video rounded-2xl'
      } ${className}`}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-sm pointer-events-none transition-opacity">
          {posterUrl && (
            <img
              src={posterUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-sm"
            />
          )}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-cyan-300">Loading EmbedMaster Stream...</p>
              <p className="text-xs text-neutral-400 max-w-sm truncate mt-0.5">{title}</p>
            </div>
          </div>
        </div>
      )}

      {/* EmbedMaster Iframe - Strictly following documentation: NO sandbox attribute */}
      <iframe
        id="embedmaster_iframe"
        ref={iframeRef}
        src={embedSrc}
        title={title}
        className="w-full h-full border-0 absolute inset-0 bg-black"
        allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
      />

      {/* Top Floating Control Bar */}
      <div
        className={`absolute top-0 inset-x-0 z-20 p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs">
            <Tv className="w-3.5 h-3.5" />
            <span>EmbedMaster HD</span>
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-md drop-shadow-md">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Skin Toggle */}
          <button
            onClick={() => setSkin((prev) => (prev === 'onyx' ? 'aurora' : 'onyx'))}
            title={`Toggle player skin (current: ${skin})`}
            className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
          >
            Skin: <span className="text-cyan-400 uppercase">{skin}</span>
          </button>

          {/* Reload Stream */}
          <button
            onClick={() => {
              setEmbedSrc('');
              setIsLoading(true);
              setTimeout(() => setEmbedSrc(computeUrl()), 50);
            }}
            title="Reload Embed"
            className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={() => {
                if (isPlaying) {
                  sendCommand('pause');
                  setIsPlaying(false);
                } else {
                  sendCommand('play');
                  setIsPlaying(true);
                }
              }}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black shadow-lg shadow-cyan-500/20 transition active:scale-95 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Seek -10s */}
            <button
              onClick={() => {
                const target = Math.max(0, currentTime - 10);
                sendCommand('seek', target);
                setCurrentTime(target);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>-10s</span>
            </button>

            {/* Seek +10s */}
            <button
              onClick={() => {
                const target = currentTime + 10;
                sendCommand('seek', target);
                setCurrentTime(target);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
              title="Forward 10 seconds"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>+10s</span>
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={() => {
                if (isMuted) {
                  sendCommand('unmute');
                  setIsMuted(false);
                } else {
                  sendCommand('mute');
                  setIsMuted(true);
                }
              }}
              className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Time Jump Selector */}
            <div className="relative">
              {showJumpInput ? (
                <div className="flex items-center gap-1 bg-neutral-900 border border-cyan-500/50 rounded-lg p-1">
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={jumpMinutes}
                    onChange={(e) => setJumpMinutes(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecuteTimeJump()}
                    className="w-12 bg-neutral-800 text-white text-xs px-1.5 py-0.5 rounded border-0 outline-none text-center font-bold"
                    placeholder="Min"
                    autoFocus
                  />
                  <span className="text-[10px] text-neutral-400">m</span>
                  <button
                    onClick={handleExecuteTimeJump}
                    className="px-2 py-0.5 rounded bg-cyan-500 text-neutral-950 font-bold text-xs"
                  >
                    Go
                  </button>
                  <button
                    onClick={() => setShowJumpInput(false)}
                    className="text-neutral-400 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowJumpInput(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
                  title="Jump to specific time in minutes"
                >
                  Jump Min
                </button>
              )}
            </div>

            {/* Current Time Display */}
            {currentTime > 0 && (
              <span className="text-xs text-neutral-300 font-mono">
                {formatTime(currentTime)}
                {duration > 0 ? ` / ${formatTime(duration)}` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400 hidden sm:inline-block">
              Use remote or controls above
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
