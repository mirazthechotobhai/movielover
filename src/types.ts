export type MediaType = 'movie' | 'tv' | 'anime';

export interface TMDBMediaItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TMDBSeasonSummary[];
}

export interface TMDBSeasonSummary {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  episode_count: number;
  poster_path: string | null;
  air_date?: string;
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
  runtime?: number;
}

export interface VideoStreamOption {
  quality: string;
  url: string;
  type: string;
}

export interface MediaPlayPayload {
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'anime';
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  releaseYear?: string;
  rating?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
}

export type RemoteCommandType =
  | 'PLAY_MEDIA'
  | 'PLAY_EPISODE'
  | 'PAUSE'
  | 'PLAY'
  | 'SEEK_FORWARD'
  | 'SEEK_BACKWARD'
  | 'TIME_JUMP'
  | 'SET_VOLUME'
  | 'MUTE'
  | 'UNMUTE'
  | 'STOP';

export interface RemoteCommand {
  commandId: string;
  type: RemoteCommandType;
  payload?: any;
  timestamp: number;
  senderId?: string;
}

export interface PlaybackState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  title: string;
  posterUrl?: string;
  mediaType?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  lastUpdated?: number;
}

export interface TvSessionData {
  roomCode: string;
  tvId: string;
  status: 'waiting' | 'connected' | 'expired';
  remoteId: string | null;
  createdAt: number;
  lastHeartbeat: number;
  currentMedia?: MediaPlayPayload | null;
  playbackState?: PlaybackState;
  command?: RemoteCommand | null;
}

export type ActiveCategory = 'movies' | 'tv' | 'anime';
export type FilterSortOption = 'popular' | 'trending' | 'top_rated' | 'now_playing';
