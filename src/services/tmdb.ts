import { TMDBMedia, TMDBSeasonDetails } from '../types';

const TMDB_API_KEY = "0fa8c81701a0392d7aa1634738beb404";
const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE_W500 = "https://image.tmdb.org/t/p/w500";
export const IMAGE_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original";
export const IMAGE_BASE_W780 = "https://image.tmdb.org/t/p/w780";

export interface MediaSection {
  title: string;
  items: TMDBMedia[];
}

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params
  });

  const response = await fetch(`${BASE_URL}${endpoint}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`TMDB error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const tmdbService = {
  // --- MOVIES ---
  async getMovieSections(): Promise<MediaSection[]> {
    try {
      const [trending, popular, topRated, action, scifi, comedy] = await Promise.all([
        fetchFromTMDB<{ results: TMDBMedia[] }>('/trending/movie/week'),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/movie/popular'),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/movie/top_rated'),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/movie', { with_genres: '28', sort_by: 'popularity.desc' }),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/movie', { with_genres: '878', sort_by: 'popularity.desc' }),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/movie', { with_genres: '35', sort_by: 'popularity.desc' })
      ]);

      const tagMovies = (items: TMDBMedia[]) => items.map(m => ({ ...m, media_type: 'movie' as const }));

      return [
        { title: "Trending Movies This Week", items: tagMovies(trending.results || []) },
        { title: "Popular On Cinema", items: tagMovies(popular.results || []) },
        { title: "Top Rated Blockbusters", items: tagMovies(topRated.results || []) },
        { title: "Adrenaline Action & Adventure", items: tagMovies(action.results || []) },
        { title: "Sci-Fi & Cyber Universe", items: tagMovies(scifi.results || []) },
        { title: "Comedy & Laughs", items: tagMovies(comedy.results || []) }
      ];
    } catch (err) {
      console.error("Failed to fetch movie sections:", err);
      return [];
    }
  },

  // --- TV SHOWS ---
  async getTVSections(): Promise<MediaSection[]> {
    try {
      const [trending, popular, topRated, action, mystery, scifi] = await Promise.all([
        fetchFromTMDB<{ results: TMDBMedia[] }>('/trending/tv/week'),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/tv/popular'),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/tv/top_rated'),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/tv', { with_genres: '10759', sort_by: 'popularity.desc' }),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/tv', { with_genres: '9648,18', sort_by: 'popularity.desc' }),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/tv', { with_genres: '10765', sort_by: 'popularity.desc' })
      ]);

      const tagTV = (items: TMDBMedia[]) => items.map(t => ({ ...t, media_type: 'tv' as const }));

      return [
        { title: "Trending TV Series", items: tagTV(trending.results || []) },
        { title: "Popular Binge Hits", items: tagTV(popular.results || []) },
        { title: "Critically Acclaimed TV", items: tagTV(topRated.results || []) },
        { title: "Action & Adventure Series", items: tagTV(action.results || []) },
        { title: "Mystery & Thrillers", items: tagTV(mystery.results || []) },
        { title: "Sci-Fi & Fantasy Worlds", items: tagTV(scifi.results || []) }
      ];
    } catch (err) {
      console.error("Failed to fetch TV sections:", err);
      return [];
    }
  },

  // --- ANIME ---
  async getAnimeSections(): Promise<MediaSection[]> {
    try {
      const [popularAnime, topAnime, actionAnime, animeMovies, shonenAnime] = await Promise.all([
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/tv', {
          with_genres: '16',
          with_original_language: 'ja',
          sort_by: 'popularity.desc'
        }),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/tv', {
          with_genres: '16',
          with_original_language: 'ja',
          sort_by: 'vote_average.desc',
          'vote_count.gte': '200'
        }),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/tv', {
          with_genres: '16,10759',
          with_original_language: 'ja',
          sort_by: 'popularity.desc'
        }),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/movie', {
          with_genres: '16',
          with_original_language: 'ja',
          sort_by: 'popularity.desc'
        }),
        fetchFromTMDB<{ results: TMDBMedia[] }>('/discover/tv', {
          with_keywords: '210024|287501',
          sort_by: 'popularity.desc'
        })
      ]);

      const tagAnimeTV = (items: TMDBMedia[]) => items.map(a => ({ ...a, media_type: 'tv' as const }));
      const tagAnimeMovie = (items: TMDBMedia[]) => items.map(a => ({ ...a, media_type: 'movie' as const }));

      return [
        { title: "Trending Anime Series", items: tagAnimeTV(popularAnime.results || []) },
        { title: "Masterpiece Anime Series", items: tagAnimeTV(topAnime.results || []) },
        { title: "Epic Anime Movies", items: tagAnimeMovie(animeMovies.results || []) },
        { title: "High-Octane Action & Battles", items: tagAnimeTV(actionAnime.results || []) },
        { title: "Legendary Shonen Hits", items: tagAnimeTV(shonenAnime.results || []) }
      ];
    } catch (err) {
      console.error("Failed to fetch Anime sections:", err);
      return [];
    }
  },

  // Details
  async getMovieDetails(id: number): Promise<TMDBMedia> {
    const data = await fetchFromTMDB<TMDBMedia>(`/movie/${id}`, {
      append_to_response: 'videos,credits,similar'
    });
    return { ...data, media_type: 'movie' };
  },

  async getTVDetails(id: number): Promise<TMDBMedia> {
    const data = await fetchFromTMDB<TMDBMedia>(`/tv/${id}`, {
      append_to_response: 'videos,credits,similar'
    });
    return { ...data, media_type: 'tv' };
  },

  // Season details with episodes
  async getSeasonDetails(tvId: number, seasonNumber: number): Promise<TMDBSeasonDetails> {
    return fetchFromTMDB<TMDBSeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
  },

  // Search
  async searchMulti(query: string): Promise<TMDBMedia[]> {
    if (!query.trim()) return [];
    const res = await fetchFromTMDB<{ results: TMDBMedia[] }>('/search/multi', {
      query: query.trim(),
      include_adult: 'false'
    });
    return (res.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');
  }
};
