import { TMDBMedia, TMDBEpisode, WatchlistItem } from '../types';

const TMDB_API_KEY = '173860f57d41a8a7638aef7ffcdaee64';
const BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

export interface Genre {
  id: number;
  name: string;
}

// Fallback items in case client has offline network constraints
const FALLBACK_ITEMS: TMDBMedia[] = [
  {
    id: 575264,
    title: 'Mission: Impossible - Dead Reckoning',
    overview: 'Ethan Hunt and his IMF team embark on their most dangerous mission yet: to track down a terrifying new weapon.',
    poster_path: '/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
    backdrop_path: '/628Dep6AxEtDxjZoGP78TsOxYbK.jpg',
    media_type: 'movie',
    release_date: '2023-07-08',
    vote_average: 7.6,
    vote_count: 3450,
    genre_ids: [28, 12, 53]
  },
  {
    id: 94605,
    name: 'Arcane',
    overview: 'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.',
    poster_path: '/abf8tOzPuP56eO1XNZ8ehNUXbGC.jpg',
    backdrop_path: '/rkB4LyZHo1NHXFEDHl9vSD9r1lW.jpg',
    media_type: 'tv',
    first_air_date: '2021-11-06',
    vote_average: 8.7,
    vote_count: 4120,
    genre_ids: [16, 10765, 10759]
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II.',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: '/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    media_type: 'movie',
    release_date: '2023-07-19',
    vote_average: 8.1,
    vote_count: 8900,
    genre_ids: [18, 36]
  },
  {
    id: 85937,
    name: 'Demon Slayer: Kimetsu no Yaiba',
    overview: 'It is the Taisho Period in Japan. Tanjiro, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon.',
    poster_path: '/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg',
    backdrop_path: '/nTvM4mhqZlHIvUkIvdikWstEZKa.jpg',
    media_type: 'tv',
    first_air_date: '2019-04-06',
    vote_average: 8.6,
    vote_count: 6100,
    genre_ids: [16, 10759, 10765]
  }
];

