import React from 'react';
import { MediaItem } from '../types';
import { Play } from 'lucide-react';
import { getEpisodesForSeason } from '../services/tmdbApi';

interface EpisodeSelectorProps {
  media: MediaItem;
  activeSeason: number;
  activeEpisode: number;
  onSelectEpisode: (season: number, episode: number) => void;
  isTvConnected?: boolean;
  connectedRoomCode?: string | null;
}

export const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  media,
  activeSeason,
  activeEpisode,
  onSelectEpisode,
}) => {
  if (media.type !== 'tv' && media.type !== 'anime') {
    return null;
  }

  const totalSeasons = media.seasonsInfo?.length || media.totalSeasons || 1;
  const seasons = media.seasonsInfo && media.seasonsInfo.length > 0
    ? media.seasonsInfo.map((s) => s.seasonNumber)
    : Array.from({ length: totalSeasons }, (_, i) => i + 1);
  const episodes = getEpisodesForSeason(media, activeSeason);

  return (
    <div
      id="dynamic-episode-selector"
      className="w-full bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3.5"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        {/* Season Selector */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">
            Episodes ({media.title})
          </span>

          {totalSeasons > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => onSelectEpisode(s, 1)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap active:scale-95 ${
                    activeSeason === s
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Season {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Episode Chips */}
        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {episodes.map((ep) => {
            const isActive = activeSeason === (media.season || 1) && activeEpisode === ep;

            return (
              <button
                key={ep}
                onClick={() => onSelectEpisode(activeSeason, ep)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
                }`}
                title={`Season ${activeSeason} Episode ${ep}`}
              >
                {isActive && <Play className="w-2.5 h-2.5 fill-white" />}
                <span>{ep}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
