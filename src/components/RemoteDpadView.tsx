import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Radio,
  Tv,
  Film,
  Sparkles,
  Zap,
  ArrowLeft,
  FastForward,
  Rewind,
  SkipForward,
  SkipBack,
  Sliders,
  KeyRound,
  Copy,
  Check,
  LogOut,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import {
  RemotePlayerState,
  RemoteCommand,
  sendRemoteCommand,
  sendRemotePing,
  setupRemoteStateListener,
} from '../utils/remoteSync';
import {
  auth,
  signInWithGoogle,
  logoutFirebaseUser,
  initRemoteSession,
  sendFirestoreCommand,
  subscribeToRemoteSession,
  RemoteSessionData,
} from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export const RemoteDpadView: React.FC = () => {
  const [playerState, setPlayerState] = useState<RemotePlayerState>({
    isPlaying: false,
    isMuted: false,
    volumeLevel: 100,
    currentTime: 0,
    duration: 0,
    title: 'EmbedMaster Stream',
    type: 'movie',
    id: '',
  });

  const [lastAction, setLastAction] = useState<string>('Ready');
  const [activeDpadDirection, setActiveDpadDirection] = useState<string | null>(null);

  // Firebase Auth & Pairing Code State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(() => {
    return localStorage.getItem('embedmaster_remote_pairing_code');
  });
  const [sessionData, setSessionData] = useState<RemoteSessionData | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Trigger brief vibration on mobile if available
  const triggerHaptic = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
    } catch {}
  }, []);

  const dispatch = useCallback(
    (cmd: RemoteCommand, label: string, value?: any) => {
      triggerHaptic();
      setLastAction(label);

      // 1. Local dispatch (BroadcastChannel + LocalStorage)
      sendRemoteCommand(cmd, value);

      // 2. Cloud Firestore dispatch if code exists
      if (pairingCode) {
        sendFirestoreCommand(pairingCode, cmd, value);
      }
    },
    [triggerHaptic, pairingCode]
  );

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const code = await initRemoteSession(user, pairingCode);
          setPairingCode(code);
          localStorage.setItem('embedmaster_remote_pairing_code', code);
        } catch (err) {
          console.warn('[Remote] Failed initializing session:', err);
        }
      }
    });
    return () => unsubscribe();
  }, [pairingCode]);

  // Subscribe to Firestore session document once pairingCode is available
  useEffect(() => {
    if (!pairingCode) return;
    const unsubscribe = subscribeToRemoteSession(pairingCode, (data) => {
      setSessionData(data);
      if (data.playerState) {
        setPlayerState(data.playerState);
      }
    });
    return () => unsubscribe();
  }, [pairingCode]);

  // Listen to local live state updates from Main Player
  useEffect(() => {
    const unsubscribe = setupRemoteStateListener((newState) => {
      setPlayerState(newState);
    });

    // Send initial ping to wake up main player tab
    sendRemotePing();
    const pingInterval = setInterval(sendRemotePing, 3000);

    return () => {
      unsubscribe();
      clearInterval(pingInterval);
    };
  }, []);

  // Keyboard shortcut listener for remote tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveDpadDirection('up');
        dispatch('volume_up', 'Vol +10%');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveDpadDirection('down');
        dispatch('volume_down', 'Vol -10%');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveDpadDirection('left');
        dispatch('seek_backward', 'Rewind -10s');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveDpadDirection('right');
        dispatch('seek_forward', 'Forward +10s');
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveDpadDirection('center');
        dispatch('toggle_play', playerState.isPlaying ? 'Paused' : 'Playing');
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        dispatch('toggle_mute', playerState.isMuted ? 'Unmuted' : 'Muted');
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        dispatch('toggle_fullscreen', 'Toggle Fullscreen');
      }
    };

    const handleKeyUp = () => {
      setActiveDpadDirection(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch, playerState.isPlaying, playerState.isMuted]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const user = await signInWithGoogle();
      const code = await initRemoteSession(user, pairingCode);
      setPairingCode(code);
      localStorage.setItem('embedmaster_remote_pairing_code', code);
      setLastAction('Logged in via Gmail');
    } catch (err: any) {
      console.error('Google login failed:', err);
      alert('Google Login failed: ' + (err.message || 'Please check popup permissions.'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFirebaseUser();
      setCurrentUser(null);
      setSessionData(null);
      setLastAction('Logged out');
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard?.writeText(pairingCode);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Format seconds helper (00:00)
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      id="remote-controller-viewport"
      className="min-h-screen w-full bg-[#07080f] text-white flex flex-col items-center justify-between p-3 sm:p-5 select-none overflow-x-hidden font-sans"
    >
      {/* 1. TOP STATUS BAR */}
      <header className="w-full max-w-sm flex items-center justify-between py-2 border-b border-white/[0.08] mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              sessionData?.paired
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                : 'bg-blue-400 shadow-[0_0_8px_#60a5fa]'
            }`}
          />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            EmbedMaster Remote
          </span>
        </div>

        <button
          onClick={() => {
            window.location.href = window.location.pathname;
          }}
          className="text-[11px] font-semibold text-neutral-400 hover:text-white transition flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.06]"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Player View</span>
        </button>
      </header>

      {/* 2. FIREBASE GMAIL AUTH & PAIRING CODE CARD */}
      {!currentUser ? (
        <div className="w-full max-w-[340px] sm:max-w-[360px] p-3.5 rounded-3xl bg-gradient-to-br from-blue-950/40 via-[#0f1224] to-purple-950/30 border border-blue-500/30 shadow-xl flex flex-col gap-2.5 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Get Remote Pairing Code
            </span>
            <span className="text-[10px] font-semibold text-blue-300 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30">
              Gmail Auth
            </span>
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Gmail দিয়ে লগইন করে পেয়ারিং কোড পান। কোডটি প্লেয়ার পেইজে বসালেই রিমোট সক্রিয় হবে।
          </p>
          <button
            id="btn-remote-google-login"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 disabled:opacity-50 text-neutral-900 font-bold text-xs flex items-center justify-center gap-2.5 transition active:scale-95 shadow-md"
          >
            {/* Google SVG Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google / Gmail'}</span>
          </button>
        </div>
      ) : (
        /* LOGGED IN USER & PAIRING CODE DISPLAY */
        <div className="w-full max-w-[340px] sm:max-w-[360px] p-3 rounded-3xl bg-[#0c0e1b] border border-blue-500/40 shadow-xl flex flex-col gap-2 mb-2">
          {/* User Profile Bar */}
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 overflow-hidden">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  className="w-6 h-6 rounded-full border border-blue-400/40 flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold">
                  G
                </div>
              )}
              <div className="truncate">
                <span className="block text-[11px] font-bold text-white truncate">
                  {currentUser.displayName || 'Google Account'}
                </span>
                <span className="block text-[10px] text-neutral-400 truncate">
                  {currentUser.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-[10px] text-neutral-400 hover:text-rose-400 font-semibold px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-rose-500/10 transition flex items-center gap-1"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Big Pairing Code Card */}
          <div className="flex items-center justify-between bg-black/60 px-3.5 py-2.5 rounded-2xl border border-white/[0.08]">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">
                Your Remote Pairing Code
              </span>
              <span className="text-2xl font-mono font-black text-amber-400 tracking-widest">
                {pairingCode ? `${pairingCode.slice(0, 3)} ${pairingCode.slice(3)}` : 'Generating...'}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              disabled={!pairingCode}
              className="px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition"
              title="Copy 6-digit pairing code"
            >
              {copyFeedback ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="text-xs font-bold">{copyFeedback ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Connection Status Banner */}
          <div className="flex items-center justify-between text-[10px] px-1">
            <span className="text-neutral-400">Main page a code ti bosan</span>
            <span
              className={`font-bold flex items-center gap-1.5 ${
                sessionData?.paired ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  sessionData?.paired
                    ? 'bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              {sessionData?.paired ? 'Paired & Active' : 'Waiting for Code Entry'}
            </span>
          </div>
        </div>
      )}

      {/* 3. THE REMOTE CONTROL BODY CHASSIS */}
      <main
        id="remote-body-chassis"
        className="relative w-full max-w-[340px] sm:max-w-[360px] bg-gradient-to-b from-[#111322] via-[#0d0f1b] to-[#090b14] border-2 border-white/[0.12] rounded-[44px] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-between gap-4 my-auto"
      >
        {/* IR Sensor Accent */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-b-md bg-blue-500/40 shadow-[0_0_12px_#3b82f6]" />

        {/* Top Function Buttons Row (Power, Feedback, Mute) */}
        <div className="w-full flex items-center justify-between px-2 pt-1">
          {/* Reload / Power Button */}
          <button
            id="btn-remote-reload"
            onClick={() => dispatch('reload', 'Reload Stream')}
            className="w-11 h-11 rounded-full bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-400 flex items-center justify-center transition active:scale-95 shadow-md group"
            title="Reload Video Stream"
          >
            <RotateCcw className="w-4 h-4 group-hover:-rotate-45 transition-transform" />
          </button>

          {/* OLED Feedback Display */}
          <div className="flex-1 mx-3 px-3 py-1.5 rounded-xl bg-black/60 border border-white/[0.08] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider truncate max-w-[150px]">
              {lastAction}
            </span>
            <span className="text-[9px] font-mono text-neutral-400">
              {formatTime(playerState.currentTime)}{' '}
              {playerState.duration ? `/ ${formatTime(playerState.duration)}` : ''}
            </span>
          </div>

          {/* Mute Button */}
          <button
            id="btn-remote-mute"
            onClick={() =>
              dispatch('toggle_mute', playerState.isMuted ? 'Unmuted' : 'Muted')
            }
            className={`w-11 h-11 rounded-full flex items-center justify-center transition active:scale-95 shadow-md border ${
              playerState.isMuted
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/[0.08] text-neutral-300'
            }`}
            title="Mute / Unmute"
          >
            {playerState.isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Current Media Title Banner */}
        <div className="w-full px-3 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between text-left">
          <div className="flex items-center gap-2 overflow-hidden">
            {playerState.type === 'tv' ? (
              <Tv className="w-4 h-4 text-purple-400 flex-shrink-0" />
            ) : (
              <Film className="w-4 h-4 text-blue-400 flex-shrink-0" />
            )}
            <div className="truncate">
              <span className="block text-xs font-bold text-white truncate">
                {playerState.title}
              </span>
              <span className="block text-[10px] text-neutral-400 font-mono">
                {playerState.type === 'tv'
                  ? `Season ${playerState.season || 1} • Episode ${playerState.episode || 1}`
                  : 'Feature Film'}
              </span>
            </div>
          </div>
          <div className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {playerState.isPlaying ? 'PLAYING' : 'PAUSED'}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. THE PHYSICAL CIRCULAR D-PAD CONTROLLER                 */}
        {/* ========================================================= */}
        <div className="relative w-60 h-60 sm:w-68 sm:h-68 my-1">
          {/* Outer Ring Ambient Glow & Bezel */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#131627] to-[#1f233b] border-4 border-neutral-800 shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_2px_8px_rgba(255,255,255,0.12)] p-2">
            
            {/* UP BUTTON (Volume +) */}
            <button
              id="dpad-btn-up"
              onClick={() => dispatch('volume_up', 'Volume +10%')}
              className={`absolute top-2 left-1/2 -translate-x-1/2 w-28 h-20 rounded-t-full flex flex-col items-center justify-start pt-2.5 transition-all active:scale-95 ${
                activeDpadDirection === 'up'
                  ? 'bg-blue-600/40 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                  : 'hover:bg-white/[0.08] text-neutral-300 hover:text-white'
              }`}
              title="Volume Up (+10%)"
            >
              <ChevronUp className="w-7 h-7" />
              <span className="text-[10px] font-black tracking-wider uppercase -mt-1">
                VOL +
              </span>
            </button>

            {/* DOWN BUTTON (Volume -) */}
            <button
              id="dpad-btn-down"
              onClick={() => dispatch('volume_down', 'Volume -10%')}
              className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-20 rounded-b-full flex flex-col items-center justify-end pb-2.5 transition-all active:scale-95 ${
                activeDpadDirection === 'down'
                  ? 'bg-blue-600/40 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                  : 'hover:bg-white/[0.08] text-neutral-300 hover:text-white'
              }`}
              title="Volume Down (-10%)"
            >
              <span className="text-[10px] font-black tracking-wider uppercase -mb-1">
                VOL -
              </span>
              <ChevronDown className="w-7 h-7" />
            </button>

            {/* LEFT BUTTON (Rewind -10s) */}
            <button
              id="dpad-btn-left"
              onClick={() => dispatch('seek_backward', 'Seek -10s')}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-20 h-28 rounded-l-full flex items-center justify-start pl-2.5 gap-0.5 transition-all active:scale-95 ${
                activeDpadDirection === 'left'
                  ? 'bg-blue-600/40 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                  : 'hover:bg-white/[0.08] text-neutral-300 hover:text-white'
              }`}
              title="Rewind (-10 Seconds)"
            >
              <ChevronLeft className="w-7 h-7" />
              <span className="text-[9px] font-bold uppercase tracking-tighter -ml-1">
                10s
              </span>
            </button>

            {/* RIGHT BUTTON (Forward +10s) */}
            <button
              id="dpad-btn-right"
              onClick={() => dispatch('seek_forward', 'Seek +10s')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-20 h-28 rounded-r-full flex items-center justify-end pr-2.5 gap-0.5 transition-all active:scale-95 ${
                activeDpadDirection === 'right'
                  ? 'bg-blue-600/40 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                  : 'hover:bg-white/[0.08] text-neutral-300 hover:text-white'
              }`}
              title="Forward (+10 Seconds)"
            >
              <span className="text-[9px] font-bold uppercase tracking-tighter -mr-1">
                10s
              </span>
              <ChevronRight className="w-7 h-7" />
            </button>

            {/* CENTER OK / PLAY-PAUSE BUTTON */}
            <button
              id="dpad-btn-center-ok"
              onClick={() =>
                dispatch(
                  'toggle_play',
                  playerState.isPlaying ? 'Paused' : 'Playing'
                )
              }
              className={`absolute inset-0 m-auto w-22 h-22 sm:w-24 sm:h-24 rounded-full border-2 transition-all active:scale-90 flex flex-col items-center justify-center gap-0.5 shadow-2xl z-10 ${
                activeDpadDirection === 'center'
                  ? 'bg-blue-600 border-blue-400 text-white scale-95 shadow-[0_0_30px_#3b82f6]'
                  : playerState.isPlaying
                  ? 'bg-gradient-to-tr from-blue-700 to-indigo-600 border-blue-400/50 text-white hover:from-blue-600 hover:to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                  : 'bg-gradient-to-tr from-[#1b1e32] to-[#282d4c] border-white/20 text-white hover:bg-neutral-800'
              }`}
              title="Toggle Play / Pause (Enter / Space)"
            >
              {playerState.isPlaying ? (
                <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
              ) : (
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-1" />
              )}
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                {playerState.isPlaying ? 'PAUSE' : 'PLAY'}
              </span>
            </button>
          </div>
        </div>

        {/* 5. SECONDARY CONTROLS (QUICK JUMPS & VOLUME) */}
        <div className="w-full space-y-2.5 pt-1">
          {/* Seek 30s & Fullscreen Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn-remote-seek-back-30"
              onClick={() => dispatch('seek_backward_30', 'Rewind -30s')}
              className="py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.06] text-neutral-300 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition"
              title="Rewind 30 Seconds"
            >
              <Rewind className="w-4 h-4" />
              <span className="text-[9px] font-bold font-mono">-30s</span>
            </button>

            <button
              id="btn-remote-fullscreen"
              onClick={() => dispatch('toggle_fullscreen', 'Fullscreen Toggle')}
              className="py-2 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition"
              title="Toggle Fullscreen on Player"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="text-[9px] font-bold font-mono">FULLSCREEN</span>
            </button>

            <button
              id="btn-remote-seek-fwd-30"
              onClick={() => dispatch('seek_forward_30', 'Forward +30s')}
              className="py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.06] text-neutral-300 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition"
              title="Forward 30 Seconds"
            >
              <FastForward className="w-4 h-4" />
              <span className="text-[9px] font-bold font-mono">+30s</span>
            </button>
          </div>

          {/* TV Episode Navigator */}
          {playerState.type === 'tv' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-remote-prev-episode"
                onClick={() => dispatch('prev_episode', 'Previous Episode')}
                className="py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>Prev Episode</span>
              </button>
              <button
                id="btn-remote-next-episode"
                onClick={() => dispatch('next_episode', 'Next Episode')}
                className="py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <span>Next Episode</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Volume Rocker Display */}
          <div className="px-3 py-1.5 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
              <Volume1 className="w-3.5 h-3.5 text-blue-400" />
              Volume: {playerState.volumeLevel}%
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => dispatch('volume_down', 'Volume -10%')}
                className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white flex items-center justify-center font-bold active:scale-95"
              >
                -
              </button>
              <button
                onClick={() => dispatch('volume_up', 'Volume +10%')}
                className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white flex items-center justify-center font-bold active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 6. FOOTER SHORTCUT HINT */}
      <footer className="w-full max-w-sm text-center py-1.5">
        <p className="text-[10px] text-neutral-500 font-mono">
          Keyboard: <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-neutral-300">↑</kbd>{' '}
          <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-neutral-300">↓</kbd> Vol &bull;{' '}
          <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-neutral-300">←</kbd>{' '}
          <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-neutral-300">→</kbd> Seek &bull;{' '}
          <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-neutral-300">Space / Enter</kbd> Play
        </p>
      </footer>
    </div>
  );
};
