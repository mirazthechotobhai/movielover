import { useState, useEffect, useCallback, useRef, MouseEvent } from 'react';
import {
  ActiveCategory,
  FilterSortOption,
  TMDBMediaItem,
  MediaPlayPayload,
  TvSessionData,
} from './types';
import {
  tmdbService,
  getPosterUrl,
  getBackdropUrl,
  getStreamUrlForMedia,
} from './api/tmdbService';
import { Header } from './components/Header';
import { SubFilterTabs } from './components/SubFilterTabs';
import { MediaGrid } from './components/MediaGrid';
import { TvPlayerPage } from './tv/TvPlayerPage';
import { EpisodeSelectorModal } from './components/EpisodeSelectorModal';
import { MediaDetailModal } from './components/MediaDetailModal';
import { RemoteControlModal } from './remote/RemoteControlModal';
import { RemoteControllerBar } from './remote/RemoteControllerBar';
import { StickyPlayerController } from './components/StickyPlayerController';
import { TvSessionService } from './firebase/tvSessionService';
import { Tv, Sparkles, Film, Play, Info, ExternalLink } from 'lucide-react';

export default function App() {
  // Mode: standard web streaming app vs dedicated Smart TV player
  const [isTvMode, setIsTvMode] = useState<boolean>(() => {
    return (
      window.location.search.includes('tv=true') ||
      window.location.pathname.includes('/tv') ||
      window.location.hash === '#tv'
    );
  });

  // Active Category & Filter
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('movies');
  const [activeFilter, setActiveFilter] = useState<FilterSortOption>('popular');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  // Media Feed State
  const [items, setItems] = useState<TMDBMediaItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Video Player state (Section 5: Custom Video Player below navigation)
  const [activeMedia, setActiveMedia] = useState<MediaPlayPayload | null>(null);

  // Modals state
  const [selectedDetailMedia, setSelectedDetailMedia] = useState<TMDBMediaItem | null>(null);
  const [selectedShowForEpisodes, setSelectedShowForEpisodes] = useState<TMDBMediaItem | null>(null);
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState<boolean>(false);

  // TV Remote Session state
  const [connectedRoomCode, setConnectedRoomCode] = useState<string | null>(() => {
    return localStorage.getItem('onlinetv_paired_code');
  });
  const [tvSessionData, setTvSessionData] = useState<TvSessionData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 2 Boxes state in Header:
  // Box 1: TV Room ID (automatically populated when TV is opened)
  const [tvRoomId, setTvRoomId] = useState<string>(() => {
    return localStorage.getItem('onlinetv_tv_room_code') || '';
  });

  // Box 2: Auto-filled Room ID (editable by user or auto-filled from Box 1)
  const [inputRoomId, setInputRoomId] = useState<string>(() => {
    return (
      localStorage.getItem('onlinetv_tv_room_code') ||
      localStorage.getItem('onlinetv_paired_code') ||
      ''
    );
  });

  // Sticky player controller bar dismiss state
  const [isStickyControllerDismissed, setIsStickyControllerDismissed] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize TV Room ID across tabs via Firebase RTDB, storage events, postMessage and BroadcastChannel
  useEffect(() => {
    // 1. Firebase Realtime Database direct listener for instant cross-tab / cross-device sync
    const unsubRtdb = TvSessionService.listenToActiveTvRoom((activeCode) => {
      if (activeCode && /^\d{4}$/.test(activeCode)) {
        setTvRoomId(activeCode);
        setInputRoomId(activeCode);
        showToast(`TV Room #${activeCode} detected! Click "Active" to connect.`);
      }
    });

    // 2. Storage event for multi-tab sync on same origin
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'onlinetv_tv_room_code') {
        const code = e.newValue || '';
        if (code && /^\d{4}$/.test(code)) {
          setTvRoomId(code);
          setInputRoomId(code);
          showToast(`TV Room #${code} detected! Click "Active" to connect.`);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. window.opener postMessage listener
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TV_ROOM_READY' && event.data.roomCode) {
        const code = String(event.data.roomCode);
        if (/^\d{4}$/.test(code)) {
          setTvRoomId(code);
          setInputRoomId(code);
          showToast(`TV Room #${code} detected! Click "Active" to connect.`);
        }
      }
    };
    window.addEventListener('message', handleMessage);

    // 4. BroadcastChannel sync
    let syncChannel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        syncChannel = new BroadcastChannel('onlinetv_tv_sync');
        syncChannel.onmessage = (event) => {
          if (event.data?.type === 'TV_ROOM_READY' && event.data.roomCode) {
            const code = String(event.data.roomCode);
            if (/^\d{4}$/.test(code)) {
              setTvRoomId(code);
              setInputRoomId(code);
              showToast(`TV Room #${code} detected! Click "Active" to connect.`);
            }
          }
        };
        // Query if any TV player tab is open
        syncChannel.postMessage({ type: 'QUERY_TV_ROOM' });
      }
    } catch (e) {
      console.warn('BroadcastChannel sync error:', e);
    }

    // 5. Periodic 600ms polling check for localStorage updates (handles iframe storage edge cases)
    const pollInterval = window.setInterval(() => {
      try {
        const stored = localStorage.getItem('onlinetv_tv_room_code');
        if (stored && /^\d{4}$/.test(stored)) {
          setTvRoomId((curr) => {
            if (curr !== stored) {
              setInputRoomId(stored);
              return stored;
            }
            return curr;
          });
        }
      } catch {
        // ignore
      }
    }, 600);

    return () => {
      if (unsubRtdb) unsubRtdb();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleMessage);
      clearInterval(pollInterval);
      try {
        syncChannel?.close();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Subscribe to TV session if room code is saved
  useEffect(() => {
    if (!connectedRoomCode) {
      setTvSessionData(null);
      return;
    }

    const unsub = TvSessionService.subscribeToTvState(
      connectedRoomCode,
      (data) => {
        setTvSessionData(data);
      },
      () => {
        // Disconnected or expired
        setConnectedRoomCode(null);
        setTvSessionData(null);
        localStorage.removeItem('onlinetv_paired_code');
        showToast(`TV #${connectedRoomCode} disconnected.`);
      }
    );

    return () => {
      unsub();
    };
  }, [connectedRoomCode]);

  // Load Content from TMDB
  const fetchMedia = useCallback(
    async (page: number, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        let result: { results: TMDBMediaItem[]; total_pages: number };

        if (debouncedQuery) {
          result = await tmdbService.searchAll(debouncedQuery, page);
        } else if (activeCategory === 'movies') {
          if (activeFilter === 'trending') {
            result = await tmdbService.getTrendingMovies('week', page);
          } else if (activeFilter === 'top_rated') {
            result = await tmdbService.getTopRatedMovies(page);
          } else if (activeFilter === 'now_playing') {
            result = await tmdbService.getNowPlayingMovies(page);
          } else {
            result = await tmdbService.getPopularMovies(page);
          }
        } else if (activeCategory === 'tv') {
          if (activeFilter === 'trending') {
            result = await tmdbService.getTrendingTV('week', page);
          } else if (activeFilter === 'top_rated') {
            result = await tmdbService.getTopRatedTV(page);
          } else {
            result = await tmdbService.getPopularTV(page);
          }
        } else {
          // Anime
          result = await tmdbService.getAnime(page, activeFilter === 'now_playing' ? 'popular' : activeFilter);
        }

        setTotalPages(result.total_pages);
        setCurrentPage(page);

        setItems((prev) => {
          if (!append) {
            // Set initial active media for player if none chosen yet
            if (result.results.length > 0 && !activeMedia) {
              const first = result.results[0];
              setActiveMedia({
                mediaId: first.id,
                mediaType: first.media_type || 'movie',
                title: first.title || first.name || 'Featured',
                overview: first.overview || '',
                posterUrl: getPosterUrl(first.poster_path),
                backdropUrl: getBackdropUrl(first.backdrop_path),
                videoUrl: getStreamUrlForMedia(first.id, first.media_type || 'movie'),
                releaseYear: (first.release_date || first.first_air_date || '').slice(0, 4),
                rating: first.vote_average,
              });
            }
            return result.results;
          }

          // Deduplicate items
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = result.results.filter((i) => !existingIds.has(i.id));
          return [...prev, ...newItems];
        });
      } catch (err: any) {
        console.error('Fetch media error:', err);
        setErrorMessage('Failed to load media titles. Please check your internet connection and try again.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeCategory, activeFilter, activeMedia, debouncedQuery]
  );

  // Re-fetch when category, filter, or query changes
  useEffect(() => {
    fetchMedia(1, false);
  }, [fetchMedia]);

  // Infinite Scroll Listener (Section 13)
  useEffect(() => {
    const handleScroll = () => {
      if (isLoading || isLoadingMore || currentPage >= totalPages) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.offsetHeight - 600;

      if (scrollPosition >= threshold) {
        fetchMedia(currentPage + 1, true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage, fetchMedia, isLoading, isLoadingMore, totalPages]);

  // Handle media selection from cards
  const handleMediaClick = (item: TMDBMediaItem) => {
    const isTvShow = item.media_type === 'tv' || !!item.first_air_date;
    if (isTvShow) {
      setSelectedShowForEpisodes(item);
    } else {
      setSelectedDetailMedia(item);
    }
  };

  // Activate TV session with room code from Box 2 or Box 1
  const handleActivateTv = async (codeOverride?: any) => {
    const raw = typeof codeOverride === 'string' ? codeOverride : (inputRoomId || tvRoomId || '');
    const targetCode = String(raw || '').trim();
    if (!targetCode) {
      showToast('Please open TV first (click TV button) or enter Room ID');
      return;
    }

    if (!/^\d{4}$/.test(targetCode)) {
      showToast('Please enter a valid 4-digit TV room code');
      return;
    }

    const res = await TvSessionService.claimTvCode(targetCode);
    if (res.success) {
      setConnectedRoomCode(targetCode);
      setInputRoomId(targetCode);
      localStorage.setItem('onlinetv_paired_code', targetCode);
      showToast(`TV Player #${targetCode} is now ACTIVE! Click any movie/show to stream on TV.`);
    } else {
      showToast(res.message || `Could not connect to TV #${targetCode}`);
    }
  };

  // Play media on TV (player is on TV page, controller is sticky on main page)
  const handlePlayMedia = async (payload: MediaPlayPayload) => {
    setActiveMedia(payload);
    setIsStickyControllerDismissed(false);
    try {
      localStorage.setItem('onlinetv_tv_pending_media', JSON.stringify(payload));
    } catch (err) {
      console.warn('Could not save media for TV tab:', err);
    }

    const targetRoom = connectedRoomCode || inputRoomId || tvRoomId;

    if (targetRoom) {
      if (!connectedRoomCode) {
        await handleActivateTv(targetRoom);
      }
      TvSessionService.sendCommand(targetRoom, 'PLAY_MEDIA', payload);
      showToast(`▶ Streaming "${payload.title}" on TV #${targetRoom}!`);
    } else {
      // If TV is not open yet, create new room code and open TV in new tab
      const freshRoom = TvSessionService.generateRoomCode();
      setTvRoomId(freshRoom);
      setInputRoomId(freshRoom);
      setConnectedRoomCode(freshRoom);
      try {
        localStorage.setItem('onlinetv_tv_room_code', freshRoom);
        localStorage.setItem('onlinetv_paired_code', freshRoom);
      } catch (err) {
        console.warn('Could not save fresh room code:', err);
      }

      showToast(`Opening TV Player #${freshRoom} to stream "${payload.title}"...`);
      window.open(
        `?tv=true&roomCode=${freshRoom}&mediaId=${payload.mediaId}&title=${encodeURIComponent(
          payload.title
        )}&mediaType=${payload.mediaType || 'movie'}`,
        '_blank',
        'opener'
      );
    }
  };

  // Play episode on TV (player is on TV page, controller is sticky on main page)
  const handlePlayEpisode = async (payload: MediaPlayPayload) => {
    setActiveMedia(payload);
    setIsStickyControllerDismissed(false);
    try {
      localStorage.setItem('onlinetv_tv_pending_media', JSON.stringify(payload));
    } catch (err) {
      console.warn('Could not save media for TV tab:', err);
    }

    const targetRoom = connectedRoomCode || inputRoomId || tvRoomId;

    if (targetRoom) {
      if (!connectedRoomCode) {
        await handleActivateTv(targetRoom);
      }
      TvSessionService.sendCommand(targetRoom, 'PLAY_EPISODE', payload);
      showToast(
        `▶ Streaming S${payload.seasonNumber}E${payload.episodeNumber} on TV #${targetRoom}!`
      );
    } else {
      const freshRoom = TvSessionService.generateRoomCode();
      setTvRoomId(freshRoom);
      setInputRoomId(freshRoom);
      setConnectedRoomCode(freshRoom);
      try {
        localStorage.setItem('onlinetv_tv_room_code', freshRoom);
        localStorage.setItem('onlinetv_paired_code', freshRoom);
      } catch (err) {
        console.warn('Could not save fresh room code:', err);
      }

      showToast(
        `Opening TV Player #${freshRoom} to stream S${payload.seasonNumber}E${payload.episodeNumber}...`
      );
      window.open(
        `?tv=true&roomCode=${freshRoom}&mediaId=${payload.mediaId}&title=${encodeURIComponent(
          payload.title
        )}&season=${payload.seasonNumber || 1}&episode=${payload.episodeNumber || 1}&mediaType=tv`,
        '_blank',
        'opener'
      );
    }
  };

  // Quick Cast to TV
  const handleQuickCast = (item: TMDBMediaItem) => {
    setIsStickyControllerDismissed(false);
    const isTvShow = item.media_type === 'tv' || !!item.first_air_date;
    if (isTvShow) {
      setSelectedShowForEpisodes(item);
      return;
    }

    const payload: MediaPlayPayload = {
      mediaId: item.id,
      mediaType: 'movie',
      title: item.title || item.name || 'Untitled',
      overview: item.overview || '',
      posterUrl: getPosterUrl(item.poster_path),
      backdropUrl: getBackdropUrl(item.backdrop_path),
      videoUrl: getStreamUrlForMedia(item.id, 'movie'),
      releaseYear: (item.release_date || item.first_air_date || '').slice(0, 4),
      rating: item.vote_average,
    };

    handlePlayMedia(payload);
  };

  // Handle successful remote pairing
  const handlePairSuccess = (code: string) => {
    setConnectedRoomCode(code);
    localStorage.setItem('onlinetv_paired_code', code);
    showToast(`Connected to TV #${code}!`);
    setIsRemoteModalOpen(false);
  };

  // Disconnect remote
  const handleDisconnectRemote = () => {
    if (connectedRoomCode) {
      TvSessionService.disconnectRemote(connectedRoomCode);
    }
    setConnectedRoomCode(null);
    setTvSessionData(null);
    localStorage.removeItem('onlinetv_paired_code');
    showToast('TV Remote disconnected');
  };

  // Open TV mode in dedicated screen or new tab
  const handleOpenTvMode = (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Always generate a BRAND NEW 4-digit TV room code each time TV is opened
    const freshRoom = TvSessionService.generateRoomCode();

    // Immediately update both TV Room ID & Auto-Fill boxes on main page
    setTvRoomId(freshRoom);
    setInputRoomId(freshRoom);
    try {
      localStorage.setItem('onlinetv_tv_room_code', freshRoom);
    } catch {
      // ignore
    }

    if (activeMedia) {
      try {
        localStorage.setItem('onlinetv_tv_pending_media', JSON.stringify(activeMedia));
      } catch (err) {
        console.warn('Could not save active media for TV tab:', err);
      }
    }
    showToast(`New TV Room #${freshRoom} created! Opening player...`);

    const url = new URL(window.location.href);
    url.searchParams.set('tv', 'true');
    url.searchParams.set('roomCode', freshRoom);
    if (activeMedia) {
      url.searchParams.set('mediaId', String(activeMedia.mediaId));
      url.searchParams.set('title', activeMedia.title);
      url.searchParams.set('mediaType', activeMedia.mediaType || 'movie');
      if (activeMedia.seasonNumber) url.searchParams.set('season', String(activeMedia.seasonNumber));
      if (activeMedia.episodeNumber) url.searchParams.set('episode', String(activeMedia.episodeNumber));
    }
    window.open(url.toString(), '_blank', 'opener');
  };

  const handleExitTvMode = () => {
    setIsTvMode(false);
    window.history.pushState({}, '', window.location.pathname);
  };

  // IF IN DEDICATED SMART TV MODE: Render TvPlayerPage
  if (isTvMode) {
    return <TvPlayerPage onExitTvMode={handleExitTvMode} initialMedia={activeMedia} />;
  }

  // STANDARD RESPONSIVE STREAMING WEB APPLICATION
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-cyan-500 selection:text-neutral-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900/95 border border-cyan-500/60 text-white text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with 2 Side-by-side Boxes & Active Button */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setSearchQuery('');
          setActiveFilter('popular');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        onOpenTvMode={handleOpenTvMode}
        onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
        connectedRoomCode={connectedRoomCode}
        activeMedia={activeMedia}
        tvRoomId={tvRoomId}
        inputRoomId={inputRoomId}
        onInputRoomIdChange={setInputRoomId}
        onActivateTv={handleActivateTv}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 ${
          (activeMedia || tvSessionData?.currentMedia || (connectedRoomCode && tvSessionData?.playbackState)) &&
          !isStickyControllerDismissed
            ? 'pb-28 sm:pb-32'
            : ''
        }`}
      >
        {/* Category Sub-Filters & Section Header */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {debouncedQuery
                  ? `Search Results for "${debouncedQuery}"`
                  : activeCategory === 'movies'
                  ? 'Discover Feature Movies'
                  : activeCategory === 'tv'
                  ? 'Popular TV Series'
                  : 'Anime Hits & Animation'}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Stream in HD, search titles, or cast directly to your Android Smart TV.
              </p>
            </div>

            {!debouncedQuery && (
              <SubFilterTabs
                category={activeCategory}
                selectedFilter={activeFilter}
                onSelectFilter={setActiveFilter}
              />
            )}
          </div>

          {/* Media Grid with Infinite Scrolling (Section 13, 14) */}
          <MediaGrid
            items={items}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={currentPage < totalPages}
            onItemClick={handleMediaClick}
            onQuickCast={handleQuickCast}
            isTvConnected={!!connectedRoomCode}
            onRetry={() => fetchMedia(1, false)}
            errorMessage={errorMessage}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900 bg-neutral-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-neutral-300">OnlineTV</span>
            <span>• Cross-Platform Streaming & Smart TV Remote</span>
          </div>
          <div className="text-neutral-400">
            Powered by TMDB API & Firebase Realtime Database
          </div>
        </div>
      </footer>

      {/* Sticky Player Controller Bar - Always visible when any movie, tv show, or anime is played */}
      {(activeMedia || tvSessionData?.currentMedia || (connectedRoomCode && tvSessionData?.playbackState)) &&
        !isStickyControllerDismissed && (
          <StickyPlayerController
            activeMedia={activeMedia || tvSessionData?.currentMedia || null}
            roomCode={connectedRoomCode || inputRoomId || tvRoomId || ''}
            playbackState={tvSessionData?.playbackState}
            isTvConnected={!!connectedRoomCode}
            onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
            onClose={() => setIsStickyControllerDismissed(true)}
          />
        )}

      {/* Remote Pairing & Control Modal (Section 20, 21) */}
      <RemoteControlModal
        isOpen={isRemoteModalOpen}
        onClose={() => setIsRemoteModalOpen(false)}
        connectedRoomCode={connectedRoomCode}
        onConnectSuccess={handlePairSuccess}
        onDisconnect={handleDisconnectRemote}
        playbackState={tvSessionData?.playbackState}
      />

      {/* Movie Details Modal */}
      <MediaDetailModal
        media={selectedDetailMedia}
        isOpen={!!selectedDetailMedia}
        onClose={() => setSelectedDetailMedia(null)}
        onPlayMedia={handlePlayMedia}
        onOpenEpisodes={(show) => {
          setSelectedShowForEpisodes(show);
        }}
        isTvConnected={!!connectedRoomCode}
        tvRoomCode={connectedRoomCode}
      />

      {/* TV Series Season & Episode Selector Modal (Section 15) */}
      <EpisodeSelectorModal
        show={selectedShowForEpisodes}
        isOpen={!!selectedShowForEpisodes}
        onClose={() => setSelectedShowForEpisodes(null)}
        onPlayEpisode={handlePlayEpisode}
        isTvConnected={!!connectedRoomCode}
        tvRoomCode={connectedRoomCode}
      />
    </div>
  );
}
