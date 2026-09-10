import { FC, useEffect, useState } from 'react';
import { X, Play, Tv, Calendar, Star, Clock, Loader2, Sparkles } from 'lucide-react';
import { TMDBMediaItem, TMDBEpisode, MediaPlayPayload } from '../types';
import { tmdbService, getPosterUrl, getBackdropUrl, getStreamUrlForMedia } from '../api/tmdbService';

interface EpisodeSelectorModalProps {
  show: TMDBMediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayEpisode: (payload: MediaPlayPayload, castToTv?: boolean) => void;
  isTvConnected: boolean;
  tvRoomCode: string | null;
}

export const EpisodeSelectorModal: FC<EpisodeSelectorModalProps> = ({
  show,
  isOpen,
  onClose,
  onPlayEpisode,
  isTvConnected,
  tvRoomCode,
}) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);
  const [totalSeasons, setTotalSeasons] = useState<number>(1);

  useEffect(() => {
    if (!isOpen || !show) return;

    const count = show.number_of_seasons || (show.seasons ? show.seasons.length : 1);
    setTotalSeasons(Math.max(1, count));
    setSelectedSeason(1);
  }, [isOpen, show]);

  useEffect(() => {
    if (!isOpen || !show) return;

    let isMounted = true;
    setIsLoadingEpisodes(true);

    tmdbService
      .getSeasonEpisodes(show.id, selectedSeason)
      .then((data) => {
        if (isMounted) {
          setEpisodes(data);
          setIsLoadingEpisodes(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load season episodes:', err);
        if (isMounted) {
          setEpisodes([]);
          setIsLoadingEpisodes(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, show, selectedSeason]);

  if (!isOpen || !show) return null;

  const handleSelectEpisode = (ep: TMDBEpisode, castToTv = false) => {
    const payload: MediaPlayPayload = {
      mediaId: show.id,
      mediaType: 'tv',
      title: show.name || show.title || 'Untitled Show',
      overview: ep.overview || show.overview || '',
      posterUrl: getPosterUrl(show.poster_path),
      backdropUrl: ep.still_path ? getBackdropUrl(ep.still_path) : getBackdropUrl(show.backdrop_path),
      videoUrl: getStreamUrlForMedia(show.id, 'tv', selectedSeason, ep.episode_number),
      releaseYear: (ep.air_date || show.first_air_date || '').slice(0, 4),
      rating: ep.vote_average || show.vote_average,
      seasonNumber: selectedSeason,
      episodeNumber: ep.episode_number,
      episodeTitle: ep.name,
    };

    onPlayEpisode(payload, castToTv);
    onClose();
  };

  return (
    <div
      id="episode-selector-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="episode-selector-modal-content"
        className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col overflow-hidden text-white relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Backdrop */}
        <div className="relative h-44 sm:h-56 w-full flex-shrink-0 bg-neutral-950 overflow-hidden">
          <img
            src={getBackdropUrl(show.backdrop_path, 'w1280')}
            alt={show.name || show.title}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-neutral-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Details */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
            <img
              src={getPosterUrl(show.poster_path, 'w342')}
              alt={show.name || show.title}
              className="w-20 sm:w-28 aspect-2/3 object-cover rounded-xl shadow-2xl border border-neutral-700 hidden xs:block flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">TV Series & Episodes</span>
              <h2 className="text-xl sm:text-2xl font-black text-white truncate">{show.name || show.title}</h2>
              <div className="flex items-center gap-3 text-xs text-neutral-300 mt-1">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {show.vote_average ? show.vote_average.toFixed(1) : 'N/A'}
                </span>
                <span>{(show.first_air_date || '').slice(0, 4)}</span>
                <span>{totalSeasons} Season{totalSeasons > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Season Selector Tabs */}
        <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-neutral-800 bg-neutral-950/60 overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider pl-1 mr-2 flex-shrink-0">
            Season:
          </span>
          {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((sNum) => (
            <button
              key={sNum}
              onClick={() => setSelectedSeason(sNum)}
              id={`season-tab-${sNum}`}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                selectedSeason === sNum
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/30 scale-105'
                  : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300'
              }`}
            >
              Season {sNum}
            </button>
          ))}
        </div>

        {/* Episodes List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
          {isLoadingEpisodes ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
              <p className="text-sm">Loading Season {selectedSeason} Episodes...</p>
            </div>
          ) : episodes.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <p className="text-sm">No episodes found for this season.</p>
            </div>
          ) : (
            episodes.map((ep) => (
              <div
                key={ep.id}
                id={`episode-card-${ep.episode_number}`}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-2xl bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800/80 hover:border-cyan-500/40 transition gap-4"
              >
                {/* Thumbnail & Index */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-28 sm:w-36 aspect-16/9 bg-neutral-900 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-800">
                    <img
                      src={
                        ep.still_path
                          ? getBackdropUrl(ep.still_path, 'w780')
                          : getPosterUrl(show.poster_path, 'w342')
                      }
                      alt={ep.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono font-bold text-white">
                      E{ep.episode_number}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition">
                      {ep.episode_number}. {ep.name}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                      {ep.air_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          {ep.air_date}
                        </span>
                      )}
                      {ep.runtime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {ep.runtime}m
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed hidden sm:block">
                      {ep.overview || 'No episode description available.'}
                    </p>
                  </div>
                </div>

                {/* Action: Play on TV */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                  <button
                    onClick={() => handleSelectEpisode(ep, true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-xs shadow-md transition transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <Tv className="w-3.5 h-3.5" />
                    <span>Play on TV</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
