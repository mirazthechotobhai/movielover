import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { MediaItem, PlayerSettings, PlaybackState, PlayerEventLog } from '../types';
import { buildEmbedUrl } from '../utils/embedUrl';
import { syncManager } from '../utils/syncChannel';
import { Shield, ShieldAlert, Maximize2, ExternalLink, Tv, Radio } from 'lucide-react';

export interface EmbedPlayerRef {
  sendCommand: (command: string, value?: any) => void;
  seekTo: (seconds: number) => void;
  seek: (seconds: number) => void;
  setVolume: (percent: number) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleMute: () => void;
  requestFullscreen: () => void;
  currentPlaybackState: PlaybackState;
}

interface EmbedPlayerProps {
  media: MediaItem;
  settings: PlayerSettings;
  touchShieldActive: boolean;
  onToggleTouchShield: () => void;
  onEventLog?: (log: PlayerEventLog) => void;
  onStateChange?: (state: PlaybackState) => void;
  isPurePlayerMode?: boolean;
  onExitPurePlayer?: () => void;
  className?: string;
}

export const EmbedPlayer = forwardRef<EmbedPlayerRef, EmbedPlayerProps>(
  (
    {
      media,
      settings,
      touchShieldActive,
      onToggleTouchShield,
      onEventLog,
      onStateChange,
      isPurePlayerMode = false,
      onExitPurePlayer,
      className,
    },
    ref
  ) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [shieldToast, setShieldToast] = useState<string | null>(null);
    const toastTimeoutRef = useRef<any>(null);

    const [playbackState, setPlaybackState] = useState<PlaybackState>({
      isPlaying: settings.autoplay === 'on',
      currentTime: 0,
      duration: 0,
      volume: 100,
      isMuted: false,
      isFullscreen: false,
      lastUpdated: Date.now(),
    });

    // Reset playback stats when media changes so new video stream starts fresh
    useEffect(() => {
      setPlaybackState({
        isPlaying: settings.autoplay === 'on',
        currentTime: 0,
        duration: 0,
        volume: 100,
        isMuted: false,
        isFullscreen: false,
        lastUpdated: Date.now(),
      });
    }, [media.id, media.type, media.season, media.episode, settings.autoplay]);

    const playbackStateRef = useRef<PlaybackState>(playbackState);
    useEffect(() => {
      playbackStateRef.current = playbackState;
    }, [playbackState]);

    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => {
      onStateChangeRef.current = onStateChange;
    }, [onStateChange]);

    const mediaRef = useRef(media);
    useEffect(() => {
      mediaRef.current = media;
    }, [media]);

    // Pure local state updater - avoids updating parent component inside a setState callback or render
    const updatePlayback = (updater: Partial<PlaybackState>) => {
      setPlaybackState((prev) => ({
        ...prev,
        ...updater,
        lastUpdated: Date.now(),
      }));
    };

    // Safely notify parent component and syncManager in an effect outside the render phase
    useEffect(() => {
      if (onStateChangeRef.current) {
        onStateChangeRef.current(playbackState);
      }
      syncManager.send({
        source: 'embedmaster_player_client',
        type: 'syncState',
        state: playbackState,
        media: mediaRef.current,
      });
    }, [playbackState]);

    // Active unmount cleanup: kill audio and blank iframe to prevent duplicate/orphan streams
    useEffect(() => {
      const currentIframe = iframeRef.current;
      return () => {
        try {
          if (currentIframe && currentIframe.contentWindow) {
            const killPayloads = [
              { api: 'pause' },
              { api: 'stop' },
              { api: 'volume', value: 0 },
              { api: 'mute' },
              JSON.stringify({ api: 'pause' }),
              JSON.stringify({ api: 'stop' }),
              { context: 'player.js', version: '0.0.11', method: 'pause' },
              { context: 'player.js', version: '0.0.11', method: 'stop' },
            ];
            killPayloads.forEach((payload) => {
              try {
                currentIframe.contentWindow?.postMessage(payload, '*');
              } catch {
                // ignore
              }
            });
          }
          if (currentIframe) {
            currentIframe.src = 'about:blank';
          }
        } catch {
          // ignore
        }
      };
    }, []);

    // Send command to EmbedMaster iframe via postMessage supporting PlayerJS, Player.js and custom protocols
    const sendCommand = (command: string, value?: any) => {
      if (!iframeRef.current || !iframeRef.current.contentWindow) {
        console.warn('EmbedMaster iframe not ready for command:', command);
        return;
      }

      const win = iframeRef.current.contentWindow;

      const postToIframe = (msg: any) => {
        try {
          win.postMessage(msg, '*');
          if (typeof msg === 'object') {
            win.postMessage(JSON.stringify(msg), '*');
          }
        } catch (e) {
          console.warn('postMessage error:', e);
        }
      };

      if (command === 'play') {
        postToIframe({ api: 'play' });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'play' });
        postToIframe({ event: 'command', func: 'playVideo' });
        postToIframe({ event: 'play' });
        postToIframe({ source: 'embedmaster_player_command', command: 'play' });
        updatePlayback({ isPlaying: true });
      } else if (command === 'pause') {
        postToIframe({ api: 'pause' });
        postToIframe({ api: 'stop' });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'pause' });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'stop' });
        postToIframe({ event: 'command', func: 'pauseVideo' });
        postToIframe({ event: 'pause' });
        postToIframe({ source: 'embedmaster_player_command', command: 'pause' });
        updatePlayback({ isPlaying: false });
      } else if (command === 'stop') {
        postToIframe({ api: 'stop' });
        postToIframe({ api: 'pause' });
        postToIframe({ api: 'seek', value: 0 });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'pause' });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'setCurrentTime', value: 0 });
        postToIframe({ event: 'command', func: 'stopVideo' });
        postToIframe({ source: 'embedmaster_player_command', command: 'stop' });
        updatePlayback({ isPlaying: false, currentTime: 0 });
      } else if (command === 'seek' && typeof value === 'number') {
        postToIframe({ api: 'seek', value: value });
        postToIframe({ api: 'seekTo', value: value });
        postToIframe({ api: 'setCurrentTime', value: value });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'setCurrentTime', value: value });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'seek', value: value });
        postToIframe({ event: 'command', func: 'seekTo', args: [value, true] });
        postToIframe({ source: 'embedmaster_player_command', command: 'seek', value: value });
        try {
          win.postMessage(`seek:${value}`, '*');
          win.postMessage(JSON.stringify({ event: 'seek', val: value }), '*');
        } catch {}
        updatePlayback({ currentTime: value });
        // Automatically ensure stream starts playing at the target position
        postToIframe({ api: 'play' });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'play' });
        postToIframe({ event: 'command', func: 'playVideo' });
        postToIframe({ source: 'embedmaster_player_command', command: 'play' });
        updatePlayback({ isPlaying: true });
      } else if (command === 'volume' && typeof value === 'number') {
        const decimalVol = Math.max(0, Math.min(1, value / 100));
        postToIframe({ api: 'volume', value: decimalVol });
        postToIframe({ api: 'volume', value: value });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'setVolume', value: value });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'setVolume', value: decimalVol });
        postToIframe({ source: 'embedmaster_player_command', command: 'volume', value: value });
        updatePlayback({ volume: value, isMuted: value === 0 });
      } else if (command === 'mute') {
        postToIframe({ api: 'mute' });
        postToIframe({ api: 'volume', value: 0 });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'mute' });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'setVolume', value: 0 });
        postToIframe({ source: 'embedmaster_player_command', command: 'mute' });
        updatePlayback({ isMuted: true });
      } else if (command === 'unmute') {
        postToIframe({ api: 'unmute' });
        postToIframe({ api: 'volume', value: 1 });
        postToIframe({ api: 'volume', value: 100 });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'unmute' });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'setVolume', value: 100 });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'setVolume', value: 1 });
        postToIframe({ source: 'embedmaster_player_command', command: 'unmute' });
        postToIframe({ source: 'embedmaster_player_command', command: 'volume', value: 100 });
        try {
          win.postMessage('unmute', '*');
          win.postMessage('volume:100', '*');
        } catch {}
        updatePlayback({ isMuted: false, volume: 100 });
      } else if (command === 'fullscreen') {
        postToIframe({ api: 'fullscreen' });
        postToIframe({ context: 'player.js', version: '0.0.11', method: 'fullscreen' });
        postToIframe({ source: 'embedmaster_player_command', command: 'fullscreen' });
      } else {
        postToIframe({ api: command, value });
        postToIframe({ source: 'embedmaster_player_command', command, value });
      }

      if (onEventLog) {
        onEventLog({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          event: `sent_command: ${command}`,
          info: value !== undefined ? { value } : undefined,
        });
      }
    };

    const seekTo = (seconds: number) => {
      sendCommand('seek', Math.max(0, seconds));
    };

    const setVolume = (percent: number) => {
      const clamped = Math.max(0, Math.min(100, percent));
      sendCommand('volume', clamped);
    };

    const play = () => {
      sendCommand('play');
    };

    const pause = () => {
      sendCommand('pause');
    };

    const stop = () => {
      sendCommand('stop');
    };

    const togglePlay = () => {
      if (playbackStateRef.current.isPlaying) {
        pause();
      } else {
        play();
      }
    };

    const toggleMute = () => {
      if (playbackStateRef.current.isMuted) {
        sendCommand('unmute');
      } else {
        sendCommand('mute');
      }
    };

    const requestFullscreen = () => {
      sendCommand('fullscreen');
      if (containerRef.current) {
        if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(() => {
            // Ignore if blocked by browser policy
          });
          updatePlayback({ isFullscreen: true });
        } else {
          document.exitFullscreen().catch(() => {});
          updatePlayback({ isFullscreen: false });
        }
      }
    };

    // Expose control functions via ref
    useImperativeHandle(ref, () => ({
      sendCommand,
      seekTo,
      seek: seekTo,
      setVolume,
      togglePlay,
      play,
      pause,
      stop,
      toggleMute,
      requestFullscreen,
      get currentPlaybackState() {
        return playbackStateRef.current;
      },
    }));

    // Listen to messages from EmbedMaster iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        let data = event.data;
        if (!data) return;

        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            // Not a JSON string
          }
        }

        if (typeof data !== 'object') return;

        // Support PlayerJS, Player.js, and EmbedMaster events
        const eventName =
          data.event ||
          data.api ||
          (data.context === 'player.js' ? data.event : undefined) ||
          (data.source === 'embedmaster_player' ? data.event : undefined);

        if (!eventName) return;

        const info = data.info !== undefined ? data.info : (data.value !== undefined ? data.value : data.data);

        if (onEventLog) {
          onEventLog({
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            event: String(eventName),
            info: info,
          });
        }

        // Handle specific player events
        if (eventName === 'play' || eventName === 'playing') {
          updatePlayback({ isPlaying: true, lastEvent: 'play' });
        } else if (eventName === 'pause' || eventName === 'stop' || eventName === 'ended') {
          updatePlayback({ isPlaying: false, lastEvent: String(eventName) });
        } else if (eventName === 'time' || eventName === 'timeupdate') {
          if (info && typeof info === 'object') {
            const cur = typeof info.time === 'number' ? info.time : (typeof info.seconds === 'number' ? info.seconds : playbackStateRef.current.currentTime);
            const dur = typeof info.duration === 'number' ? info.duration : playbackStateRef.current.duration;
            updatePlayback({ currentTime: cur, duration: dur, lastEvent: 'time' });
          } else if (typeof info === 'number') {
            updatePlayback({ currentTime: info, lastEvent: 'time' });
          }
        } else if (eventName === 'volume') {
          if (typeof info === 'number') {
            const vol = info <= 1 && info > 0 ? Math.round(info * 100) : info;
            updatePlayback({ volume: vol, isMuted: vol === 0, lastEvent: 'volume' });
          }
        } else if (eventName === 'mute') {
          updatePlayback({ isMuted: true, lastEvent: 'mute' });
        } else if (eventName === 'unmute') {
          updatePlayback({ isMuted: false, lastEvent: 'unmute' });
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, [onEventLog]);

    // Listen to cross-window remote messages
    useEffect(() => {
      const unsubscribe = syncManager.subscribe((msg) => {
        if (msg.source === 'embedmaster_remote') {
          if (msg.type === 'play') {
            play();
          } else if (msg.type === 'pause') {
            pause();
          } else if (msg.type === 'stop') {
            stop();
          } else if (msg.type === 'togglePlay') {
            togglePlay();
          } else if (msg.type === 'seek' && typeof msg.value === 'number') {
            seekTo(msg.value);
          } else if (msg.type === 'seekRelative' && typeof msg.value === 'number') {
            seekTo(playbackStateRef.current.currentTime + msg.value);
          } else if (msg.type === 'volume' && typeof msg.value === 'number') {
            setVolume(msg.value);
          } else if (msg.type === 'mute') {
            sendCommand('mute');
          } else if (msg.type === 'unmute') {
            sendCommand('unmute');
          } else if (msg.type === 'toggleMute') {
            toggleMute();
          } else if (msg.type === 'fullscreen') {
            requestFullscreen();
          } else if (msg.type === 'requestState') {
            syncManager.send({
              source: 'embedmaster_player_client',
              type: 'syncState',
              state: playbackStateRef.current,
              media,
              settings,
            });
          }
        }
      });

      return () => unsubscribe();
    }, [media, settings]);

    // Autoplay & 100% Volume on initial mount / media load
    useEffect(() => {
      const sendAutoplayAndFullVolume = () => {
        setVolume(100);
        sendCommand('unmute');
        play();
      };

      // Send immediately and after staggered intervals so the embed catches it when ready
      const timers = [
        setTimeout(sendAutoplayAndFullVolume, 100),
        setTimeout(sendAutoplayAndFullVolume, 400),
        setTimeout(sendAutoplayAndFullVolume, 800),
        setTimeout(sendAutoplayAndFullVolume, 1500),
        setTimeout(sendAutoplayAndFullVolume, 2500),
        setTimeout(sendAutoplayAndFullVolume, 4000),
      ];

      // Window interaction handler to guarantee unmuted 100% volume if browser held audio back
      const handleUserGesture = () => {
        sendAutoplayAndFullVolume();
      };
      window.addEventListener('click', handleUserGesture, { once: true });
      window.addEventListener('touchstart', handleUserGesture, { once: true });
      window.addEventListener('keydown', handleUserGesture, { once: true });

      return () => {
        timers.forEach((t) => clearTimeout(t));
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('touchstart', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
      };
    }, [media.id, media.type, media.season, media.episode]);

    // Fullscreen change listener
    useEffect(() => {
      const handleFsChange = () => {
        updatePlayback({ isFullscreen: !!document.fullscreenElement });
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const embedUrl = buildEmbedUrl(media, settings);

    return (
      <div
        ref={containerRef}
        id="embedmaster_container"
        className={
          className ||
          `player-viewport relative w-full h-full bg-[#000000] overflow-hidden flex flex-col items-center justify-center ${
            isPurePlayerMode
              ? 'fixed inset-0 z-50 h-screen w-screen'
              : 'w-full h-full'
          }`
        }
      >
        {/* The EmbedMaster iframe adhering to official rules:
            - allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *"
            - NO sandbox attribute!
            - allowfullscreen
        */}
        <iframe
          key={`${media.type}_${media.id}_s${media.season || 1}_e${media.episode || 1}_${embedUrl}`}
          id="embedmaster_iframe"
          ref={iframeRef}
          src={embedUrl}
          title={`EmbedMaster Player - ${media.title}`}
          className="w-full h-full border-0 absolute inset-0 z-10"
          allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *"
          allowFullScreen
          onLoad={() => {
            setVolume(100);
            sendCommand('unmute');
            play();
            setTimeout(() => {
              setVolume(100);
              sendCommand('unmute');
              play();
            }, 300);
            setTimeout(() => {
              setVolume(100);
              sendCommand('unmute');
              play();
            }, 900);
            setTimeout(() => {
              setVolume(100);
              sendCommand('unmute');
              play();
            }, 2000);
          }}
        />

        {/* Detached Touch Shield Overlay (if armed) */}
        {touchShieldActive && (
          <div
            id="player_touch_shield"
            className="absolute inset-0 z-20 cursor-crosshair bg-transparent"
          />
        )}
      </div>
    );
  }
);

EmbedPlayer.displayName = 'EmbedPlayer';
