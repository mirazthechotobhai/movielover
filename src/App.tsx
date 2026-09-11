import { useState, useEffect, useCallback, useMemo } from 'react';
import { MainCategory, TMDBMedia, ActivePlayTarget, WatchlistItem } from './types';
import { tmdbService, MediaSection } from './services/tmdb';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MediaRow } from './components/MediaRow';
import { PlayerView } from './components/PlayerView';
import { SearchModal } from './components/SearchModal';
import { WatchlistView } from './components/WatchlistView';
import { TVRemoteOverlay } from './components/TVRemoteOverlay';
import { useTVNavigation } from './hooks/useTVNavigation';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<MainCategory>('movie');
  const [sections, setSections] = useState<MediaSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Playback for EmbedMaster Player
  const [activePlayTarget, setActivePlayTarget] = useState<ActivePlayTarget | null>(null);

  // Search Modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Watchlist View & Items
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Virtual Remote Guide / Overlay
  const [isRemoteOverlayOpen, setIsRemoteOverlayOpen] = useState(false);

  // Load Watchlist from Firebase & LocalStorage
  useEffect(() => {
    fetchWatchlist().then((items) => {
      setWatchlist(items);
    });
  }, []);

  // Fetch Media Sections when category changes
  const loadCategoryData = useCallback(async (cat: MainCategory) => {
    setLoading(true);
    setError(null);
    try {
      let data: MediaSection[] = [];
      if (cat === 'movie') {
        data = await tmdbService.getMovieSections();
      } else if (cat === 'tv') {
        data = await tmdbService.getTVSections();
      } else if (cat === 'anime') {
        data = await tmdbService.getAnimeSections();
      }
      setSections(data);
    } catch (err) {
      console.error("Error loading category media:", err);
      setError("Failed to load catalog from TMDB. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategoryData(activeCategory);
  }, [activeCategory, loadCategoryData]);

  // Handle Back button for TV remote
  const handleTVBack = useCallback(() => {
    if (activePlayTarget) {
      setActivePlayTarget(null);
      return true;
    }
    if (isSearchOpen) {
      setIsSearchOpen(false);
      return true;
    }
    if (isWatchlistOpen) {
      setIsWatchlistOpen(false);
      return true;
    }
    if (isRemoteOverlayOpen) {
      setIsRemoteOverlayOpen(false);
      return true;
    }
    return false;
  }, [activePlayTarget, isSearchOpen, isWatchlistOpen, isRemoteOverlayOpen]);

  // Enable TV Remote navigation
  useTVNavigation({
    onBack: handleTVBack,
    enabled: true
  });

  // Featured Media for Hero Banner
  const featuredMedia = useMemo(() => {
    if (sections.length > 0 && sections[0].items.length > 0) {
      return sections[0].items[0];
    }
    return null;
  }, [sections]);

  // 1-Click Direct Play for Movies, TV Shows, and Anime (No details page)
  const handlePlayDirect = useCallback((media: TMDBMedia) => {
    const isTV = media.media_type === 'tv' || !!media.first_air_date || (activeCategory === 'tv');
    const isAnime = activeCategory === 'anime';
    const mediaType: 'movie' | 'tv' | 'anime' = isAnime ? 'anime' : isTV ? 'tv' : 'movie';

    setActivePlayTarget({
      media,
      mediaType,
      season: 1,
      episode: 1
    });
  }, [activeCategory]);

  // Switch Episode within Player
  const handleChangePlayerEpisode = (season: number, episode: number) => {
    if (activePlayTarget) {
      setActivePlayTarget({
        ...activePlayTarget,
        season,
        episode
      });
    }
  };

  // Toggle Watchlist item
  const handleToggleWatchlist = async (media: TMDBMedia) => {
    const isTV = media.media_type === 'tv' || !!media.first_air_date;
    const mediaType: 'movie' | 'tv' | 'anime' = activeCategory === 'anime' ? 'anime' : isTV ? 'tv' : 'movie';
    const isSaved = watchlist.some((i) => i.tmdbId === media.id && i.mediaType === mediaType);

    if (isSaved) {
      await removeFromWatchlist(media.id, mediaType);
      setWatchlist((prev) => prev.filter((i) => !(i.tmdbId === media.id && i.mediaType === mediaType)));
    } else {
      const newItem: WatchlistItem = {
        id: media.id,
        tmdbId: media.id,
        title: media.title || media.name || 'Untitled',
        posterPath: media.poster_path,
        backdropPath: media.backdrop_path,
        mediaType,
        voteAverage: media.vote_average || 0,
        year: (media.release_date || media.first_air_date || '').slice(0, 4),
        addedAt: Date.now()
      };
      await addToWatchlist(newItem);
      setWatchlist((prev) => [newItem, ...prev]);
    }
  };

  const handleRemoveFromWatchlist = async (tmdbId: number, mediaType: 'movie' | 'tv' | 'anime') => {
    await removeFromWatchlist(tmdbId, mediaType);
    setWatchlist((prev) => prev.filter((i) => !(i.tmdbId === tmdbId && i.mediaType === mediaType)));
  };

  const isCurrentMediaInWatchlist = (media: TMDBMedia | null) => {
    if (!media) return false;
    return watchlist.some((i) => i.tmdbId === media.id);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top TV Navigation Bar */}
      <Navbar
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onToggleRemoteHelp={() => setIsRemoteOverlayOpen(!isRemoteOverlayOpen)}
        isRemoteOverlayOpen={isRemoteOverlayOpen}
        watchlistCount={watchlist.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
              </div>
            </div>
            <p className="font-heading text-lg font-bold text-slate-300">
              Loading {activeCategory === 'anime' ? 'Anime' : activeCategory === 'tv' ? 'TV Shows' : 'Cinema Movies'}...
            </p>
            <p className="text-xs text-slate-500">Fetching live from TMDB servers</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="font-heading text-xl font-bold text-white">Connection Issue</h3>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
            <button
              onClick={() => loadCategoryData(activeCategory)}
              className="tv-focusable flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Loading</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Leanback TV Hero Banner (1-Click Play) */}
            {featuredMedia && (
              <HeroBanner
                media={featuredMedia}
                category={activeCategory}
                onPlay={handlePlayDirect}
                onToggleWatchlist={handleToggleWatchlist}
                isInWatchlist={isCurrentMediaInWatchlist(featuredMedia)}
              />
            )}

            {/* Horizontal Media Rows (1-Click Play on any card) */}
            <div className="relative -mt-10 sm:-mt-14 z-20 space-y-2 sm:space-y-4">
              {sections.map((sec, idx) => (
                <MediaRow
                  key={`${activeCategory}-${idx}`}
                  title={sec.title}
                  items={sec.items}
                  onSelectMedia={handlePlayDirect}
                  rowId={`row-${idx}`}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fullpage EmbedMaster Player (Instant 1-Click Playback) */}
      {activePlayTarget && (
        <PlayerView
          playTarget={activePlayTarget}
          onClose={() => setActivePlayTarget(null)}
          onChangeEpisode={handleChangePlayerEpisode}
        />
      )}

      {/* TMDB Search Modal (1-Click Play on result) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMedia={(media) => {
          setIsSearchOpen(false);
          handlePlayDirect(media);
        }}
      />

      {/* Saved TV Watchlist Modal (1-Click Play on item) */}
      <WatchlistView
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        items={watchlist}
        onSelectMedia={(media) => {
          setIsWatchlistOpen(false);
          handlePlayDirect(media);
        }}
        onRemoveItem={handleRemoveFromWatchlist}
      />

      {/* Virtual TV Remote Controller / D-Pad Guide */}
      <TVRemoteOverlay
        isOpen={isRemoteOverlayOpen}
        onClose={() => setIsRemoteOverlayOpen(false)}
      />

      {/* TV Leanback Footer */}
      <footer className="tv-safe-area py-6 border-t border-white/5 bg-slate-950/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-white">GoToCinema TV</span>
          <span>•</span>
          <span>1-Click Instant Play</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Powered by TMDB API</span>
          <span>•</span>
          <span>EmbedMaster Fast Player</span>
          <span>•</span>
          <span>Firebase Sync</span>
        </div>
      </footer>
    </div>
  );
}
