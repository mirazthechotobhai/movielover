export type MediaType = 'movie' | 'tv' | 'anime';

export type ContentCategory = 'movie' | 'tv' | 'anime';

export type PlayerSkin = 'onyx' | 'aurora';
export type SwitchToggle = 'on' | 'off';
export type DisplayMode = 'fullscreen-view' | 'responsive-16-9' | 'contained';

export interface CustomSubtitle {
  url: string;
  label: string;
}

export interface MediaItem {
  id: string; // IMDb (tt...) or TMDB ID
  tmdbId?: number;
  imdbId?: string;
  title: string;
  type: MediaType;
  category?: ContentCategory;
  year?: string;
  duration?: string;
  genre?: string;
  description?: string;
  season?: number;
  episode?: number;
  totalSeasons?: number;
  episodesPerSeason?: number;
  seasonsInfo?: { seasonNumber: number; episodeCount: number; name: string }[];
  backdropUrl?: string;
  posterUrl?: string;
  rating?: string;
  trendingRank?: number;
  isTrending?: boolean;
}

export interface PlayerConfig {
  skin: PlayerSkin;
  welcomePage: SwitchToggle;
  autoplay: SwitchToggle;
  subtitles: CustomSubtitle[];
}

export interface PlayerEventLog {
  id: string;
  event: string;
  info?: any;
  timestamp: string;
  raw: string;
}

export interface PlayerCommand {
  command: 'play' | 'pause' | 'seek' | 'volume' | 'mute' | 'unmute' | 'fullscreen' | 'reload';
  value?: any;
  timestamp: number;
}

export interface TvRoomData {
  roomCode: string;
  status: 'waiting' | 'connected' | 'terminated';
  createdAt?: any;
  lastActive?: any;
  controllerId?: string | null;
  currentMedia?: MediaItem | null;
  playbackCommand?: {
    action: 'play' | 'pause' | 'seek' | 'time_jump' | 'volume' | 'mute' | 'unmute' | 'fullscreen' | 'play_media' | 'reload';
    value?: any;
    timestamp: number;
  } | null;
  tvState?: {
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    title: string;
    mediaType: string;
  } | null;
}
