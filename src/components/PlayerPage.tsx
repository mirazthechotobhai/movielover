import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { RoomState } from '../types';
import {
  generateRoomCode,
  initializeRoom,
  subscribeToRoom,
  updateRoomState,
  removeRoom,
} from '../services/firebase';
import { BrowseModal } from './BrowseModal';
import {
  Tv,
  QrCode,
  Maximize,
  Minimize,
  Film,
  Check,
  Copy,
  ExternalLink,
  Radio,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface PlayerPageProps {
  onOpenRemoteView?: (roomCode: string) => void;
}

export const PlayerPage: React.FC<PlayerPageProps> = ({ onOpenRemoteView }) => {
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [qrOverlayVisible, setQrOverlayVisible] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        return {
          id,
          tmdbId: Number(params.get('tmdbId') || 0),
          title: params.get('title') || '',
          type: (params.get('type') === 'tv' || params.get('type') === 'anime' ? params.get('type') : 'movie') as 'movie' | 'tv' | 'anime',
          season: Number(params.get('season') || 1),
          episode: Number(params.get('episode') || 1),
        };
      }
    }
    return {
      id: 'tt31193180', // Default example from prompt
      tmdbId: 31193180,
      title: '',
      type: 'movie' as const,
      season: 1,
      episode: 1,
    };
  });

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastExecutedActionIdRef = useRef<string>('');

  // TV Volume state & on-screen HUD (default 100%)
  const [tvVolume, setTvVolume] = useState<number>(1);
  const [showTvVolumeHud, setShowTvVolumeHud] = useState<boolean>(false);
  const tvVolumeHudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute remote URL for QR code
  const getRemoteUrl = useCallback((code: string) => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin;
    return `${base}/remote.html?room=${code}`;
  }, []);

  const currentTimeRef = useRef<number>(0);

  // Ref to hold freshest handleRemoteCommand to avoid stale closures in room subscription
  const handleRemoteCommandRef = useRef<((action: RoomState['action'], state: RoomState) => void) | null>(null);

  // Handle postMessage commands to EmbedMaster & PlayerJS
  const handleRemoteCommand = useCallback(
    (action: RoomState['action'], state: RoomState) => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      const sendCommand = (command: string, value?: any) => {
        try {
          const contentWin = iframe.contentWindow;
          if (!contentWin) return;

          const messages: any[] = [];

          if (command === 'play') {
            // 1. PlayerJS specification
            messages.push({ api: 'play' });
            // 2. Standard Player.js specification
            messages.push({
              context: 'player.js',
              version: '0.0.11',
              event: 'command',
              method: 'play',
            });
            // 3. EmbedMaster custom player format
            messages.push({
              source: 'embedmaster_player_command',
              command: 'play',
            });
            // 4. HTML5 video event fallbacks
            messages.push({ event: 'command', command: 'play' });
            messages.push({ event: 'play' });
          } else if (command === 'pause') {
            // 1. PlayerJS specification
            messages.push({ api: 'pause' });
            // 2. Standard Player.js specification
            messages.push({
              context: 'player.js',
              version: '0.0.11',
              event: 'command',
              method: 'pause',
            });
            // 3. EmbedMaster custom player format
            messages.push({
              source: 'embedmaster_player_command',
              command: 'pause',
            });
            // 4. HTML5 video event fallbacks
            messages.push({ event: 'command', command: 'pause' });
            messages.push({ event: 'pause' });
          } else if (command === 'volume') {
            const fraction = typeof value === 'number' ? (value > 1 ? value / 100 : value) : 1;
            const percent = Math.round(fraction * 100);
            messages.push({ api: 'volume', set: fraction });
            messages.push({ api: 'volume', set: percent });
            messages.push({ api: 'volume', value: fraction });
            messages.push({ api: 'volume', value: percent });
            messages.push({
              context: 'player.js',
              version: '0.0.11',
              event: 'command',
              method: 'setVolume',
              value: percent,
            });
            messages.push({
              source: 'embedmaster_player_command',
              command: 'volume',
              value: percent,
              set: fraction,
            });
            messages.push({ event: 'command', command: 'volume', value: percent });
          } else if (command === 'unmute') {
            messages.push({ api: 'unmute' });
            messages.push({
              context: 'player.js',
              version: '0.0.11',
              event: 'command',
              method: 'unmute',
            });
            messages.push({
              source: 'embedmaster_player_command',
              command: 'unmute',
            });
            messages.push({ event: 'command', command: 'unmute' });
          } else if (command === 'mute') {
            messages.push({ api: 'mute' });
            messages.push({
              context: 'player.js',
              version: '0.0.11',
              event: 'command',
              method: 'mute',
            });
            messages.push({
              source: 'embedmaster_player_command',
              command: 'mute',
            });
            messages.push({ event: 'command', command: 'mute' });
          } else if (command === 'seek') {
            const target = typeof value === 'number' ? value : 0;
            messages.push({ api: 'seek', set: target });
            messages.push({ api: 'seek', value: target });
            messages.push({
              context: 'player.js',
              version: '0.0.11',
              event: 'command',
              method: 'setCurrentTime',
              value: target,
            });
            messages.push({
              source: 'embedmaster_player_command',
              command: 'seek',
              value: target,
            });
            messages.push({ event: 'command', command: 'seek', value: target });
          }

          // Broadcast all messages as JavaScript object AND JSON string for maximum cross-origin compatibility
          for (const msg of messages) {
            contentWin.postMessage(msg, '*');
            try {
              contentWin.postMessage(JSON.stringify(msg), '*');
            } catch (err) {}
          }
          // Direct string fallback for PlayerJS core
          if (command === 'play' || command === 'pause') {
            contentWin.postMessage(command, '*');
          }
        } catch (e) {
          console.warn('postMessage to player error:', e);
        }
      };

      switch (action) {
        case 'play':
          sendCommand('play');
          setIsPlaying(true);
          break;
        case 'pause':
          sendCommand('pause');
          setIsPlaying(false);
          break;
        case 'seek_forward': {
          const target = Math.round((currentTimeRef.current || state.currentTime || 0) + 10);
          currentTimeRef.current = target;
          sendCommand('seek', target);
          break;
        }
        case 'seek_backward': {
          const target = Math.max(0, Math.round((currentTimeRef.current || state.currentTime || 0) - 10));
          currentTimeRef.current = target;
          sendCommand('seek', target);
          break;
        }
        case 'volume': {
          const vol = typeof state.volume === 'number' ? state.volume : 1;
          const percent = Math.round(vol * 100);

          // Update local TV volume HUD
          setTvVolume(vol);
          setShowTvVolumeHud(true);
          if (tvVolumeHudTimeoutRef.current) {
            clearTimeout(tvVolumeHudTimeoutRef.current);
          }
          tvVolumeHudTimeoutRef.current = setTimeout(() => {
            setShowTvVolumeHud(false);
          }, 2200);

          if (percent === 0) {
            sendCommand('mute');
            sendCommand('volume', 0);
          } else {
            sendCommand('unmute');
            sendCommand('volume', vol);
          }
          break;
        }
        case 'close':
          // Red Close Player Session button pressed from remote
          sendCommand('pause');
          setQrOverlayVisible(true);
          updateRoomState(roomCode, {
            status: 'waiting',
            isPlaying: false,
            action: 'none',
          });
          break;
        case 'change_media':
          if (state.media) {
            setActiveMedia({
              id: state.media.id,
              tmdbId: state.media.tmdbId || 0,
              title: state.media.title,
              type: state.media.type,
              season: state.media.season || 1,
              episode: state.media.episode || 1,
            });
            setQrOverlayVisible(false);
          }
          break;
        default:
          break;
      }
    },
    [roomCode]
  );

  // Keep ref synchronized
  handleRemoteCommandRef.current = handleRemoteCommand;

  // Initialize Room on page load
  useEffect(() => {
    const newCode = generateRoomCode();
    setRoomCode(newCode);

    let cleanupRoom: (() => void) | null = null;

    const init = async () => {
      await initializeRoom(newCode, {
        id: activeMedia.id,
        tmdbId: activeMedia.tmdbId,
        title: activeMedia.title,
        type: activeMedia.type,
        season: activeMedia.season,
        episode: activeMedia.episode,
      });

      // Subscribe to real-time changes
      cleanupRoom = subscribeToRoom(newCode, (state) => {
        if (!state) {
          // If room was removed, keep waiting or show overlay
          setQrOverlayVisible(true);
          return;
        }

        setRoomState(state);

        // When status changes to 'connected', hide QR overlay
        if (state.status === 'connected') {
          setQrOverlayVisible(false);
        } else if (state.status === 'closed') {
          setQrOverlayVisible(true);
        }

        // Check for incoming remote actions using resilient action ID
        if (state.action && state.action !== 'none') {
          const actionId = state.actionId || `${state.actionTimestamp || 0}_${state.action}`;
          if (actionId !== lastExecutedActionIdRef.current) {
            lastExecutedActionIdRef.current = actionId;
            handleRemoteCommandRef.current?.(state.action, state);
          }
        }
      });
    };

    init();

    // Clean up room on refresh / close
    const handleBeforeUnload = () => {
      removeRoom(newCode).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (cleanupRoom) cleanupRoom();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removeRoom(newCode).catch(() => {});
    };
  }, []);

  // Listen to events coming from EmbedMaster iframe
  useEffect(() => {
    const handleEmbedMasterMessage = (event: MessageEvent) => {
      let data = event.data;
      if (!data) return;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {}
      }

      const evt = typeof data === 'string' ? data : (data.event || data.type || data.action || data.api);

      if (evt === 'play' || evt === 'playing') {
        setIsPlaying(true);
        if (roomCode) {
          updateRoomState(roomCode, { isPlaying: true });
        }
      } else if (evt === 'pause' || evt === 'paused' || evt === 'ended') {
        setIsPlaying(false);
        if (roomCode) {
          updateRoomState(roomCode, { isPlaying: false });
        }
      }

      if (data.info || data.time || data.currentTime) {
        const time =
          typeof data.currentTime === 'number'
            ? data.currentTime
            : typeof data.time === 'number'
            ? data.time
            : typeof data.info?.currentTime === 'number'
            ? data.info.currentTime
            : typeof data.info?.time === 'number'
            ? data.info.time
            : typeof data.info === 'number'
            ? data.info
            : null;

        if (time !== null && !isNaN(time)) {
          currentTimeRef.current = time;
          if (roomCode && Math.abs(time - (roomState?.currentTime || 0)) > 5) {
            updateRoomState(roomCode, { currentTime: Math.round(time) });
          }
        }
      }
    };

    window.addEventListener('message', handleEmbedMasterMessage);
    return () => window.removeEventListener('message', handleEmbedMasterMessage);
  }, [roomCode, roomState?.currentTime]);

  // Construct EmbedMaster iframe URL (official stable parameters only)
  const getEmbedUrl = () => {
    const isTV = activeMedia.type === 'tv' || activeMedia.type === 'anime';
    const baseUrl = isTV
      ? `https://embedmaster.link/tv/${activeMedia.id}/${activeMedia.season}/${activeMedia.episode}`
      : `https://embedmaster.link/movie/${activeMedia.id}`;

    return `${baseUrl}?skin=onyx&welcome_page=off&autoplay=on`;
  };

  // When iframe loads, establish active state without triggering browser autoplay abort
  const handleIframeLoad = () => {
    setIsPlaying(true);
  };

  // Copy remote link
  const handleCopyLink = () => {
    if (!roomCode) return;
    const url = getRemoteUrl(roomCode);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isConnected = roomState?.status === 'connected';

  return (
    <div
      ref={containerRef}
      id="player-page-container"
      className="relative w-full h-screen bg-black overflow-hidden flex flex-col select-none"
    >
      {/* Top Floating Control Bar */}
      <header
        id="player-top-bar"
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white">
            <Tv className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold tracking-wide">TV PLAYER</span>
          </div>

          {/* Connection Status Badge */}
          <div
            id="badge-room-status"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium transition-colors ${
              isConnected
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Remote Connected</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Waiting for Remote (Room {roomCode || '....'})</span>
              </>
            )}
          </div>

          <span className="hidden md:inline text-xs text-zinc-300 font-medium truncate max-w-xs">
            Now Playing: {activeMedia.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Catalog & Browse Button */}
          <button
            id="btn-player-browse"
            onClick={() => setBrowseOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold backdrop-blur-sm border border-indigo-400/30 shadow-lg shadow-indigo-600/20 transition-colors"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Browse Movies</span>
          </button>

          {/* Toggle QR Overlay */}
          <button
            id="btn-toggle-qr-overlay"
            onClick={() => setQrOverlayVisible(!qrOverlayVisible)}
            className={`p-2 rounded-lg backdrop-blur-md border text-xs font-medium transition-colors ${
              qrOverlayVisible
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-black/60 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Toggle QR Code & Instructions"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            id="btn-player-fullscreen"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* EmbedMaster Player Container (responsive full-screen container) */}
      <main
        id="player-iframe-wrapper"
        className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden"
      >
        <iframe
          ref={iframeRef}
          id="embedmaster_iframe"
          key={`${activeMedia.id}-${activeMedia.season}-${activeMedia.episode}`}
          src={getEmbedUrl()}
          onLoad={handleIframeLoad}
          className="w-full h-full border-0 object-contain"
          allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *; autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
          allowFullScreen
          title="StreamCast Movie Player"
        />

        {/* Real-Time TV Volume HUD Overlay (Activated when adjusted from remote) */}
        {showTvVolumeHud && (
          <div
            id="tv-volume-hud"
            className="absolute top-16 right-6 z-40 bg-[#12121c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3.5 animate-in fade-in zoom-in-95 duration-150 min-w-[210px] pointer-events-none"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              {tvVolume === 0 ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-zinc-300">TV Volume</span>
                <span className="text-xs font-bold font-mono text-white">
                  {Math.round(tvVolume * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-75"
                  style={{ width: `${Math.round(tvVolume * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Center QR Code Overlay (Instructions & 4-Digit Room Code) */}
      {qrOverlayVisible && (
        <div
          id="qr-overlay"
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="relative w-full max-w-sm sm:max-w-md bg-[#12121c] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
            {/* Close / Minimize Overlay button if player is already playing */}
            {isConnected && (
              <button
                id="btn-dismiss-overlay"
                onClick={() => setQrOverlayVisible(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors text-xs"
              >
                Hide
              </button>
            )}

            {/* TV Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <Tv className="w-6 h-6" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1">
              Connect Your Remote
            </h2>
            <p className="text-sm text-zinc-400 mb-5">
              Scan QR code & connect your remote
            </p>

            {/* Prominent QR Code Box */}
            <div
              id="qr-code-box"
              className="p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 transition-transform hover:scale-105"
            >
              <canvas ref={qrCanvasRef} className="rounded-lg" />
            </div>

            {/* Numeric Room Code Text */}
            <div className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 mb-4">
              <span className="text-xs text-zinc-400 block font-medium uppercase tracking-wider mb-0.5">
                Room Code
              </span>
              <span
                id="room-code-display"
                className="text-3xl font-extrabold text-indigo-400 tracking-widest font-mono"
              >
                {roomCode || '....'}
              </span>
            </div>

            {/* Action buttons */}
            <div className="w-full flex flex-col sm:flex-row items-center gap-2">
              <button
                id="btn-copy-remote-url"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-300" />
                    <span>Copy Remote URL</span>
                  </>
                )}
              </button>

              {/* Test Remote in New Tab or Split View button */}
              {onOpenRemoteView ? (
                <button
                  id="btn-open-remote-simulator"
                  onClick={() => onOpenRemoteView(roomCode)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Remote View</span>
                </button>
              ) : (
                <a
                  id="link-open-remote-tab"
                  href={getRemoteUrl(roomCode)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in New Tab</span>
                </a>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 mt-4 leading-relaxed">
              Open the remote on your phone or in another tab to play, pause, seek, and control volume in real-time.
            </p>
          </div>
        </div>
      )}

      {/* Catalog & Search Modal */}
      <BrowseModal
        isOpen={browseOpen}
        onClose={() => setBrowseOpen(false)}
        onPlayMedia={(payload) => {
          setActiveMedia({
            id: payload.id,
            tmdbId: payload.tmdbId,
            title: payload.title,
            type: payload.type,
            season: payload.season || 1,
            episode: payload.episode || 1,
          });

          // Sync media change to Firebase room state
          updateRoomState(roomCode, {
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
            isPlaying: true,
          });
        }}
      />
    </div>
  );
};
