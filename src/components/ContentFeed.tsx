import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaItem, ContentCategory } from '../types';
import {
  fetchLiveTmdbCategoryContent,
  getTmdbCategoryContent,
  fetchTmdbMediaDetails,
} from '../services/tmdbApi';
import { Search, Star, Play, X, Loader2 } from 'lucide-react';

interface ContentFeedProps {
  currentMedia: MediaItem;
  onSelectMedia: (media: MediaItem) => void;
  isTvConnected?: boolean;
  connectedRoomCode?: string | null;
}

export const ContentFeed: React.FC<ContentFeedProps> = ({
  currentMedia,
  onSelectMedia,
}) => {
  const [activeCategory, setActiveCategory] = useState<ContentCategory>('movie');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [items, setItems] = useState<MediaItem[]>(() => {
    return getTmdbCategoryContent('movie', 1, 18).items;
  });
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch live content from TMDB API
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (page === 1) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const result = await fetchLiveTmdbCategoryContent(
          activeCategory,
          page,
          debouncedQuery
        );

        if (!isCancelled) {
          setHasMore(result.hasMore);
          if (page === 1) {
            setItems(result.items);
          } else {
            setItems((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const freshItems = result.items.filter((i) => !existingIds.has(i.id));
              return [...prev, ...freshItems];
            });
          }
        }
      } catch (err) {
        console.warn('[ContentFeed] Live TMDB error, falling back:', err);
        if (!isCancelled && page === 1) {
          const fallback = getTmdbCategoryContent(activeCategory, 1, 18, debouncedQuery);
          setItems(fallback.items);
        }
      } finally {
        if (!isCancelled) {
          setIsInitialLoading(false);
          setIsLoadingMore(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [activeCategory, debouncedQuery, page]);

  const handleCategoryChange = (cat: ContentCategory) => {
    if (activeCategory === cat) return;
    setActiveCategory(cat);
    setPage(1);
    setHasMore(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
    setHasMore(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setPage(1);
    setHasMore(true);
  };

  const handleItemClick = async (item: MediaItem) => {
    onSelectMedia(item);

    // Asynchronously enrich with seasons details from TMDB
    try {
      const enriched = await fetchTmdbMediaDetails(item);
      if (
        enriched.id !== item.id ||
        enriched.totalSeasons !== item.totalSeasons ||
        enriched.seasonsInfo
      ) {
        onSelectMedia(enriched);
      }
    } catch {
      // Non-blocking
    }
  };

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && !isLoadingMore && !isInitialLoading && hasMore) {
        setPage((prev) => prev + 1);
      }
    },
    [isLoadingMore, isInitialLoading, hasMore]
  );

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '300px',
      threshold: 0,
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (sentinelRef.current) observer.observe(sentinelRef.current);

    return () => {
      if (sentinelRef.current) observer.unobserve(sentinelRef.current);
    };
  }, [handleObserver]);

  return (
    <section id="content-feed-section" className="w-full bg-slate-50 px-4 sm:px-6 py-6 select-none">
      <div className="max-w-7xl mx-auto flex flex-col gap-5">
        {/* Navigation Bar: Categories & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl w-fit">
            <button
              id="tab-category-movies"
              onClick={() => handleCategoryChange('movie')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeCategory === 'movie'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Movies
            </button>

            <button
              id="tab-category-tv"
              onClick={() => handleCategoryChange('tv')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeCategory === 'tv'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              TV Shows
            </button>

            <button
              id="tab-category-anime"
              onClick={() => handleCategoryChange('anime')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeCategory === 'anime'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Anime
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="input-media-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Cards Grid */}
        <div
          id="content-feed-grid"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4"
        >
          {items.map((item) => {
            const isPlayingThis = currentMedia.id === item.id;

            return (
              <div
                key={item.id}
                tabIndex={0}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item);
                  }
                }}
                className={`group relative flex flex-col rounded-xl overflow-hidden bg-white border cursor-pointer transition-all duration-150 ${
                  isPlayingThis
                    ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                  />

                  {/* Rating Tag */}
                  {item.rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-amber-300 text-[10px] font-semibold">
                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                      <span>{item.rating}</span>
                    </div>
                  )}

                  {/* Play Indicator on Hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-2.5 rounded-full bg-blue-600 text-white shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-4 h-4 fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {isPlayingThis && (
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-semibold text-center shadow-xs">
                      Playing
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-2.5 flex flex-col justify-between flex-1">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.year || '2024'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Infinite Scroll Sentinel */}
        <div ref={sentinelRef} className="w-full flex items-center justify-center py-6">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading more...</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
