import React, { useEffect, useState } from 'react';
import { TMDBMedia, TMDBEpisode, MediaType } from '../types';
import {
  fetchDetails,
  fetchSeasonEpisodes,
  TMDB_IMAGE_BASE,
  TMDB_BACKDROP_BASE,
  addToWatchlist,
  removeFromWatchlist,
  isItemInWatchlist
} from '../services/tmdb';
import { X, Play, Bookmark, BookmarkCheck, Star, Calendar, Tv, Film } from 'lucide-react';

interface MediaModalProps {
  media: TMDBMedia | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayMedia: (payload: {
    id: string; // IMDb or TMDB
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

export const MediaModal: React.FC<MediaModalProps> = ({
  media,
  isOpen,
  onClose,
  onPlayMedia,
}) => {
  const [details, setDetails] = useState<TMDBMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    if (!media || !isOpen) {
      setDetails(null);
      return;
    }

    const mediaType = media.media_type || (media.title ? 'movie' : 'tv');
    const watchlistId = `${mediaType}_${media.id}`;
    setInWatchlist(isItemInWatchlist(watchlistId));

    const loadDetails = async () => {
      setLoading(true);
      const res = await fetchDetails(mediaType, media.id);
      if (res) {
        setDetails(res);
      } else {
        setDetails(media);
      }
      setLoading(false);
    };

    loadDetails();
  }, [media, isOpen]);

  // Load episodes when season changes for TV shows
  useEffect(() => {
    if (!media) return;
    const isTV = (media.media_type || (media.title ? 'movie' : 'tv')) === 'tv';
    if (!isTV) return;

    const loadEpisodes = async () => {
      setLoadingEpisodes(true);
      const eps = await fetchSeasonEpisodes(media.id, selectedSeason);
      setEpisodes(eps);
      setLoadingEpisodes(false);
      setSelectedEpisode(1);
    };

    loadEpisodes();
  }, [media, selectedSeason]);

  if (!isOpen || !media) return null;

  const title = details?.title || details?.name || media.title || media.name || 'Untitled';
  const isTV = (media.media_type || (media.title ? 'movie' : 'tv')) === 'tv';
  const year = (media.release_date || media.first_air_date || '').split('-')[0] || '2024';
  const backdropUrl = media.backdrop_path ? `${TMDB_BACKDROP_BASE}${media.backdrop_path}` : null;
  const posterUrl = media.poster_path ? `${TMDB_IMAGE_BASE}${media.poster_path}` : null;
  const rating = Number(media.vote_average || 0).toFixed(1);

  const toggleWatchlist = () => {
    const watchlistId = `${isTV ? 'tv' : 'movie'}_${media.id}`;
    if (inWatchlist) {
      removeFromWatchlist(watchlistId);
      setInWatchlist(false);
    } else {
      addToWatchlist({
        id: watchlistId,
        mediaId: details?.imdb_id || media.id.toString(),
        tmdbId: media.id,
        title,
        type: isTV ? 'tv' : 'movie',
        posterPath: media.poster_path,
        rating: media.vote_average,
        year,
      });
      setInWatchlist(true);
    }
  };

  const handlePlay = () => {
    // If IMDb ID exists, prefer tt... id; otherwise use TMDB numerical ID as per EmbedMaster instructions
    const finalId = details?.imdb_id || media.id.toString();
    onPlayMedia({
      id: finalId,
      tmdbId: media.id,
      title,
      type: isTV ? 'tv' : 'movie',
      season: isTV ? selectedSeason : undefined,
      episode: isTV ? selectedEpisode : undefined,
      posterPath: posterUrl || undefined,
      backdropPath: backdropUrl || undefined,
      releaseYear: year,
      overview: media.overview || details?.overview
    });
    onClose();
  };

  return (
    <div
      id="media-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-[#14141c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Backdrop Banner */}
        <div className="relative h-48 sm:h-64 w-full bg-zinc-900 overflow-hidden">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#0f0f13] via-indigo-950/40 to-[#14141c]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14141c] via-[#14141c]/60 to-transparent" />

          {/* Close Button */}
          <button
            id="btn-close-media-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold text-amber-400 border border-white/10">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {rating}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-zinc-300 border border-white/10">
              {isTV ? <Tv className="w-3.5 h-3.5 text-indigo-400" /> : <Film className="w-3.5 h-3.5 text-rose-400" />}
              {isTV ? 'TV Series' : 'Movie'}
            </span>
            {year && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-zinc-300 border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {year}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 pt-2">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Poster Thumbnail */}
            {posterUrl && (
              <div className="hidden sm:block w-28 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-lg -mt-16 z-10 bg-zinc-900">
                <img
                  src={posterUrl}
                  alt={title}
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug mb-2">
                {title}
              </h2>

              {/* Genres */}
              {details?.genres && details.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {details.genres.map((g) => (
                    <span
                      key={g.id}
                      className="text-xs px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-zinc-300 leading-relaxed line-clamp-4 mb-4">
                {media.overview || details?.overview || 'No overview available for this title.'}
              </p>
            </div>
          </div>

          {/* TV Show Season & Episode Picker */}
          {isTV && (
            <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Select Season & Episode
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Season</label>
                  <select
                    id="select-season"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f0f13] border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {Array.from({ length: details?.number_of_seasons || 5 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Season {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Episode</label>
                  <select
                    id="select-episode"
                    value={selectedEpisode}
                    onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f0f13] border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
                    disabled={loadingEpisodes}
                  >
                    {episodes.length > 0 ? (
                      episodes.map((ep) => (
                        <option key={ep.episode_number} value={ep.episode_number}>
                          Ep {ep.episode_number}: {ep.name || `Episode ${ep.episode_number}`}
                        </option>
                      ))
                    ) : (
                      Array.from({ length: 10 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Episode {i + 1}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              id="btn-play-stream"
              onClick={handlePlay}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {isTV ? `Play S${selectedSeason}:E${selectedEpisode} on TV` : 'Play Movie on TV'}
              </span>
            </button>

            <button
              id="btn-toggle-watchlist"
              onClick={toggleWatchlist}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                inWatchlist
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {inWatchlist ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-amber-400" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-zinc-400" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
