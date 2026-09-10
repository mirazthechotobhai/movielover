import React, { useState, useEffect } from 'react';
import {
  TMDBMedia,
  FEATURED_GENRES,
  fetchTrending,
  searchTMDB,
  fetchByGenre,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  fetchMovieImdbId,
  KNOWN_MOVIE_IMDB_MAP,
} from '../lib/tmdb';
import {
  Search,
  Film,
  Tv,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Play,
  X,
  Star,
  Calendar,
  Layers,
  Filter,
  Flame,
} from 'lucide-react';

interface TMDBBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'trending' | 'movie' | 'tv' | 'anime' | 'watchlist';
  onSelectMedia: (media: {
    id: string | number;
    title: string;
    type: 'movie' | 'tv';
    posterPath?: string | null;
    backdropPath?: string | null;
    season?: number;
    episode?: number;
  }) => void;
}

export const TMDBBrowserModal: React.FC<TMDBBrowserModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'trending',
  onSelectMedia,
}) => {
  const [activeTab, setActiveTab] = useState<'trending' | 'movie' | 'tv' | 'anime' | 'watchlist'>(initialTab);
  const [selectedGenre, setSelectedGenre] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaList, setMediaList] = useState<TMDBMedia[]>([]);
  const [watchlist, setWatchlist] = useState<TMDBMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync tab when initialTab changes or modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Detail inspection
  const [detailItem, setDetailItem] = useState<TMDBMedia | null>(null);
  const [seasonNum, setSeasonNum] = useState<number>(1);
  const [episodeNum, setEpisodeNum] = useState<number>(1);

  // Load watchlist on mount
  useEffect(() => {
    setWatchlist(getWatchlist());
  }, [isOpen]);

  // Fetch items based on activeTab, genre or search
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === 'watchlist') {
      setMediaList(getWatchlist());
      return;
    }

    if (searchQuery.trim().length > 1) {
      const delayDebounce = setTimeout(async () => {
        setIsLoading(true);
        const results = await searchTMDB(searchQuery);
        setMediaList(results);
        setIsLoading(false);
      }, 350);
      return () => clearTimeout(delayDebounce);
    }

    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      let data: TMDBMedia[] = [];
      if (selectedGenre !== 0) {
        data = await fetchByGenre(
          selectedGenre,
          activeTab === 'tv' || activeTab === 'anime' ? 'tv' : 'movie'
        );
      } else {
        data = await fetchTrending(activeTab === 'trending' ? 'all' : activeTab);
      }
      if (isMounted) {
        setMediaList(data);
        setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, selectedGenre, searchQuery]);

  const handleToggleWatchlist = (item: TMDBMedia, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isInWatchlist(item.id)) {
      const updated = removeFromWatchlist(item.id);
      setWatchlist(updated);
      if (activeTab === 'watchlist') setMediaList(updated);
    } else {
      const updated = addToWatchlist(item);
      setWatchlist(updated);
    }
  };

  const handleStartPlayback = async (item: TMDBMedia, season?: number, episode?: number) => {
    let playId = String(item.imdbId || item.id);
    if (item.mediaType === 'movie' && !playId.startsWith('tt')) {
      if (KNOWN_MOVIE_IMDB_MAP[playId]) {
        playId = KNOWN_MOVIE_IMDB_MAP[playId];
      } else {
        const imdb = await fetchMovieImdbId(item.id);
        playId = imdb || 'tt6263850';
      }
    }
    onSelectMedia({
      id: playId,
      title: item.title,
      type: item.mediaType,
      posterPath: item.posterPath,
      backdropPath: item.backdropPath,
      season: item.mediaType === 'tv' ? (season ?? seasonNum ?? 1) : undefined,
      episode: item.mediaType === 'tv' ? (episode ?? episodeNum ?? 1) : undefined,
    });
    setDetailItem(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in text-zinc-100">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#111116] border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white flex items-center gap-2">
                TMDB Cinema Catalog
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Live API
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Explore trending movies, series & anime to stream directly on EmbedMaster
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Live Search */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search movies, anime, shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700/60 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition"
              aria-label="Close catalog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category & Genre Navigation */}
        <div className="px-4 sm:px-5 py-3 border-b border-zinc-800/50 bg-[#14141b] flex flex-col gap-2.5">
          {/* Main Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                setActiveTab('trending');
                setSelectedGenre(0);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'trending'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Trending
            </button>

            <button
              onClick={() => {
                setActiveTab('movie');
                setSelectedGenre(0);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'movie'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Movies
            </button>

            <button
              onClick={() => {
                setActiveTab('tv');
                setSelectedGenre(0);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'tv'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> TV Shows
            </button>

            <button
              onClick={() => {
                setActiveTab('anime');
                setSelectedGenre(0);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'anime'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Anime
            </button>

            <button
              onClick={() => {
                setActiveTab('watchlist');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ml-auto ${
                activeTab === 'watchlist'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Watchlist
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
                {watchlist.length}
              </span>
            </button>
          </div>

          {/* Genre Filters (when not in search or watchlist) */}
          {activeTab !== 'watchlist' && !searchQuery && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <span className="text-zinc-500 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Genre:
              </span>
              {FEATURED_GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                    selectedGenre === genre.id
                      ? 'bg-zinc-200 text-black font-semibold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Media Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Fetching titles from TMDB API...</p>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-zinc-500 text-center">
              <Film className="w-10 h-10 stroke-1" />
              <p className="text-sm font-medium">No titles found</p>
              <p className="text-xs text-zinc-600">
                {activeTab === 'watchlist'
                  ? 'Your watchlist is currently empty. Bookmark any movie or show to view here.'
                  : 'Try adjusting your search query or selecting a different genre.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {mediaList.map((item) => {
                const bookmarked = isInWatchlist(item.id);
                return (
                  <div
                    key={`${item.mediaType}_${item.id}`}
                    onClick={() => {
                      if (item.mediaType === 'movie') {
                        handleStartPlayback(item);
                      } else {
                        // For TV & Anime, open details with S1E1 ready or user can click quick play
                        setDetailItem(item);
                        setSeasonNum(1);
                        setEpisodeNum(1);
                      }
                    }}
                    className="group relative flex flex-col bg-zinc-900/80 rounded-xl overflow-hidden border border-zinc-800/80 hover:border-cyan-500/50 transition duration-200 cursor-pointer shadow-md hover:shadow-cyan-500/10"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-full bg-zinc-950 overflow-hidden">
                      {item.posterPath ? (
                        <img
                          src={item.posterPath}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-600 text-xs">
                          No Poster
                        </div>
                      )}

                      {/* Instant Play on TV Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartPlayback(item, 1, 1);
                          }}
                          className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-lg shadow-cyan-500/40 transform group-hover:scale-105 transition"
                          title="Stream Now on Player"
                        >
                          <Play className="w-5 h-5 fill-black translate-x-0.5" />
                        </button>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-300 bg-black/80 px-2 py-0.5 rounded">
                          {item.mediaType === 'tv' ? 'Play S1 E1' : 'Play Movie'}
                        </span>
                      </div>

                      {/* Floating Rating Badge */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-medium text-amber-300 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-300" />
                        {item.voteAverage.toFixed(1)}
                      </div>

                      {/* Type Badge */}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-medium text-cyan-300 uppercase tracking-wide">
                        {item.mediaType === 'tv' ? 'TV' : 'Movie'}
                      </div>

                      {/* Quick Watchlist Bookmark Button */}
                      <button
                        onClick={(e) => handleToggleWatchlist(item, e)}
                        className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition ${
                          bookmarked
                            ? 'bg-amber-500 text-black'
                            : 'bg-black/60 text-zinc-300 hover:text-white hover:bg-black/80'
                        }`}
                        title={bookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        {bookmarked ? (
                          <BookmarkCheck className="w-3.5 h-3.5" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Meta info */}
                    <div className="p-2.5 flex flex-col flex-1 justify-between gap-1">
                      <h4 className="text-xs font-semibold text-zinc-100 line-clamp-1 group-hover:text-cyan-400 transition">
                        {item.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span>{item.releaseDate ? item.releaseDate.split('-')[0] : '2024'}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartPlayback(item, 1, 1);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5 hover:underline"
                        >
                          Stream <Play className="w-2.5 h-2.5 fill-cyan-400 inline" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Item Inspection Modal */}
        {detailItem && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-2xl bg-[#161620] border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
              {/* Close Button */}
              <button
                onClick={() => setDetailItem(null)}
                className="absolute top-4 right-4 z-30 p-2 text-zinc-300 hover:text-white rounded-full bg-black/60 backdrop-blur-md transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Backdrop Header */}
              <div className="relative h-48 w-full bg-zinc-950 overflow-hidden">
                {detailItem.backdropPath || detailItem.posterPath ? (
                  <img
                    src={detailItem.backdropPath || detailItem.posterPath!}
                    alt={detailItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#161620] via-[#161620]/60 to-transparent" />

                <div className="absolute bottom-3 left-5 right-16 flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-cyan-500 text-black">
                    {detailItem.mediaType === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-amber-300 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    {detailItem.voteAverage.toFixed(1)} / 10
                  </div>
                  {detailItem.releaseDate && (
                    <span className="text-xs text-zinc-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {detailItem.releaseDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{detailItem.title}</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">{detailItem.overview}</p>
                </div>

                {/* If TV Show: Season & Episode picker */}
                {detailItem.mediaType === 'tv' && (
                  <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2">
                    <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Season & Episode Selection
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Season</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={seasonNum}
                          onChange={(e) => setSeasonNum(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full py-1.5 px-3 bg-black border border-zinc-700 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Episode</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={episodeNum}
                          onChange={(e) => setEpisodeNum(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full py-1.5 px-3 bg-black border border-zinc-700 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      EmbedMaster loads: <code className="text-zinc-400">https://embedmaster.link/tv/{detailItem.id}/{seasonNum}/{episodeNum}</code>
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleStartPlayback(detailItem, seasonNum, episodeNum)}
                    className="flex-1 py-3 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Stream on TV Player
                  </button>

                  <button
                    onClick={() => handleToggleWatchlist(detailItem)}
                    className={`py-3 px-4 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                      isInWatchlist(detailItem.id)
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {isInWatchlist(detailItem.id) ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-amber-400" />
                        In Watchlist
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        Save to Watchlist
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
