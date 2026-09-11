import React from 'react';
import { Bookmark, X, Play, Trash2, Star, Film } from 'lucide-react';
import { WatchlistItem, TMDBMedia } from '../types';
import { IMAGE_BASE_W500 } from '../services/tmdb';

interface WatchlistViewProps {
  isOpen: boolean;
  onClose: () => void;
  items: WatchlistItem[];
  onSelectMedia: (media: TMDBMedia) => void;
  onRemoveItem: (tmdbId: number, mediaType: 'movie' | 'tv' | 'anime') => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  isOpen,
  onClose,
  items,
  onSelectMedia,
  onRemoveItem
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Bookmark className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-white">
                My TV Watchlist
              </h2>
              <p className="text-xs text-slate-400">
                {items.length} {items.length === 1 ? 'title saved' : 'titles saved'} • Synced with Firebase
              </p>
            </div>
          </div>

          <button
            id="watchlist-close-btn"
            onClick={onClose}
            className="tv-focusable p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/15 cursor-pointer"
            title="Close Watchlist (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar flex-1">
          {items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item) => {
                const poster = item.posterPath ? `${IMAGE_BASE_W500}${item.posterPath}` : null;
                const mediaObject: TMDBMedia = {
                  id: item.tmdbId,
                  title: item.title,
                  name: item.title,
                  overview: '',
                  poster_path: item.posterPath,
                  backdrop_path: item.backdropPath,
                  vote_average: item.voteAverage,
                  vote_count: 0,
                  popularity: 0,
                  media_type: item.mediaType === 'movie' ? 'movie' : 'tv'
                };

                return (
                  <div
                    key={`${item.mediaType}-${item.tmdbId}`}
                    className="tv-focusable group relative rounded-xl overflow-hidden bg-slate-800/80 border border-white/10 hover:border-sky-400 transition-all cursor-pointer"
                  >
                    <div
                      onClick={() => onSelectMedia(mediaObject)}
                      className="relative pb-[145%] bg-slate-950"
                    >
                      {poster ? (
                        <img
                          src={poster}
                          alt={item.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-slate-500">
                          <Film className="w-8 h-8 mb-1" />
                          <span className="text-xs line-clamp-2">{item.title}</span>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{item.voteAverage.toFixed(1)}</span>
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="p-3 rounded-full bg-sky-500 text-white shadow-lg">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{item.mediaType}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveItem(item.tmdbId, item.mediaType);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 transition-colors"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                <Bookmark className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-slate-300">Your Watchlist is empty</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore Movies, TV Shows, and Anime, then click the bookmark icon to save titles to your Smart TV library.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
