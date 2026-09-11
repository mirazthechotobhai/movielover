import React from 'react';
import { Play, Bookmark, Star, Calendar, Sparkles } from 'lucide-react';
import { TMDBMedia, MainCategory } from '../types';
import { IMAGE_BASE_ORIGINAL } from '../services/tmdb';

interface HeroBannerProps {
  media: TMDBMedia | null;
  category: MainCategory;
  onPlay: (media: TMDBMedia) => void;
  onToggleWatchlist: (media: TMDBMedia) => void;
  isInWatchlist: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  media,
  category,
  onPlay,
  onToggleWatchlist,
  isInWatchlist
}) => {
  if (!media) return null;

  const title = media.title || media.name || media.original_title || media.original_name || 'Featured Cinema';
  const releaseYear = (media.release_date || media.first_air_date || '').slice(0, 4);
  const rating = media.vote_average ? media.vote_average.toFixed(1) : '7.8';
  const backdropUrl = media.backdrop_path 
    ? `${IMAGE_BASE_ORIGINAL}${media.backdrop_path}`
    : media.poster_path 
    ? `${IMAGE_BASE_ORIGINAL}${media.poster_path}`
    : '';

  return (
    <div className="relative w-full h-[52vh] min-h-[380px] max-h-[560px] overflow-hidden select-none">
      {/* Backdrop Image */}
      {backdropUrl && (
        <div className="absolute inset-0">
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-center opacity-40 transform scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Cinema Gradients for high readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/80 to-transparent w-full md:w-3/4" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end tv-safe-area pb-8">
        <div className="max-w-3xl space-y-3.5">
          {/* Badge */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{rating} TMDB</span>
            </span>

            {releaseYear && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-xs font-medium">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{releaseYear}</span>
              </span>
            )}

            <span className="uppercase text-[11px] font-bold tracking-widest px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {category === 'anime' ? 'Anime Feature' : category === 'tv' ? 'TV Series' : 'Blockbuster'}
            </span>

            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <Sparkles className="w-3 h-3" />
              <span>Ultra HD 1080p / 4K</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
            {title}
          </h1>

          {/* Overview */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-2xl drop-shadow">
            {media.overview || 'Stream this title in high definition with EmbedMaster fast cinema player on your smart device.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              id="hero-play-btn"
              onClick={() => onPlay(media)}
              className="tv-focusable flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-base shadow-xl shadow-sky-500/40 transition-all cursor-pointer transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Play Now (1-Click)</span>
            </button>

            <button
              id="hero-watchlist-btn"
              onClick={() => onToggleWatchlist(media)}
              className={`tv-focusable flex items-center gap-2 px-5 py-3.5 rounded-xl border backdrop-blur-sm transition-all cursor-pointer font-semibold text-sm ${
                isInWatchlist
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-300'
              }`}
              title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isInWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
