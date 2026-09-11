import React, { useState } from 'react';
import { Star, Play, Film, Tv } from 'lucide-react';
import { TMDBMedia } from '../types';
import { IMAGE_BASE_W500 } from '../services/tmdb';

interface MediaCardProps {
  media: TMDBMedia;
  onSelect: (media: TMDBMedia) => void;
  index?: number;
  rowId?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onSelect,
  index = 0,
  rowId = 'row'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const title = media.title || media.name || media.original_title || media.original_name || 'Untitled';
  const releaseYear = (media.release_date || media.first_air_date || '').slice(0, 4);
  const rating = media.vote_average ? media.vote_average.toFixed(1) : null;
  const isTV = media.media_type === 'tv' || !!media.first_air_date;

  const posterUrl = media.poster_path 
    ? `${IMAGE_BASE_W500}${media.poster_path}`
    : media.backdrop_path 
    ? `${IMAGE_BASE_W500}${media.backdrop_path}`
    : null;

  return (
    <div
      id={`card-${rowId}-${index}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(media)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(media);
        }
      }}
      className="tv-focusable group relative flex-shrink-0 w-[150px] sm:w-[180px] md:w-[200px] rounded-xl overflow-hidden cursor-pointer bg-slate-900 border border-white/10 hover:border-sky-400 focus-visible:border-sky-400 transition-all duration-200 transform hover:scale-105"
    >
      {/* Aspect Ratio 2:3 container */}
      <div className="relative w-full pb-[150%] bg-slate-800">
        {posterUrl && !imageError ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-slate-800 text-slate-400">
            {isTV ? <Tv className="w-8 h-8 mb-2 text-slate-500" /> : <Film className="w-8 h-8 mb-2 text-slate-500" />}
            <span className="text-xs font-semibold text-slate-300 line-clamp-3">{title}</span>
          </div>
        )}

        {/* Rating Badge */}
        {rating && parseFloat(rating) > 0 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-white/15 flex items-center gap-1 text-[11px] font-bold text-amber-300 shadow-md">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-slate-300 uppercase tracking-wider">
          {isTV ? 'TV' : 'Movie'}
        </div>

        {/* Hover / Remote Focus Quick Play Icon Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
          <div className="mb-2 self-center h-10 w-10 rounded-full bg-sky-500/90 text-white flex items-center justify-center shadow-lg shadow-sky-500/40 transform group-hover:scale-110 group-focus-visible:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
          <p className="text-white text-xs font-bold line-clamp-2 leading-tight drop-shadow">{title}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
            <span>{releaseYear || 'Cinema'}</span>
            <span className="text-sky-400 font-bold bg-sky-500/20 px-1.5 py-0.5 rounded border border-sky-500/30">▶ Play</span>
          </div>
        </div>
      </div>

      {/* Static Footer below poster */}
      <div className="p-2.5 bg-slate-900/90">
        <h3 className="text-slate-100 text-xs sm:text-sm font-semibold truncate" title={title}>
          {title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
          <span>{releaseYear || 'Cinema'}</span>
          <span className="text-slate-500">{isTV ? 'Series' : 'Film'}</span>
        </div>
      </div>
    </div>
  );
};
