import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Film,
  Tv,
  Maximize2,
  Minimize2,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Terminal,
  RotateCcw,
  Sparkles,
  Play,
  Pause,
  Info,
  Flame,
  Radio,
  ExternalLink,
  KeyRound,
} from 'lucide-react';
import {
  MediaItem,
  PlayerConfig,
  PlayerEventLog,
  DisplayMode,
} from './types';
import { POPULAR_MOVIES, POPULAR_TV_SHOWS, buildEmbedMasterUrl } from './data/mediaPresets';
import { sendEmbedMasterCommand, seekTo, setVolume } from './utils/playerBridge';
import { PlayerView } from './components/PlayerView';
import { ExternalControlBar } from './components/ExternalControlBar';
import { FullScreenMediaCatalog } from './components/FullScreenMediaCatalog';
import { EventLogPanel } from './components/EventLogPanel';
import { RemoteDpadView } from './components/RemoteDpadView';
import { RemotePairingModal } from './components/RemotePairingModal';
import { EpisodeSelector } from './components/EpisodeSelector';
import { ContentFeed } from './components/ContentFeed';
import { TvPlayerView } from './components/TvPlayerView';
import { TvPairingBar } from './components/TvPairingBar';
import { claimTvRoom, sendTvCommand, subscribeToTvRoom } from './lib/tvSync';
import {
  setupMainPlayerRemoteListener,
  broadcastPlayerState,
  RemoteCommand,
} from './utils/remoteSync';
import {
  linkMainPlayerToSession,
  syncPlayerStateToFirestore,
  RemoteSessionData,
  db,
} from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  openFullscreen,
  toggleTvFullscreen,
  isFullscreenActive,
} from './utils/tvFullscreen';

