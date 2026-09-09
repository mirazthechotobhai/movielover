import React, { useEffect, useState } from 'react';
import { TMDBMedia, MediaType } from '../types';
import {
  fetchTrending,
  searchTMDB,
  fetchGenres,
  fetchByGenre,
  getWatchlist,
  TMDB_IMAGE_BASE,
  Genre
} from '../services/tmdb';
import {
  Search,
  X,
  Flame,
  Film,
  Tv,
  Sparkles,
  Bookmark,
  Star,
  Play,
  Filter
} from 'lucide-react';

interface BrowseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayMedia: (payload: {
    id: string;
    tmdbId: number;
    title: string;
    type: MediaType;
    season?: number;
    episode?: number;
    posterPath?: string;
    backdropPath?: string;
    releaseYear?: string;
    overview?: string;
  }) => void;
}

export const BrowseModal: React.FC<BrowseModalProps> = ({
  isOpen,
  onClose,
  onPlayMedia,
}) => {
  const [activeTab, setActiveTab] = useState<'trending' | 'movie' | 'tv' | 'anime' | 'watchlist'>('trending');
  const [items, setItems] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [watchlistItems, setWatchlistItems] = useState(getWatchlist());

  // Load genres
  useEffect(() => {
    if (!isOpen) return;
    const loadGenres = async () => {
      const type = activeTab === 'tv' || activeTab === 'anime' ? 'tv' : 'movie';
      const g = await fetchGenres(type);
      setGenres(g);
    };
    loadGenres();
  }, [isOpen, activeTab]);

  // Load content
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === 'watchlist') {
      setWatchlistItems(getWatchlist());
      return;
    }

    if (searchQuery.trim()) {
      const timer = setTimeout(async () => {
        setLoading(true);
        const results = await searchTMDB(searchQuery);
        setItems(results);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    const loadData = async () => {
      setLoading(true);
      if (selectedGenre) {
        const type = activeTab === 'tv' || activeTab === 'anime' ? 'tv' : 'movie';
        const res = await fetchByGenre(type, selectedGenre);
        setItems(res);
      } else {
        const res = await fetchTrending(activeTab === 'watchlist' ? 'all' : activeTab);
        setItems(res);
      }
      setLoading(false);
    };

    loadData();
  }, [isOpen, activeTab, searchQuery, selectedGenre]);

  if (!isOpen) return null;

  return (
    <div
      id="browse-catalog-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden"
    >
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#151520] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  Media Catalog & Search
                </h2>
                <p className="text-xs text-zinc-400">
                  Select any movie, TV show, or anime to stream and control via your phone remote.
                </p>
              </div>
            </div>

            <button
              id="btn-close-browse"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Close browse"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar & Nav Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="input-media-search"
                type="text"
                placeholder="Search movies, TV shows, anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-xl bg-[#0d0d12] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                id="tab-trending"
                onClick={() => {
                  setActiveTab('trending');
                  setSelectedGenre(null);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'trending' && !searchQuery
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Trending
              </button>

              <button
                id="tab-movies"
                onClick={() => {
                  setActiveTab('movie');
                  setSelectedGenre(null);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'movie' && !searchQuery
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                Movies
              </button>

              <button
                id="tab-tv"
                onClick={() => {
                  setActiveTab('tv');
                  setSelectedGenre(null);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'tv' && !searchQuery
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                TV Shows
              </button>

              <button
                id="tab-anime"
                onClick={() => {
                  setActiveTab('anime');
                  setSelectedGenre(null);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'anime' && !searchQuery
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Anime
              </button>

              <button
                id="tab-watchlist"
                onClick={() => {
                  setActiveTab('watchlist');
                  setSelectedGenre(null);
                  setSearchQuery('');
                  setWatchlistItems(getWatchlist());
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'watchlist' && !searchQuery
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Watchlist ({watchlistItems.length})
              </button>
            </div>
          </div>

          {/* Genre Filter Pills (shown if not in watchlist and not searching) */}
          {!searchQuery && activeTab !== 'watchlist' && genres.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-zinc-500 flex items-center gap-1 pl-1">
                <Filter className="w-3 h-3" />
                Genre:
              </span>
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  selectedGenre === null
                    ? 'bg-white/20 text-white font-medium'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
              {genres.slice(0, 10).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGenre(g.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    selectedGenre === g.id
                      ? 'bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-medium'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0f0f13]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading media catalog...</p>
            </div>
          ) : activeTab === 'watchlist' ? (
            watchlistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Bookmark className="w-12 h-12 text-zinc-600 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Your Watchlist is Empty</h3>
                <p className="text-sm text-zinc-400 max-w-sm">
                  Click the bookmark button on any movie or TV series card to save it here for quick access.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {watchlistItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-xl overflow-hidden bg-[#161622] border border-white/10 hover:border-indigo-500/50 transition-all flex flex-col"
                  >
                    <div className="relative aspect-[2/3] bg-zinc-900 overflow-hidden">
                      {item.posterPath ? (
                        <img
                          src={`${TMDB_IMAGE_BASE}${item.posterPath}`}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Film className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                        <button
                          onClick={() => {
                            onPlayMedia({
                              id: item.mediaId,
                              tmdbId: item.tmdbId,
                              title: item.title,
                              type: item.type,
                              posterPath: item.posterPath ? `${TMDB_IMAGE_BASE}${item.posterPath}` : undefined,
                              releaseYear: item.year
                            });
                            onClose();
                          }}
                          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Play on TV
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                      <div className="flex items-center justify-between mt-1 text-xs text-zinc-400">
                        <span>{item.year}</span>
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {Number(item.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400">
              <Film className="w-10 h-10 mb-2 text-zinc-600" />
              <p className="text-sm">No titles found. Try a different query or genre.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => {
                const title = item.title || item.name || 'Untitled';
                const isTV = (item.media_type || (item.title ? 'movie' : 'tv')) === 'tv';
                const year = (item.release_date || item.first_air_date || '').split('-')[0] || '';
                const posterUrl = item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onPlayMedia({
                        id: item.imdb_id || item.id.toString(),
                        tmdbId: item.id,
                        title,
                        type: isTV ? 'tv' : 'movie',
                        season: 1,
                        episode: 1,
                        posterPath: posterUrl || undefined,
                        backdropPath: item.backdrop_path ? `${TMDB_IMAGE_BASE}${item.backdrop_path}` : undefined,
                        releaseYear: year,
                        overview: item.overview,
                      });
                      onClose();
                    }}
                    className="group relative rounded-xl overflow-hidden bg-[#161622] border border-white/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer transition-all flex flex-col"
                  >
                    <div className="relative aspect-[2/3] bg-zinc-900 overflow-hidden">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Film className="w-8 h-8" />
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          {Number(item.vote_average || 0).toFixed(1)}
                        </span>
                      </div>

                      <div className="absolute top-2 right-2">
                        <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-medium text-zinc-300">
                          {isTV ? 'TV' : 'Movie'}
                        </span>
                      </div>

                      {/* Hover Overlay Button */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayMedia({
                              id: item.imdb_id || item.id.toString(),
                              tmdbId: item.id,
                              title,
                              type: isTV ? 'tv' : 'movie',
                              season: 1,
                              episode: 1,
                              posterPath: posterUrl || undefined,
                              backdropPath: item.backdrop_path ? `${TMDB_IMAGE_BASE}${item.backdrop_path}` : undefined,
                              releaseYear: year,
                              overview: item.overview,
                            });
                            onClose();
                          }}
                          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/40"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Play Now
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-white truncate leading-snug">{title}</h4>
                      <div className="flex items-center justify-between mt-1 text-xs text-zinc-400">
                        <span>{year}</span>
                        <span className="text-[11px] text-zinc-500 capitalize">
                          {isTV ? 'Series' : 'Feature'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
