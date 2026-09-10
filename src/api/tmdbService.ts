import { TMDBMediaItem, TMDBEpisode } from '../types';

const TMDB_API_KEY = (import.meta as any).env?.VITE_TMDB_API_KEY || '89f90296706e6cad85838bfc94769bd4';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface EmbedMasterOptions {
  skin?: 'onyx' | 'aurora';
  welcome_page?: 'on' | 'off';
  autoplay?: 'on' | 'off';
  sub_url?: string[];
  sub_label?: string[];
}

/**
 * Generate EmbedMaster streaming URL for movies or TV episodes
 * Movie: https://embedmaster.link/movie/{id}
 * TV:    https://embedmaster.link/tv/{id}/{season}/{episode}
 */
export function getEmbedMasterUrl(
  id: number | string,
  mediaType: 'movie' | 'tv' | 'anime' = 'movie',
  season: number = 1,
  episode: number = 1,
  options: EmbedMasterOptions = {
    skin: 'onyx',
    welcome_page: 'off',
    autoplay: 'on',
  }
): string {
  const isTv = mediaType === 'tv';
  const base = isTv
    ? `https://embedmaster.link/tv/${id}/${season || 1}/${episode || 1}`
    : `https://embedmaster.link/movie/${id}`;

  const params = new URLSearchParams();
  if (options.skin) params.set('skin', options.skin);
  if (options.welcome_page) params.set('welcome_page', options.welcome_page);
  if (options.autoplay) params.set('autoplay', options.autoplay);

  if (options.sub_url && options.sub_url.length > 0) {
    options.sub_url.forEach((url, i) => {
      params.append('sub_url[]', url);
      if (options.sub_label && options.sub_label[i]) {
        params.append('sub_label[]', options.sub_label[i]);
      }
    });
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function getStreamUrlForMedia(
  id: number | string,
  mediaType: 'movie' | 'tv' | 'anime' = 'movie',
  season: number = 1,
  episode: number = 1
): string {
  return getEmbedMasterUrl(id, mediaType, season, episode);
}

export function getPosterUrl(path: string | null, size: 'w342' | 'w500' | 'original' = 'w500'): string {
  if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&auto=format&fit=crop&q=80';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
  const searchParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });

  const url = `${BASE_URL}${endpoint}?${searchParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB HTTP error ${response.status}: ${response.statusText}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Error fetching TMDB endpoint ${endpoint}:`, error);
    throw error;
  }
}

