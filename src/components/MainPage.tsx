import React, { useEffect, useState } from 'react';
import { TMDBMedia, MediaType } from '../types';
import {
  fetchTrending,
  searchTMDB,
  fetchGenres,
  fetchByGenre,
  getWatchlist,
  TMDB_IMAGE_BASE,
  TMDB_BACKDROP_BASE,
  Genre,
  addToWatchlist,
  removeFromWatchlist,
  isItemInWatchlist
} from '../services/tmdb';
import {
  Tv,
  Smartphone,
  Search,
  ExternalLink,
  Flame,
  Film,
  Sparkles,
  Bookmark,
  Star,
  Play,
  Filter,
  X,
  Radio,
  Cast
} from 'lucide-react';

export const MainPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'movie' | 'tv' | 'anime' | 'watchlist'>('trending');
  const [items, setItems] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [watchlistItems, setWatchlistItems] = useState(getWatchlist());
  const [featuredItem, setFeaturedItem] = useState<TMDBMedia | null>(null);

  // Helper to launch Player in new tab
  const launchPlayerInNewTab = (mediaParams?: {
    id?: string;
    tmdbId?: number;
    title?: string;
    type?: MediaType;
    season?: number;
    episode?: number;
  }) => {
    let url = '/player.html';
    if (mediaParams && mediaParams.id) {
      const q = new URLSearchParams();
      q.set('id', mediaParams.id);
      if (mediaParams.tmdbId) q.set('tmdbId', mediaParams.tmdbId.toString());
      if (mediaParams.title) q.set('title', mediaParams.title);
      if (mediaParams.type) q.set('type', mediaParams.type);
      if (mediaParams.season) q.set('season', mediaParams.season.toString());
      if (mediaParams.episode) q.set('episode', mediaParams.episode.toString());
      url = `/player.html?${q.toString()}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Helper to launch Remote in new tab
  const launchRemoteInNewTab = (roomCode?: string) => {
    const url = roomCode ? `/remote.html?room=${roomCode}` : '/remote.html';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Load genres
  useEffect(() => {
    const loadGenres = async () => {
      const type = activeTab === 'tv' || activeTab === 'anime' ? 'tv' : 'movie';
      const g = await fetchGenres(type);
      setGenres(g);
    };
    loadGenres();
  }, [activeTab]);

  // Load content
  useEffect(() => {
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
      let res: TMDBMedia[] = [];
      if (selectedGenre) {
        const type = activeTab === 'tv' || activeTab === 'anime' ? 'tv' : 'movie';
        res = await fetchByGenre(type, selectedGenre);
      } else {
        res = await fetchTrending(activeTab === 'watchlist' ? 'all' : activeTab);
      }
      setItems(res);
      if (res.length > 0 && !featuredItem) {
        setFeaturedItem(res[0]);
      }
      setLoading(false);
    };

    loadData();
  }, [activeTab, searchQuery, selectedGenre]);

  const featuredTitle = featuredItem?.title || featuredItem?.name || 'Featured Movie';
  const featuredYear = (featuredItem?.release_date || featuredItem?.first_air_date || '').split('-')[0] || '2024';
  const featuredBackdrop = featuredItem?.backdrop_path ? `${TMDB_BACKDROP_BASE}${featuredItem.backdrop_path}` : null;
  const isFeaturedTV = (featuredItem?.media_type || (featuredItem?.title ? 'movie' : 'tv')) === 'tv';

  return (
    <div id="main-hub-page" className="min-h-screen w-full bg-[#0b0b10] text-white flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header
        id="main-nav-bar"
        className="w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/10 bg-[#101017]/80 backdrop-blur-md sticky top-0 z-40"
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white leading-tight tracking-tight flex items-center gap-2">
              StreamCast
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
                Remote Cinema
              </span>
            </h1>
            <p className="hidden sm:block text-xs text-zinc-400">
              Watch on TV & control from your smartphone
            </p>
          </div>
        </div>

        {/* Action Buttons: PLAYER BUTTON (Opens in New Tab) & Remote */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Main "Player" button as requested */}
          <button
            id="btn-main-open-player"
            onClick={() => launchPlayerInNewTab()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all transform active:scale-95"
            title="Open TV Player in a new tab (Displaying QR code)"
          >
            <Tv className="w-4 h-4" />
            <span>Player</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Remote Button */}
          <button
            id="btn-main-open-remote"
            onClick={() => launchRemoteInNewTab()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold border border-white/10 transition-colors"
            title="Open Remote Control in a new tab"
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Mobile Remote</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-8">
        {/* Notice Info Banner: Clarifying that the QR code is displayed on the TV Player tab */}
        <div
          id="tab-instruction-banner"
          className="w-full p-4 rounded-2xl bg-[#14141f] border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Cast className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                How Remote-Controlled Streaming Works
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Click the <strong className="text-indigo-400">"Player"</strong> button to open the TV player in a new tab. The TV display in that new tab will show the <strong className="text-white">QR Code</strong> to scan and connect with your smartphone.
              </p>
            </div>
          </div>

          <button
            id="btn-launch-player-cta"
            onClick={() => launchPlayerInNewTab()}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Tv className="w-4 h-4" />
            <span>Launch Player Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Featured Media Spotlight */}
        {featuredItem && (
          <div
            id="hero-featured-spotlight"
            className="relative w-full rounded-3xl overflow-hidden bg-[#13131c] border border-white/10 shadow-2xl min-h-[320px] sm:min-h-[400px] flex items-end p-6 sm:p-10"
          >
            {featuredBackdrop && (
              <img
                src={featuredBackdrop}
                alt={featuredTitle}
                className="absolute inset-0 w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-[#0b0b10]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b10] via-[#0b0b10]/60 to-transparent" />

            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-indigo-600/80 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  Featured Today
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold text-amber-400 border border-white/10 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {Number(featuredItem.vote_average || 0).toFixed(1)}
                </span>
                <span className="text-xs text-zinc-300 font-medium">{featuredYear}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2">
                {featuredTitle}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 mb-5 leading-relaxed">
                {featuredItem.overview || 'Experience high quality streaming with full smartphone remote control synchronization.'}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="btn-hero-play-player"
                  onClick={() =>
                    launchPlayerInNewTab({
                      id: featuredItem.imdb_id || featuredItem.id.toString(),
                      tmdbId: featuredItem.id,
                      title: featuredTitle,
                      type: isFeaturedTV ? 'tv' : 'movie',
                      season: 1,
                      episode: 1,
                    })
                  }
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play on TV (Direct Play)</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Catalog Section Header with Search & Tabs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Explore Streaming Catalog
              </h3>
              <p className="text-xs text-zinc-400">
                Pick any title to launch and control on the TV Player.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="input-main-search"
                type="text"
                placeholder="Search movies, TV shows, anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#14141f] border border-white/10 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
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
          </div>

          {/* Navigation Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                setActiveTab('trending');
                setSelectedGenre(null);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'trending' && !searchQuery
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Trending
            </button>

            <button
              onClick={() => {
                setActiveTab('movie');
                setSelectedGenre(null);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'movie' && !searchQuery
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Movies
            </button>

            <button
              onClick={() => {
                setActiveTab('tv');
                setSelectedGenre(null);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'tv' && !searchQuery
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              TV Shows
            </button>

            <button
              onClick={() => {
                setActiveTab('anime');
                setSelectedGenre(null);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'anime' && !searchQuery
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Anime
            </button>

            <button
              onClick={() => {
                setActiveTab('watchlist');
                setSelectedGenre(null);
                setSearchQuery('');
                setWatchlistItems(getWatchlist());
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'watchlist' && !searchQuery
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Watchlist ({watchlistItems.length})
            </button>
          </div>

          {/* Genre Filters */}
          {!searchQuery && activeTab !== 'watchlist' && genres.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-zinc-500 flex items-center gap-1 pr-1 text-[11px]">
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

        {/* Media Cards Grid */}
        <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs">Loading media catalog...</p>
            </div>
          ) : activeTab === 'watchlist' ? (
            watchlistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-[#13131c] rounded-2xl border border-white/5">
                <Bookmark className="w-10 h-10 text-zinc-600 mb-2" />
                <h4 className="text-base font-bold text-white mb-1">Watchlist is Empty</h4>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Add movies and series to your watchlist to quickly launch them on your TV player.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {watchlistItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl overflow-hidden bg-[#14141e] border border-white/10 hover:border-indigo-500/50 transition-all flex flex-col shadow-md"
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

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-1.5">
                        <button
                          onClick={() =>
                            launchPlayerInNewTab({
                              id: item.mediaId,
                              tmdbId: item.tmdbId,
                              title: item.title,
                              type: item.type,
                            })
                          }
                          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play on TV</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{item.title}</h4>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
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
              <p className="text-xs">No media found for your criteria.</p>
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
                      launchPlayerInNewTab({
                        id: item.imdb_id || item.id.toString(),
                        tmdbId: item.id,
                        title,
                        type: isTV ? 'tv' : 'movie',
                        season: 1,
                        episode: 1,
                      });
                    }}
                    className="group relative rounded-2xl overflow-hidden bg-[#14141e] border border-white/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer transition-all flex flex-col"
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

                      {/* Hover Action Buttons */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            launchPlayerInNewTab({
                              id: item.imdb_id || item.id.toString(),
                              tmdbId: item.id,
                              title,
                              type: isTV ? 'tv' : 'movie',
                              season: 1,
                              episode: 1,
                            });
                          }}
                          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/40"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play on TV</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate leading-snug">{title}</h4>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
                        <span>{year}</span>
                        <span className="text-[10px] text-zinc-500 capitalize">
                          {isTV ? 'TV Series' : 'Movie'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
