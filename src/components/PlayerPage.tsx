import React, { useState, useEffect, useRef } from 'react';
import {
  RoomState,
  generateRoomCode,
  initializePlayerRoom,
  listenToRoom,
  updatePlayerPlaybackState,
  closeRoom,
  registerActiveTv,
  unregisterActiveTv,
} from '../lib/rtdb';
import { MediaItem, PlayerSettings, PlaybackState } from '../types';
import { EmbedPlayer, EmbedPlayerRef } from './EmbedPlayer';
import { fetchMovieImdbId, resolveMediaPlaybackId } from '../lib/tmdb';
import { syncManager } from '../utils/syncChannel';
import { Tv, Play, X } from 'lucide-react';

interface PlayerPageProps {
  initialMedia?: MediaItem;
  onNavigateToRemote?: (roomCode: string) => void;
}

export const PlayerPage: React.FC<PlayerPageProps> = ({
  initialMedia = {
    id: 'tt6263850',
    title: 'Deadpool & Wolverine (Sample Stream)',
    type: 'movie',
  },
}) => {
  // 1. ALWAYS generate a brand new 4-digit room code on every page load/reload
  const [roomCode] = useState<string>(() => {
    const fresh = generateRoomCode();
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('room')) {
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url.toString());
      }
    }
    return fresh;
  });

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentMedia, setCurrentMedia] = useState<MediaItem>(initialMedia);
  const [touchShieldActive, setTouchShieldActive] = useState<boolean>(false);
  const [manuallyDismissedPairing, setManuallyDismissedPairing] = useState<boolean>(false);

  const playerRef = useRef<EmbedPlayerRef | null>(null);
  const lastActionTimestampRef = useRef<number>(0);

  const [playerSettings] = useState<PlayerSettings>({
    skin: 'onyx',
    welcomePage: 'off',
    autoplay: 'on',
    subtitles: [],
  });

  // Ensure 100% volume and autoplay on initial load with staggered triggers
  useEffect(() => {
    const triggerAutoPlayAnd100Volume = () => {
      if (playerRef.current) {
        playerRef.current.setVolume(100);
        playerRef.current.sendCommand('unmute');
        playerRef.current.play();
      }
    };

    const timers = [
      setTimeout(triggerAutoPlayAnd100Volume, 100),
      setTimeout(triggerAutoPlayAnd100Volume, 400),
      setTimeout(triggerAutoPlayAnd100Volume, 900),
      setTimeout(triggerAutoPlayAnd100Volume, 1600),
      setTimeout(triggerAutoPlayAnd100Volume, 2600),
      setTimeout(triggerAutoPlayAnd100Volume, 4000),
    ];

    // Browser audio gesture unlock: tapping or clicking anywhere triggers immediate unmuted 100% volume
    const handleGesture = () => {
      triggerAutoPlayAnd100Volume();
    };
    window.addEventListener('click', handleGesture, { once: true });
    window.addEventListener('touchstart', handleGesture, { once: true });
    window.addEventListener('keydown', handleGesture, { once: true });

    return () => {
      timers.forEach((t) => clearTimeout(t));
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, [currentMedia]);

  // 2. Initialize Firebase RTDB node at rooms/{roomCode} and announce new TV room to remote
  useEffect(() => {
    // Announce new TV room code to remote in real-time
    registerActiveTv(roomCode);

    initializePlayerRoom(roomCode, {
      title: currentMedia.title,
      id: currentMedia.id,
      type: currentMedia.type,
      season: currentMedia.season,
      episode: currentMedia.episode,
    });

    // Handle loadMedia helper
    const handleLoadMedia = async (data: RoomState) => {
      let playId = String(data.mediaId || '');
      if (data.mediaType === 'movie' && !playId.startsWith('tt')) {
        const imdb = await fetchMovieImdbId(data.mediaId || '');
        if (imdb) playId = imdb;
      }
      setCurrentMedia({
        id: playId,
        title: data.mediaTitle || 'Media Stream',
        type: data.mediaType || 'movie',
        season: data.season || 1,
        episode: data.episode || 1,
      });
      setTimeout(() => {
        playerRef.current?.play();
      }, 600);
    };

    // 3. Listen to rooms/{roomCode} in real-time
    const unsubscribe = listenToRoom(roomCode, (data) => {
      if (!data) return;
      setRoomState(data);

      // When remote claims the TV or sends a play action, trigger play with 100% volume
      if (data.isClaimed || data.status === 'connected') {
        playerRef.current?.setVolume(100);
        playerRef.current?.play();
      }

      // Check if there is a new action to execute
      if (
        data.action &&
        data.action !== 'none' &&
        data.actionTimestamp &&
        data.actionTimestamp > lastActionTimestampRef.current
      ) {
        lastActionTimestampRef.current = data.actionTimestamp;

        if (data.action === 'play') {
          playerRef.current?.play();
        } else if (data.action === 'pause') {
          playerRef.current?.pause();
        } else if (data.action === 'seek' && typeof data.currentTime === 'number') {
          playerRef.current?.seekTo(data.currentTime);
          playerRef.current?.play();
        } else if (data.action === 'volume' && typeof data.volume === 'number') {
          playerRef.current?.setVolume(data.volume * 100);
        } else if (data.action === 'loadMedia' && data.mediaId) {
          handleLoadMedia(data);
        }
      }
    });

    // 4. Local BroadcastChannel / storage fallback listener
    const unsubscribeSync = syncManager.subscribe(async (msg) => {
      if (msg.source === 'embedmaster_remote') {
        if (msg.type === 'play') {
          playerRef.current?.play();
        } else if (msg.type === 'pause') {
          playerRef.current?.pause();
        } else if (msg.type === 'seek' && typeof msg.value === 'number') {
          playerRef.current?.seekTo(msg.value);
          playerRef.current?.play();
        } else if (msg.type === 'volume' && typeof msg.value === 'number') {
          playerRef.current?.setVolume(msg.value);
        } else if (msg.type === 'loadMedia' && msg.media) {
          const resolvedId = await resolveMediaPlaybackId(msg.media.id, msg.media.type);
          setCurrentMedia({
            ...msg.media,
            id: resolvedId,
          });
          setTimeout(() => {
            playerRef.current?.play();
          }, 600);
        }
      }
    });

    // On window reload or close, unregister this TV room
    const handleBeforeUnload = () => {
      unregisterActiveTv(roomCode);
      closeRoom(roomCode);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unregisterActiveTv(roomCode);
      closeRoom(roomCode);
      unsubscribe();
      unsubscribeSync();
    };
  }, [roomCode]);

  // Sync playback time to room node periodically for remote feedback
  const handleStateChange = (state: PlaybackState) => {
    updatePlayerPlaybackState(roomCode, {
      isPlaying: state.isPlaying,
      currentTime: state.currentTime,
      duration: state.duration,
      volume: state.volume / 100,
    });
  };

  return (
    <div className="relative w-full h-screen bg-black text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Pure Cinema Video Player Viewport */}
      <main className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
        <div className="w-full h-full relative">
          <EmbedPlayer
            ref={playerRef}
            media={currentMedia}
            settings={playerSettings}
            touchShieldActive={touchShieldActive}
            onToggleTouchShield={() => setTouchShieldActive((v) => !v)}
            onStateChange={handleStateChange}
          />
        </div>

        {/* Subtle Non-Blocking TV Pairing Badge: Video plays underneath in 100% cinema mode with full volume */}
        {!roomState?.isClaimed && !manuallyDismissedPairing && (
          <div className="absolute top-5 right-5 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/80 border border-cyan-500/40 backdrop-blur-md shadow-2xl shadow-cyan-500/20 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-zinc-400 font-medium">TV Code:</span>
              <span className="font-mono text-base font-black text-cyan-400 tracking-wider">
                {roomCode}
              </span>
            </div>
            <button
              onClick={() => setManuallyDismissedPairing(true)}
              className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              title="Hide Pairing Badge"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