export async function fetchTrending(
  category: 'all' | 'movie' | 'tv' | 'anime' = 'all',
  page = 1
): Promise<TMDBMedia[]> {
  try {
    let url = '';
    if (category === 'movie') {
      url = `${BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&page=${page}`;
    } else if (category === 'tv') {
      url = `${BASE_URL}/trending/tv/day?api_key=${TMDB_API_KEY}&page=${page}`;
    } else if (category === 'anime') {
      url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`;
    } else {
      url = `${BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}&page=${page}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
    const data = await res.json();
    const results: TMDBMedia[] = (data.results || []).map((item: any) => ({
      ...item,
      media_type: category === 'movie' ? 'movie' : category === 'tv' || category === 'anime' ? 'tv' : item.media_type || (item.title ? 'movie' : 'tv')
    }));
    return results;
  } catch (err) {
    console.warn("fetchTrending fallback:", err);
    return FALLBACK_ITEMS;
  }
}

export async function searchTMDB(query: string, page = 1): Promise<TMDBMedia[]> {
  if (!query.trim()) return [];
  try {
    const url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB search error: ${res.status}`);
    const data = await res.json();
    return (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        ...item,
        media_type: item.media_type || (item.title ? 'movie' : 'tv')
      }));
  } catch (err) {
    console.warn("searchTMDB error:", err);
    return FALLBACK_ITEMS.filter(item =>
      (item.title || item.name || '').toLowerCase().includes(query.toLowerCase())
    );
  }
}

export async function fetchGenres(type: 'movie' | 'tv'): Promise<Genre[]> {
  try {
    const url = `${BASE_URL}/genre/${type}/list?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Genres error: ${res.status}`);
    const data = await res.json();
    return data.genres || [];
  } catch (err) {
    return [
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 16, name: 'Animation' },
      { id: 35, name: 'Comedy' },
      { id: 80, name: 'Crime' },
      { id: 18, name: 'Drama' },
      { id: 10751, name: 'Family' },
      { id: 14, name: 'Fantasy' },
      { id: 878, name: 'Sci-Fi' },
      { id: 53, name: 'Thriller' }
    ];
  }
}

export async function fetchByGenre(
  type: 'movie' | 'tv',
  genreId: number,
  page = 1
): Promise<TMDBMedia[]> {
  try {
    const url = `${BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Genre discover error: ${res.status}`);
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      ...item,
      media_type: type
    }));
  } catch (err) {
    console.warn("fetchByGenre error:", err);
    return [];
  }
}

export async function fetchDetails(
  type: 'movie' | 'tv',
  id: number
): Promise<TMDBMedia | null> {
  try {
    const url = `${BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Details error: ${res.status}`);
    const data = await res.json();
    return {
      ...data,
      media_type: type,
      imdb_id: data.external_ids?.imdb_id || data.imdb_id
    };
  } catch (err) {
    console.warn("fetchDetails error:", err);
    return null;
  }
}

export async function fetchSeasonEpisodes(
  tvId: number,
  seasonNumber: number
): Promise<TMDBEpisode[]> {
  try {
    const url = `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Season error: ${res.status}`);
    const data = await res.json();
    return data.episodes || [];
  } catch (err) {
    console.warn("fetchSeasonEpisodes error:", err);
    // Return sample episodes if failed
    return Array.from({ length: 8 }).map((_, i) => ({
      id: tvId * 100 + i + 1,
      name: `Episode ${i + 1}`,
      overview: `Official episode ${i + 1} of season ${seasonNumber}.`,
      episode_number: i + 1,
      season_number: seasonNumber,
      still_path: null
    }));
  }
}

export interface TVShowSeasonsInfo {
  totalSeasons: number;
  seasonEpisodesMap: Record<number, number>;
}

export async function fetchTVShowSeasonsInfo(
  tvId: number | string
): Promise<TVShowSeasonsInfo> {
  try {
    let numericId: number | null = typeof tvId === 'number' ? tvId : Number(tvId);
    if (isNaN(numericId) || !numericId) {
      const findUrl = `${BASE_URL}/find/${tvId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
      const findRes = await fetch(findUrl);
      if (findRes.ok) {
        const findData = await findRes.json();
        const tvResult = (findData.tv_results || [])[0];
        if (tvResult) {
          numericId = tvResult.id;
        }
      }
    }

    if (!numericId) {
      return { totalSeasons: 1, seasonEpisodesMap: { 1: 12 } };
    }

    const res = await fetch(`${BASE_URL}/tv/${numericId}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) {
      return { totalSeasons: 1, seasonEpisodesMap: { 1: 12 } };
    }
    const data = await res.json();
    const totalSeasons = Math.max(1, data.number_of_seasons || 1);
    const seasonEpisodesMap: Record<number, number> = {};

    if (Array.isArray(data.seasons)) {
      data.seasons.forEach((s: any) => {
        if (s.season_number > 0) {
          seasonEpisodesMap[s.season_number] = s.episode_count || 1;
        }
      });
    }

    for (let s = 1; s <= totalSeasons; s++) {
      if (!seasonEpisodesMap[s]) {
        seasonEpisodesMap[s] = 10;
      }
    }

    return { totalSeasons, seasonEpisodesMap };
  } catch (err) {
    console.warn('fetchTVShowSeasonsInfo error:', err);
    return { totalSeasons: 1, seasonEpisodesMap: { 1: 12 } };
  }
}

// Watchlist Helpers using LocalStorage
const WATCHLIST_STORAGE_KEY = 'streamcast_watchlist';

export function getWatchlist(): WatchlistItem[] {
  try {
    const data = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToWatchlist(item: Omit<WatchlistItem, 'addedAt'>): WatchlistItem[] {
  const current = getWatchlist();
  if (current.some(w => w.id === item.id)) return current;
  const updated = [{ ...item, addedAt: Date.now() }, ...current];
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function removeFromWatchlist(id: string): WatchlistItem[] {
  const current = getWatchlist();
  const updated = current.filter(w => w.id !== id);
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function isItemInWatchlist(id: string): boolean {
  const current = getWatchlist();
  return current.some(w => w.id === id);
}
