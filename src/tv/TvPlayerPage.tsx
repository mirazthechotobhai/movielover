import { FC, useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Tv, RefreshCw, Volume2, Sparkles } from 'lucide-react';
import { TvSessionService } from '../firebase/tvSessionService';
import { CustomVideoPlayer } from '../player/CustomVideoPlayer';
import { TvPairingCard } from './TvPairingCard';
import {
  MediaPlayPayload,
  RemoteCommand,
  PlaybackState,
  TMDBMediaItem,
} from '../types';
import { tmdbService, getBackdropUrl, getPosterUrl, getStreamUrlForMedia } from '../api/tmdbService';
import { useTvNavigation } from '../hooks/useTvNavigation';

interface TvPlayerPageProps {
  onExitTvMode: () => void;
  initialMedia?: MediaPlayPayload | null;
}

export const TvPlayerPage: FC<TvPlayerPageProps> = ({ onExitTvMode, initialMedia }) => {
  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromParam = params.get('roomCode') || params.get('room') || '';
      if (/^\d{4}$/.test(fromParam)) return fromParam;
    } catch {
      // ignore
    }
    // Always generate a fresh new 4-digit code if none was provided
    return TvSessionService.generateRoomCode();
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [remoteId, setRemoteId] = useState<string | null>(null);
  const [currentMedia, setCurrentMedia] = useState<MediaPlayPayload | null>(() => {
    if (initialMedia) return initialMedia;
    try {
      const stored = localStorage.getItem('onlinetv_tv_pending_media');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.removeItem('onlinetv_tv_pending_media');
        return parsed;
      }
    } catch (e) {
      console.warn('Error reading pending media from storage:', e);
    }
    return null;
  });
  const [lastCommand, setLastCommand] = useState<RemoteCommand | null>(null);
  const [trendingMedia, setTrendingMedia] = useState<TMDBMediaItem[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const roomCodeRef = useRef<string>('');
  roomCodeRef.current = roomCode;

  // Clean roomCode query parameter from browser address bar on mount so subsequent reloads generate a fresh code
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('roomCode') || url.searchParams.has('room')) {
        url.searchParams.delete('roomCode');
        url.searchParams.delete('room');
        window.history.replaceState({}, document.title, url.toString());
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-parse media from URL params if opened in a new tab without localStorage
  useEffect(() => {
    if (currentMedia) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const mediaId = params.get('mediaId') || params.get('playMediaId');
      if (mediaId) {
        const idNum = Number(mediaId);
        const title = params.get('title') || 'Featured Stream';
        const mediaType = (params.get('mediaType') || 'movie') as 'movie' | 'tv' | 'anime';
        const seasonNum = params.get('season') ? Number(params.get('season')) : undefined;
        const episodeNum = params.get('episode') ? Number(params.get('episode')) : undefined;
        const videoUrl =
          params.get('videoUrl') ||
          getStreamUrlForMedia(idNum, mediaType, seasonNum || 1, episodeNum || 1);
        
        setCurrentMedia({
          mediaId: idNum,
          mediaType,
          seasonNumber: seasonNum,
          episodeNumber: episodeNum,
          title,
          overview: '',
          posterUrl: '',
          backdropUrl: '',
          videoUrl,
        });

        // Enrich details asynchronously
        const fetcher = mediaType === 'tv' ? tmdbService.getTVDetails(idNum) : tmdbService.getMovieDetails(idNum);
        fetcher.then((data: any) => {
          if (data) {
            setCurrentMedia((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                title: data.title || data.name || prev.title,
                overview: data.overview || '',
                posterUrl: getPosterUrl(data.poster_path),
                backdropUrl: getBackdropUrl(data.backdrop_path),
                releaseYear: (data.release_date || data.first_air_date || '').slice(0, 4),
                rating: data.vote_average,
              };
            });
          }
        }).catch((err) => console.warn('Could not enrich TV media details:', err));
      }
    } catch (err) {
      console.warn('Error parsing media from URL params:', err);
    }
  }, [currentMedia]);

  // Show transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Android TV navigation
  useTvNavigation({
    enabled: true,
    onBack: () => {
      if (currentMedia) {
        setCurrentMedia(null);
      } else {
        onExitTvMode();
      }
    },
  });

  // Handle incoming remote commands
  const handleCommandReceived = useCallback((cmd: RemoteCommand) => {
    console.log('TV received remote command:', cmd);
    setLastCommand(cmd);

    if (cmd.type === 'PLAY_MEDIA' && cmd.payload) {
      const payload = cmd.payload as MediaPlayPayload;
      setCurrentMedia(payload);
      TvSessionService.updateCurrentMedia(roomCodeRef.current, payload);
      showToast(`Now Playing: ${payload.title}`);
    } else if (cmd.type === 'PLAY_EPISODE' && cmd.payload) {
      const payload = cmd.payload as MediaPlayPayload;
      setCurrentMedia(payload);
      TvSessionService.updateCurrentMedia(roomCodeRef.current, payload);
      showToast(`Now Playing: S${payload.seasonNumber} E${payload.episodeNumber} - ${payload.episodeTitle || payload.title}`);
    } else if (cmd.type === 'STOP') {
      setCurrentMedia(null);
      TvSessionService.updateCurrentMedia(roomCodeRef.current, null);
      showToast('Playback stopped by remote');
    }
  }, []);

  // Initialize TV session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const preferredCode = roomCodeRef.current || undefined;
        const { roomCode: code } = await TvSessionService.createTvSession(
          (connectedRemoteId) => {
            if (!isMounted) return;
            setIsConnected(true);
            setRemoteId(connectedRemoteId);
            showToast('Remote connected successfully!');
          },
          () => {
            if (!isMounted) return;
            setIsConnected(false);
            setRemoteId(null);
            showToast('Remote disconnected.');
          },
          (cmd) => {
            if (!isMounted) return;
            handleCommandReceived(cmd);
          },
          preferredCode
        );

        if (isMounted) {
          setRoomCode(code);
          roomCodeRef.current = code;

          // Store and broadcast room code to main site header
          try {
            localStorage.setItem('onlinetv_tv_room_code', code);
            localStorage.setItem('onlinetv_tv_room_time', String(Date.now()));
          } catch (e) {
            console.warn('Could not store TV room code:', e);
          }

          try {
            if (typeof BroadcastChannel !== 'undefined') {
              const bc = new BroadcastChannel('onlinetv_tv_sync');
              bc.postMessage({ type: 'TV_ROOM_READY', roomCode: code });
              bc.close();
            }
          } catch (e) {
            console.warn('BroadcastChannel error:', e);
          }

          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'TV_ROOM_READY', roomCode: code }, '*');
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        console.error('Failed to initialize TV session:', err);
      }
    }

    initSession();

    // Listen for queries from other tabs for the active TV room
    let syncChannel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        syncChannel = new BroadcastChannel('onlinetv_tv_sync');
        syncChannel.onmessage = (event) => {
          if (event.data?.type === 'QUERY_TV_ROOM' && roomCodeRef.current) {
            syncChannel?.postMessage({ type: 'TV_ROOM_READY', roomCode: roomCodeRef.current });
          }
        };
      }
    } catch (e) {
      console.warn('Sync channel setup error:', e);
    }

    // Fetch trending media for TV home screen fallback
    tmdbService
      .getTrendingMovies('day', 1)
      .then((res) => {
        if (isMounted) {
          setTrendingMedia(res.results.slice(0, 8));
          setIsLoadingTrending(false);
        }
      })
      .catch(() => setIsLoadingTrending(false));

    // Handle beforeunload and pagehide
    const handleUnload = () => {
      if (roomCodeRef.current) {
        TvSessionService.destroyTvSession(roomCodeRef.current);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      isMounted = false;
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      try {
        syncChannel?.close();
        if (localStorage.getItem('onlinetv_tv_room_code') === roomCodeRef.current) {
          localStorage.removeItem('onlinetv_tv_room_code');
        }
      } catch (e) {
        // ignore
      }
      if (roomCodeRef.current) {
        TvSessionService.destroyTvSession(roomCodeRef.current);
      }
    };
  }, [handleCommandReceived]);

  // Sync playback state to Firebase
  const handlePlaybackStateChange = useCallback((state: Partial<PlaybackState>) => {
    if (roomCodeRef.current) {
      TvSessionService.updatePlaybackState(roomCodeRef.current, state);
    }
  }, []);

  // Quick Play selected media directly on TV
  const handleQuickPlay = (item: TMDBMediaItem) => {
    const isTv = item.media_type === 'tv' || !!item.first_air_date;
    const payload: MediaPlayPayload = {
      mediaId: item.id,
      mediaType: isTv ? 'tv' : 'movie',
      seasonNumber: isTv ? 1 : undefined,
      episodeNumber: isTv ? 1 : undefined,
      title: item.title || item.name || 'Untitled',
      overview: item.overview || '',
      posterUrl: getPosterUrl(item.poster_path),
      backdropUrl: getBackdropUrl(item.backdrop_path),
      videoUrl: getStreamUrlForMedia(item.id, isTv ? 'tv' : 'movie', 1, 1),
      releaseYear: (item.release_date || item.first_air_date || '').slice(0, 4),
      rating: item.vote_average,
    };
    setCurrentMedia(payload);
    if (roomCodeRef.current) {
      TvSessionService.updateCurrentMedia(roomCodeRef.current, payload);
    }
    showToast(`Streaming on EmbedMaster: ${payload.title}`);
  };

  return (
    <div
      id="tv-player-page-root"
      className="relative w-screen min-h-screen bg-neutral-950 text-white flex flex-col justify-between overflow-x-hidden select-none"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900/95 border border-cyan-500/50 text-white text-sm font-semibold shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top TV Bar */}
      <header className="relative z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <button
            id="tv-btn-exit"
            onClick={onExitTvMode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-sm font-semibold text-neutral-300 transition focus:ring-2 focus:ring-cyan-400"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit TV Mode</span>
          </button>

          <div className="flex items-center gap-2 ml-2">
            <Tv className="w-6 h-6 text-cyan-400" />
            <h1 className="text-lg font-black tracking-tight text-white hidden sm:inline-block">
              OnlineTV <span className="text-cyan-400">SMART TV</span>
            </h1>
          </div>
        </div>

        {/* Pairing Status in Top Bar */}
        <div className="flex items-center gap-3">
          <TvPairingCard
            roomCode={roomCode}
            isConnected={isConnected}
            remoteId={remoteId}
            isCompact={true}
          />

          {currentMedia && (
            <button
              onClick={() => {
                setCurrentMedia(null);
                if (roomCodeRef.current) {
                  TvSessionService.updateCurrentMedia(roomCodeRef.current, null);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 border border-neutral-700 transition"
            >
              Stop Playback
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 w-full max-w-7xl mx-auto">
        {currentMedia ? (
          /* Active Fullscreen Video Player */
          <div className="w-full flex-1 flex flex-col justify-center items-center">
            <div className="w-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden border border-neutral-800">
              <CustomVideoPlayer
                videoUrl={currentMedia.videoUrl}
                mediaId={currentMedia.mediaId}
                mediaType={currentMedia.mediaType}
                seasonNumber={currentMedia.seasonNumber}
                episodeNumber={currentMedia.episodeNumber}
                title={
                  currentMedia.seasonNumber && currentMedia.episodeNumber
                    ? `${currentMedia.title} - S${currentMedia.seasonNumber}E${currentMedia.episodeNumber}: ${currentMedia.episodeTitle || ''}`
                    : currentMedia.title
                }
                posterUrl={currentMedia.backdropUrl || currentMedia.posterUrl}
                autoPlay={true}
                isTvMode={true}
                onPlaybackStateChange={handlePlaybackStateChange}
                onEnded={() => {
                  showToast('Stream finished');
                }}
                externalCommand={
                  lastCommand
                    ? {
                        type: lastCommand.type,
                        payload: lastCommand.payload,
                        id: lastCommand.commandId,
                      }
                    : null
                }
              />
            </div>
          </div>
        ) : (
          /* Waiting for Media / TV Pairing Screen */
          <div className="w-full flex flex-col items-center justify-center my-auto space-y-8">
            <TvPairingCard
              roomCode={roomCode}
              isConnected={isConnected}
              remoteId={remoteId}
            />

            {/* Quick Play Row for TV Remote Navigation */}
            <div className="w-full mt-4">
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                  Or select directly using TV Remote:
                </div>
                <div className="text-xs text-cyan-400 flex items-center gap-1 font-medium">
                  <Volume2 className="w-3 h-3" /> Ready to Cast
                </div>
              </div>

              {isLoadingTrending ? (
                <div className="flex gap-4 overflow-x-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-40 sm:w-48 aspect-2/3 rounded-xl bg-neutral-900 animate-pulse border border-neutral-800 flex-shrink-0"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
                  {trendingMedia.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleQuickPlay(item)}
                      data-nav="true"
                      data-nav-id={`tv-quick-${item.id}`}
                      className="group flex flex-col rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-cyan-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/40 focus:scale-105 hover:scale-102 transition-all text-left outline-none cursor-pointer"
                    >
                      <div className="aspect-2/3 w-full bg-neutral-800 relative overflow-hidden">
                        <img
                          src={getPosterUrl(item.poster_path, 'w342')}
                          alt={item.title || item.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-xs font-bold text-cyan-400">▶ Play on TV</span>
                        </div>
                      </div>
                      <div className="p-2">
                        <h4 className="text-xs font-bold text-white truncate">{item.title || item.name}</h4>
                        <span className="text-[10px] text-neutral-400">★ {item.vote_average.toFixed(1)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Info */}
      <footer className="p-4 text-center text-xs text-neutral-400 border-t border-neutral-900 bg-neutral-950/80">
        Use TV Remote D-Pad / Arrow keys & Enter to navigate • Press Back / Escape to exit
      </footer>
    </div>
  );
};
