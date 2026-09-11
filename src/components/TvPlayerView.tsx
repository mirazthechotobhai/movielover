import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaItem, TvRoomData } from '../types';
import { buildEmbedMasterUrl } from '../data/mediaPresets';
import {
  generateTvRoomCode,
  createTvRoom,
  terminateTvRoom,
  subscribeToTvRoom,
  syncTvPlayerState,
} from '../lib/tvSync';
import { requestTvFullscreen } from '../utils/tvFullscreen';
import {
  Tv,
  Maximize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Radio,
  Clock,
} from 'lucide-react';

interface TvPlayerViewProps {
  initialMedia?: MediaItem;
}

export const TvPlayerView: React.FC<TvPlayerViewProps> = ({ initialMedia }) => {
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomData, setRoomData] = useState<TvRoomData | null>(null);
  const [currentMedia, setCurrentMedia] = useState<MediaItem>(
    initialMedia || {
      id: 'tt31193180',
      title: 'Moana 2',
      type: 'movie',
      year: '2024',
    }
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(100);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showHud, setShowHud] = useState<boolean>(true);
  const [osdMessage, setOsdMessage] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const tvContainerRef = useRef<HTMLDivElement | null>(null);
  const lastProcessedCmdTimestampRef = useRef<number>(0);
  const hudTimeoutRef = useRef<any>(null);

  // Helper to send postMessage commands to EmbedMaster iframe
  const sendIframeCommand = useCallback((cmd: string, val?: any) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          source: 'embedmaster_player_command',
          command: cmd,
          value: val,
        },
        '*'
      );
    } catch (err) {
      console.warn('[TV Player] iframe postMessage error:', err);
    }
  }, []);

  const triggerOsd = (msg: string) => {
    setOsdMessage(msg);
    setTimeout(() => setOsdMessage(''), 3000);
  };

  // Generate Room Code & Register TV Session in Firebase
  useEffect(() => {
    const code = generateTvRoomCode();
    setRoomCode(code);

    // Immediate local storage update
    if (typeof window !== 'undefined') {
      localStorage.setItem('embedmaster_latest_tv_code', code);
      if (window.opener) {
        try {
          window.opener.postMessage({ type: 'embedmaster_tv_opened', roomCode: code }, '*');
        } catch (e) {}
      }
    }

    createTvRoom(code, currentMedia)
      .then(() => {
        if (typeof window !== 'undefined' && window.opener) {
          try {
            window.opener.postMessage({ type: 'embedmaster_tv_opened', roomCode: code }, '*');
          } catch (e) {}
        }
      })
      .catch((err) => console.error('[TV] Room creation failed:', err));

    // Subscribe to real-time room updates from Controller / Remote
    const unsub = subscribeToTvRoom(code, (updatedRoom) => {
      if (!updatedRoom) return;
      setRoomData(updatedRoom);

      // Check for incoming playback command
      const cmd = updatedRoom.playbackCommand;
      if (cmd && cmd.timestamp && cmd.timestamp > lastProcessedCmdTimestampRef.current) {
        lastProcessedCmdTimestampRef.current = cmd.timestamp;

        switch (cmd.action) {
          case 'play_media':
            if (cmd.value) {
              setCurrentMedia(cmd.value);
              setIsPlaying(true);
              triggerOsd(`Now Playing: ${cmd.value.title}`);
            }
            break;
          case 'play':
            setIsPlaying(true);
            sendIframeCommand('play');
            triggerOsd('Playback Resumed');
            break;
          case 'pause':
            setIsPlaying(false);
            sendIframeCommand('pause');
            triggerOsd('Paused');
            break;
          case 'seek':
            sendIframeCommand('seek', cmd.value);
            triggerOsd(`Seeked to ${Math.floor(cmd.value || 0)}s`);
            break;
          case 'time_jump':
            // Time jump is in minutes!
            const targetSec = (cmd.value || 0) * 60;
            sendIframeCommand('seek', targetSec);
            sendIframeCommand('play');
            setIsPlaying(true);
            triggerOsd(`Jumped to ${cmd.value}m`);
            break;
          case 'volume':
            setVolume(cmd.value);
            sendIframeCommand('volume', cmd.value);
            triggerOsd(`Volume: ${cmd.value}%`);
            break;
          case 'mute':
            sendIframeCommand('mute');
            triggerOsd('Muted');
            break;
          case 'unmute':
            sendIframeCommand('unmute');
            triggerOsd('Unmuted');
            break;
          case 'fullscreen':
            if (tvContainerRef.current) {
              requestTvFullscreen(tvContainerRef.current);
            }
            break;
          case 'reload':
            if (iframeRef.current) {
              iframeRef.current.src = iframeRef.current.src;
              triggerOsd('Stream Reloaded');
            }
            break;
        }
      }
    });

    // Automatically terminate/disconnect room when TV tab closes
    const handleUnload = () => {
      terminateTvRoom(code);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      terminateTvRoom(code);
      unsub();
    };
  }, []);

  // Listen to EmbedMaster events from iframe
  useEffect(() => {
    const handleWindowMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data || data.source !== 'embedmaster_player') return;

        if (data.event === 'play') {
          setIsPlaying(true);
        } else if (data.event === 'pause') {
          setIsPlaying(false);
        } else if (data.event === 'time' || data.event === 'timeupdate') {
          if (typeof data.info === 'number') {
            setCurrentTime(data.info);
          } else if (data.info && typeof data.info.currentTime === 'number') {
            setCurrentTime(data.info.currentTime);
            if (data.info.duration) setDuration(data.info.duration);
          }
        }
      } catch (err) {
        // Ignore non-json messages
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  // Keep Firestore synced with live playback state
  useEffect(() => {
    if (!roomCode) return;
    syncTvPlayerState(roomCode, {
      isPlaying,
      volume,
      currentTime,
      duration,
      title: currentMedia.title,
      mediaType: currentMedia.type,
    });
  }, [roomCode, isPlaying, volume, currentTime, duration, currentMedia]);

  // Request edge-to-edge fullscreen on TV
  const handleFullscreen = () => {
    if (tvContainerRef.current) {
      requestTvFullscreen(tvContainerRef.current);
    }
  };

  // Build TV-optimized stream URL (autoplay=on, skin=onyx, welcome_page=off)
  const streamUrl = buildEmbedMasterUrl(currentMedia, {
    autoplay: 'on',
    skin: 'onyx',
    welcomePage: 'off',
  });

  const isControllerConnected = roomData?.status === 'connected';

  return (
    <div
      ref={tvContainerRef}
      id="tv-mode-viewport"
      className="relative w-screen h-screen bg-black overflow-hidden select-none"
    >
      {/* 100% Fullscreen Video Player Iframe */}
      <iframe
        ref={iframeRef}
        id="embedmaster_iframe"
        src={streamUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *"
        allowFullScreen
        className="w-full h-full border-0 bg-black object-cover"
        title="TV Fullscreen Stream Player"
      />

      {/* Floating Smart TV HUD Banner */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 p-4 sm:p-6 transition-all duration-300 pointer-events-none ${
          showHud ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#090b14]/90 border border-white/10 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] pointer-events-auto">
          {/* Left: TV Brand & Room Code */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Tv className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  TV Room Code:
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-400 text-black text-lg sm:text-xl font-mono font-extrabold tracking-widest shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-pulse">
                  {roomCode || '....'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-1">
                {isControllerConnected ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Remote Controller Linked • Ready for Commands
                  </span>
                ) : (
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 animate-spin" />
                    Waiting for Remote... Open Main Page & enter code {roomCode}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Center: Current Playing Title */}
          <div className="hidden md:flex flex-col items-center text-center">
            <span className="text-sm font-bold text-white truncate max-w-xs">
              {currentMedia.title}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {currentMedia.type === 'tv' || currentMedia.type === 'anime'
                ? `Season ${currentMedia.season || 1} • Episode ${currentMedia.episode || 1}`
                : currentMedia.year || '2024'}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleFullscreen}
              className="interactive-element flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition active:scale-95 shadow-lg"
              title="Enter Edge-to-Edge Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>

            <a
              href={window.location.origin + window.location.pathname}
              className="interactive-element flex items-center gap-1 px-3 py-2 rounded-xl bg-[#1a1c2e] hover:bg-[#252842] text-neutral-300 hover:text-white text-xs font-semibold border border-white/10 transition"
              title="Return to Main Web Page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit TV</span>
            </a>
          </div>
        </div>
      </div>

      {/* On-Screen Display (OSD) Toast for TV */}
      {osdMessage && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-black/85 border border-amber-400/40 text-amber-300 text-sm font-bold font-mono tracking-wide backdrop-blur-md shadow-[0_0_25px_rgba(251,191,36,0.3)] animate-fade-in pointer-events-none">
          {osdMessage}
        </div>
      )}
    </div>
  );
};