function MainPlayer() {
  // Master container ref for full screen requests
  const appContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Active Media Item (Default: Moana 2 tt31193180 as in user prompt)
  const [currentMedia, setCurrentMedia] = useState<MediaItem>(POPULAR_MOVIES[0]);

  // Player configuration options
  const [config, setConfig] = useState<PlayerConfig>({
    skin: 'onyx',
    welcomePage: 'off',
    autoplay: 'on',
    subtitles: [],
  });

  // Display & UI state
  const [displayMode, setDisplayMode] = useState<DisplayMode>('fullscreen-view');
  const [isShieldActive, setIsShieldActive] = useState<boolean>(true);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState<boolean>(false);
  const [isLogOpen, setIsLogOpen] = useState<boolean>(false);

  // Firebase Remote Cloud Pairing State (D-Pad Controller)
  const [isPairingModalOpen, setIsPairingModalOpen] = useState<boolean>(false);
  const [pairedRemoteCode, setPairedRemoteCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('embedmaster_paired_remote_code');
  });
  const [pairedSession, setPairedSession] = useState<RemoteSessionData | null>(null);

  // Firebase TV Session State (Master Prompt: TV Button + Unique Room Code + Live Sync)
  const [connectedTvRoomCode, setConnectedTvRoomCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('embedmaster_connected_tv_code');
  });

  // Keep subscription to the claimed TV room to detect if TV tab closed or terminated
  useEffect(() => {
    if (!connectedTvRoomCode) return;
    const unsub = subscribeToTvRoom(connectedTvRoomCode, (room) => {
      if (!room || room.status === 'terminated') {
        setConnectedTvRoomCode(null);
        localStorage.removeItem('embedmaster_connected_tv_code');
      }
    });
    return () => unsub();
  }, [connectedTvRoomCode]);

  // Playback & telemetry state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(100);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [logs, setLogs] = useState<PlayerEventLog[]>([]);
  const [lastEventName, setLastEventName] = useState<string>('idle');
  const [osdText, setOsdText] = useState<string | null>(null);
  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute active embed URL
  const activeEmbedUrl = buildEmbedMasterUrl(currentMedia, {
    skin: config.skin,
    welcomePage: config.welcomePage,
    autoplay: config.autoplay,
    subtitles: config.subtitles,
  });

  // Trigger brief on-screen toast feedback
  const showOsd = useCallback((text: string) => {
    setOsdText(text);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setOsdText(null);
    }, 1800);
  }, []);

  // PostMessage Command Dispatcher (Official EmbedMaster specification)
  const dispatchCommand = useCallback(
    (command: string, value?: any) => {
      if (!iframeRef.current) return;
      sendEmbedMasterCommand(iframeRef.current, command, value);
    },
    []
  );

  // Write into logs and update <pre id="log">
  const handleIncomingLog = useCallback((event: string, info: any) => {
    const rawLine = `event: ${event} | info: ${JSON.stringify(info)}`;
    
    // Also write into DOM <pre id="log"> as instructed in user's prompt
    const el = document.getElementById('log');
    if (el) {
      el.textContent += rawLine + '\n';
      el.scrollTop = el.scrollHeight;
    }

    setLastEventName(event);
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        event,
        info,
        timestamp: new Date().toLocaleTimeString(),
        raw: rawLine,
      },
    ]);
  }, []);

  // Listen to incoming messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      // Handle official embedmaster_player events
      if (data.source === 'embedmaster_player') {
        handleIncomingLog(data.event, data.info);

        if (data.event === 'play') {
          console.log('Video started playing.');
          setIsPlaying(true);
        } else if (data.event === 'pause') {
          console.log('Video paused.');
          setIsPlaying(false);
        } else if (data.event === 'time' || data.event === 'timeupdate') {
          if (typeof data.info === 'number') {
            setCurrentTime(data.info);
          } else if (data.info && typeof data.info.time === 'number') {
            setCurrentTime(data.info.time);
            if (data.info.duration) setDuration(data.info.duration);
          }
        } else if (data.event === 'volume') {
          if (typeof data.info === 'number') {
            setVolumeLevel(data.info);
            setIsMuted(data.info === 0);
          }
        } else if (data.event === 'mute') {
          setIsMuted(true);
        } else if (data.event === 'unmute') {
          setIsMuted(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleIncomingLog]);

  // Command handlers for external control bar & remote
  const handlePlay = useCallback(() => {
    dispatchCommand('play');
    setIsPlaying(true);
    showOsd('Playback Started');
    if (connectedTvRoomCode) {
      sendTvCommand(connectedTvRoomCode, 'play');
    }
  }, [dispatchCommand, showOsd, connectedTvRoomCode]);

  const handlePause = useCallback(() => {
    dispatchCommand('pause');
    setIsPlaying(false);
    showOsd('Playback Paused');
    if (connectedTvRoomCode) {
      sendTvCommand(connectedTvRoomCode, 'pause');
    }
  }, [dispatchCommand, showOsd, connectedTvRoomCode]);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, handlePlay, handlePause]);

  const handleSeek = useCallback(
    (seconds: number) => {
      seekTo(iframeRef.current, seconds);
      setCurrentTime(seconds);
      showOsd(`Seek to ${Math.round(seconds)}s`);
      if (connectedTvRoomCode) {
        sendTvCommand(connectedTvRoomCode, 'seek', seconds);
      }
    },
    [showOsd, connectedTvRoomCode]
  );

  const handleSeekRelative = useCallback(
    (deltaSeconds: number) => {
      const target = Math.max(0, currentTime + deltaSeconds);
      seekTo(iframeRef.current, target);
      setCurrentTime(target);
      showOsd(`${deltaSeconds > 0 ? '+' : ''}${deltaSeconds}s Jump`);
      if (connectedTvRoomCode) {
        sendTvCommand(connectedTvRoomCode, 'seek', target);
      }
    },
    [currentTime, showOsd, connectedTvRoomCode]
  );

  // Time Jump Input Box Handler (User types minutes—e.g., 10 or 20—and clicks play to seek instantly)
  const handleTimeJump = useCallback(
    (minutes: number) => {
      const seconds = minutes * 60;
      handleSeek(seconds);
      if (!isPlaying) {
        handlePlay();
      }
      showOsd(`Time Jumped to ${minutes} min (${seconds}s)`);
      if (connectedTvRoomCode) {
        sendTvCommand(connectedTvRoomCode, 'time_jump', minutes);
      }
    },
    [handleSeek, isPlaying, handlePlay, showOsd, connectedTvRoomCode]
  );

  const handleMute = useCallback(() => {
    dispatchCommand('mute');
    setIsMuted(true);
    showOsd('Muted');
    if (connectedTvRoomCode) {
      sendTvCommand(connectedTvRoomCode, 'mute');
    }
  }, [dispatchCommand, showOsd, connectedTvRoomCode]);

  const handleUnmute = useCallback(() => {
    dispatchCommand('unmute');
    setIsMuted(false);
    showOsd('Unmuted');
    if (connectedTvRoomCode) {
      sendTvCommand(connectedTvRoomCode, 'unmute');
    }
  }, [dispatchCommand, showOsd, connectedTvRoomCode]);

  const handleToggleMute = useCallback(() => {
    if (isMuted) {
      handleUnmute();
    } else {
      handleMute();
    }
  }, [isMuted, handleMute, handleUnmute]);

  const handleSetVolume = useCallback(
    (percent: number) => {
      const clamped = Math.max(0, Math.min(100, percent));
      setVolume(iframeRef.current, clamped);
      setVolumeLevel(clamped);
      setIsMuted(clamped === 0);
      showOsd(`Volume: ${clamped}%`);
      if (connectedTvRoomCode) {
        sendTvCommand(connectedTvRoomCode, 'volume', clamped);
      }
    },
    [showOsd, connectedTvRoomCode]
  );

  // TV Session Pairing and Control Handlers
  const handleOpenTvPage = useCallback(() => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const tvUrl = `${origin}${pathname}?view=tv`;
    const newWin = window.open(tvUrl, '_blank');
    if (newWin) {
      showOsd('Dedicated TV Player opened in new tab');
    }
  }, [showOsd]);

  const handleConnectTv = useCallback(
    async (code: string) => {
      const result = await claimTvRoom(code);
      if (result.success) {
        setConnectedTvRoomCode(code);
        localStorage.setItem('embedmaster_connected_tv_code', code);
        showOsd(`Connected to TV Room [${code}]!`);
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [showOsd]
  );

  const handleDisconnectTv = useCallback(() => {
    if (connectedTvRoomCode) {
      showOsd(`Disconnected from TV [${connectedTvRoomCode}]`);
    }
    setConnectedTvRoomCode(null);
    localStorage.removeItem('embedmaster_connected_tv_code');
  }, [connectedTvRoomCode, showOsd]);

  // Content Feed item click (Requirement: "clicking any movie, show, or anime on the main page must command the connected TV page to play it.")
  const handleSelectMedia = useCallback(
    (media: MediaItem) => {
      setCurrentMedia(media);
      setIsPlaying(true);
      showOsd(`Selected: ${media.title}`);
      if (connectedTvRoomCode) {
        sendTvCommand(connectedTvRoomCode, 'play_media', media);
        showOsd(`Streaming on TV [${connectedTvRoomCode}]: ${media.title}`);
      }
    },
    [connectedTvRoomCode, showOsd]
  );

  // Expose window.sendCommand, window.seekTo, window.setVolume as documented in EmbedMaster documentation
  useEffect(() => {
    (window as any).sendCommand = (command: string, value?: any) => {
      dispatchCommand(command, value);
    };
    (window as any).seekTo = (seconds: number) => {
      handleSeek(seconds);
    };
    (window as any).setVolume = (percent: number) => {
      handleSetVolume(percent);
    };
    (window as any).log = (msg: string) => {
      const el = document.getElementById('log');
      if (el) {
        el.textContent += msg + '\n';
        el.scrollTop = el.scrollHeight;
      }
    };
    return () => {
      delete (window as any).sendCommand;
      delete (window as any).seekTo;
      delete (window as any).setVolume;
      delete (window as any).log;
    };
  }, [dispatchCommand, handleSeek, handleSetVolume]);

  const handleSelectEpisode = useCallback(
    (season: number, episode: number) => {
      const updatedMedia: MediaItem = {
        ...currentMedia,
        season,
        episode,
      };
      setCurrentMedia(updatedMedia);
      setIsPlaying(true);
      showOsd(`Season ${season} • Episode ${episode}`);
      if (connectedTvRoomCode) {
        sendTvCommand(connectedTvRoomCode, 'play_media', updatedMedia);
        showOsd(`TV Playing S${season} E${episode}`);
      }
    },
    [currentMedia, connectedTvRoomCode, showOsd]
  );

  const handleToggleFullscreen = useCallback(() => {
    // Send fullscreen command to iframe
    dispatchCommand('fullscreen');

    // Also trigger HTML5 Fullscreen for true edge-to-edge experience (Android TV / Tizen / WebOS)
    toggleTvFullscreen(appContainerRef.current || document.documentElement).catch(() => {});
  }, [dispatchCommand]);

  const handleOpenSmartTvFullscreen = useCallback(() => {
    openFullscreen(appContainerRef.current || document.documentElement).then(() => {
      showOsd('Smart TV Edge-to-Edge Fullscreen Activated');
    }).catch(() => {});
  }, [showOsd]);

  const handleReload = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = activeEmbedUrl;
      showOsd('Reloaded Stream');
    }
  }, [activeEmbedUrl, showOsd]);

  // Next / Previous TV Episode Handlers
  const handleNextEpisode = useCallback(() => {
    if (currentMedia.type === 'tv') {
      const nextEp = (currentMedia.episode || 1) + 1;
      setCurrentMedia({
        ...currentMedia,
        episode: nextEp,
      });
      showOsd(`Playing Season ${currentMedia.season || 1}, Episode ${nextEp}`);
    }
  }, [currentMedia, showOsd]);

  const handlePrevEpisode = useCallback(() => {
    if (currentMedia.type === 'tv' && currentMedia.episode && currentMedia.episode > 1) {
      const prevEp = currentMedia.episode - 1;
      setCurrentMedia({
        ...currentMedia,
        episode: prevEp,
      });
      showOsd(`Playing Season ${currentMedia.season || 1}, Episode ${prevEp}`);
    }
  }, [currentMedia, showOsd]);

  // Open Remote D-Pad in a dedicated new tab
  const handleOpenRemoteTab = useCallback(() => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const remoteUrl = `${origin}${pathname}?mode=remote`;
    const newWin = window.open(remoteUrl, '_blank');
    if (newWin) {
      showOsd('Remote D-Pad opened in new tab');
    } else {
      window.open('#remote', '_blank');
      showOsd('Remote D-Pad opened in new tab');
    }
  }, [showOsd]);

  // Listen for remote commands from the new tab and sync live state
  useEffect(() => {
    const pushStateToRemote = () => {
      broadcastPlayerState({
        isPlaying,
        isMuted,
        volumeLevel,
        currentTime,
        duration,
        title: currentMedia.title,
        type: currentMedia.type,
        season: currentMedia.season,
        episode: currentMedia.episode,
        id: currentMedia.id,
      });
    };

    const unsubscribe = setupMainPlayerRemoteListener(
      (command: RemoteCommand, value?: any) => {
        switch (command) {
          case 'play':
            handlePlay();
            break;
          case 'pause':
            handlePause();
            break;
          case 'toggle_play':
            handleTogglePlay();
            break;
          case 'volume_up':
            handleSetVolume(volumeLevel + 10);
            break;
          case 'volume_down':
            handleSetVolume(volumeLevel - 10);
            break;
          case 'seek_forward':
            handleSeekRelative(10);
            break;
          case 'seek_backward':
            handleSeekRelative(-10);
            break;
          case 'seek_forward_30':
            handleSeekRelative(30);
            break;
          case 'seek_backward_30':
            handleSeekRelative(-30);
            break;
          case 'toggle_mute':
            handleToggleMute();
            break;
          case 'mute':
            handleMute();
            break;
          case 'unmute':
            handleUnmute();
            break;
          case 'toggle_fullscreen':
            handleToggleFullscreen();
            break;
          case 'reload':
            handleReload();
            break;
          case 'next_episode':
            handleNextEpisode();
            break;
          case 'prev_episode':
            handlePrevEpisode();
            break;
          case 'set_volume':
            if (typeof value === 'number') handleSetVolume(value);
            break;
          case 'seek_to':
            if (typeof value === 'number') handleSeek(value);
            break;
        }
      },
      () => {
        pushStateToRemote();
      }
    );

    // Initial broadcast
    pushStateToRemote();

    return () => {
      unsubscribe();
    };
  }, [
    isPlaying,
    isMuted,
    volumeLevel,
    currentTime,
    duration,
    currentMedia,
    handlePlay,
    handlePause,
    handleTogglePlay,
    handleSetVolume,
    handleSeekRelative,
    handleToggleMute,
    handleMute,
    handleUnmute,
    handleToggleFullscreen,
    handleReload,
    handleNextEpisode,
    handlePrevEpisode,
    handleSeek,
  ]);

  // Pair remote by 6-digit code via Firebase Firestore
  const handlePairCode = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        const snap = await getDoc(doc(db, 'remote_sessions', code));
        if (!snap.exists()) {
          return false;
        }
        setPairedRemoteCode(code);
        localStorage.setItem('embedmaster_paired_remote_code', code);
        showOsd(`Remote Linked with Code: ${code}`);
        return true;
      } catch (err) {
        console.warn('[Firebase] Pairing check failed:', err);
        return false;
      }
    },
    [showOsd]
  );

  const handleUnlinkRemote = useCallback(() => {
    setPairedRemoteCode(null);
    setPairedSession(null);
    localStorage.removeItem('embedmaster_paired_remote_code');
    showOsd('Remote Disconnected');
  }, [showOsd]);

  // Subscribe to Firebase Firestore remote session when code is paired
  useEffect(() => {
    if (!pairedRemoteCode) return;

    const unsubscribe = linkMainPlayerToSession(
      pairedRemoteCode,
      (command: RemoteCommand, value?: any) => {
        switch (command) {
          case 'play':
            handlePlay();
            break;
          case 'pause':
            handlePause();
            break;
          case 'toggle_play':
            handleTogglePlay();
            break;
          case 'volume_up':
            handleSetVolume(volumeLevel + 10);
            break;
          case 'volume_down':
            handleSetVolume(volumeLevel - 10);
            break;
          case 'seek_forward':
            handleSeekRelative(10);
            break;
          case 'seek_backward':
            handleSeekRelative(-10);
            break;
          case 'seek_forward_30':
            handleSeekRelative(30);
            break;
          case 'seek_backward_30':
            handleSeekRelative(-30);
            break;
          case 'toggle_mute':
            handleToggleMute();
            break;
          case 'mute':
            handleMute();
            break;
          case 'unmute':
            handleUnmute();
            break;
          case 'toggle_fullscreen':
            handleToggleFullscreen();
            break;
          case 'reload':
            handleReload();
            break;
          case 'next_episode':
            handleNextEpisode();
            break;
          case 'prev_episode':
            handlePrevEpisode();
            break;
          case 'set_volume':
            if (typeof value === 'number') handleSetVolume(value);
            break;
          case 'seek_to':
            if (typeof value === 'number') handleSeek(value);
            break;
        }
      },
      (session) => {
        setPairedSession(session);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [
    pairedRemoteCode,
    volumeLevel,
    handlePlay,
    handlePause,
    handleTogglePlay,
    handleSetVolume,
    handleSeekRelative,
    handleToggleMute,
    handleMute,
    handleUnmute,
    handleToggleFullscreen,
    handleReload,
    handleNextEpisode,
    handlePrevEpisode,
    handleSeek,
  ]);

  // Continuously sync player state to Firestore session for the remote screen
  useEffect(() => {
    if (!pairedRemoteCode) return;
    syncPlayerStateToFirestore(pairedRemoteCode, {
      isPlaying,
      isMuted,
      volumeLevel,
      currentTime,
      duration,
      title: currentMedia.title,
      type: currentMedia.type,
      season: currentMedia.season,
      episode: currentMedia.episode,
      id: currentMedia.id,
    });
  }, [
    pairedRemoteCode,
    isPlaying,
    isMuted,
    volumeLevel,
    currentTime,
    duration,
    currentMedia,
  ]);

  // Smart TV Remote & Keyboard Shortcuts (Android TV / Tizen / WebOS)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input text field
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      // Smart TV Back / Return Key (Tizen: 10009, WebOS: 461, Android: 4, Escape: 27)
      if (
        e.keyCode === 10009 ||
        e.keyCode === 461 ||
        e.keyCode === 4 ||
        e.key === 'Escape' ||
        e.keyCode === 27
      ) {
        if (isMediaModalOpen) {
          e.preventDefault();
          setIsMediaModalOpen(false);
          return;
        }
        if (isPairingModalOpen) {
          e.preventDefault();
          setIsPairingModalOpen(false);
          return;
        }
        if (isLogOpen) {
          e.preventDefault();
          setIsLogOpen(false);
          return;
        }
      }

      if (isInput) return;

      const keyCode = e.keyCode || e.which;
      const key = e.key;

      // Smart TV Remote Arrow Keys (KeyCodes: 37, 38, 39, 40) & Media Keys
      // When not navigating focused elements, these directly control the video player
      const activeEl = document.activeElement;
      const isInteractiveFocused =
        activeEl &&
        activeEl !== document.body &&
        activeEl !== document.documentElement &&
        activeEl.id !== 'embedmaster-app-root';

      // Arrow Left (KeyCode: 37) - Seek Backward 10s
      if (key === 'ArrowLeft' || keyCode === 37) {
        if (!isInteractiveFocused || isMediaModalOpen) {
          // If modal open, allow normal spatial navigation unless handled
        } else {
          e.preventDefault();
          handleSeekRelative(-10);
          return;
        }
      }

      // Arrow Right (KeyCode: 39) - Seek Forward 10s
      if (key === 'ArrowRight' || keyCode === 39) {
        if (!isInteractiveFocused || isMediaModalOpen) {
          // allow normal navigation
        } else {
          e.preventDefault();
          handleSeekRelative(10);
          return;
        }
      }

      // Arrow Up (KeyCode: 38) - Volume Up
      if (key === 'ArrowUp' || keyCode === 38) {
        if (!isInteractiveFocused || isMediaModalOpen) {
          // allow normal navigation
        } else {
          e.preventDefault();
          handleSetVolume(Math.min(100, volumeLevel + 5));
          return;
        }
      }

      // Arrow Down (KeyCode: 40) - Volume Down
      if (key === 'ArrowDown' || keyCode === 40) {
        if (!isInteractiveFocused || isMediaModalOpen) {
          // allow normal navigation
        } else {
          e.preventDefault();
          handleSetVolume(Math.max(0, volumeLevel - 5));
          return;
        }
      }

      // Enter / OK (KeyCode: 13) or Space (KeyCode: 32)
      if (key === ' ' || key === 'Enter' || keyCode === 13 || keyCode === 32) {
        if (!isInteractiveFocused) {
          e.preventDefault();
          handleTogglePlay();
          return;
        }
      }

      // Smart TV Dedicated Media Play/Pause Keys
      if (
        key === 'MediaPlayPause' ||
        keyCode === 179 ||
        key === 'MediaPlay' ||
        keyCode === 415
      ) {
        e.preventDefault();
        handleTogglePlay();
        return;
      }
      if (key === 'MediaPause' || keyCode === 19 || key === 'MediaStop' || keyCode === 413) {
        e.preventDefault();
        handlePause();
        return;
      }
      if (key === 'MediaFastForward' || keyCode === 417) {
        e.preventDefault();
        handleSeekRelative(30);
        return;
      }
      if (key === 'MediaRewind' || keyCode === 412) {
        e.preventDefault();
        handleSeekRelative(-30);
        return;
      }

      // Smart TV Colored Remote Buttons (Red, Green, Yellow, Blue)
      if (key === 'ColorF0Red' || keyCode === 403) {
        // Red: Mute / Unmute
        e.preventDefault();
        handleToggleMute();
        return;
      }
      if (key === 'ColorF1Green' || keyCode === 404) {
        // Green: Edge-to-Edge Fullscreen
        e.preventDefault();
        handleToggleFullscreen();
        return;
      }
      if (key === 'ColorF2Yellow' || keyCode === 405) {
        // Yellow: Browse Movie Catalog
        e.preventDefault();
        setIsMediaModalOpen((prev) => !prev);
        return;
      }
      if (key === 'ColorF3Blue' || keyCode === 406) {
        // Blue: Pair Remote
        e.preventDefault();
        setIsPairingModalOpen((prev) => !prev);
        return;
      }

      // Standard desktop shortcuts
      switch (key) {
        case 'm':
        case 'M':
          handleToggleMute();
          break;
        case 'f':
        case 'F':
          handleToggleFullscreen();
          break;
        case 'l':
        case 'L':
          setIsLogOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTogglePlay,
    handlePause,
    handleToggleMute,
    handleSeekRelative,
    handleSetVolume,
    handleToggleFullscreen,
    volumeLevel,
    isMediaModalOpen,
    isPairingModalOpen,
    isLogOpen,
  ]);

  const handleClearLogs = () => {
    const el = document.getElementById('log');
    if (el) el.textContent = '';
    setLogs([]);
    setLastEventName('cleared');
  };

  return (
    <div
      ref={appContainerRef}
      id="embedmaster-app-root"
      className="flex flex-col w-full min-h-screen bg-slate-50 text-slate-900 font-sans select-none"
    >
      {/* Clean Minimal Header */}
      <header
        id="app-header-nav"
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white/90 border-b border-slate-200 backdrop-blur-md"
      >
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Film className="w-4 h-4" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-slate-900">
            Cinema
          </h1>
        </div>

        {/* TV Link / Cast */}
        <TvPairingBar
          connectedRoomCode={connectedTvRoomCode}
          onConnect={handleConnectTv}
          onDisconnect={handleDisconnectTv}
          onOpenTvTab={handleOpenTvPage}
        />
      </header>

      {/* Main Video Player Container */}
      <section
        id="app-main-player-stage"
        className="relative w-full bg-black flex flex-col flex-shrink-0"
      >
        <div className="w-full h-[48vh] sm:h-[56vh] min-h-[300px] max-h-[580px] bg-black relative">
          <PlayerView
            ref={iframeRef}
            embedUrl={activeEmbedUrl}
            media={currentMedia}
            isPlaying={isPlaying}
            osdText={osdText}
          />
        </div>

        {/* Playback Controls & Time Jump */}
        <ExternalControlBar
          media={currentMedia}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volumeLevel}
          currentTime={currentTime}
          duration={duration}
          onPlay={handlePlay}
          onPause={handlePause}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          onSeekRelative={handleSeekRelative}
          onTimeJump={handleTimeJump}
          onToggleMute={handleToggleMute}
          onSetVolume={handleSetVolume}
          onToggleFullscreen={handleToggleFullscreen}
          onReload={handleReload}
          onNextEpisode={handleNextEpisode}
          onPrevEpisode={handlePrevEpisode}
        />
      </section>

      {/* Episode Selector for TV Shows & Anime */}
      <EpisodeSelector
        media={currentMedia}
        activeSeason={currentMedia.season || 1}
        activeEpisode={currentMedia.episode || 1}
        onSelectEpisode={handleSelectEpisode}
      />

      {/* Movies, TV Shows, Anime Feed with TMDB API */}
      <ContentFeed
        currentMedia={currentMedia}
        onSelectMedia={handleSelectMedia}
      />

      {/* EmbedMaster Player API & Event Log Console */}
      <section
        id="embedmaster-api-section"
        className="w-full bg-white border-t border-slate-200 px-4 sm:px-6 py-6 select-none"
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
                EmbedMaster Player Interaction & Event Stream
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Target: #embedmaster_iframe
            </span>
          </div>

          {/* Quick Command Buttons from EmbedMaster Docs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => dispatchCommand('play')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-medium transition active:scale-95 shadow-xs"
            >
              Play
            </button>
            <button
              onClick={() => dispatchCommand('pause')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition active:scale-95"
            >
              Pause
            </button>
            <button
              onClick={() => handleSeek(60)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition active:scale-95"
            >
              Seek to 60s
            </button>
            <button
              onClick={() => handleMute()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition active:scale-95"
            >
              Mute
            </button>
            <button
              onClick={() => handleUnmute()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition active:scale-95"
            >
              Unmute
            </button>
            <button
              onClick={() => handleSetVolume(50)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition active:scale-95"
            >
              Volume 50%
            </button>
            <button
              onClick={() => handleSetVolume(100)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition active:scale-95"
            >
              Volume 100%
            </button>
            <button
              onClick={() => dispatchCommand('fullscreen')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition active:scale-95"
            >
              Fullscreen
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('log');
                if (el) el.textContent = '';
              }}
              className="ml-auto text-xs text-slate-400 hover:text-rose-500 transition"
            >
              Clear Log
            </button>
          </div>

          {/* Real-time Event Print Area matching official documentation */}
          <pre
            id="log"
            style={{
              boxSizing: 'border-box',
              marginTop: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px',
              width: '100%',
              maxHeight: '180px',
              overflow: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '11px',
              lineHeight: '1.6',
              color: '#334155',
              whiteSpace: 'pre-wrap',
            }}
          />
        </div>
      </section>
    </div>
  );
}

