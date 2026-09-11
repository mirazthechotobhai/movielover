import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ChevronRight, 
  ChevronLeft, 
  Tv, 
  ListVideo,
  X,
  Loader2
} from 'lucide-react';
import { ActivePlayTarget, TMDBSeasonDetails, TMDBEpisode } from '../types';
import { tmdbService, IMAGE_BASE_W500 } from '../services/tmdb';

interface PlayerViewProps {
  playTarget: ActivePlayTarget;
  onClose: () => void;
  onChangeEpisode?: (season: number, episode: number) => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  playTarget,
  onClose,
  onChangeEpisode
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [playerEventLog, setPlayerEventLog] = useState<string>('Initializing player...');
  const [currentSeason, setCurrentSeason] = useState(playTarget.season || 1);
  const [currentEpisode, setCurrentEpisode] = useState(playTarget.episode || 1);

  // In-Player Episodes Drawer
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);
  const [selectedSeasonDrawer, setSelectedSeasonDrawer] = useState(playTarget.season || 1);
  const [totalSeasons, setTotalSeasons] = useState<number>(1);
  const [seasonDetails, setSeasonDetails] = useState<TMDBSeasonDetails | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { media, mediaType } = playTarget;
  const isTV = mediaType === 'tv' || (mediaType === 'anime' && (media.media_type === 'tv' || !!media.first_air_date));
  const title = media.title || media.name || media.original_title || media.original_name || 'Video';

  // Construct EmbedMaster URL
  const embedUrl = isTV
    ? `https://embedmaster.link/tv/${media.id}/${currentSeason}/${currentEpisode}?skin=onyx&welcome_page=off&autoplay=on`
    : `https://embedmaster.link/movie/${media.id}?skin=onyx&welcome_page=off&autoplay=on`;

  // Fetch season count if TV
  useEffect(() => {
    if (!isTV) return;
    if (media.number_of_seasons) {
      setTotalSeasons(media.number_of_seasons);
    } else {
      tmdbService.getTVDetails(media.id).then((tv) => {
        if (tv.number_of_seasons) setTotalSeasons(tv.number_of_seasons);
      }).catch(() => {});
    }
  }, [isTV, media.id, media.number_of_seasons]);

  // Fetch episodes for drawer when opened or season changed
  useEffect(() => {
    if (!isTV || !showEpisodesDrawer) return;

    let active = true;
    setLoadingEpisodes(true);
    tmdbService.getSeasonDetails(media.id, selectedSeasonDrawer)
      .then((data) => {
        if (active) setSeasonDetails(data);
      })
      .catch(() => {
        if (active) setSeasonDetails(null);
      })
      .finally(() => {
        if (active) setLoadingEpisodes(false);
      });

    return () => {
      active = false;
    };
  }, [isTV, showEpisodesDrawer, selectedSeasonDrawer, media.id]);

  // Send command to EmbedMaster player iframe
  const sendCommand = useCallback((command: string, value?: string | number) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          source: 'embedmaster_player_command',
          command,
          value
        },
        '*'
      );
    }
  }, []);

  const seekRelative = useCallback((deltaSeconds: number) => {
    sendCommand('seek', deltaSeconds);
    setPlayerEventLog(`Seek ${deltaSeconds > 0 ? '+' : ''}${deltaSeconds}s`);
  }, [sendCommand]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      sendCommand('pause');
      setIsPlaying(false);
      setPlayerEventLog('Paused');
    } else {
      sendCommand('play');
      setIsPlaying(true);
      setPlayerEventLog('Playing');
    }
  }, [isPlaying, sendCommand]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      sendCommand('unmute');
      setIsMuted(false);
      setPlayerEventLog('Unmuted');
    } else {
      sendCommand('mute');
      setIsMuted(true);
      setPlayerEventLog('Muted');
    }
  }, [isMuted, sendCommand]);

  const handleSetVolume = useCallback((newVol: number) => {
    setVolumeState(newVol);
    sendCommand('volume', newVol);
    setPlayerEventLog(`Volume ${newVol}%`);
  }, [sendCommand]);

  const triggerFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {
          sendCommand('fullscreen');
        });
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } else {
      sendCommand('fullscreen');
    }
  }, [sendCommand]);

  // Next / Prev episode
  const handleNextEpisode = useCallback(() => {
    const nextEp = currentEpisode + 1;
    setCurrentEpisode(nextEp);
    if (onChangeEpisode) onChangeEpisode(currentSeason, nextEp);
  }, [currentEpisode, currentSeason, onChangeEpisode]);

  const handlePrevEpisode = useCallback(() => {
    if (currentEpisode > 1) {
      const prevEp = currentEpisode - 1;
      setCurrentEpisode(prevEp);
      if (onChangeEpisode) onChangeEpisode(currentSeason, prevEp);
    }
  }, [currentEpisode, currentSeason, onChangeEpisode]);

  const handleSelectEpisode = (season: number, epNumber: number) => {
    setCurrentSeason(season);
    setCurrentEpisode(epNumber);
    setShowEpisodesDrawer(false);
    if (onChangeEpisode) onChangeEpisode(season, epNumber);
    setPlayerEventLog(`Playing S${season}:E${epNumber}`);
  };

  // Reset auto-hide timer for OSD controls
  const bumpControlsVisibility = useCallback(() => {
    if (showEpisodesDrawer) return; // Keep visible while drawer is open
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  }, [showEpisodesDrawer]);

  // Listen for EmbedMaster postMessage events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== 'embedmaster_player') return;

      if (data.event === 'play') {
        setIsPlaying(true);
        setPlayerEventLog('Video playing');
      } else if (data.event === 'pause') {
        setIsPlaying(false);
        setPlayerEventLog('Video paused');
      } else if (data.event) {
        setPlayerEventLog(`Player event: ${data.event}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // TV Remote keyboard navigation inside player
  useEffect(() => {
    bumpControlsVisibility();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showEpisodesDrawer) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          setShowEpisodesDrawer(false);
        }
        return;
      }

      bumpControlsVisibility();

      switch (e.key) {
        case 'Escape':
        case 'Backspace':
        case 'GoBack':
          e.preventDefault();
          onClose();
          break;
        case ' ':
        case 'MediaPlayPause':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'MediaPlay':
          e.preventDefault();
          sendCommand('play');
          setIsPlaying(true);
          break;
        case 'MediaPause':
          e.preventDefault();
          sendCommand('pause');
          setIsPlaying(false);
          break;
        case 'ArrowLeft':
          seekRelative(-10);
          break;
        case 'ArrowRight':
          seekRelative(10);
          break;
        case 'ArrowUp':
          bumpControlsVisibility();
          break;
        case 'ArrowDown':
          setShowControls(false);
          break;
        case 'f':
        case 'F':
          triggerFullscreen();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'n':
        case 'N':
          if (isTV) handleNextEpisode();
          break;
        case 'p':
        case 'P':
          if (isTV) handlePrevEpisode();
          break;
        case 'e':
        case 'E':
          if (isTV) setShowEpisodesDrawer(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [
    bumpControlsVisibility, 
    onClose, 
    togglePlayPause, 
    sendCommand, 
    seekRelative, 
    triggerFullscreen, 
    toggleMute, 
    isTV, 
    handleNextEpisode, 
    handlePrevEpisode,
    showEpisodesDrawer
  ]);

  return (
    <div
      ref={containerRef}
      onMouseMove={bumpControlsVisibility}
      onClick={bumpControlsVisibility}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center select-none"
    >
      {/* 16:9 Aspect Ratio or Full Screen Container */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        <iframe
          id="embedmaster_iframe"
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full border-0 absolute inset-0"
          allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *"
          allowFullScreen
          title={title}
        />
      </div>

      {/* Top Header Bar (Auto-Hides) */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/95 via-black/60 to-transparent transition-opacity duration-300 pointer-events-auto flex items-center justify-between z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            id="player-back-btn"
            onClick={onClose}
            className="tv-focusable flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/20 shadow-lg text-sm font-semibold transition-all cursor-pointer"
            title="Exit Player (Remote Back / ESC)"
          >
            <ArrowLeft className="w-5 h-5 text-sky-400" />
            <span className="hidden sm:inline">Back to TV Home</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-base sm:text-lg drop-shadow line-clamp-1">
                {title}
              </h2>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold uppercase">
                {isTV ? `S${currentSeason} : E${currentEpisode}` : 'Movie'}
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>EmbedMaster Fast Player</span>
              <span>•</span>
              <span className="text-sky-400 font-mono">{playerEventLog}</span>
            </p>
          </div>
        </div>

        {/* Remote Quick Guide Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-slate-300">
          <Tv className="w-3.5 h-3.5 text-sky-400" />
          <span>Remote: <strong>OK</strong> Play/Pause • <strong>◀ / ▶</strong> Seek 10s • <strong>Back</strong> Exit</span>
        </div>
      </div>

      {/* Bottom TV Remote OSD Control HUD (Auto-Hides) */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Controls Buttons Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                id="player-ctrl-play"
                onClick={togglePlayPause}
                className="tv-focusable p-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-lg shadow-sky-500/30 transition-all cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                id="player-ctrl-seek-back"
                onClick={() => seekRelative(-10)}
                className="tv-focusable p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
                title="Rewind 10 Seconds (Left Arrow)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                id="player-ctrl-seek-fwd"
                onClick={() => seekRelative(10)}
                className="tv-focusable p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
                title="Fast Forward 10 Seconds (Right Arrow)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* TV Episode Navigator & Episodes Picker */}
              {isTV && (
                <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-white/15">
                  <button
                    onClick={handlePrevEpisode}
                    disabled={currentEpisode <= 1}
                    className="tv-focusable p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white border border-white/15 cursor-pointer"
                    title="Previous Episode"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-2 text-slate-300">
                    Ep {currentEpisode}
                  </span>
                  <button
                    onClick={handleNextEpisode}
                    className="tv-focusable p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 cursor-pointer flex items-center gap-1 text-xs font-bold"
                    title="Next Episode"
                  >
                    <span>Next Ep</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Open In-Player Episodes List */}
                  <button
                    onClick={() => setShowEpisodesDrawer(true)}
                    className="tv-focusable ml-1 px-3 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-500/40 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="All Episodes & Seasons"
                  >
                    <ListVideo className="w-4 h-4" />
                    <span>Episodes</span>
                  </button>
                </div>
              )}
            </div>

            {/* Volume & Fullscreen Controls */}
            <div className="flex items-center gap-2">
              <button
                id="player-ctrl-mute"
                onClick={toggleMute}
                className="tv-focusable p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleSetVolume(Number(e.target.value))}
                  className="w-20 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  title={`Volume: ${volume}%`}
                />
                <span className="text-xs font-mono text-slate-300">{volume}%</span>
              </div>

              <button
                id="player-ctrl-fullscreen"
                onClick={triggerFullscreen}
                className="tv-focusable p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
                title="Fullscreen Toggle"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* In-Player Episodes Drawer / Overlay for TV and Anime */}
      {showEpisodesDrawer && (
        <div
          className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6"
          onClick={() => setShowEpisodesDrawer(false)}
        >
          <div
            className="w-full max-w-3xl bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ListVideo className="w-5 h-5 text-sky-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {title} • Select Episode
                </h3>
              </div>
              <button
                onClick={() => setShowEpisodesDrawer(false)}
                className="tv-focusable p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Season Selector */}
            {totalSeasons > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((sNum) => (
                  <button
                    key={sNum}
                    onClick={() => setSelectedSeasonDrawer(sNum)}
                    className={`tv-focusable px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedSeasonDrawer === sNum
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    Season {sNum}
                  </button>
                ))}
              </div>
            )}

            {/* Episode Grid */}
            <div className="overflow-y-auto no-scrollbar flex-1 max-h-[50vh] pr-1">
              {loadingEpisodes ? (
                <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                  <span>Loading Season {selectedSeasonDrawer} episodes...</span>
                </div>
              ) : seasonDetails && seasonDetails.episodes && seasonDetails.episodes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {seasonDetails.episodes.map((ep: TMDBEpisode) => {
                    const isCurrent = currentSeason === selectedSeasonDrawer && currentEpisode === ep.episode_number;
                    return (
                      <div
                        key={ep.id}
                        onClick={() => handleSelectEpisode(selectedSeasonDrawer, ep.episode_number)}
                        className={`tv-focusable flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isCurrent
                            ? 'bg-sky-500/20 border-sky-400 shadow-md shadow-sky-500/20'
                            : 'bg-slate-800/80 hover:bg-slate-700/80 border-white/10'
                        }`}
                      >
                        <div className="relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-900">
                          {ep.still_path ? (
                            <img
                              src={`${IMAGE_BASE_W500}${ep.still_path}`}
                              alt={ep.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                              EP {ep.episode_number}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-4 h-4 fill-white text-white" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-sky-400">
                              Episode {ep.episode_number}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500 text-white font-semibold">
                                Now Playing
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white truncate font-medium mt-0.5">
                            {ep.name || `Episode ${ep.episode_number}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 bg-white/5 rounded-xl">
                  <p className="text-sm">Episode list unavailable. Click below to play.</p>
                  <button
                    onClick={() => handleSelectEpisode(selectedSeasonDrawer, 1)}
                    className="mt-2 px-4 py-2 rounded-lg bg-sky-500 text-white text-xs font-bold"
                  >
                    Play Season {selectedSeasonDrawer} Episode 1
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
