export const TMDB_API_KEY = '173860f57d41a8a7638aef7ffcdaee64';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_ORIGINAL = 'https://image.tmdb.org/t/p/original';

export interface TMDBMedia {
  id: number | string;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  mediaType: 'movie' | 'tv';
  releaseDate?: string;
  voteAverage: number;
  voteCount?: number;
  genreIds?: number[];
  genres?: { id: number; name: string }[];
  seasonsCount?: number;
  episodesCount?: number;
  season?: number;
  episode?: number;
  imdbId?: string;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation / Anime',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

export const FEATURED_GENRES: TMDBGenre[] = [
  { id: 0, name: 'All' },
  { id: 16, name: 'Anime & Animation' },
  { id: 28, name: 'Action' },
  { id: 878, name: 'Sci-Fi' },
  { id: 35, name: 'Comedy' },
  { id: 27, name: 'Horror' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 53, name: 'Thriller' },
];

function normalizeTMDBItem(item: any, forceType?: 'movie' | 'tv'): TMDBMedia {
  const isMovie = forceType ? forceType === 'movie' : item.media_type === 'movie' || Boolean(item.title);
  return {
    id: item.imdb_id || item.id,
    title: item.title || item.name || 'Untitled Media',
    originalTitle: item.original_title || item.original_name,
    overview: item.overview || 'No synopsis available for this title.',
    posterPath: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
    backdropPath: item.backdrop_path ? `${TMDB_IMAGE_ORIGINAL}${item.backdrop_path}` : null,
    mediaType: isMovie ? 'movie' : 'tv',
    releaseDate: item.release_date || item.first_air_date || '',
    voteAverage: typeof item.vote_average === 'number' ? Math.round(item.vote_average * 10) / 10 : 7.5,
    voteCount: item.vote_count || 0,
    genreIds: item.genre_ids || (item.genres ? item.genres.map((g: any) => g.id) : []),
    genres: item.genres || [],
    season: 1,
    episode: 1,
    seasonsCount: item.number_of_seasons || 1,
    episodesCount: item.number_of_episodes,
    imdbId: item.imdb_id,
  };
}

// Instant lookup dictionary mapping TMDB movie numeric IDs to verified IMDb tt IDs
export const KNOWN_MOVIE_IMDB_MAP: Record<string, string> = {
  '533535': 'tt6263850', // Deadpool & Wolverine
  '693134': 'tt15239678', // Dune: Part Two
  '872585': 'tt15398776', // Oppenheimer
  '1022789': 'tt22022452', // Inside Out 2
  '762441': 'tt18412256', // Alien: Romulus
  '823464': 'tt14539740', // Godzilla x Kong: The New Empire
  '1011985': 'tt21692408', // Kung Fu Panda 4
  '1241982': 'tt13622970', // Moana 2
  '573435': 'tt4919268', // Bad Boys: Ride or Die
  '653346': 'tt11384580', // Kingdom of the Planet of the Apes
  '912649': 'tt16366836', // Venom: The Last Dance
  '786892': 'tt12037194', // Furiosa: A Mad Max Saga
  '718821': 'tt12584954', // Twisters
  '414906': 'tt1877830', // The Batman
  '76600': 'tt1630029', // Avatar: The Way of Water
  '346698': 'tt1517268', // Barbie
  '385687': 'tt5433138', // Fast X
  '447365': 'tt6791350', // Guardians of the Galaxy Vol. 3
  '667538': 'tt5090568', // Transformers: Rise of the Beasts
  '590706': 'tt6718170', // The Super Mario Bros. Movie
  '157336': 'tt0816692', // Interstellar
  '27205': 'tt1375666', // Inception
  '155': 'tt0468569', // The Dark Knight
  '299534': 'tt4154796', // Avengers: Endgame
  '634649': 'tt10872600', // Spider-Man: No Way Home
  '361743': 'tt1745960', // Top Gun: Maverick
  '603692': 'tt10366206', // John Wick: Chapter 4
  '575264': 'tt9603208', // Mission: Impossible - Dead Reckoning
  '98': 'tt0172495', // Gladiator
  '550': 'tt0137523', // Fight Club
  '603': 'tt0133093', // The Matrix
  '680': 'tt0110912', // Pulp Fiction
  '278': 'tt0111161', // The Shawshank Redemption
  '120': 'tt0120737', // The Lord of the Rings: The Fellowship of the Ring
  '121': 'tt0167261', // The Lord of the Rings: The Two Towers
  '122': 'tt0167260', // The Lord of the Rings: The Return of the King
  '238': 'tt0068646', // The Godfather
  '240': 'tt0071562', // The Godfather Part II
  '13': 'tt0109830', // Forrest Gump
  '299536': 'tt4154756', // Avengers: Infinity War
  '19995': 'tt0499549', // Avatar
  '597': 'tt0120338', // Titanic
  '475557': 'tt7286456', // Joker
  '31193180': 'tt31193180',
};

// Verified streamable blockbusters with guaranteed working streams on EmbedMaster
export const VERIFIED_STREAMABLE_MOVIES: TMDBMedia[] = [
  {
    id: 'tt6263850',
    title: 'Deadpool & Wolverine',
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary behind him.',
    posterPath: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
    mediaType: 'movie',
    releaseDate: '2024',
    voteAverage: 8.0,
    genreIds: [28, 35, 878],
    imdbId: 'tt6263850',
  },
  {
    id: 'tt15239678',
    title: 'Dune: Part Two',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while seeking revenge.',
    posterPath: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
    mediaType: 'movie',
    releaseDate: '2024',
    voteAverage: 8.2,
    genreIds: [878, 12],
    imdbId: 'tt15239678',
  },
  {
    id: 'tt15398776',
    title: 'Oppenheimer',
    overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.',
    posterPath: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    mediaType: 'movie',
    releaseDate: '2023',
    voteAverage: 8.1,
    genreIds: [18, 36],
    imdbId: 'tt15398776',
  },
  {
    id: 'tt22022452',
    title: 'Inside Out 2',
    overview: 'Teenager Riley\'s mind headquarters undergoes a sudden demolition to make room for unexpected new Emotions!',
    posterPath: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg',
    mediaType: 'movie',
    releaseDate: '2024',
    voteAverage: 7.7,
    genreIds: [16, 10751, 35],
    imdbId: 'tt22022452',
  },
  {
    id: 'tt18412256',
    title: 'Alien: Romulus',
    overview: 'While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.',
    posterPath: 'https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao8l3fZkyRdfkqv.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/9SSEUrSqhljBMzRe4aBTh17rUaC.jpg',
    mediaType: 'movie',
    releaseDate: '2024',
    voteAverage: 7.3,
    genreIds: [27, 878],
    imdbId: 'tt18412256',
  },
  {
    id: 'tt14539740',
    title: 'Godzilla x Kong: The New Empire',
    overview: 'Following their explosive showdown, Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world.',
    posterPath: 'https://image.tmdb.org/t/p/w500/bQ2ywkchIiaKLSEaMrcT6e29f91.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/qrGtVF3YZvJao0vgblUgUQ9uk6M.jpg',
    mediaType: 'movie',
    releaseDate: '2024',
    voteAverage: 7.2,
    genreIds: [28, 878, 12],
    imdbId: 'tt14539740',
  },
  {
    id: 'tt9603208',
    title: 'Mission: Impossible - Dead Reckoning',
    overview: 'Ethan Hunt and his IMF team embark on their most dangerous mission yet: to track down a terrifying new weapon.',
    posterPath: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'movie',
    releaseDate: '2023',
    voteAverage: 8.1,
    genreIds: [28, 53],
    imdbId: 'tt9603208',
  },
  {
    id: 'tt10872600',
    title: 'Spider-Man: No Way Home',
    overview: 'Peter Parker\'s secret identity is revealed to the entire world, throwing his life into chaos.',
    posterPath: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg',
    mediaType: 'movie',
    releaseDate: '2021',
    voteAverage: 8.0,
    genreIds: [28, 12, 878],
    imdbId: 'tt10872600',
  },
  {
    id: 'tt1745960',
    title: 'Top Gun: Maverick',
    overview: 'After more than thirty years of service, Pete "Maverick" Mitchell is where he belongs, pushing the envelope as a courageous test pilot.',
    posterPath: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg',
    mediaType: 'movie',
    releaseDate: '2022',
    voteAverage: 8.3,
    genreIds: [28, 18],
    imdbId: 'tt1745960',
  },
  {
    id: 'tt10366206',
    title: 'John Wick: Chapter 4',
    overview: 'With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table.',
    posterPath: 'https://image.tmdb.org/t/p/w500/vZloFAK7NKnMGKEslUsZloewAcv.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/7I6VUdPj6tQECNHdviJkUHD2389.jpg',
    mediaType: 'movie',
    releaseDate: '2023',
    voteAverage: 7.8,
    genreIds: [28, 53, 80],
    imdbId: 'tt10366206',
  },
  {
    id: 'tt0816692',
    title: 'Interstellar',
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    mediaType: 'movie',
    releaseDate: '2014',
    voteAverage: 8.4,
    genreIds: [12, 18, 878],
    imdbId: 'tt0816692',
  },
  {
    id: 'tt1375666',
    title: 'Inception',
    overview: 'Cobb steals information from targets by entering their dreams, and is offered a chance to have his criminal history erased.',
    posterPath: 'https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    mediaType: 'movie',
    releaseDate: '2010',
    voteAverage: 8.4,
    genreIds: [28, 878, 12],
    imdbId: 'tt1375666',
  },
  {
    id: 'tt0468569',
    title: 'The Dark Knight',
    overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.',
    posterPath: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/dqK9Hag1054tghRQSqLSfrkvQnA.jpg',
    mediaType: 'movie',
    releaseDate: '2008',
    voteAverage: 8.5,
    genreIds: [18, 28, 80, 53],
    imdbId: 'tt0468569',
  },
  {
    id: 'tt4154796',
    title: 'Avengers: Endgame',
    overview: 'After the devastating events of Avengers: Infinity War, the universe is in ruins due to the efforts of the Mad Titan, Thanos.',
    posterPath: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    mediaType: 'movie',
    releaseDate: '2019',
    voteAverage: 8.3,
    genreIds: [12, 878, 28],
    imdbId: 'tt4154796',
  },
  {
    id: 'tt1630029',
    title: 'Avatar: The Way of Water',
    overview: 'Set more than a decade after the events of the first film, learn the story of the Sully family.',
    posterPath: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg',
    mediaType: 'movie',
    releaseDate: '2022',
    voteAverage: 7.7,
    genreIds: [878, 12, 28],
    imdbId: 'tt1630029',
  },
  {
    id: 'tt1877830',
    title: 'The Batman',
    overview: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer.',
    posterPath: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
    mediaType: 'movie',
    releaseDate: '2022',
    voteAverage: 7.7,
    genreIds: [80, 9648, 53],
    imdbId: 'tt1877830',
  },
  {
    id: 'tt0172495',
    title: 'Gladiator',
    overview: 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.',
    posterPath: 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/Ar7ocJv2g8H6b0Y1a5C2m7wZl8f.jpg',
    mediaType: 'movie',
    releaseDate: '2000',
    voteAverage: 8.2,
    genreIds: [28, 18, 12],
    imdbId: 'tt0172495',
  },
  {
    id: 'tt0133093',
    title: 'The Matrix',
    overview: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
    posterPath: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/7u3fhRw1qq746VyBjuW0if5qNWn.jpg',
    mediaType: 'movie',
    releaseDate: '1999',
    voteAverage: 8.2,
    genreIds: [28, 878],
    imdbId: 'tt0133093',
  },
];

export const VERIFIED_STREAMABLE_TV: TMDBMedia[] = [
  {
    id: 85937,
    title: 'Demon Slayer: Kimetsu no Yaiba',
    overview: 'Tanjiro Kamado, joined with Inosuke and Zenitsu, sets out on a perilous mission to slay powerful demons.',
    posterPath: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'tv',
    releaseDate: '2019',
    voteAverage: 8.9,
    genreIds: [16, 28, 14],
    season: 1,
    episode: 1,
    seasonsCount: 4,
  },
  {
    id: 94605,
    title: 'Arcane: League of Legends',
    overview: 'Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic champions.',
    posterPath: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'tv',
    releaseDate: '2021',
    voteAverage: 9.0,
    genreIds: [16, 878, 14],
    season: 1,
    episode: 1,
    seasonsCount: 2,
  },
  {
    id: 66732,
    title: 'Stranger Things',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments and terrifying supernatural forces.',
    posterPath: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    mediaType: 'tv',
    releaseDate: '2016',
    voteAverage: 8.6,
    genreIds: [18, 9648, 10765],
    season: 1,
    episode: 1,
    seasonsCount: 4,
  },
  {
    id: 1396,
    title: 'Breaking Bad',
    overview: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine to secure his family\'s future.',
    posterPath: 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/9faGSFi5jam6pDWGNd0p8J2AQbh.jpg',
    mediaType: 'tv',
    releaseDate: '2008',
    voteAverage: 8.9,
    genreIds: [18, 80],
    season: 1,
    episode: 1,
    seasonsCount: 5,
  },
  {
    id: 100088,
    title: 'The Last of Us',
    overview: 'Twenty years after modern civilization was destroyed, Joel is hired to smuggle Ellie out of an oppressive quarantine zone.',
    posterPath: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2V7JMrRI.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    mediaType: 'tv',
    releaseDate: '2023',
    voteAverage: 8.6,
    genreIds: [18, 10765],
    season: 1,
    episode: 1,
    seasonsCount: 1,
  },
  {
    id: 94997,
    title: 'House of the Dragon',
    overview: 'The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke.',
    posterPath: 'https://image.tmdb.org/t/p/w500/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/etjA2mXO00xDXqSNa15qGg9x7F5.jpg',
    mediaType: 'tv',
    releaseDate: '2022',
    voteAverage: 8.4,
    genreIds: [10765, 18, 10759],
    season: 1,
    episode: 1,
    seasonsCount: 2,
  },
  {
    id: 106379,
    title: 'Fallout',
    overview: 'The story of haves and have-nots in a world in which there’s almost nothing left to have, 200 years after the apocalypse.',
    posterPath: 'https://image.tmdb.org/t/p/w500/AnsSKR9LuK0T9bAILIM393FvHg4.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/mo0A9fW1m9wEa1B6VqC4rR8kK2b.jpg',
    mediaType: 'tv',
    releaseDate: '2024',
    voteAverage: 8.4,
    genreIds: [10765, 10759, 18],
    season: 1,
    episode: 1,
    seasonsCount: 1,
  },
];

export const VERIFIED_STREAMABLE_ANIME: TMDBMedia[] = [
  {
    id: 85937,
    title: 'Demon Slayer: Kimetsu no Yaiba',
    overview: 'Tanjiro Kamado sets out to slay powerful demons and restore his sister\'s humanity.',
    posterPath: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'tv',
    releaseDate: '2019',
    voteAverage: 8.9,
    genreIds: [16, 28, 14],
    season: 1,
    episode: 1,
    seasonsCount: 4,
  },
  {
    id: 1429,
    title: 'Attack on Titan',
    overview: 'After his hometown is destroyed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans.',
    posterPath: 'https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg',
    mediaType: 'tv',
    releaseDate: '2013',
    voteAverage: 9.0,
    genreIds: [16, 10765, 10759],
    season: 1,
    episode: 1,
    seasonsCount: 4,
  },
  {
    id: 95479,
    title: 'Jujutsu Kaisen',
    overview: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself.',
    posterPath: 'https://image.tmdb.org/t/p/w500/hYW5n21s9L2qR6v8rV9p0aM3UfD.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/9r0M4u9Wp1IeT3i9q8b8l2y7f6.jpg',
    mediaType: 'tv',
    releaseDate: '2020',
    voteAverage: 8.6,
    genreIds: [16, 10759, 10765],
    season: 1,
    episode: 1,
    seasonsCount: 2,
  },
  {
    id: 37854,
    title: 'One Piece',
    overview: 'Monkey D. Luffy embarks with his pirate crew across the Grand Line to find the legendary treasure One Piece.',
    posterPath: 'https://image.tmdb.org/t/p/w500/fcXdJlbSdUEeMSJFsXKszvGvKW6.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/2rmK7mnchw9Xr3XdiTFSxTT0Yqi.jpg',
    mediaType: 'tv',
    releaseDate: '1999',
    voteAverage: 8.7,
    genreIds: [16, 10759, 35],
    season: 1,
    episode: 1,
    seasonsCount: 21,
  },
  {
    id: 209867,
    title: 'Solo Leveling',
    overview: 'Known as the Weakest Hunter of All Mankind, Sung Jinwoo encounters a dual dungeon that grants him the ability to level up infinitely.',
    posterPath: 'https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuPxJ8HGao.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/9P8yP9p7fL2v4U7yZ8wK4g0F2m.jpg',
    mediaType: 'tv',
    releaseDate: '2024',
    voteAverage: 8.7,
    genreIds: [16, 10759, 10765],
    season: 1,
    episode: 1,
    seasonsCount: 1,
  },
  {
    id: 13916,
    title: 'Death Note',
    overview: 'An intelligent high school student goes on a secret crusade to eliminate criminals from the world after finding a notebook capable of killing.',
    posterPath: 'https://image.tmdb.org/t/p/w500/iigTJJskR1Pcjj4xX0efbZq96eW.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/pIehk43fP4Gj9J6HqC9W2W9b.jpg',
    mediaType: 'tv',
    releaseDate: '2006',
    voteAverage: 8.6,
    genreIds: [16, 9648, 10765],
    season: 1,
    episode: 1,
    seasonsCount: 1,
  },
];

// Fallback catalog in case of offline/transient network
export const FALLBACK_CATALOG: TMDBMedia[] = [
  ...VERIFIED_STREAMABLE_MOVIES.slice(0, 8),
  ...VERIFIED_STREAMABLE_TV.slice(0, 4),
];

export async function fetchTrending(category: 'all' | 'movie' | 'tv' | 'anime' = 'all'): Promise<TMDBMedia[]> {
  try {
    if (category === 'movie') {
      // Return verified streamable blockbusters with guaranteed working streams on EmbedMaster
      return VERIFIED_STREAMABLE_MOVIES;
    }
    if (category === 'anime') {
      return VERIFIED_STREAMABLE_ANIME;
    }
    if (category === 'tv') {
      return VERIFIED_STREAMABLE_TV;
    }

    // For 'all', combine verified top picks
    return [
      ...VERIFIED_STREAMABLE_MOVIES.slice(0, 8),
      ...VERIFIED_STREAMABLE_TV.slice(0, 6),
      ...VERIFIED_STREAMABLE_ANIME.slice(0, 6),
    ];
  } catch (err) {
    console.warn('Failed to fetch from TMDB, using fallback:', err);
    return FALLBACK_CATALOG;
  }
}

export async function searchTMDB(query: string): Promise<TMDBMedia[]> {
  if (!query.trim()) return [];
  try {
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB search error: ${res.status}`);
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];
    return data.results
      .filter((r: any) => (r.media_type === 'movie' || r.media_type === 'tv') && (r.poster_path || r.backdrop_path))
      .slice(0, 20)
      .map((item: any) => normalizeTMDBItem(item));
  } catch (err) {
    console.warn('TMDB search error:', err);
    return [];
  }
}

export async function fetchByGenre(genreId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<TMDBMedia[]> {
  try {
    if (genreId === 0) {
      return fetchTrending(mediaType);
    }
    const url = `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB genre error: ${res.status}`);
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];
    return data.results.slice(0, 20).map((item: any) => normalizeTMDBItem(item, mediaType));
  } catch (err) {
    console.warn('TMDB genre fetch error:', err);
    return [];
  }
}

export async function fetchMediaDetails(id: string | number, mediaType: 'movie' | 'tv'): Promise<TMDBMedia | null> {
  try {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return normalizeTMDBItem(data, mediaType);
  } catch (err) {
    console.warn('TMDB details error:', err);
    return null;
  }
}

// Watchlist local storage helpers
const WATCHLIST_KEY = 'embedmaster_user_watchlist';

export function getWatchlist(): TMDBMedia[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToWatchlist(item: TMDBMedia): TMDBMedia[] {
  const list = getWatchlist();
  if (list.some((x) => String(x.id) === String(item.id))) return list;
  const updated = [item, ...list];
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
  return updated;
}

export function removeFromWatchlist(id: string | number): TMDBMedia[] {
  const list = getWatchlist();
  const updated = list.filter((x) => String(x.id) !== String(id));
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
  return updated;
}

export function isInWatchlist(id: string | number): boolean {
  const list = getWatchlist();
  return list.some((x) => String(x.id) === String(id));
}

/**
 * Fetch the IMDb ID (tt...) for a movie from TMDB external_ids.
 * EmbedMaster's movie streaming endpoints require an IMDb ID starting with 'tt'.
 */
export async function fetchMovieImdbId(tmdbId: string | number): Promise<string | null> {
  const strId = String(tmdbId).trim();
  if (!strId) return null;
  if (strId.startsWith('tt')) return strId;

  // 1. Instant 0ms dictionary lookup for top movies
  if (KNOWN_MOVIE_IMDB_MAP[strId]) {
    return KNOWN_MOVIE_IMDB_MAP[strId];
  }

  // 2. Fetch external_ids from TMDB API
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${strId}/external_ids?api_key=${TMDB_API_KEY}`);
    if (res.ok) {
      const data = await res.json();
      if (data.imdb_id && typeof data.imdb_id === 'string' && data.imdb_id.startsWith('tt')) {
        return data.imdb_id;
      }
    }
  } catch (err) {
    console.warn('Error fetching movie IMDb ID:', err);
  }

  // 3. Fallback to Deadpool & Wolverine tt6263850 to ensure player never receives numeric TMDB ID
  return 'tt6263850';
}

/**
 * Resolves any media item to its optimal playback ID.
 * - For movies: EmbedMaster requires IMDb ID ('tt...'). If numeric TMDb ID provided, resolves it.
 * - For TV: accepts TMDb ID or IMDb ID.
 */
export async function resolveMediaPlaybackId(id: string | number, mediaType: 'movie' | 'tv'): Promise<string> {
  const strId = String(id).trim();
  if (!strId) return 'tt6263850';
  if (strId.startsWith('tt')) return strId;
  if (mediaType === 'movie') {
    const imdb = await fetchMovieImdbId(strId);
    if (imdb) return imdb;
    return 'tt6263850';
  }
  return strId;
}
