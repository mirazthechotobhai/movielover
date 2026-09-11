import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  FastForward,
  Rewind,
  Clock,
  SkipForward,
  SkipBack,
} from 'lucide-react';
import { MediaItem } from '../types';

interface ExternalControlBarProps {
  media: MediaItem;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSeekRelative: (deltaSeconds: number) => void;
  onTimeJump?: (minutes: number) => void;
  onMute?: () => void;
  onUnmute?: () => void;
  onToggleMute: () => void;
  onSetVolume: (percent: number) => void;
  onToggleFullscreen: () => void;
  onReload?: () => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const ExternalControlBar: React.FC<ExternalControlBarProps> = ({
  media,
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  onPlay,
  onTogglePlay,
  onSeek,
  onSeekRelative,
  onTimeJump,
  onToggleMute,
  onSetVolume,
  onToggleFullscreen,
  onReload,
  onNextEpisode,
  onPrevEpisode,
}) => {
  const [sliderValue, setSliderValue] = useState<number>(currentTime);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [timeJumpMinutes, setTimeJumpMinutes] = useState<string>('');

  useEffect(() => {
    if (!isScrubbing) {
      setSliderValue(currentTime);
    }
  }, [currentTime, isScrubbing]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSliderValue(val);
  };

  const handleSliderCommit = () => {
    setIsScrubbing(false);
    onSeek(sliderValue);
  };

  const handleTimeJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseFloat(timeJumpMinutes);
    if (!isNaN(mins) && mins >= 0) {
      if (onTimeJump) {
        onTimeJump(mins);
      } else {
        onSeek(mins * 60);
        if (!isPlaying) onPlay();
      }
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, (sliderValue / duration) * 100) : 0;

  return (
    <div
      id="embedmaster-external-control-bar"
      className="w-full bg-white border-b border-slate-200 shadow-sm px-4 sm:px-6 py-3 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        {/* Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-slate-500 min-w-[44px] text-right">
            {formatTime(sliderValue)}
          </span>

          <div className="relative flex-1 flex items-center py-1">
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 3600}
              step={1}
              value={sliderValue}
              onMouseDown={() => setIsScrubbing(true)}
              onTouchStart={() => setIsScrubbing(true)}
              onChange={handleSliderChange}
              onMouseUp={handleSliderCommit}
              onTouchEnd={handleSliderCommit}
              className="w-full h-1.5 rounded-lg appearance-none bg-slate-200 cursor-pointer accent-blue-600 hover:h-2 transition-all focus:outline-none"
              style={{
                background: `linear-gradient(to right, #2563eb ${progressPercent}%, #e2e8f0 ${progressPercent}%)`,
              }}
              title="Seek video"
            />
          </div>

          <span className="text-xs font-mono text-slate-400 min-w-[44px]">
            {duration > 0 ? formatTime(duration) : '--:--'}
          </span>
        </div>

        {/* Playback Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          {/* Left: Title & Season/Episode if applicable */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 truncate max-w-[220px] sm:max-w-xs">
                  {media.title}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                  {media.type === 'anime' ? 'Anime' : media.type === 'tv' ? 'TV' : 'Movie'}
                </span>
              </div>
              {(media.type === 'tv' || media.type === 'anime') && (
                <span className="text-xs text-slate-500 font-medium">
                  Season {media.season || 1}, Episode {media.episode || 1}
                </span>
              )}
            </div>

            {/* Quick Next/Prev Episode buttons for series */}
            {(media.type === 'tv' || media.type === 'anime') && (
              <div className="flex items-center gap-0.5 ml-2 border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={onPrevEpisode}
                  disabled={!media.episode || media.episode <= 1}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous Episode"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onNextEpisode}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  title="Next Episode"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Center: Play, Pause, Rewind 10s, Forward 10s */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="btn-seek-rewind-10"
              onClick={() => onSeekRelative(-10)}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-medium transition flex items-center gap-1 active:scale-95"
              title="Rewind 10s"
            >
              <Rewind className="w-3.5 h-3.5 text-slate-600" />
              <span>-10s</span>
            </button>

            <button
              id="btn-external-play-pause"
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all active:scale-95 shadow-sm ${
                isPlaying
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-900 hover:bg-black text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              id="btn-seek-forward-10"
              onClick={() => onSeekRelative(10)}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-medium transition flex items-center gap-1 active:scale-95"
              title="Forward 10s"
            >
              <FastForward className="w-3.5 h-3.5 text-slate-600" />
              <span>+10s</span>
            </button>

            {onReload && (
              <button
                onClick={onReload}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
                title="Reload video"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Time Jump, Volume, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Time Jump Box */}
            <form
              onSubmit={handleTimeJumpSubmit}
              className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                min="0"
                step="any"
                value={timeJumpMinutes}
                onChange={(e) => setTimeJumpMinutes(e.target.value)}
                placeholder="Min"
                className="w-12 px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium transition"
              >
                Go
              </button>
            </form>

            {/* Volume */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
              <button
                onClick={onToggleMute}
                className="text-slate-600 hover:text-slate-900 transition"
                title="Toggle Mute"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : volume < 50 ? (
                  <Volume1 className="w-4 h-4 text-slate-700" />
                ) : (
                  <Volume2 className="w-4 h-4 text-slate-700" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => onSetVolume(parseInt(e.target.value, 10))}
                className="w-14 sm:w-20 h-1.5 rounded-lg appearance-none bg-slate-200 cursor-pointer accent-blue-600"
              />
            </div>

            {/* Fullscreen */}
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
