export type MediaType = 'movie' | 'tv';

export type PlayerSkin = 'onyx' | 'aurora';
export type ToggleOption = 'on' | 'off';

export interface SubtitleConfig {
  url: string;
  label: string;
}

export interface PlayerSettings {
  skin: PlayerSkin;
  welcomePage: ToggleOption;
  autoplay: ToggleOption;
  subtitles: SubtitleConfig[];
}

export interface MediaItem {
  id: string; // IMDb (e.g. tt31193180) or TMDB id
  title: string;
  type: MediaType;
  year?: string;
  poster?: string;
  backdrop?: string;
  overview?: string;
  genre?: string[];
  rating?: string;
  season?: number;
  episode?: number;
  totalSeasons?: number;
  episodesPerSeason?: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  lastEvent?: string;
  lastUpdated: number;
}

export interface PlayerEventLog {
  id: string;
  timestamp: string;
  event: string;
  info?: any;
}

export type RemoteCommandType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'togglePlay'
  | 'seek'
  | 'seekRelative'
  | 'mute'
  | 'unmute'
  | 'toggleMute'
  | 'volume'
  | 'fullscreen'
  | 'loadMedia'
  | 'updateSettings'
  | 'syncState'
  | 'requestState'
  | 'tv_opened'
  | 'tv_closed'
  | 'ping';

export interface RemoteMessage {
  id: string;
  source: 'embedmaster_remote' | 'embedmaster_player_client';
  type: RemoteCommandType;
  value?: any;
  media?: MediaItem;
  settings?: PlayerSettings;
  state?: PlaybackState;
  timestamp: number;
}
