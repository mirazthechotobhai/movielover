import React, { useEffect, useState, useRef } from 'react';
import { RoomState } from '../types';
import {
  subscribeToRoom,
  updateRoomState,
  checkRoomExists,
} from '../services/firebase';
import { QRScannerModal } from './QRScannerModal';
import { BrowseModal } from './BrowseModal';
import { fetchTVShowSeasonsInfo, TVShowSeasonsInfo } from '../services/tmdb';
import {
  Tv,
  Camera,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  XCircle,
  Film,
  Wifi,
  WifiOff,
  Radio,
  ArrowRight,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface RemotePageProps {
  initialRoomCode?: string;
  onBackToPlayer?: () => void;
}

export const RemotePage: React.FC<RemotePageProps> = ({
  initialRoomCode,
  onBackToPlayer,
}) => {
  // Read ?room= query param if present
  const [roomCodeInput, setRoomCodeInput] = useState<string>(() => {
    if (initialRoomCode) return initialRoomCode;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r && /^[0-9]{4}$/.test(r)) return r;
    }
    return '';
  });

  const [connectedRoomCode, setConnectedRoomCode] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);

  // Local optimistic controls (Default volume 100%)
  const [volume, setVolume] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const prevVolumeRef = useRef<number>(1);
  const isDraggingVolumeRef = useRef<boolean>(false);
  const volumeDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentVolumeRef = useRef<number>(1);

  // Seasons & Episodes State for TV shows / Anime
  const [seasonsInfo, setSeasonsInfo] = useState<TVShowSeasonsInfo>({
    totalSeasons: 1,
    seasonEpisodesMap: { 1: 12 },
  });
  const [inputSeason, setInputSeason] = useState<string>('1');
  const [inputEpisode, setInputEpisode] = useState<string>('1');

  // Sync with current media playing from roomState
  useEffect(() => {
    if (!roomState?.media) return;
    const media = roomState.media;
    const isEpisodic = media.type === 'tv' || media.type === 'anime' || Boolean(media.season);
    if (!isEpisodic) return;

    if (media.season) {
      setInputSeason(String(media.season));
    }
    if (media.episode) {
      setInputEpisode(String(media.episode));
    }

    const targetId = media.tmdbId || media.id;
    if (targetId) {
      fetchTVShowSeasonsInfo(targetId).then((info) => {
        setSeasonsInfo(info);
      });
    }
  }, [roomState?.media?.id, roomState?.media?.tmdbId, roomState?.media?.season, roomState?.media?.episode]);

  // Auto-connect if ?room= query param exists on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room') || initialRoomCode;
    if (roomParam && /^[0-9]{4}$/.test(roomParam)) {
      handleConnect(roomParam);
    }
  }, [initialRoomCode]);

  // Subscribe to room updates when connected
  useEffect(() => {
    if (!connectedRoomCode) {
      setRoomState(null);
      return;
    }

    const unsub = subscribeToRoom(connectedRoomCode, (state) => {
      if (!state) {
        // Do not immediately drop connection; keep waiting for TV player
        return;
      }
      setRoomState(state);
      setIsPlaying(Boolean(state.isPlaying));
      // Only sync volume from TV state if user is NOT actively dragging the slider
      if (typeof state.volume === 'number' && !isDraggingVolumeRef.current) {
        setVolume(state.volume);
        setIsMuted(state.volume === 0);
      }
    });

    return () => {
      unsub();
    };
  }, [connectedRoomCode]);

  // Connect to TV by room code
  const handleConnect = async (codeToConnect: string) => {
    const code = codeToConnect.trim();
    if (!/^[0-9]{4}$/.test(code)) {
      setErrorMsg('Please enter a valid 4-digit room code.');
      return;
    }

    setConnecting(true);
    setErrorMsg(null);

    try {
      // Connect to the room
      setConnectedRoomCode(code);
      setRoomCodeInput(code);

      // Notify TV player that remote is now connected
      await updateRoomState(code, {
        status: 'connected',
        lastUpdated: Date.now(),
      });
    } catch (err: any) {
      console.warn('Connect notice:', err);
      // Still allow remote control even if initial ping had network latency
      setConnectedRoomCode(code);
    } finally {
      setConnecting(false);
    }
  };

  // Remote Action: Play / Pause toggle
  const handleTogglePlay = async () => {
    if (!connectedRoomCode) return;
    const nextPlay = !isPlaying;
    setIsPlaying(nextPlay);

    await updateRoomState(connectedRoomCode, {
      isPlaying: nextPlay,
      action: nextPlay ? 'play' : 'pause',
      actionTimestamp: Date.now(),
      actionId: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });
  };

  // Remote Action: Rewind 10s
  const handleRewind = async () => {
    if (!connectedRoomCode) return;
    const cur = roomState?.currentTime || 0;
    const newTime = Math.max(0, cur - 10);

    await updateRoomState(connectedRoomCode, {
      currentTime: newTime,
      action: 'seek_backward',
      actionTimestamp: Date.now(),
      actionId: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });
  };

  // Remote Action: Fast Forward 10s
  const handleFastForward = async () => {
    if (!connectedRoomCode) return;
    const cur = roomState?.currentTime || 0;
    const newTime = cur + 10;

    await updateRoomState(connectedRoomCode, {
      currentTime: newTime,
      action: 'seek_forward',
      actionTimestamp: Date.now(),
      actionId: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });
  };

  // Remote Action: Smooth volume change with optimistic local UI and throttled network sync
  const handleVolumeChange = (newVol: number, commitImmediately = false) => {
    if (!connectedRoomCode) return;
    const clamped = Math.max(0, Math.min(1, Math.round(newVol * 100) / 100));

    // 1. Instant optimistic state update (silky smooth 60fps)
    setVolume(clamped);
    if (clamped > 0) setIsMuted(false);
    else setIsMuted(true);

    // 2. Clear any pending debounce timer
    if (volumeDebounceTimerRef.current) {
      clearTimeout(volumeDebounceTimerRef.current);
      volumeDebounceTimerRef.current = null;
    }

    const triggerUpdate = async (val: number) => {
      lastSentVolumeRef.current = val;
      try {
        await updateRoomState(connectedRoomCode, {
          volume: val,
          action: 'volume',
          actionTimestamp: Date.now(),
          actionId: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        });
      } catch (err) {
        console.warn('Volume update network notice:', err);
      }
    };

    if (commitImmediately) {
      triggerUpdate(clamped);
    } else {
      // Throttle network requests to every 45ms to avoid flooding SSE and network queue
      volumeDebounceTimerRef.current = setTimeout(() => {
        triggerUpdate(clamped);
      }, 45);
    }
  };

  // Stepper: Volume Up (+)
  const handleVolumeUp = () => {
    const current = isMuted ? 0 : volume;
    const next = Math.min(1, Math.round((current + 0.05) * 100) / 100);
    handleVolumeChange(next, true);
  };

  // Stepper: Volume Down (-)
  const handleVolumeDown = () => {
    const current = isMuted ? 0 : volume;
    const next = Math.max(0, Math.round((current - 0.05) * 100) / 100);
    handleVolumeChange(next, true);
  };

  // Mute / Unmute Toggle
  const handleToggleMute = () => {
    if (!connectedRoomCode) return;
    if (isMuted || volume === 0) {
      const restored = prevVolumeRef.current > 0 ? prevVolumeRef.current : 1;
      setIsMuted(false);
      handleVolumeChange(restored, true);
    } else {
      prevVolumeRef.current = volume > 0 ? volume : 1;
      setIsMuted(true);
      handleVolumeChange(0, true);
    }
  };

  // Remote Action: Red Close Player Session ❌ button
  const handleCloseSession = async () => {
    if (!connectedRoomCode) return;
    try {
      await updateRoomState(connectedRoomCode, {
        action: 'close',
        actionTimestamp: Date.now(),
        actionId: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status: 'waiting',
        isPlaying: false,
      });
    } catch {}

    setConnectedRoomCode(null);
    setRoomState(null);
    setErrorMsg('Session closed. Connect to another room anytime.');
  };

  // Handle successful QR code scan
  const handleScanSuccess = (code: string) => {
    setScannerOpen(false);
    setRoomCodeInput(code);
    handleConnect(code);
  };

  // Season & Episode bounds and clamping
  const isEpisodic = Boolean(
    roomState?.media &&
      (roomState.media.type === 'tv' ||
        roomState.media.type === 'anime' ||
        (typeof roomState.media.season === 'number' && roomState.media.type !== 'movie'))
  );

  const maxSeasons = Math.max(1, seasonsInfo.totalSeasons || 1);
  const currentSeasonNum = Math.min(Math.max(1, parseInt(inputSeason, 10) || 1), maxSeasons);
  const maxEpisodes = Math.max(1, seasonsInfo.seasonEpisodesMap[currentSeasonNum] || 10);
  const currentEpisodeNum = Math.min(Math.max(1, parseInt(inputEpisode, 10) || 1), maxEpisodes);

  const handleSeasonUp = () => {
    const nextS = Math.min(currentSeasonNum + 1, maxSeasons);
    setInputSeason(String(nextS));
    const nextMaxE = Math.max(1, seasonsInfo.seasonEpisodesMap[nextS] || 10);
    if (currentEpisodeNum > nextMaxE) {
      setInputEpisode(String(nextMaxE));
    }
  };

  const handleSeasonDown = () => {
    const prevS = Math.max(currentSeasonNum - 1, 1);
    setInputSeason(String(prevS));
    const prevMaxE = Math.max(1, seasonsInfo.seasonEpisodesMap[prevS] || 10);
    if (currentEpisodeNum > prevMaxE) {
      setInputEpisode(String(prevMaxE));
    }
  };

  const handleSeasonInputChange = (val: string) => {
    if (val === '') {
      setInputSeason('');
      return;
    }
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return;
    const num = parseInt(clean, 10);
    // Strict clamp: cannot enter greater than available seasons
    const clamped = Math.min(Math.max(1, num), maxSeasons);
    setInputSeason(String(clamped));
    const newMaxE = Math.max(1, seasonsInfo.seasonEpisodesMap[clamped] || 10);
    if (currentEpisodeNum > newMaxE) {
      setInputEpisode(String(newMaxE));
    }
  };

  const handleSeasonInputBlur = () => {
    if (!inputSeason || parseInt(inputSeason, 10) < 1) {
      setInputSeason('1');
    }
  };

  const handleEpisodeUp = () => {
    const nextE = Math.min(currentEpisodeNum + 1, maxEpisodes);
    setInputEpisode(String(nextE));
  };

  const handleEpisodeDown = () => {
    const prevE = Math.max(currentEpisodeNum - 1, 1);
    setInputEpisode(String(prevE));
  };

  const handleEpisodeInputChange = (val: string) => {
    if (val === '') {
      setInputEpisode('');
      return;
    }
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return;
    const num = parseInt(clean, 10);
    // Strict clamp: cannot enter greater than available episodes for this season
    const clamped = Math.min(Math.max(1, num), maxEpisodes);
    setInputEpisode(String(clamped));
  };

  const handleEpisodeInputBlur = () => {
    if (!inputEpisode || parseInt(inputEpisode, 10) < 1) {
      setInputEpisode('1');
    }
  };

  // Trigger play on TV for selected Season and Episode
  const handlePlaySeasonEpisode = async (sTarget?: number, eTarget?: number) => {
    if (!connectedRoomCode || !roomState?.media) return;
    const s = typeof sTarget === 'number' ? sTarget : currentSeasonNum;
    const seasonMaxE = Math.max(1, seasonsInfo.seasonEpisodesMap[s] || 10);
    const e = typeof eTarget === 'number' ? eTarget : Math.min(currentEpisodeNum, seasonMaxE);

    setInputSeason(String(s));
    setInputEpisode(String(e));

    await updateRoomState(connectedRoomCode, {
      media: {
        ...roomState.media,
        season: s,
        episode: e,
      },
      action: 'change_media',
      actionTimestamp: Date.now(),
      actionId: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isPlaying: true,
    });
  };

  return (
    <div
      id="remote-page-container"
      className="min-h-screen w-full bg-[#0f0f13] text-white flex flex-col items-center select-none"
    >
      {/* Top Bar (#0f0f13 sleek mobile UI) */}
      <header
        id="remote-top-bar"
        className="w-full max-w-md px-5 py-4 flex items-center justify-between border-b border-white/10 bg-[#14141c]/80 backdrop-blur-md sticky top-0 z-30"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Tv className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight tracking-tight">
              StreamCast
            </h1>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
              {connectedRoomCode ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected (#{connectedRoomCode})
                </span>
              ) : (
                'Mobile Remote'
              )}
            </span>
          </div>
        </div>

        {/* Camera button (📷 Scan QR) and TV Back switch */}
        <div className="flex items-center gap-2">
          {onBackToPlayer && (
            <button
              id="btn-back-to-tv"
              onClick={onBackToPlayer}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 border border-white/10 transition-colors"
            >
              TV View
            </button>
          )}

          <button
            id="btn-scan-qr"
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all active:scale-95"
            aria-label="Scan QR Code"
          >
            <Camera className="w-4 h-4" />
            <span>Scan QR</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-md flex-1 flex flex-col p-5">
        {/* Error / Alert banner */}
        {errorMsg && (
          <div className="w-full p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between mb-4 animate-in fade-in">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="p-1 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* SECTION 1: Connect Section (When not connected) */}
        {!connectedRoomCode ? (
          <div
            id="connect-section"
            className="flex-1 flex flex-col justify-center items-center text-center py-8 animate-in fade-in"
          >
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 shadow-xl shadow-indigo-500/10">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
              Connect to TV
            </h2>
            <p className="text-sm text-zinc-400 max-w-xs mb-8">
              Enter the 4-digit code shown on your TV screen, or tap 📷 Scan QR to connect instantly.
            </p>

            {/* 4-Digit Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConnect(roomCodeInput);
              }}
              className="w-full flex flex-col items-center gap-4"
            >
              <div className="w-full relative">
                <input
                  id="input-room-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="0000"
                  value={roomCodeInput}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                    setRoomCodeInput(clean);
                    if (clean.length === 4) {
                      handleConnect(clean);
                    }
                  }}
                  className="w-full py-4 text-center text-4xl font-extrabold tracking-[0.4em] font-mono text-white bg-[#161622] border-2 border-white/10 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all placeholder:text-zinc-600"
                />
              </div>

              <button
                id="btn-connect-tv"
                type="submit"
                disabled={connecting || roomCodeInput.length !== 4}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Connect to TV</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-2 text-xs text-zinc-500">
              <Camera className="w-3.5 h-3.5" />
              <span>Or tap the Scan QR button in the top bar</span>
            </div>
          </div>
        ) : (
          /* SECTION 2: Remote Control Panel (shown after successful connection) */
          <div
            id="remote-control-panel"
            className="flex-1 flex flex-col justify-between py-2 gap-5 animate-in fade-in zoom-in-98 duration-200"
          >
            {/* Now Playing Banner with Cast button */}
            <div className="p-3.5 rounded-2xl bg-[#161622] border border-white/10 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Now Playing
                  </span>
                  <h3 className="text-sm font-bold text-white truncate">
                    {roomState?.media?.title && roomState.media.title !== 'Featured Cinema Stream'
                      ? roomState.media.title
                      : 'No Media Playing'}
                  </h3>
                  {isEpisodic && (
                    <span className="text-xs text-indigo-400 font-medium">
                      Season {roomState?.media?.season || 1}, Ep {roomState?.media?.episode || 1}
                    </span>
                  )}
                </div>
              </div>

              <button
                id="btn-remote-browse"
                onClick={() => setBrowseOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Cast</span>
              </button>
            </div>

            {/* Playback Control Pad: Rewind, Big Play/Pause, Fast Forward */}
            <div className="flex flex-col items-center justify-center py-6">
              <div className="flex items-center justify-center gap-6 sm:gap-8">
                {/* Rewind (⏪ 10s) */}
                <button
                  id="btn-rewind-10"
                  onClick={handleRewind}
                  className="w-16 h-16 rounded-full bg-[#1b1b26] hover:bg-[#232332] active:scale-90 border border-white/10 text-zinc-300 hover:text-white flex flex-col items-center justify-center shadow-lg transition-all"
                  aria-label="Rewind 10 seconds"
                >
                  <RotateCcw className="w-6 h-6" />
                  <span className="text-[10px] font-bold mt-0.5">10s</span>
                </button>

                {/* Big Play/Pause Toggle Button (▶️ and ⏸️) */}
                <button
                  id="btn-play-pause-toggle"
                  onClick={handleTogglePlay}
                  className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-95 ${
                    isPlaying
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-orange-500/30'
                      : 'bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-indigo-500/35'
                  }`}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-10 h-10 fill-current" />
                  ) : (
                    <Play className="w-10 h-10 fill-current translate-x-0.5" />
                  )}
                </button>

                {/* Fast Forward (10s ⏩) */}
                <button
                  id="btn-forward-10"
                  onClick={handleFastForward}
                  className="w-16 h-16 rounded-full bg-[#1b1b26] hover:bg-[#232332] active:scale-90 border border-white/10 text-zinc-300 hover:text-white flex flex-col items-center justify-center shadow-lg transition-all"
                  aria-label="Fast forward 10 seconds"
                >
                  <RotateCw className="w-6 h-6" />
                  <span className="text-[10px] font-bold mt-0.5">10s</span>
                </button>
              </div>

              <span className="text-xs text-zinc-400 mt-4 font-medium">
                {isPlaying ? 'Streaming Active' : 'Paused'}
              </span>
            </div>

            {/* Season & Episode Selector: Active for TV Shows & Anime, placed above Volume */}
            {isEpisodic && (
              <div
                id="season-episode-selector-card"
                className="p-3.5 rounded-2xl bg-[#161622] border border-white/10 flex flex-col gap-2.5 shadow-lg animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                    <Tv className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Season & Episode</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Playing: S{roomState?.media?.season || 1} · E{roomState?.media?.episode || 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Season Box */}
                  <div className="flex-1 bg-[#12121a] rounded-xl p-2 border border-white/10 flex items-center justify-between gap-1">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                        Season
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          id="input-season"
                          type="text"
                          inputMode="numeric"
                          value={inputSeason}
                          onChange={(e) => handleSeasonInputChange(e.target.value)}
                          onBlur={handleSeasonInputBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePlaySeasonEpisode();
                          }}
                          className="w-8 text-center text-sm font-bold text-white bg-white/5 rounded border border-white/15 focus:border-indigo-500 focus:outline-none py-0.5"
                        />
                        <span className="text-xs text-zinc-400 font-semibold">
                          / {maxSeasons}
                        </span>
                      </div>
                    </div>

                    {/* Up / Down arrows */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        id="btn-season-up"
                        type="button"
                        onClick={handleSeasonUp}
                        disabled={currentSeasonNum >= maxSeasons}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed text-zinc-300 hover:text-white transition-colors"
                        title="Next Season"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id="btn-season-down"
                        type="button"
                        onClick={handleSeasonDown}
                        disabled={currentSeasonNum <= 1}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed text-zinc-300 hover:text-white transition-colors"
                        title="Previous Season"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Episode Box */}
                  <div className="flex-1 bg-[#12121a] rounded-xl p-2 border border-white/10 flex items-center justify-between gap-1">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                        Episode
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          id="input-episode"
                          type="text"
                          inputMode="numeric"
                          value={inputEpisode}
                          onChange={(e) => handleEpisodeInputChange(e.target.value)}
                          onBlur={handleEpisodeInputBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePlaySeasonEpisode();
                          }}
                          className="w-9 text-center text-sm font-bold text-white bg-white/5 rounded border border-white/15 focus:border-indigo-500 focus:outline-none py-0.5"
                        />
                        <span className="text-xs text-zinc-400 font-semibold">
                          / {maxEpisodes}
                        </span>
                      </div>
                    </div>

                    {/* Up / Down arrows */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        id="btn-episode-up"
                        type="button"
                        onClick={handleEpisodeUp}
                        disabled={currentEpisodeNum >= maxEpisodes}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed text-zinc-300 hover:text-white transition-colors"
                        title="Next Episode"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id="btn-episode-down"
                        type="button"
                        onClick={handleEpisodeDown}
                        disabled={currentEpisodeNum <= 1}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed text-zinc-300 hover:text-white transition-colors"
                        title="Previous Episode"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Small Play Button Icon */}
                  <button
                    id="btn-play-season-episode"
                    type="button"
                    onClick={() => handlePlaySeasonEpisode()}
                    className="h-12 w-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all shrink-0"
                    title="Play Selected Season & Episode"
                    aria-label="Play Selected Season & Episode"
                  >
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Smooth Volume Control Panel with Steppers, Slider & Presets */}
            <div
              id="remote-volume-control-card"
              className="p-4 rounded-2xl bg-[#161622] border border-white/10 shadow-lg flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    id="btn-toggle-mute"
                    type="button"
                    onClick={handleToggleMute}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                    title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-indigo-400" />
                    )}
                  </button>
                  <span className="text-xs font-semibold text-zinc-300">Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                    {isMuted || volume === 0 ? 'Muted' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
              </div>

              {/* Slider with Smooth Step Buttons */}
              <div className="flex items-center gap-3">
                {/* Volume Down Button (-) */}
                <button
                  id="btn-volume-down"
                  type="button"
                  onClick={handleVolumeDown}
                  className="w-9 h-9 rounded-xl bg-[#1b1b26] hover:bg-[#252535] active:scale-90 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center font-bold text-lg transition-all shrink-0 select-none"
                  title="Volume Down (-5%)"
                  aria-label="Volume Down"
                >
                  −
                </button>

                {/* Range Slider Track */}
                <div className="relative flex-1 flex items-center">
                  <input
                    id="slider-volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onPointerDown={() => {
                      isDraggingVolumeRef.current = true;
                    }}
                    onTouchStart={() => {
                      isDraggingVolumeRef.current = true;
                    }}
                    onPointerUp={(e) => {
                      isDraggingVolumeRef.current = false;
                      handleVolumeChange(parseFloat((e.target as HTMLInputElement).value), true);
                    }}
                    onTouchEnd={(e) => {
                      isDraggingVolumeRef.current = false;
                      handleVolumeChange(parseFloat((e.target as HTMLInputElement).value), true);
                    }}
                    onChange={(e) => {
                      handleVolumeChange(parseFloat(e.target.value), false);
                    }}
                    className="w-full h-2.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all"
                  />
                </div>

                {/* Volume Up Button (+) */}
                <button
                  id="btn-volume-up"
                  type="button"
                  onClick={handleVolumeUp}
                  className="w-9 h-9 rounded-xl bg-[#1b1b26] hover:bg-[#252535] active:scale-90 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center font-bold text-lg transition-all shrink-0 select-none"
                  title="Volume Up (+5%)"
                  aria-label="Volume Up"
                >
                  +
                </button>
              </div>

              {/* Quick Volume Preset Pills */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                  const isActive =
                    (isMuted && pct === 0) ||
                    (!isMuted && Math.round(volume * 100) === Math.round(pct * 100));
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleVolumeChange(pct, true)}
                      className={`flex-1 py-1 text-[11px] font-mono rounded-lg transition-all border ${
                        isActive
                          ? 'bg-indigo-600/30 border-indigo-500/80 text-indigo-300 font-bold shadow-sm'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {pct === 0 ? 'Mute' : `${Math.round(pct * 100)}%`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions: Close Player Session ❌ & Disconnect */}
            <div className="flex flex-col gap-2.5 pt-2">
              {/* Red Close Player Session ❌ Button */}
              <button
                id="btn-close-player-session"
                onClick={handleCloseSession}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <XCircle className="w-4 h-4" />
                <span>Close Player Session ❌</span>
              </button>

              {/* Switch Room / Unlink */}
              <button
                id="btn-disconnect-remote"
                onClick={() => {
                  setConnectedRoomCode(null);
                  setRoomState(null);
                }}
                className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect & Switch Room</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* QR Scanner Camera Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Media Catalog Modal to Cast any TMDB Movie / TV Show */}
      <BrowseModal
        isOpen={browseOpen}
        onClose={() => setBrowseOpen(false)}
        onPlayMedia={async (payload) => {
          if (!connectedRoomCode) return;
          await updateRoomState(connectedRoomCode, {
            media: {
              id: payload.id,
              tmdbId: payload.tmdbId,
              title: payload.title,
              type: payload.type,
              season: payload.season,
              episode: payload.episode,
              posterPath: payload.posterPath,
              releaseYear: payload.releaseYear,
              overview: payload.overview,
            },
            action: 'change_media',
            actionTimestamp: Date.now(),
            actionId: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            isPlaying: true,
          });
        }}
      />
    </div>
  );
};
