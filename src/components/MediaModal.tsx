import React, { useState, useEffect } from 'react';
import { X, Play, Star, Calendar, Clock, Bookmark, Layers, Loader2, Sparkles } from 'lucide-react';
import { TMDBMedia, TMDBSeasonDetails, TMDBEpisode, MainCategory } from '../types';
import { tmdbService, IMAGE_BASE_ORIGINAL, IMAGE_BASE_W500 } from '../services/tmdb';

interface MediaModalProps {
  media: TMDBMedia | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayMovie: (media: TMDBMedia) => void;
  onPlayTVEpisode: (media: TMDBMedia, season: number, episode: number) => void;
  onToggleWatchlist: (media: TMDBMedia) => void;
  isInWatchlist: boolean;
  category: MainCategory;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  media,
  isOpen,
  onClose,
  onPlayMovie,
  onPlayTVEpisode,
  onToggleWatchlist,
  isInWatchlist,
}) => {
  const [detailedMedia, setDetailedMedia] = useState<TMDBMedia | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState<TMDBSeasonDetails | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  const isTV = media ? (media.media_type === 'tv' || !!media.first_air_date) : false;

  // Fetch full details when opened
  useEffect(() => {
    if (!isOpen || !media) {
      setDetailedMedia(null);
      setSeasonDetails(null);
      setSelectedSeason(1);
      return;
    }

    let active = true;
    setLoadingDetails(true);

    const loadDetails = async () => {
      try {
        if (isTV) {
          const tvData = await tmdbService.getTVDetails(media.id);
          if (active) {
            setDetailedMedia(tvData);
            // Default to season 1 or first available season
            const initialSeason = (tvData.number_of_seasons && tvData.number_of_seasons > 0) ? 1 : 1;
            setSelectedSeason(initialSeason);
          }
        } else {
          const movieData = await tmdbService.getMovieDetails(media.id);
          if (active) {
            setDetailedMedia(movieData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch detailed info:", err);
        if (active) setDetailedMedia(media);
      } finally {
        if (active) setLoadingDetails(false);
      }
    };

    loadDetails();
    return () => {
      active = false;
    };
  }, [isOpen, media, isTV]);

  // Fetch episodes when selected season changes
  useEffect(() => {
    if (!isOpen || !media || !isTV) return;

    let active = true;
    setLoadingSeason(true);

    const loadSeason = async () => {
      try {
        const data = await tmdbService.getSeasonDetails(media.id, selectedSeason);
        if (active) setSeasonDetails(data);
      } catch (err) {
        console.error("Failed to load season details:", err);
        if (active) setSeasonDetails(null);
      } finally {
        if (active) setLoadingSeason(false);
      }
    };

    loadSeason();
    return () => {
      active = false;
    };
  }, [isOpen, media, isTV, selectedSeason]);

  if (!isOpen || !media) return null;

  const m = detailedMedia || media;
  const title = m.title || m.name || m.original_title || m.original_name || 'Details';
  const releaseYear = (m.release_date || m.first_air_date || '').slice(0, 4);
  const rating = m.vote_average ? m.vote_average.toFixed(1) : '7.5';
  const backdropUrl = m.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${m.backdrop_path}` : '';
  const posterUrl = m.poster_path ? `${IMAGE_BASE_W500}${m.poster_path}` : '';
  const seasonsCount = m.number_of_seasons || 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="modal-close-btn"
          onClick={onClose}
          className="tv-focusable absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-slate-200 border border-white/20 transition-all cursor-pointer"
          title="Close (ESC / Back)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto no-scrollbar">
          {/* Header Backdrop Banner */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-950">
            {backdropUrl ? (
              <img
                src={backdropUrl}
                alt={title}
                className="w-full h-full object-cover object-center opacity-45"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />

            {/* Poster & Title in Header */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex items-end gap-4 sm:gap-6">
              {posterUrl && (
                <div className="hidden sm:block w-32 md:w-36 flex-shrink-0 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800">
                  <img src={posterUrl} alt={title} className="w-full h-auto object-cover" />
                </div>
              )}

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{rating} TMDB</span>
                  </span>
                  {releaseYear && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-xs">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{releaseYear}</span>
                    </span>
                  )}
                  {m.runtime ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-xs">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{m.runtime} min</span>
                    </span>
                  ) : null}
                  {isTV && seasonsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium">
                      <Layers className="w-3 h-3" />
                      <span>{seasonsCount} {seasonsCount === 1 ? 'Season' : 'Seasons'}</span>
                    </span>
                  )}
                </div>

                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow">
                  {title}
                </h2>

                {m.tagline && (
                  <p className="text-sky-300/80 text-xs sm:text-sm italic font-medium">
                    "{m.tagline}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Body Section */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {!isTV ? (
                <button
                  id="modal-play-movie-btn"
                  onClick={() => onPlayMovie(m)}
                  className="tv-focusable flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-base shadow-lg shadow-sky-500/30 transition-all cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Play Movie</span>
                </button>
              ) : (
                <button
                  id="modal-play-first-ep-btn"
                  onClick={() => onPlayTVEpisode(m, selectedSeason, 1)}
                  className="tv-focusable flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Play Season {selectedSeason}, Ep 1</span>
                </button>
              )}

              <button
                id="modal-watchlist-btn"
                onClick={() => onToggleWatchlist(m)}
                className={`tv-focusable flex items-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${
                  isInWatchlist
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>
            </div>

            {/* Overview */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">Storyline</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {m.overview || 'No description provided.'}
              </p>
            </div>

            {/* Genres */}
            {m.genres && m.genres.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {m.genres.map((g) => (
                    <span
                      key={g.id}
                      className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* TV Show / Anime Episodes Section */}
            {isTV && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>Episodes Selection</span>
                  </h3>

                  {/* Season selector */}
                  {seasonsCount > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {Array.from({ length: seasonsCount }, (_, i) => i + 1).map((sNum) => (
                        <button
                          key={sNum}
                          onClick={() => setSelectedSeason(sNum)}
                          className={`tv-focusable px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            selectedSeason === sNum
                              ? 'bg-sky-500 text-white shadow-md'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                          }`}
                        >
                          Season {sNum}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Episodes List */}
                {loadingSeason ? (
                  <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                    <span>Loading episodes for Season {selectedSeason}...</span>
                  </div>
                ) : seasonDetails && seasonDetails.episodes && seasonDetails.episodes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto no-scrollbar pr-1">
                    {seasonDetails.episodes.map((ep: TMDBEpisode) => (
                      <div
                        key={ep.id}
                        onClick={() => onPlayTVEpisode(m, selectedSeason, ep.episode_number)}
                        className="tv-focusable group flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-sky-400 cursor-pointer transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-900">
                          {ep.still_path ? (
                            <img
                              src={`${IMAGE_BASE_W500}${ep.still_path}`}
                              alt={ep.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-xs font-bold">
                              EP {ep.episode_number}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 fill-white text-white" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-sky-400">
                              Ep {ep.episode_number}
                            </span>
                            {ep.air_date && (
                              <span className="text-[10px] text-slate-400">{ep.air_date.slice(0, 4)}</span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-white truncate mt-0.5 group-hover:text-sky-300">
                            {ep.name || `Episode ${ep.episode_number}`}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                            {ep.overview || 'Select to stream with EmbedMaster player.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-white/5 rounded-xl">
                    <p className="text-sm">Episodes info unavailable. Click Play to start Season {selectedSeason}, Episode 1.</p>
                    <button
                      onClick={() => onPlayTVEpisode(m, selectedSeason, 1)}
                      className="mt-3 px-4 py-2 rounded-lg bg-sky-500 text-white text-xs font-bold inline-flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Play Ep 1
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
