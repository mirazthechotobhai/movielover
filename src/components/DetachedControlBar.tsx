import React from 'react';
import { PlaybackState, MediaItem } from '../types';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Shield,
  ShieldCheck,
  Smartphone,
  Tv,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

interface DetachedControlBarProps {
  playbackState: PlaybackState;
  media: MediaItem;
  touchShieldActive: boolean;
  onToggleTouchShield: () => void;
  onSendCommand: (command: string, value?: any) => void;
  onSeekTo: (seconds: number) => void;
  onSetVolume: (percent: number) => void;
  onTogglePlay: () => void;
  onStop?: () => void;
  onToggleMute: () => void;
  onRequestFullscreen: () => void;
  onOpenRemotePage: () => void;
  onOpenPurePlayer: () => void;
  isPurePlayerMode?: boolean;
  onChangeEpisode?: (season: number, episode: number) => void;
  onOpenSettings?: () => void;
}

export const DetachedControlBar: React.FC<DetachedControlBarProps> = ({
  playbackState,
  media,
  touchShieldActive,
  onToggleTouchShield,
  onSendCommand,
  onSeekTo,
  onSetVolume,
  onTogglePlay,
  onStop,
  onToggleMute,
  onRequestFullscreen,
  onOpenRemotePage,
  onOpenPurePlayer,
  isPurePlayerMode = false,
  onChangeEpisode,
  onOpenSettings,
}) => {
  const formatTime = (totalSeconds: number) => {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentSec = Math.floor(playbackState.currentTime || 0);
  const durationSec = Math.floor(playbackState.duration || 0);

  const handleSeekSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onSeekTo(val);
  };

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onSetVolume(val);
  };

  const handleJump = (delta: number) => {
    const target = Math.max(0, currentSec + delta);
    onSeekTo(target);
  };

  const handlePrevEp = () => {
    if (media.type === 'tv' && onChangeEpisode) {
      const currentEp = media.episode || 1;
      const currentSeason = media.season || 1;
      if (currentEp > 1) {
        onChangeEpisode(currentSeason, currentEp - 1);
      } else if (currentSeason > 1) {
        onChangeEpisode(currentSeason - 1, 8);
      }
    }
  };

  const handleNextEp = () => {
    if (media.type === 'tv' && onChangeEpisode) {
      const currentEp = media.episode || 1;
      const currentSeason = media.season || 1;
      const maxEp = media.episodesPerSeason || 10;
      if (currentEp < maxEp) {
        onChangeEpisode(currentSeason, currentEp + 1);
      } else {
        onChangeEpisode(currentSeason + 1, 1);
      }
    }
  };

  return (
    <div
      id="detached_control_bar"
      className="w-full bg-[#111111] border-2 border-[#222222] rounded-none sm:rounded-md p-4 sm:p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] transition-all"
    >
      {/* Top Console Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#222222] hardware-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0a0a0a] border border-[#333333] rounded-[3px]">
            <span className="led led-cyan"></span>
            <span className="text-[#888888] text-[10px] uppercase tracking-wider">CONSOLE DECK:</span>
            <span className="text-[#00F0FF] font-bold text-[11px] tracking-wide">OPERATIONAL</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white font-semibold tracking-wide truncate max-w-xs sm:max-w-md">
              {media.title}
            </span>
            {media.type === 'tv' && (
              <span className="text-[11px] text-[#00F0FF] bg-[#152528] px-2 py-0.5 border border-[#00F0FF]/40 rounded-[3px]">
                S{media.season || 1} • E{media.episode || 1}
              </span>
            )}
          </div>
        </div>

        {/* Quick Console Action Switches */}
        <div className="flex items-center gap-2">
          {/* Touch Shield Button */}
          <button
            id="toggle_touch_shield_btn"
            onClick={onToggleTouchShield}
            title={touchShieldActive ? "Touch Shield is ON: Clicks inside player are blocked" : "Touch Shield is OFF: Clicks inside player are allowed"}
            className={`px-3 py-1 text-xs hardware-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer border rounded-[3px] ${
              touchShieldActive
                ? 'bg-[#221800] text-[#FFB300] border-[#FFB300] shadow-[0_0_8px_rgba(255,179,0,0.3)]'
                : 'bg-[#1a1a1a] text-[#888888] border-[#333333] hover:text-white'
            }`}
          >
            <span className={`led ${touchShieldActive ? 'led-amber' : ''}`}></span>
            <span>SHIELD: {touchShieldActive ? 'ARMED' : 'FREE'}</span>
          </button>

          {/* Open Dedicated Remote Page */}
          <button
            id="open_remote_page_btn"
            onClick={onOpenRemotePage}
            title="Open dedicated remote control in new tab or remote view"
            className="hardware-btn px-3 py-1 text-xs hardware-mono font-medium flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>REMOTE_VIEW</span>
          </button>

          {/* Pure Screen Toggle */}
          <button
            id="toggle_pure_player_btn"
            onClick={onOpenPurePlayer}
            title={isPurePlayerMode ? "Exit pure monitor" : "Switch to pure monitor"}
            className="hardware-btn px-3 py-1 text-xs hardware-mono font-medium flex items-center gap-1.5"
          >
            <Tv className="w-3.5 h-3.5 text-[#888888]" />
            <span>{isPurePlayerMode ? "EXIT_MONITOR" : "MONITOR_ONLY"}</span>
          </button>

          {/* Player Options / Settings */}
          {onOpenSettings && (
            <button
              id="open_player_settings_btn"
              onClick={onOpenSettings}
              title="EmbedMaster Parameters (Skin, Welcome Page, Autoplay, Subtitles)"
              className="hardware-btn p-1 px-2 text-xs hardware-mono flex items-center"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00F0FF]" />
            </button>
          )}
        </div>
      </div>

      {/* Main 3-Column Industrial Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Section: Status Display */}
        <div className="lg:col-span-3 bg-[#0a0a0a] border border-[#333333] rounded-[4px] p-3 flex flex-col justify-between gap-2.5 hardware-mono">
          <div>
            <div className="text-[10px] text-[#888888] uppercase tracking-wider mb-0.5">SOURCE ID</div>
            <div className="text-xs text-[#00F0FF] font-bold truncate">IMDb: {media.id}</div>
          </div>

          <div>
            <div className="text-[10px] text-[#888888] uppercase tracking-wider mb-0.5">PLAYBACK STATUS</div>
            <div className={`text-xs font-bold flex items-center gap-1.5 ${playbackState.isPlaying ? 'text-[#00FF66]' : 'text-[#FFB300]'}`}>
              <span className={`led ${playbackState.isPlaying ? 'led-green' : 'led-amber'}`}></span>
              <span>{playbackState.isPlaying ? 'STREAMING / PLAY' : 'STANDBY / PAUSED'}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[#888888] uppercase tracking-wider mb-0.5">FORMAT & ENGINE</div>
            <div className="text-xs text-[#888888]">
              <span className="text-white font-medium">{media.type === 'tv' ? 'EPISODIC 1080P' : 'CINEMA 4K UHD'}</span>
            </div>
          </div>
        </div>

        {/* Center Section: Progress Container & Scrubber & Button Grid */}
        <div className="lg:col-span-6 bg-[#0a0a0a] border border-[#333333] rounded-[4px] p-3.5 flex flex-col justify-between">
          {/* Time Displays */}
          <div className="flex justify-between hardware-mono text-xs mb-1.5">
            <span className="text-[#00F0FF] font-bold">{formatTime(currentSec)}</span>
            <span className="text-[#888888] font-medium">
              {durationSec > 0 ? formatTime(durationSec) : '02:14:00 (EST)'}
            </span>
          </div>

          {/* Scrubber Rail */}
          <div className="relative w-full my-1 group">
            <input
              id="timeline_seek_slider"
              type="range"
              min={0}
              max={durationSec > 0 ? durationSec : 7200}
              value={currentSec}
              onChange={handleSeekSlider}
              className="hardware-slider w-full h-2 bg-[#222222] rounded-none appearance-none cursor-pointer focus:outline-none"
            />
          </div>

          {/* Quick Seek Presets Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 my-1 hardware-mono text-[10px]">
            <span className="text-[#666666] uppercase mr-1">SEEK:</span>
            {[
              { label: '0s', val: 0 },
              { label: '30s', val: 30 },
              { label: '60s', val: 60 },
              { label: '5m', val: 300 },
              { label: '15m', val: 900 },
              { label: '30m', val: 1800 },
              { label: '60m', val: 3600 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => onSeekTo(p.val)}
                className="px-2 py-0.5 bg-[#161616] hover:bg-[#252525] border border-[#333333] text-[#aaaaaa] hover:text-[#00F0FF] rounded-[2px] cursor-pointer transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Tactile Hardware 8-Button Grid */}
          <div className="grid grid-cols-8 gap-1.5 mt-2">
            {/* 1. Rewind -10s */}
            <button
              id="btn_seek_minus_10"
              onClick={() => handleJump(-10)}
              title="Step -10s"
              className="hardware-btn h-11 flex items-center justify-center text-xs hardware-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* 2. Play/Pause Primary */}
            <button
              id="btn_main_play_pause"
              onClick={onTogglePlay}
              title={playbackState.isPlaying ? "Pause" : "Play"}
              className={`hardware-btn col-span-2 h-11 flex items-center justify-center font-bold text-xs hardware-mono transition-all ${
                playbackState.isPlaying
                  ? 'bg-[#152528] text-[#00F0FF] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'bg-[#1a1a1a] text-white hover:border-[#00F0FF]'
              }`}
            >
              {playbackState.isPlaying ? (
                <div className="flex items-center gap-1.5">
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>PLAY</span>
                </div>
              )}
            </button>

            {/* 3. Forward +10s */}
            <button
              id="btn_seek_plus_10"
              onClick={() => handleJump(10)}
              title="Step +10s"
              className="hardware-btn h-11 flex items-center justify-center text-xs hardware-mono"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* 4. Real Stop Stream */}
            <button
              id="btn_stream_stop"
              onClick={() => {
                if (onStop) {
                  onStop();
                } else {
                  onSendCommand('stop');
                  onSeekTo(0);
                }
              }}
              title="Stop Playback (Halt stream and pause)"
              className="hardware-btn h-11 flex items-center justify-center text-xs hardware-mono text-[#ff4444] hover:text-white hover:border-[#ff4444]"
            >
              <div className="flex flex-col items-center gap-0.5">
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="font-bold text-[9px]">STOP</span>
              </div>
            </button>

            {/* 5. Prev Ep / Step */}
            <button
              id="btn_prev_episode"
              onClick={handlePrevEp}
              title="Previous Episode"
              className="hardware-btn h-11 flex items-center justify-center text-xs hardware-mono"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* 6. Next Ep / Step */}
            <button
              id="btn_next_episode"
              onClick={handleNextEp}
              title="Next Episode"
              className="hardware-btn h-11 flex items-center justify-center text-xs hardware-mono"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* 7. Fullscreen */}
            <button
              id="btn_external_fullscreen"
              onClick={onRequestFullscreen}
              title="Toggle Fullscreen"
              className="hardware-btn h-11 flex items-center justify-center text-xs hardware-mono"
            >
              {playbackState.isFullscreen ? (
                <Minimize className="w-4 h-4 text-[#00F0FF]" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Right Section: Audio & System Hardware Metering */}
        <div className="lg:col-span-3 bg-[#0a0a0a] border border-[#333333] rounded-[4px] p-3 flex flex-col justify-between gap-3 hardware-mono">
          <div>
            <div className="text-[10px] text-[#888888] uppercase tracking-wider mb-1">AUDIO BUS</div>
            <div className="text-xs text-[#00F0FF] font-bold">5.1 SURROUND DAC</div>
          </div>

          {/* Precision Volume Level Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[#888888]">
              <span>MASTER VOL</span>
              <span className="text-[#00F0FF] font-bold">
                {playbackState.isMuted ? 'MUTED' : `${playbackState.volume}%`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="volume_slider_bar"
                type="range"
                min={0}
                max={100}
                value={playbackState.isMuted ? 0 : playbackState.volume}
                onChange={handleVolumeSlider}
                className="hardware-slider w-full h-2 bg-[#222222] rounded-none appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Volume & Full Controls Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              id="btn_toggle_mute"
              onClick={onToggleMute}
              className={`hardware-btn py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 ${
                playbackState.isMuted ? 'bg-[#2b1010] border-[#FF2233] text-[#FF2233]' : ''
              }`}
            >
              {playbackState.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#00F0FF]" />}
              <span>MUTE</span>
            </button>

            <button
              id="btn_vol_50"
              onClick={() => onSetVolume(50)}
              className="hardware-btn py-1.5 text-[11px] font-bold"
            >
              50%
            </button>

            <button
              id="btn_vol_100"
              onClick={() => onSetVolume(100)}
              className="hardware-btn py-1.5 text-[11px] font-bold text-[#00F0FF]"
            >
              100%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
