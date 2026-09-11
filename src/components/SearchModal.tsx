import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Star, Film, Tv, Loader2, Delete } from 'lucide-react';
import { TMDBMedia } from '../types';
import { tmdbService, IMAGE_BASE_W500 } from '../services/tmdb';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: TMDBMedia) => void;
}

const KEYBOARD_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3'],
  ['G', 'H', 'I', 'J', 'K', 'L', '4', '5', '6'],
  ['M', 'N', 'O', 'P', 'Q', 'R', '7', '8', '9'],
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0']
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const searchMovies = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const items = await tmdbService.searchMulti(q);
      setResults(items);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMovies(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, searchMovies]);

  const handleKeyPress = (char: string) => {
    setQuery((prev) => prev + char);
  };

  const handleBackspace = () => {
    setQuery((prev) => prev.slice(0, -1));
  };

  const handleSpace = () => {
    setQuery((prev) => prev + ' ');
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex-1 relative flex items-center">
            <Search className="w-5 h-5 text-sky-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Movies, TV Shows, Anime..."
              className="tv-focusable w-full pl-11 pr-10 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-base focus:border-sky-400 focus:bg-white/10 placeholder-slate-400"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
            className="hidden sm:inline-flex px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300"
          >
            {showVirtualKeyboard ? 'Hide TV Keyboard' : 'Show TV Keyboard'}
          </button>

          <button
            id="search-close-btn"
            onClick={onClose}
            className="tv-focusable p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/15 cursor-pointer"
            title="Close Search (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Virtual Keyboard (left) + Results (right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Virtual Keyboard (for TV Remote D-pad) */}
          {showVirtualKeyboard && (
            <div className="lg:col-span-4 p-4 border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950/40 flex flex-col justify-start">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                TV Remote Keyboard
              </p>
              <div className="space-y-1.5">
                {KEYBOARD_ROWS.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-1 justify-between">
                    {row.map((char) => (
                      <button
                        key={char}
                        onClick={() => handleKeyPress(char)}
                        className="tv-focusable flex-1 h-9 sm:h-10 rounded-lg bg-white/5 hover:bg-sky-500 hover:text-white border border-white/10 text-xs sm:text-sm font-bold text-slate-200 transition-colors"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                ))}
                {/* Special keys */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={handleSpace}
                    className="tv-focusable flex-1 h-9 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-slate-300"
                  >
                    Space
                  </button>
                  <button
                    onClick={handleBackspace}
                    className="tv-focusable px-4 h-9 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 border border-white/10 text-xs font-semibold text-rose-300 flex items-center justify-center"
                    title="Backspace"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClear}
                    className="tv-focusable px-3 h-9 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-slate-400"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Area */}
          <div className={`${showVirtualKeyboard ? 'lg:col-span-8' : 'col-span-12'} p-4 sm:p-5 overflow-y-auto no-scrollbar`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
                <span className="text-sm">Searching TMDB library...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {results.map((media) => {
                  const title = media.title || media.name || 'Untitled';
                  const isTV = media.media_type === 'tv' || !!media.first_air_date;
                  const year = (media.release_date || media.first_air_date || '').slice(0, 4);
                  const rating = media.vote_average ? media.vote_average.toFixed(1) : null;
                  const poster = media.poster_path ? `${IMAGE_BASE_W500}${media.poster_path}` : null;

                  return (
                    <div
                      key={media.id}
                      onClick={() => onSelectMedia(media)}
                      className="tv-focusable group relative rounded-xl overflow-hidden bg-slate-800/80 border border-white/10 hover:border-sky-400 cursor-pointer transition-all"
                    >
                      <div className="relative pb-[145%] bg-slate-900">
                        {poster ? (
                          <img
                            src={poster}
                            alt={title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-slate-500">
                            {isTV ? <Tv className="w-6 h-6 mb-1" /> : <Film className="w-6 h-6 mb-1" />}
                            <span className="text-xs line-clamp-2">{title}</span>
                          </div>
                        )}
                        {rating && parseFloat(rating) > 0 && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>{rating}</span>
                          </div>
                        )}
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold uppercase text-slate-300">
                          {isTV ? 'TV' : 'Movie'}
                        </span>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-semibold text-white truncate">{title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{year || 'Cinema'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : query.trim() ? (
              <div className="text-center py-16 text-slate-400">
                <p className="text-base font-semibold">No results found for "{query}"</p>
                <p className="text-xs text-slate-500 mt-1">Try another title, actor, or genre keyword.</p>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <Search className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium">Type any movie, show, or anime name</p>
                <p className="text-xs text-slate-500">Fast TMDB queries with instant EmbedMaster playback.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
