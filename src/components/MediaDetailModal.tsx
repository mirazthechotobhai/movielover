import { FC, useState, useEffect } from 'react';
import {
  X,
  Play,
  Tv,
  Star,
  Calendar,
  Clock,
  Film,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { TMDBMediaItem, MediaPlayPayload } from '../types';
import {
  tmdbService,
  getPosterUrl,
  getBackdropUrl,
  getStreamUrlForMedia,
} from '../api/tmdbService';

interface MediaDetailModalProps {
  media: TMDBMediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayMedia: (payload: MediaPlayPayload, castToTv?: boolean) => void;
  onOpenEpisodes: (media: TMDBMediaItem) => void;
  isTvConnected: boolean;
  tvRoomCode: string | null;
}

export const MediaDetailModal: FC<MediaDetailModalProps> = ({
  media,
  isOpen,
  onClose,
  onPlayMedia,
  onOpenEpisodes,
  isTvConnected,
  tvRoomCode,
}) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState<boolean>(false);

  const isShow = media?.media_type === 'tv' || !!media?.first_air_date;

  useEffect(() => {
    if (!isOpen || !media) {
      setTrailerKey(null);
      setShowTrailer(false);
      return;
    }

    const type = isShow ? 'tv' : 'movie';
    tmdbService.getTrailerVideoKey(type, media.id).then((key) => {
      setTrailerKey(key);
    });
  }, [isOpen, media, isShow]);

  if (!isOpen || !media) return null;

  const title = media.title || media.name || 'Untitled';
  const releaseYear = (media.release_date || media.first_air_date || '').slice(0, 4);

  const handlePlayNow = (castToTv = false) => {
    if (isShow) {
      onClose();
      onOpenEpisodes(media);
      return;
    }

    const payload: MediaPlayPayload = {
      mediaId: media.id,
      mediaType: 'movie',
      title,
      overview: media.overview || '',
      posterUrl: getPosterUrl(media.poster_path),
      backdropUrl: getBackdropUrl(media.backdrop_path),
      videoUrl: getStreamUrlForMedia(media.id, 'movie'),
      releaseYear,
      rating: media.vote_average,
    };

    onPlayMedia(payload, castToTv);
    onClose();
  };

  return (
    <div
      id="media-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="media-detail-modal-content"
        className="w-full max-w-3xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Banner / Trailer Embed */}
        <div className="relative h-60 sm:h-80 w-full bg-neutral-950 flex-shrink-0 overflow-hidden">
          {showTrailer && trailerKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&modestbranding=1&rel=0`}
              title={`${title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <>
              <img
                src={getBackdropUrl(media.backdrop_path, 'w1280')}
                alt={title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
            </>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-black text-neutral-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Trailer toggle button */}
          {trailerKey && !showTrailer && (
            <button
              onClick={() => setShowTrailer(true)}
              className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 border border-neutral-700 text-xs font-semibold text-neutral-200 transition"
            >
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>Watch Official Trailer</span>
            </button>
          )}

          {showTrailer && (
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-700 text-xs font-semibold text-neutral-200 transition"
            >
              <span>Close Trailer</span>
            </button>
          )}
        </div>

        {/* Content Details */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 custom-scrollbar">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {isShow ? 'TV Series' : 'Feature Film'}
                </span>
                {media.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {media.vote_average.toFixed(1)} / 10
                  </span>
                )}
                {releaseYear && (
                  <span className="text-xs text-neutral-400 font-medium">{releaseYear}</span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{title}</h2>
            </div>

            {/* Quick Play Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {isShow ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenEpisodes(media);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Choose Episodes</span>
                </button>
              ) : (
                <>
                  <button
                    id="modal-btn-play-tv"
                    onClick={() => handlePlayNow(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-sm shadow-lg shadow-cyan-500/20 transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <Tv className="w-4 h-4" />
                    <span>Play on TV Player</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Overview */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Overview</h4>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-normal">
              {media.overview || 'No synopsis provided for this title.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
