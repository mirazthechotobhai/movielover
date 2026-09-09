export type MediaType = 'movie' | 'tv' | 'anime';

export interface RoomState {
  roomCode: string;
  isPlaying: boolean;
  currentTime: number;
  action: 'none' | 'play' | 'pause' | 'seek_forward' | 'seek_backward' | 'seek' | 'close' | 'change_media' | 'volume';
  actionTimestamp?: number;
  actionId?: string;
  volume: number; // 0 to 1
  status: 'waiting' | 'connected' | 'closed';
  media?: {
    id: string; // IMDb or TMDB ID
    tmdbId?: number;
    title: string;
    type: MediaType;
    posterPath?: string;
    backdropPath?: string;
    season?: number;
    episode?: number;
    releaseYear?: string;
    overview?: string;
  };
  lastUpdated?: number;
}

export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  imdb_id?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date?: string;
}

export interface WatchlistItem {
  id: string; // "movie_123" or "tv_456"
  mediaId: string; // IMDb (tt...) or TMDB ID
  tmdbId: number;
  title: string;
  type: MediaType;
  posterPath: string | null;
  rating: number;
  year: string;
  addedAt: number;
}
