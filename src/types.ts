export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: 'movie' | 'tv';
  number_of_seasons?: number;
  number_of_episodes?: number;
  tagline?: string;
  runtime?: number;
  episode_run_time?: number[];
  origin_country?: string[];
  original_language?: string;
  status?: string;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  vote_average: number;
}

export interface TMDBSeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  episodes: TMDBEpisode[];
}

export type MainCategory = 'movie' | 'tv' | 'anime';

export interface ActivePlayTarget {
  media: TMDBMedia;
  mediaType: 'movie' | 'tv' | 'anime';
  season: number;
  episode: number;
}

export interface WatchlistItem {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  mediaType: 'movie' | 'tv' | 'anime';
  voteAverage: number;
  year: string;
  addedAt: number;
}