export function App() {
  const [routeMode, setRouteMode] = useState<'main' | 'remote' | 'tv'>(() => {
    if (typeof window === 'undefined') return 'main';
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('view') === 'tv' ||
      params.get('mode') === 'tv' ||
      window.location.hash === '#tv'
    )
      return 'tv';
    if (
      params.get('view') === 'remote' ||
      params.get('mode') === 'remote' ||
      window.location.hash === '#remote'
    )
      return 'remote';
    return 'main';
  });

  useEffect(() => {
    const updateRoute = () => {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('view') === 'tv' ||
        params.get('mode') === 'tv' ||
        window.location.hash === '#tv'
      ) {
        setRouteMode('tv');
      } else if (
        params.get('view') === 'remote' ||
        params.get('mode') === 'remote' ||
        window.location.hash === '#remote'
      ) {
        setRouteMode('remote');
      } else {
        setRouteMode('main');
      }
    };
    window.addEventListener('popstate', updateRoute);
    window.addEventListener('hashchange', updateRoute);
    return () => {
      window.removeEventListener('popstate', updateRoute);
      window.removeEventListener('hashchange', updateRoute);
    };
  }, []);

  if (routeMode === 'tv') {
    return <TvPlayerView />;
  }

  if (routeMode === 'remote') {
    return <RemoteDpadView />;
  }

  return <MainPlayer />;
}

export default App;
