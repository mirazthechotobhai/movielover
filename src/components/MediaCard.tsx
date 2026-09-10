import { FC } from 'react';
import { Star, Play, Tv } from 'lucide-react';
import { TMDBMediaItem } from '../types';
import { getPosterUrl } from '../api/tmdbService';

interface MediaCardProps {
  item: TMDBMediaItem;
  onClick: () => void;
  onQuickCast?: () => void;
  isTvConnected?: boolean;
  navId?: string;
}

export const MediaCard: FC<MediaCardProps> = ({
  item,
  onClick,
  onQuickCast,
  isTvConnected = false,
  navId,
}) => {
  const title = item.title || item.name || 'Untitled';
  const releaseYear = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const isTvSeries = item.media_type === 'tv' || !!item.first_air_date;

  return (
    <div
      id={`media-card-${item.id}`}
      data-nav="true"
      data-nav-id={navId || `card-${item.id}`}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col rounded-2xl bg-neutral-900 border border-neutral-800/80 hover:border-cyan-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-950/40 outline-none select-none"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-2/3 w-full bg-neutral-950 overflow-hidden">
        <img
          src={getPosterUrl(item.poster_path, 'w500')}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Category Pill */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-cyan-400 border border-neutral-700/60">
            {isTvSeries ? 'Series' : 'Movie'}
          </span>
        </div>

        {/* Rating Badge */}
        {rating && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-neutral-700/60">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
          </div>
        )}

        {/* Hover / Focus Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
          <div className="p-3.5 rounded-full bg-cyan-500 text-neutral-950 font-bold shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Quick Cast Button if TV is connected */}
        {isTvConnected && onQuickCast && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickCast();
            }}
            title="Instant Cast to TV"
            className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 text-white shadow-lg backdrop-blur-md transition transform hover:scale-110 active:scale-95"
          >
            <Tv className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info details */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400 font-medium">
            {releaseYear && <span>{releaseYear}</span>}
            {isTvSeries && <span>• Episodes</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
