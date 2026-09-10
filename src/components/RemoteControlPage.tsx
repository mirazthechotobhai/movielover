import React, { useState, useEffect } from 'react';
import {
  RoomState,
  claimAndConnectRemote,
  forgetAndDisconnectRemote,
  sendRemoteCommand,
  listenToRoom,
  generateRoomCode,
  normalizeRoomCode,
  getRemoteDeviceId,
  listenToActiveTv,
} from '../lib/rtdb';
import { fetchMovieImdbId, KNOWN_MOVIE_IMDB_MAP } from '../lib/tmdb';
import { QRScannerModal } from './QRScannerModal';
import { TMDBBrowserModal } from './TMDBBrowserModal';
import { QRCodeDisplay } from './QRCodeDisplay';
import { getPlayerUrl, openPlayerInNewTab } from '../utils/navigation';
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
  Radio,
  Search,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Smartphone,
  ArrowRight,
  Sparkles,
  Film,
  Flame,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Zap,
  KeyRound,
  X,
  Unlink,
  AlertCircle,
  Clock,
  Maximize2,
} from 'lucide-react';

interface RemoteControlPageProps {
  onBackToPlayer?: () => void;
}

export const RemoteControlPage: React.FC<RemoteControlPageProps> = ({
  onBackToPlayer,
}) => {
  // Read initial room code from URL or localStorage or generate a default
  const [pairingRoomCode, setPairingRoomCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) return normalizeRoomCode(r);
      try {
        const paired = localStorage.getItem('pairedCode');
        if (paired) return normalizeRoomCode(paired);
        const stored = localStorage.getItem('embedmaster_room_code');
        if (stored) return normalizeRoomCode(stored);
      } catch {}
    }
    const fresh = generateRoomCode();
    try {
      localStorage.setItem('embedmaster_room_code', fresh);
    } catch {}
    return fresh;
  });

  const [roomInput, setRoomInput] = useState<string>(() => pairingRoomCode);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [disconnectAlert, setDisconnectAlert] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [catalogInitialTab, setCatalogInitialTab] = useState<'trending' | 'movie' | 'tv' | 'anime' | 'watchlist'>('movie');

  const openCatalogWithTab = (tab: 'trending' | 'movie' | 'tv' | 'anime' | 'watchlist') => {
    setCatalogInitialTab(tab);
    setIsCatalogOpen(true);
  };

  // Local control state mirrors
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1); // 0 to 1
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [minuteInput, setMinuteInput] = useState<string>('');
  const [jumpFeedback, setJumpFeedback] = useState<string | null>(null);

  // QR Code URL pointing directly to remote with pairingRoomCode
  const remotePairingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname.includes('player.html') || window.location.pathname.includes('tv.html') ? '/remote.html' : window.location.pathname}?mode=remote&room=${pairingRoomCode}`
    : `https://gotocinemaonline.web.app/remote.html?room=${pairingRoomCode}`;

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pairingRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateNewCode = () => {
    const fresh = generateRoomCode();
    setPairingRoomCode(fresh);
    setRoomInput(fresh);
    try {
      localStorage.setItem('embedmaster_room_code', fresh);
    } catch {}
  };

  // 1. Persistent Storage (localStorage):
  // Once a remote successfully pairs with a TV code, save the code in localStorage ('pairedCode').
  // On subsequent reloads, bypass the code input screen and directly load the active remote UI for that TV.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    const savedPairedCode = localStorage.getItem('pairedCode');

    const codeToConnect = urlRoom ? normalizeRoomCode(urlRoom) : savedPairedCode ? normalizeRoomCode(savedPairedCode) : null;

    if (codeToConnect) {
      setRoomInput(codeToConnect);
      setIsConnecting(true);
      const deviceId = getRemoteDeviceId();

      claimAndConnectRemote(codeToConnect, deviceId)
        .then((res) => {
          setIsConnecting(false);
          if (res.success && res.roomState) {
            setActiveRoomCode(codeToConnect);
            setRoomState(res.roomState);
            setIsConnected(true);
            setIsPlaying(true);
            if (typeof res.roomState.volume === 'number') {
              setVolume(res.roomState.volume);
            }
          } else {
            // If the room was deleted or is offline, clear localStorage
            if (savedPairedCode === codeToConnect) {
              localStorage.removeItem('pairedCode');
            }
            if (res.error) {
              setErrorMessage(res.error);
            }
          }
        })
        .catch(() => {
          setIsConnecting(false);
        });
    }
  }, []);

  // Listen to active TV session changes: whenever TV opens or reloads, update pairing suggestion
  useEffect(() => {
    const unsub = listenToActiveTv((session) => {
      if (session) {
        if (session.status !== 'closed' && session.roomCode) {
          const norm = normalizeRoomCode(session.roomCode);
          setPairingRoomCode(norm);
          if (!isConnected) {
            setRoomInput(norm);
          }
        }
      }
    });

    return () => unsub();
  }, [isConnected]);

  // 2. Real-Time Video Sync & Auto-Forget on TV Uninstall/Disconnect:
  // The remote listens to the Firebase room node. If the TV is uninstalled or disconnected
  // (causing Firebase to trigger onDisconnect and delete the room), the remote automatically detects
  // the deletion, clears its localStorage, and alerts the user that the TV was disconnected.
  useEffect(() => {
    if (!activeRoomCode) return;

    const unsubscribe = listenToRoom(activeRoomCode, (state) => {
      if (!state) {
        // TV room node deleted by Firebase onDisconnect or closed!
        try {
          localStorage.removeItem('pairedCode');
        } catch {}
        setIsConnected(false);
        setActiveRoomCode(null);
        setRoomState(null);
        setDisconnectAlert(
          `TV (${activeRoomCode}) was disconnected or closed. Your remote has been unlinked.`
        );
        return;
      }

      setRoomState(state);
      setIsConnected(true);
      if (typeof state.isPlaying === 'boolean') {
        setIsPlaying(state.isPlaying);
      }
      if (typeof state.volume === 'number') {
        setVolume(state.volume);
      }
      if (typeof state.currentTime === 'number') {
        setCurrentTime(state.currentTime);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeRoomCode]);

  // First-Come-First-Served Claiming:
  // Use transactional check in Firebase to ensure isClaimed is false.
  // If unclaimed, set isClaimed: true, ownerId: deviceId.
  // If already claimed by another device, reject and show "Code already claimed".
  const handleConnect = async (codeToUse?: string) => {
    const raw = (codeToUse || roomInput).trim();
    if (!raw) {
      setErrorMessage('Please enter a TV pairing code (e.g. TV-8492)');
      return;
    }

    const code = normalizeRoomCode(raw);
    setErrorMessage(null);
    setDisconnectAlert(null);
    setIsConnecting(true);

    try {
      const deviceId = getRemoteDeviceId();
      const result = await claimAndConnectRemote(code, deviceId);

      if (!result.success) {
        setErrorMessage(result.error || 'Code already claimed');
        return;
      }

      // First-come-first-served claim succeeded!
      setActiveRoomCode(code);
      setRoomState(result.roomState || null);
      setIsConnected(true);
      setIsPlaying(true);
      setVolume(100);
      // Enforce play and 100% volume on the TV
      await sendRemoteCommand(code, 'play', { isPlaying: true, volume: 1 });
      setSuccessNotice(`Successfully connected to ${code}!`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Connection failed. Verify room code and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Forget / Unlink Button:
  // Clears localStorage.removeItem('pairedCode') and resets remote to initial code-input state.
  const handleForgetTV = async () => {
    if (activeRoomCode) {
      const deviceId = getRemoteDeviceId();
      await forgetAndDisconnectRemote(activeRoomCode, deviceId);
    }
    try {
      localStorage.removeItem('pairedCode');
    } catch {}
    setIsConnected(false);
    setActiveRoomCode(null);
    setRoomState(null);
    setDisconnectAlert(null);
    setSuccessNotice('TV forgotten and remote unlinked successfully.');
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const handleTogglePlay = async () => {
    if (!activeRoomCode) return;
    const nextPlay = !isPlaying;
    setIsPlaying(nextPlay);
    await sendRemoteCommand(activeRoomCode, nextPlay ? 'play' : 'pause', {
      isPlaying: nextPlay,
    });
  };

  const handleRewind10 = async () => {
    if (!activeRoomCode) return;
    const target = Math.max(0, currentTime - 10);
    setCurrentTime(target);
    await sendRemoteCommand(activeRoomCode, 'seek', { currentTime: target });
  };

  const handleFastForward10 = async () => {
    if (!activeRoomCode) return;
    const target = currentTime + 10;
    setCurrentTime(target);
    await sendRemoteCommand(activeRoomCode, 'seek', { currentTime: target });
  };

  const handleVolumeChange = async (newVal: number) => {
    if (!activeRoomCode) return;
    setVolume(newVal);
    await sendRemoteCommand(activeRoomCode, 'volume', { volume: newVal });
  };

  const handleJumpToMinute = async (targetMinutes?: number) => {
    if (!activeRoomCode) return;
    const rawVal = targetMinutes !== undefined ? targetMinutes : parseFloat(minuteInput);
    if (isNaN(rawVal) || rawVal < 0) {
      setErrorMessage('Please enter a valid minute (e.g. 10 or 20)');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const seconds = Math.round(rawVal * 60);
    setCurrentTime(seconds);
    setIsPlaying(true);

    // Send seek command with target seconds and isPlaying: true
    await sendRemoteCommand(activeRoomCode, 'seek', {
      currentTime: seconds,
      isPlaying: true,
    });
    // Follow with play command so the TV player immediately unpauses and plays
    await sendRemoteCommand(activeRoomCode, 'play', {
      currentTime: seconds,
      isPlaying: true,
    });

    const displayMins = Math.floor(seconds / 60);
    const displaySecs = (seconds % 60).toString().padStart(2, '0');
    setJumpFeedback(`Playing from ${rawVal} min (${displayMins}:${displaySecs})`);
    setTimeout(() => setJumpFeedback(null), 3500);
  };

  const handleToggleFullscreen = async () => {
    if (!activeRoomCode) return;
    await sendRemoteCommand(activeRoomCode, 'fullscreen');
    setJumpFeedback('Full Screen toggled on TV 📺');
    setTimeout(() => setJumpFeedback(null), 3500);
  };

  const handleCloseSession = async () => {
    if (!activeRoomCode) return;
    if (window.confirm('Are you sure you want to close the player session on TV?')) {
      await sendRemoteCommand(activeRoomCode, 'close');
      handleForgetTV();
    }
  };

  const handleLoadMediaFromPhone = async (media: {
    id: string | number;
    title: string;
    type: 'movie' | 'tv';
    posterPath?: string | null;
    backdropPath?: string | null;
    season?: number;
    episode?: number;
  }) => {
    if (!activeRoomCode) return;
    let targetId = String(media.id);
    if (media.type === 'movie' && !targetId.startsWith('tt')) {
      if (KNOWN_MOVIE_IMDB_MAP[targetId]) {
        targetId = KNOWN_MOVIE_IMDB_MAP[targetId];
      } else {
        const imdb = await fetchMovieImdbId(media.id);
        targetId = imdb || 'tt6263850';
      }
    }
    await sendRemoteCommand(activeRoomCode, 'loadMedia', {
      mediaId: targetId,
      mediaTitle: media.title,
      mediaType: media.type,
      season: media.season || 1,
      episode: media.episode || 1,
      posterPath: media.posterPath,
      backdropPath: media.backdropPath,
    });
    setRoomState((prev) =>
      prev
        ? {
            ...prev,
            mediaId: targetId,
            mediaTitle: media.title,
            mediaType: media.type,
            season: media.season || 1,
            episode: media.episode || 1,
          }
        : null
    );
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col text-zinc-100 font-sans select-none"
      style={{ backgroundColor: '#0f0f13' }}
    >
      {/* Top Bar: Sleek Mobile Dark UI Header */}
      <header className="sticky top-0 z-30 px-4 py-3 border-b border-zinc-800/80 bg-[#0f0f13]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white leading-none">
              EmbedMaster
            </h1>
            <span className="text-[10px] text-cyan-400 font-medium tracking-wider uppercase">
              Smart Remote
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Camera Button (📷 Scan QR) using html5-qrcode */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-cyan-400 border border-zinc-700/60 text-xs font-semibold shadow-sm transition active:scale-95"
            aria-label="Scan TV QR Code"
          >
            <Camera className="w-4 h-4" />
            <span>📷 Scan QR</span>
          </button>

          {/* TV Button: Opens Full Screen Player with Autoplay in a New Tab */}
          <a
            href={getPlayerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              openPlayerInNewTab();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border border-cyan-400/40 text-xs font-black shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
            title="Open Fullscreen TV Player with Autoplay in New Tab"
          >
            <Tv className="w-4 h-4 text-white" />
            <span className="font-black tracking-wider">TV</span>
            <ExternalLink className="w-3 h-3 text-cyan-200 opacity-90" />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main
        className={`flex-1 w-full ${
          !isConnected ? 'max-w-4xl' : 'max-w-md'
        } mx-auto p-4 sm:p-6 flex flex-col justify-between transition-all duration-300`}
      >
        {/* Disconnection Alert Banner (triggered when TV is closed or loses connection) */}
        {disconnectAlert && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
              </div>
              <span className="font-medium leading-relaxed">{disconnectAlert}</span>
            </div>
            <button
              onClick={() => setDisconnectAlert(null)}
              className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Notice */}
        {successNotice && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successNotice}</span>
          </div>
        )}

        {!isConnected ? (
          /* Connect Section with Dual-Box Architecture */
          <div className="flex-1 flex flex-col justify-center my-auto py-2 space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Remote Pairing Hub</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Pair & Activate Remote Control
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
                Scan the QR code or use the Room ID displayed on the left, then activate the remote control in the box beside it.
              </p>
            </div>

            {/* Dual Complementary Boxes: Left (QR & Room ID) + Right (Code Activation) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Box 1: QR Code & Room ID Display */}
              <div className="bg-[#14141f] border border-zinc-800/90 hover:border-cyan-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between text-center relative transition-colors">
                <div className="w-full flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <QrCode className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Room ID & QR Code
                    </span>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                    Ready to Pair
                  </span>
                </div>

                {/* Large Room ID Display */}
                <div className="w-full bg-black/60 border border-cyan-500/30 rounded-2xl p-3.5 mb-4 flex items-center justify-between shadow-inner">
                  <div className="text-left">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">
                      TV Pairing Code
                    </span>
                    <span className="font-mono text-3xl font-black text-cyan-400 tracking-widest">
                      {pairingRoomCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition active:scale-95 cursor-pointer"
                      title="Copy Room ID"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-300" />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleGenerateNewCode}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
                      title="Generate New Room ID"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prominent QR Code container */}
                <div className="p-3 bg-white rounded-2xl shadow-xl shadow-cyan-950/40 mb-3.5">
                  <QRCodeDisplay value={remotePairingUrl} size={160} />
                </div>

                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mb-4">
                  Point any phone camera at this QR code to open the remote directly on your smartphone.
                </p>

                {/* Link to Open TV Player */}
                <a
                  href={getPlayerUrl(pairingRoomCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    openPlayerInNewTab(pairingRoomCode);
                  }}
                  className="w-full py-2.5 px-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <Tv className="w-4 h-4 text-cyan-400" />
                  <span>Open TV Player Tab</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400 opacity-80" />
                </a>
              </div>

              {/* Box 2: Enter Pairing Code & Claim TV */}
              <div className="bg-[#151522] border-2 border-cyan-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative">
                <div>
                  <div className="w-full flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <KeyRound className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Activate Remote
                      </span>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Enter & Connect
                    </span>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-zinc-200">
                          Enter TV Pairing Code
                        </label>
                        <button
                          type="button"
                          onClick={() => setRoomInput(pairingRoomCode)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                          title="Paste generated room code"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Fill: {pairingRoomCode}</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        maxLength={8}
                        placeholder={pairingRoomCode || 'e.g. TV-8492'}
                        value={roomInput}
                        onChange={(e) =>
                          setRoomInput(e.target.value.replace(/[^0-9a-zA-Z-]/g, '').toUpperCase())
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                        className="w-full py-3.5 px-4 bg-black/80 border-2 border-cyan-500/50 focus:border-cyan-400 rounded-2xl text-center font-mono text-2xl sm:text-3xl font-black tracking-widest text-cyan-400 placeholder-zinc-700 shadow-inner focus:outline-none focus:ring-4 focus:ring-cyan-500/20 transition"
                      />
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-semibold flex items-center justify-center gap-2 animate-fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Active Remote Button */}
                    <button
                      onClick={() => handleConnect()}
                      disabled={isConnecting || !roomInput.trim()}
                      className="w-full py-4 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer"
                    >
                      {isConnecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Activating Remote...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                          <span>Activate Remote & Connect</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Helper buttons inside Box 2 */}
                <div className="pt-5 border-t border-zinc-800/80 space-y-2.5 mt-4">
                  {/* Camera Scanner Button */}
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>Scan TV Screen QR with Camera</span>
                  </button>

                  {/* Open TV Player in New Tab Button */}
                  <a
                    href={getPlayerUrl(roomInput.trim() || pairingRoomCode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      openPlayerInNewTab(roomInput.trim() || pairingRoomCode);
                    }}
                    className="w-full py-2.5 px-4 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Tv className="w-4 h-4 text-cyan-400" />
                    <span>TV Player (Fullscreen & Autoplay)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400 opacity-80" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Remote Control Panel (shown after successful connection) */
          <div className="flex-1 flex flex-col justify-between py-2 space-y-5 animate-fade-in">
            {/* Active Connected TV Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#161620] border border-zinc-800 shadow-md gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <div>
                  <div className="text-xs font-bold text-zinc-200">Connected to TV</div>
                  <div className="text-[11px] font-mono text-cyan-400 font-bold">
                    Room: {activeRoomCode}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Forget TV / Disconnect Button */}
                <button
                  onClick={handleForgetTV}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-semibold transition active:scale-95 cursor-pointer"
                  title="Forget TV and Unlink Remote"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Forget TV / Disconnect</span>
                </button>

                {/* View QR Code Modal Button */}
                <button
                  onClick={() => setIsQRModalOpen(true)}
                  className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-medium transition cursor-pointer"
                  title="View QR Code & Room ID"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Info</span>
                </button>

                {/* Open TV Player in New Tab */}
                <a
                  href={getPlayerUrl(activeRoomCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    openPlayerInNewTab(activeRoomCode);
                  }}
                  className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer"
                  title="Open Player in New Tab"
                >
                  <Tv className="w-3 h-3 text-cyan-400" />
                  <span className="font-bold">TV</span>
                  <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                </a>
              </div>
            </div>

            {/* Currently Streaming Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#181824] to-[#12121a] border border-zinc-800 shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    Playing on TV
                  </span>
                  <h3 className="text-sm font-bold text-white truncate mt-0.5">
                    {roomState?.mediaTitle || 'Avatar: Fire and Ash'}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] uppercase font-semibold">
                      {roomState?.mediaType === 'tv' ? 'TV Series' : 'Movie'}
                    </span>
                    {roomState?.season && (
                      <span>
                        S{roomState.season} : E{roomState.episode || 1}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Quick Media Switcher Bar directly on Mobile Remote */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => openCatalogWithTab('movie')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#161622] hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-cyan-500/40 text-cyan-400 hover:text-cyan-300 active:scale-95 transition shadow-sm group"
                title="Change Movie"
              >
                <Film className="w-5 h-5 mb-1 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-zinc-200">Movies</span>
              </button>
              <button
                onClick={() => openCatalogWithTab('tv')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#161622] hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-purple-500/40 text-purple-400 hover:text-purple-300 active:scale-95 transition shadow-sm group"
                title="Change TV Show"
              >
                <Tv className="w-5 h-5 mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-zinc-200">TV Shows</span>
              </button>
              <button
                onClick={() => openCatalogWithTab('anime')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#161622] hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-pink-500/40 text-pink-400 hover:text-pink-300 active:scale-95 transition shadow-sm group"
                title="Change Anime"
              >
                <Sparkles className="w-5 h-5 mb-1 text-pink-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-zinc-200">Anime</span>
              </button>
              <button
                onClick={() => openCatalogWithTab('trending')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#161622] hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 active:scale-95 transition shadow-sm group"
                title="Change Trending"
              >
                <Flame className="w-5 h-5 mb-1 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-zinc-200">Trending</span>
              </button>
            </div>

            {/* Core Playback Control Buttons */}
            <div className="bg-[#161622] border border-zinc-800/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center space-y-6">
              {/* Play / Rewind / Fast Forward Control Row */}
              <div className="flex items-center justify-center gap-6 w-full">
                {/* Rewind (⏪ 10s) */}
                <button
                  onClick={handleRewind10}
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-zinc-800/70 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/60 active:scale-90 transition shadow-md"
                  title="Rewind 10 seconds"
                >
                  <RotateCcw className="w-5 h-5 text-zinc-300" />
                  <span className="text-[10px] font-bold text-zinc-400 mt-0.5">-10s</span>
                </button>

                {/* Play/Pause Toggle Button (changes icon between ▶️ and ⏸️) */}
                <button
                  onClick={handleTogglePlay}
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/25 active:scale-95 transition-all duration-150 ${
                    isPlaying
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white'
                      : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white'
                  }`}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-9 h-9 fill-white" />
                  ) : (
                    <Play className="w-9 h-9 fill-white ml-1" />
                  )}
                </button>

                {/* Fast Forward (10s ⏩) */}
                <button
                  onClick={handleFastForward10}
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-zinc-800/70 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/60 active:scale-90 transition shadow-md"
                  title="Fast forward 10 seconds"
                >
                  <RotateCw className="w-5 h-5 text-zinc-300" />
                  <span className="text-[10px] font-bold text-zinc-400 mt-0.5">+10s</span>
                </button>
              </div>

              {/* Smooth Volume Slider (<input type="range">) */}
              <div className="w-full space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    {volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-zinc-500" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                    )}
                    Volume Control
                  </span>
                  <span className="font-mono font-bold text-zinc-200 text-xs">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVolumeChange(volume === 0 ? 0.8 : 0)}
                    className="text-zinc-400 hover:text-white text-xs"
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Jump to Minute Option (User enters minutes like 10 or 20, clicks Play icon to jump & play) */}
              <div className="w-full space-y-2.5 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Jump to Minute</span>
                  </span>
                  {minuteInput && !isNaN(parseFloat(minuteInput)) && parseFloat(minuteInput) >= 0 && (
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                      = {Math.floor(parseFloat(minuteInput))}:{Math.round((parseFloat(minuteInput) % 1) * 60).toString().padStart(2, '0')} ({Math.round(parseFloat(minuteInput) * 60)}s)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Enter minute (e.g. 10, 20)..."
                      value={minuteInput}
                      onChange={(e) => setMinuteInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleJumpToMinute();
                        }
                      }}
                      className="w-full pl-3 pr-11 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-white font-mono text-sm placeholder:text-zinc-500 outline-none transition shadow-inner"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-400 pointer-events-none">
                      min
                    </span>
                  </div>

                  <button
                    onClick={() => handleJumpToMinute()}
                    disabled={!minuteInput || isNaN(parseFloat(minuteInput)) || parseFloat(minuteInput) < 0}
                    className="h-10 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-95 transition shrink-0"
                    title="Jump to minute and play on TV"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={handleToggleFullscreen}
                    className="w-10 h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/80 hover:border-cyan-500/50 text-white flex items-center justify-center shadow-md active:scale-95 transition shrink-0"
                    title="Toggle Full Screen on TV"
                    aria-label="Toggle Full Screen on TV"
                  >
                    <Maximize2 className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>

                {/* Quick Minute Preset Buttons (5m, 10m, 15m, 20m, 30m, 45m, 60m) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  {[5, 10, 15, 20, 30, 45, 60].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setMinuteInput(preset.toString());
                        handleJumpToMinute(preset);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 hover:border-cyan-500/40 text-[11px] font-mono font-medium text-zinc-300 hover:text-cyan-300 whitespace-nowrap active:scale-95 transition"
                      title={`Jump to ${preset} minutes and play on TV`}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>

                {jumpFeedback && (
                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 animate-fade-in bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{jumpFeedback}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Red "Close Player Session ❌" button */}
            <button
              onClick={handleCloseSession}
              className="w-full py-3.5 px-4 bg-rose-600/15 hover:bg-rose-600/25 border border-rose-600/30 active:scale-[0.98] text-rose-400 hover:text-rose-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Close Player Session ❌</span>
            </button>
          </div>
        )}
      </main>

      {/* QR Scanner Camera Modal using html5-qrcode */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedCode) => {
          setRoomInput(scannedCode);
          handleConnect(scannedCode);
        }}
      />

      {/* TMDB Catalog Search & Select Modal */}
      <TMDBBrowserModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        initialTab={catalogInitialTab}
        onSelectMedia={handleLoadMediaFromPhone}
      />

      {/* QR Info Modal (viewable anytime when connected) */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#14141f] border border-zinc-700/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center text-zinc-100">
            <button
              onClick={() => setIsQRModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/60 hover:bg-zinc-800 transition"
              aria-label="Close QR Modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-semibold uppercase tracking-wider mb-4">
              <QrCode className="w-3.5 h-3.5" />
              <span>Active Room Info</span>
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-xl shadow-cyan-950/40 mb-4">
              <QRCodeDisplay
                value={
                  typeof window !== 'undefined'
                    ? `${window.location.origin}${
                        window.location.pathname.includes('player.html')
                          ? '/remote.html'
                          : window.location.pathname
                      }?mode=remote&room=${activeRoomCode || pairingRoomCode}`
                    : `https://gotocinemaonline.web.app/remote.html?room=${
                        activeRoomCode || pairingRoomCode
                      }`
                }
                size={170}
              />
            </div>

            <div className="w-full py-3 px-4 bg-black/60 border border-zinc-800 rounded-2xl flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-400">Room Code:</span>
              <span className="font-mono text-2xl font-black text-cyan-400 tracking-widest">
                {activeRoomCode || pairingRoomCode}
              </span>
            </div>

            <p className="text-xs text-zinc-400 max-w-xs mb-4">
              Point a second phone's camera at this QR code to share remote control of this TV.
            </p>

            <button
              onClick={() => setIsQRModalOpen(false)}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