export const tmdbService = {
  // Movies
  async getPopularMovies(page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    const data = await fetchFromTMDB<{ results: TMDBMediaItem[]; total_pages: number }>('/movie/popular', { page });
    return {
      results: data.results.map((item) => ({ ...item, media_type: 'movie' })),
      total_pages: data.total_pages,
    };
  },

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    const data = await fetchFromTMDB<{ results: TMDBMediaItem[]; total_pages: number }>(`/trending/movie/${timeWindow}`, { page });
    return {
      results: data.results.map((item) => ({ ...item, media_type: 'movie' })),
      total_pages: data.total_pages,
    };
  },

  async getTopRatedMovies(page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    const data = await fetchFromTMDB<{ results: TMDBMediaItem[]; total_pages: number }>('/movie/top_rated', { page });
    return {
      results: data.results.map((item) => ({ ...item, media_type: 'movie' })),
      total_pages: data.total_pages,
    };
  },

  async getNowPlayingMovies(page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    const data = await fetchFromTMDB<{ results: TMDBMediaItem[]; total_pages: number }>('/movie/now_playing', { page });
    return {
      results: data.results.map((item) => ({ ...item, media_type: 'movie' })),
      total_pages: data.total_pages,
    };
  },

  async searchMovies(query: string, page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    const data = await fetchFromTMDB<{ results: TMDBMediaItem[]; total_pages: number }>('/search/movie', {
      query,
      page,
      include_adult: false,
    });
    return {
      results: data.results.map((item) => ({ ...item, media_type: 'movie' })),
      total_pages: data.total_pages,
    };
  },

  async getMovieDetails(movieId: number): Promise<TMDBMediaItem> {
    const data = await fetchFromTMDB<TMDBMediaItem>(`/movie/${movieId}`, {
      append_to_response: 'videos,credits',
    });
    return { ...data, media_type: 'movie' };
  },

  // TV Shows
  async getPopularTV(page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    const data = await fetchFromTMDB<{ results: TMDBMediaItem[]; total_pages: number }>('/tv/popular', { page });
    return {
      results: data.results.map((item) => ({ ...item, media_type: 'tv' })),
      total_pages: data.total_pages,
    };
  },

  async getTrendingTV(timeWindow: 'day' | 'week' = 'week', page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    const data = await fetchFromTMDB<{ results: TMDBMediaItem[]; total_pages: number }>(`/trending/tv/${timeWindow}`, { page });
    return {
      results: data.results.map((item) => ({ ...item, media_type: 'tv' })),
      total_pages: data.total_pages,
    };
  },

  async getTopRatedTV(page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    const data = await fetchFromTMDB<{ results: TMDBMediaItem[]; total_pages: number }>('/tv/top_rated', { page });
    return {
      results: data.results.map((item) => ({ ...item, media_type: 'tv' })),
      total_pages: data.total_pages,
    };
  },

  async searchTV(query: string, page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    const data = await fetchFromTMDB<{ results: TMDBMediaItem[]; total_pages: number }>('/search/tv', {
      query,
      page,
      include_adult: false,
    });
    return {
      results: data.results.map((item) => ({ ...item, media_type: 'tv' })),
      total_pages: data.total_pages,
    };
  },

  async getTVDetails(tvId: number): Promise<TMDBMediaItem> {
    const data = await fetchFromTMDB<TMDBMediaItem>(`/tv/${tvId}`, {
      append_to_response: 'videos,credits',
    });
    return { ...data, media_type: 'tv' };
  },

  async getSeasonEpisodes(tvId: number, seasonNumber: number): Promise<TMDBEpisode[]> {
    const data = await fetchFromTMDB<{ episodes: TMDBEpisode[] }>(`/tv/${tvId}/season/${seasonNumber}`);
    return data.episodes || [];
  },

  // Anime Discovery: Animation genre (16) + Japanese original language (ja)
  async getAnime(page = 1, sort: 'popular' | 'top_rated' | 'trending' = 'popular'): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    let endpoint = '/discover/tv';
    const params: Record<string, string | number> = {
      with_genres: '16', // Animation
      with_original_language: 'ja',
      page,
      sort_by: sort === 'top_rated' ? 'vote_average.desc' : 'popularity.desc',
      'vote_count.gte': sort === 'top_rated' ? 100 : 20,
    };

    const data = await fetchFromTMDB<{ results: TMDBMediaItem[]; total_pages: number }>(endpoint, params);
    return {
      results: data.results.map((item) => ({ ...item, media_type: 'tv' })),
      total_pages: data.total_pages,
    };
  },

  // Global search across movies, TV, and anime
  async searchAll(query: string, page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
    const data = await fetchFromTMDB<{
      results: (TMDBMediaItem & { media_type?: 'movie' | 'tv' | 'person' })[];
      total_pages: number;
    }>('/search/multi', {
      query,
      page,
      include_adult: false,
    });

    const filtered = data.results.filter(
      (item) => item.media_type === 'movie' || item.media_type === 'tv'
    ) as TMDBMediaItem[];

    return {
      results: filtered,
      total_pages: data.total_pages,
    };
  },

  // Get trailer video key
  async getTrailerVideoKey(mediaType: 'movie' | 'tv', id: number): Promise<string | null> {
    try {
      const data = await fetchFromTMDB<{
        results: { key: string; site: string; type: string; official: boolean }[];
      }>(`/${mediaType}/${id}/videos`);

      const trailer =
        data.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
        data.results.find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) ||
        data.results.find((v) => v.site === 'YouTube');

      return trailer ? trailer.key : null;
    } catch {
      return null;
    }
  },
};
