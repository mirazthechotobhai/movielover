import { MediaItem, ContentCategory } from '../types';

/**
 * Top curated TMDB Anime collection with verified titles, poster backdrops, and seasons
 */
export const POPULAR_ANIME: MediaItem[] = [
  {
    id: 'tt2560140', // Attack on Titan (Shingeki no Kyojin) - TMDB 1429
    title: 'Attack on Titan',
    type: 'anime',
    category: 'anime',
    year: '2013-2023',
    duration: '4 Seasons',
    rating: '9.1',
    genre: 'Action / Dark Fantasy / Mystery',
    season: 1,
    episode: 1,
    totalSeasons: 4,
    episodesPerSeason: 25,
    description: 'After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 1,
    isTrending: true,
  },
  {
    id: 'tt9335498', // Demon Slayer: Kimetsu no Yaiba - TMDB 85937
    title: 'Demon Slayer: Kimetsu no Yaiba',
    type: 'anime',
    category: 'anime',
    year: '2019-Present',
    duration: '4 Seasons',
    rating: '8.7',
    genre: 'Action / Adventure / Fantasy',
    season: 1,
    episode: 1,
    totalSeasons: 4,
    episodesPerSeason: 26,
    description: 'A youth who lost his family to a demon attack joins the Demon Slayer Corps to find a cure for his sister, who has been turned into a demon.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 2,
    isTrending: true,
  },
  {
    id: 'tt12343534', // Jujutsu Kaisen - TMDB 95479
    title: 'Jujutsu Kaisen',
    type: 'anime',
    category: 'anime',
    year: '2020-Present',
    duration: '2 Seasons',
    rating: '8.6',
    genre: 'Action / Supernatural / Fantasy',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    episodesPerSeason: 24,
    description: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman school to be able to locate the demon\'s other body parts and exorcise himself.',
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 3,
    isTrending: true,
  },
  {
    id: 'tt0388629', // One Piece - TMDB 37854
    title: 'One Piece',
    type: 'anime',
    category: 'anime',
    year: '1999-Present',
    duration: '21 Seasons',
    rating: '9.0',
    genre: 'Action / Adventure / Comedy',
    season: 1,
    episode: 1,
    totalSeasons: 21,
    episodesPerSeason: 50,
    description: 'Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 4,
    isTrending: true,
  },
  {
    id: 'tt21209876', // Solo Leveling - TMDB 209867
    title: 'Solo Leveling',
    type: 'anime',
    category: 'anime',
    year: '2024-Present',
    duration: 'Season 1-2',
    rating: '8.5',
    genre: 'Action / Fantasy / Adventure',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    episodesPerSeason: 12,
    description: 'In a world where hunters must battle deadly monsters to protect mankind from annihilation, the notoriously weak hunter Sung Jinwoo finds himself in a seemingly endless struggle for survival.',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 5,
    isTrending: true,
  },
  {
    id: 'tt0988824', // Naruto Shippuden - TMDB 31910
    title: 'Naruto: Shippuden',
    type: 'anime',
    category: 'anime',
    year: '2007-2017',
    duration: '21 Seasons',
    rating: '8.7',
    genre: 'Action / Adventure / Fantasy',
    season: 1,
    episode: 1,
    totalSeasons: 21,
    episodesPerSeason: 24,
    description: 'Naruto Uzumaki, is a loud, hyperactive, adolescent ninja who constantly searches for approval and recognition, as well as to become Hokage, who is acknowledged as the leader and strongest of all ninja in the village.',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 6,
    isTrending: true,
  },
  {
    id: 'tt0877057', // Death Note - TMDB 13916
    title: 'Death Note',
    type: 'anime',
    category: 'anime',
    year: '2006-2007',
    duration: '1 Season',
    rating: '9.0',
    genre: 'Crime / Drama / Psychological Thriller',
    season: 1,
    episode: 1,
    totalSeasons: 1,
    episodesPerSeason: 37,
    description: 'An intelligent high school student goes on a secret crusade to eliminate criminals from the world after discovering a notebook capable of killing anyone whose name is written into it.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 7,
    isTrending: false,
  },
  {
    id: 'tt13616990', // Chainsaw Man - TMDB 114410
    title: 'Chainsaw Man',
    type: 'anime',
    category: 'anime',
    year: '2022-Present',
    duration: 'Season 1',
    rating: '8.4',
    genre: 'Action / Dark Fantasy / Comedy',
    season: 1,
    episode: 1,
    totalSeasons: 1,
    episodesPerSeason: 12,
    description: 'Following a betrayal, a young man left for the dead is reborn as a powerful devil-human hybrid after merging with his pet devil, Pochita, and is soon recruited into an organization of devil hunters.',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 8,
    isTrending: false,
  },
  {
    id: 'tt0359013', // Bleach / Thousand-Year Blood War
    title: 'Bleach: Thousand-Year Blood War',
    type: 'anime',
    category: 'anime',
    year: '2022-Present',
    duration: '3 Seasons',
    rating: '9.0',
    genre: 'Action / Adventure / Supernatural',
    season: 1,
    episode: 1,
    totalSeasons: 3,
    episodesPerSeason: 13,
    description: 'The peace is suddenly broken when warning sirens blare through the Soul Society. The Quincy army begins a massive assault on the Soul Reapers, triggering an epic war.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 9,
    isTrending: false,
  },
  {
    id: 'tt13706018', // Spy x Family - TMDB 120089
    title: 'Spy x Family',
    type: 'anime',
    category: 'anime',
    year: '2022-Present',
    duration: '2 Seasons',
    rating: '8.4',
    genre: 'Comedy / Action / Family',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    episodesPerSeason: 25,
    description: 'A spy on an undercover mission gets married and adopts a child as part of his cover. His wife and daughter have secrets of their own, and all three must strive to keep together.',
    posterUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 10,
    isTrending: false,
  },
  {
    id: 'tt5311514', // Your Name (Kimi no Na wa) - TMDB 372058 (Movie)
    title: 'Your Name (Kimi no Na wa)',
    type: 'anime',
    category: 'anime',
    year: '2016',
    duration: '1h 46m',
    rating: '8.4',
    genre: 'Animation / Drama / Fantasy / Romance',
    description: 'Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 11,
    isTrending: false,
  },
  {
    id: 'tt0245429', // Spirited Away (Sen to Chihiro no Kamikakushi) - TMDB 129 (Movie)
    title: 'Spirited Away',
    type: 'anime',
    category: 'anime',
    year: '2001',
    duration: '2h 05m',
    rating: '8.6',
    genre: 'Animation / Adventure / Family / Fantasy',
    description: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 12,
    isTrending: false,
  },
];

/**
 * Top curated TMDB Movies collection
 */
export const POPULAR_MOVIES: MediaItem[] = [
  {
    id: 'tt31193180',
    title: 'Moana 2',
    type: 'movie',
    category: 'movie',
    year: '2024',
    duration: '1h 40m',
    rating: '7.1',
    genre: 'Animation / Adventure / Family',
    description: 'After receiving an unexpected call from her wayfinding ancestors, Moana journeys to the far seas of Oceania into dangerous, long-lost waters.',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 1,
    isTrending: true,
  },
  {
    id: 'tt6263850',
    title: 'Deadpool & Wolverine',
    type: 'movie',
    category: 'movie',
    year: '2024',
    duration: '2h 08m',
    rating: '7.8',
    genre: 'Action / Comedy / Sci-Fi',
    description: 'Wolverine is recovering from his injuries when he crosses paths with the loudmouth, Deadpool. They team up to defeat a common enemy.',
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 2,
    isTrending: true,
  },
  {
    id: 'tt15239678',
    title: 'Dune: Part Two',
    type: 'movie',
    category: 'movie',
    year: '2024',
    duration: '2h 46m',
    rating: '8.6',
    genre: 'Action / Adventure / Sci-Fi',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    posterUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 3,
    isTrending: true,
  },
  {
    id: 'tt9218128',
    title: 'Gladiator II',
    type: 'movie',
    category: 'movie',
    year: '2024',
    duration: '2h 28m',
    rating: '7.2',
    genre: 'Action / Drama / Epic',
    description: 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered.',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 4,
    isTrending: true,
  },
  {
    id: 'tt15398776',
    title: 'Oppenheimer',
    type: 'movie',
    category: 'movie',
    year: '2023',
    duration: '3h 00m',
    rating: '8.9',
    genre: 'Biography / Drama / History',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 5,
    isTrending: true,
  },
  {
    id: 'tt0816692',
    title: 'Interstellar',
    type: 'movie',
    category: 'movie',
    year: '2014',
    duration: '2h 49m',
    rating: '8.7',
    genre: 'Adventure / Drama / Sci-Fi',
    description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 6,
    isTrending: false,
  },
  {
    id: 'tt0468569',
    title: 'The Dark Knight',
    type: 'movie',
    category: 'movie',
    year: '2008',
    duration: '2h 32m',
    rating: '9.0',
    genre: 'Action / Crime / Drama',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 7,
    isTrending: false,
  },
  {
    id: 'tt1375666',
    title: 'Inception',
    type: 'movie',
    category: 'movie',
    year: '2010',
    duration: '2h 28m',
    rating: '8.8',
    genre: 'Action / Adventure / Sci-Fi',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 8,
    isTrending: false,
  },
  {
    id: 'tt8367814',
    title: 'Alien: Romulus',
    type: 'movie',
    category: 'movie',
    year: '2024',
    duration: '1h 59m',
    rating: '7.3',
    genre: 'Horror / Sci-Fi / Thriller',
    description: 'While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 9,
    isTrending: false,
  },
  {
    id: 'tt9362722',
    title: 'Spider-Man: Across the Spider-Verse',
    type: 'movie',
    category: 'movie',
    year: '2023',
    duration: '2h 20m',
    rating: '8.6',
    genre: 'Animation / Action / Adventure',
    description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 10,
    isTrending: false,
  },
];

/**
 * Top curated TMDB TV Shows collection
 */
export const POPULAR_TV_SHOWS: MediaItem[] = [
  {
    id: 'tt3581920',
    title: 'The Last of Us',
    type: 'tv',
    category: 'tv',
    year: '2023-2025',
    duration: 'Season 1-2',
    rating: '8.8',
    genre: 'Action / Adventure / Drama',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    episodesPerSeason: 9,
    description: 'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity\'s last hope.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 1,
    isTrending: true,
  },
  {
    id: 'tt12637874',
    title: 'Fallout',
    type: 'tv',
    category: 'tv',
    year: '2024-Present',
    duration: 'Season 1-2',
    rating: '8.4',
    genre: 'Action / Adventure / Sci-Fi',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    episodesPerSeason: 8,
    description: 'In a future, post-apocalyptic Los Angeles brought about by nuclear decimation, citizens must live in underground bunkers to protect themselves from radiation, mutants and bandits.',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 2,
    isTrending: true,
  },
  {
    id: 'tt0903747',
    title: 'Breaking Bad',
    type: 'tv',
    category: 'tv',
    year: '2008-2013',
    duration: '5 Seasons',
    rating: '9.5',
    genre: 'Crime / Drama / Thriller',
    season: 1,
    episode: 1,
    totalSeasons: 5,
    episodesPerSeason: 13,
    description: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family\'s future.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 3,
    isTrending: true,
  },
  {
    id: 'tt0944947',
    title: 'Game of Thrones',
    type: 'tv',
    category: 'tv',
    year: '2011-2019',
    duration: '8 Seasons',
    rating: '9.2',
    genre: 'Action / Adventure / Drama / Fantasy',
    season: 1,
    episode: 1,
    totalSeasons: 8,
    episodesPerSeason: 10,
    description: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 4,
    isTrending: true,
  },
  {
    id: 'tt4574334',
    title: 'Stranger Things',
    type: 'tv',
    category: 'tv',
    year: '2016-2025',
    duration: '4 Seasons',
    rating: '8.7',
    genre: 'Drama / Fantasy / Horror',
    season: 1,
    episode: 1,
    totalSeasons: 4,
    episodesPerSeason: 8,
    description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    posterUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 5,
    isTrending: false,
  },
  {
    id: 'tt11198330',
    title: 'House of the Dragon',
    type: 'tv',
    category: 'tv',
    year: '2022-Present',
    duration: '2 Seasons',
    rating: '8.4',
    genre: 'Action / Adventure / Drama',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    episodesPerSeason: 10,
    description: 'An internal succession contest within House Targaryen at the height of its power, 172 years before the birth of Daenerys Targaryen.',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 6,
    isTrending: false,
  },
  {
    id: 'tt2788316',
    title: 'Shōgun',
    type: 'tv',
    category: 'tv',
    year: '2024',
    duration: '1 Season',
    rating: '8.7',
    genre: 'Adventure / Drama / History',
    season: 1,
    episode: 1,
    totalSeasons: 1,
    episodesPerSeason: 10,
    description: 'When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power.',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 7,
    isTrending: false,
  },
  {
    id: 'tt11280740',
    title: 'Severance',
    type: 'tv',
    category: 'tv',
    year: '2022-Present',
    duration: 'Season 1-2',
    rating: '8.7',
    genre: 'Drama / Mystery / Sci-Fi',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    episodesPerSeason: 9,
    description: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 8,
    isTrending: false,
  },
];

/**
 * Procedural catalog generator for infinite scrolling across categories
 */
const INFINITE_EXPANSION_TEMPLATES: Record<ContentCategory, Omit<MediaItem, 'id'>[]> = {
  movie: [
    { title: 'The Matrix Resurrections', type: 'movie', category: 'movie', year: '2021', rating: '5.7', genre: 'Action / Sci-Fi', posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80' },
    { title: 'Blade Runner 2049', type: 'movie', category: 'movie', year: '2017', rating: '8.0', genre: 'Drama / Mystery / Sci-Fi', posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80' },
    { title: 'Spider-Man: No Way Home', type: 'movie', category: 'movie', year: '2021', rating: '8.2', genre: 'Action / Adventure', posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80' },
    { title: 'Avengers: Endgame', type: 'movie', category: 'movie', year: '2019', rating: '8.4', genre: 'Action / Sci-Fi', posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80' },
    { title: 'Avatar: The Way of Water', type: 'movie', category: 'movie', year: '2022', rating: '7.6', genre: 'Action / Adventure / Fantasy', posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80' },
    { title: 'The Batman', type: 'movie', category: 'movie', year: '2022', rating: '7.8', genre: 'Action / Crime / Drama', posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80' },
  ],
  tv: [
    { title: 'The Penguin', type: 'tv', category: 'tv', year: '2024', rating: '8.8', genre: 'Crime / Drama', totalSeasons: 1, episodesPerSeason: 8, posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80' },
    { title: 'Squid Game', type: 'tv', category: 'tv', year: '2021-2025', rating: '8.0', genre: 'Action / Drama', totalSeasons: 2, episodesPerSeason: 9, posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80' },
    { title: 'The Boys', type: 'tv', category: 'tv', year: '2019-2025', rating: '8.7', genre: 'Action / Comedy', totalSeasons: 4, episodesPerSeason: 8, posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80' },
    { title: 'Loki', type: 'tv', category: 'tv', year: '2021-2023', rating: '8.2', genre: 'Action / Fantasy / Sci-Fi', totalSeasons: 2, episodesPerSeason: 6, posterUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80' },
    { title: 'Chernobyl', type: 'tv', category: 'tv', year: '2019', rating: '9.3', genre: 'Drama / History', totalSeasons: 1, episodesPerSeason: 5, posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80' },
    { title: 'Succession', type: 'tv', category: 'tv', year: '2018-2023', rating: '8.9', genre: 'Comedy / Drama', totalSeasons: 4, episodesPerSeason: 10, posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80' },
  ],
  anime: [
    { title: 'Hunter x Hunter', type: 'anime', category: 'anime', year: '2011-2014', rating: '9.0', genre: 'Action / Adventure / Shonen', totalSeasons: 6, episodesPerSeason: 24, posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80' },
    { title: 'Fullmetal Alchemist: Brotherhood', type: 'anime', category: 'anime', year: '2009-2010', rating: '9.1', genre: 'Action / Adventure / Drama', totalSeasons: 5, episodesPerSeason: 13, posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80' },
    { title: 'Suzume', type: 'anime', category: 'anime', year: '2022', rating: '7.6', genre: 'Animation / Action / Adventure', posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80' },
    { title: 'Tokyo Ghoul', type: 'anime', category: 'anime', year: '2014-2018', rating: '7.8', genre: 'Action / Drama / Horror', totalSeasons: 4, episodesPerSeason: 12, posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80' },
    { title: 'My Hero Academia', type: 'anime', category: 'anime', year: '2016-Present', rating: '8.3', genre: 'Action / Adventure', totalSeasons: 7, episodesPerSeason: 25, posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80' },
    { title: 'Cyberpunk: Edgerunners', type: 'anime', category: 'anime', year: '2022', rating: '8.3', genre: 'Action / Sci-Fi', totalSeasons: 1, episodesPerSeason: 10, posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80' },
  ],
};

export const TMDB_API_KEY = 'b7201a3d11a59f587205fba70dd48e8d';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// TMDB Genre ID dictionary
const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
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

// In-memory cache for TMDB requests to keep navigation instant
const tmdbCache = new Map<string, { items: MediaItem[]; totalPages: number }>();
const externalIdCache = new Map<string, string>();
const showDetailsCache = new Map<string, any>();

function formatGenres(genreIds?: number[]): string {
  if (!genreIds || genreIds.length === 0) return 'General';
  return genreIds
    .slice(0, 3)
    .map((id) => TMDB_GENRES[id] || 'Cinema')
    .join(' / ');
}

/**
 * Fetch live content from TMDB API with real poster backdrops, titles, and ratings
 */
export async function fetchLiveTmdbCategoryContent(
  category: ContentCategory,
  page: number = 1,
  searchQuery: string = ''
): Promise<{ items: MediaItem[]; hasMore: boolean }> {
  const cacheKey = `${category}_p${page}_q${searchQuery.trim().toLowerCase()}`;
  if (tmdbCache.has(cacheKey)) {
    const cached = tmdbCache.get(cacheKey)!;
    return {
      items: cached.items,
      hasMore: page < cached.totalPages,
    };
  }

  const query = searchQuery.trim();
  let url = '';

  try {
    // 1. Direct IMDb ID search: e.g. tt0137523
    if (query.startsWith('tt') && query.length >= 7) {
      url = `${TMDB_BASE_URL}/find/${encodeURIComponent(query)}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
      const res = await fetch(url);
      if (res.ok) {
        const findData = await res.json();
        const foundResults = [
          ...(findData.movie_results || []).map((m: any) => ({ ...m, media_type: 'movie' })),
          ...(findData.tv_results || []).map((t: any) => ({ ...t, media_type: 'tv' })),
        ];

        if (foundResults.length > 0) {
          const items: MediaItem[] = foundResults.map((raw: any) => {
            const isMovie = raw.media_type === 'movie' || category === 'movie';
            const releaseDate = raw.release_date || raw.first_air_date || '';
            const year = releaseDate ? releaseDate.split('-')[0] : '2024';
            const title = raw.title || raw.name || raw.original_title || raw.original_name;

            return {
              id: query,
              tmdbId: raw.id,
              imdbId: query,
              title,
              type: isMovie ? 'movie' : (category === 'anime' ? 'anime' : 'tv'),
              category: category,
              year,
              rating: raw.vote_average ? raw.vote_average.toFixed(1) : '8.0',
              genre: formatGenres(raw.genre_ids),
              description: raw.overview || 'No synopsis available.',
              posterUrl: raw.poster_path
                ? `${TMDB_IMAGE_BASE_URL}/w500${raw.poster_path}`
                : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
              backdropUrl: raw.backdrop_path
                ? `${TMDB_IMAGE_BASE_URL}/w1280${raw.backdrop_path}`
                : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
              season: 1,
              episode: 1,
              totalSeasons: 1,
              episodesPerSeason: isMovie ? undefined : (category === 'anime' ? 24 : 10),
            };
          });

          tmdbCache.set(cacheKey, { items, totalPages: 1 });
          return { items, hasMore: false };
        }
      }
    }

    // 2. Standard Search query
    if (query.length > 0) {
      if (category === 'movie') {
        url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
      } else {
        // TV Shows and Anime
        url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
      }
    } else {
      // 3. Category Feeds (Movies, TV Shows, Anime)
      if (category === 'movie') {
        url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}&include_adult=false`;
      } else if (category === 'tv') {
        url = `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=${page}&include_adult=false`;
      } else if (category === 'anime') {
        // Japanese Animation TV Shows on TMDB (with_genres=16, with_original_language=ja)
        url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}&include_adult=false`;
      }
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB HTTP error ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];
    const totalPages = data.total_pages || 1;

    const items: MediaItem[] = results.map((raw: any, index: number) => {
      const isMovie = category === 'movie';
      const releaseDate = raw.release_date || raw.first_air_date || '';
      const year = releaseDate ? releaseDate.split('-')[0] : '2024';
      const title = raw.title || raw.name || raw.original_title || raw.original_name || 'Untitled';
      const tmdbId = raw.id;

      // Use tmdbId as default id; will be enriched to imdb_id on selection
      const mediaId = String(tmdbId);

      return {
        id: mediaId,
        tmdbId,
        title,
        type: isMovie ? 'movie' : (category === 'anime' ? 'anime' : 'tv'),
        category: category,
        year,
        rating: raw.vote_average ? raw.vote_average.toFixed(1) : '7.5',
        genre: formatGenres(raw.genre_ids),
        description: raw.overview || 'No synopsis available.',
        posterUrl: raw.poster_path
          ? `${TMDB_IMAGE_BASE_URL}/w500${raw.poster_path}`
          : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
        backdropUrl: raw.backdrop_path
          ? `${TMDB_IMAGE_BASE_URL}/w1280${raw.backdrop_path}`
          : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        trendingRank: (page - 1) * 20 + index + 1,
        isTrending: page === 1 && index < 6,
        season: 1,
        episode: 1,
        totalSeasons: 1,
        episodesPerSeason: isMovie ? undefined : (category === 'anime' ? 24 : 10),
      };
    });

    tmdbCache.set(cacheKey, { items, totalPages });
    return {
      items,
      hasMore: page < totalPages,
    };
  } catch (err) {
    console.warn('[TMDB API] Live fetch error, falling back to curated library:', err);
    return getTmdbCategoryContent(category, page, 12, searchQuery);
  }
}

/**
 * Fetch detailed show info (real seasons, episode counts) and external IMDb ID
 */
export async function fetchTmdbMediaDetails(media: MediaItem): Promise<MediaItem> {
  if (!media.tmdbId && !media.id) return media;
  const targetTmdbId = media.tmdbId || media.id;

  const cacheKey = `${media.type}_${targetTmdbId}`;
  if (showDetailsCache.has(cacheKey)) {
    return {
      ...media,
      ...showDetailsCache.get(cacheKey),
    };
  }

  try {
    const isMovie = media.type === 'movie';
    const typeEndpoint = isMovie ? 'movie' : 'tv';

    // 1. Fetch External IDs (to get IMDb id `tt...` for embed link)
    let imdbId = media.imdbId;
    if (!imdbId && !String(media.id).startsWith('tt')) {
      if (externalIdCache.has(cacheKey)) {
        imdbId = externalIdCache.get(cacheKey);
      } else {
        const extRes = await fetch(
          `${TMDB_BASE_URL}/${typeEndpoint}/${targetTmdbId}/external_ids?api_key=${TMDB_API_KEY}`
        );
        if (extRes.ok) {
          const extData = await extRes.json();
          if (extData.imdb_id) {
            imdbId = extData.imdb_id;
            externalIdCache.set(cacheKey, imdbId);
          }
        }
      }
    }

    // 2. If TV or Anime, fetch Season & Episode details
    let seasonsInfo: { seasonNumber: number; episodeCount: number; name: string }[] = [];
    let totalSeasons = media.totalSeasons || 1;
    let episodesPerSeason = media.episodesPerSeason || (media.type === 'anime' ? 24 : 10);

    if (!isMovie) {
      const detailsRes = await fetch(
        `${TMDB_BASE_URL}/tv/${targetTmdbId}?api_key=${TMDB_API_KEY}`
      );
      if (detailsRes.ok) {
        const details = await detailsRes.json();
        if (details.seasons && Array.isArray(details.seasons)) {
          seasonsInfo = details.seasons
            .filter((s: any) => s.season_number > 0) // Exclude specials season 0
            .map((s: any) => ({
              seasonNumber: s.season_number,
              episodeCount: s.episode_count || 10,
              name: s.name || `Season ${s.season_number}`,
            }));

          if (seasonsInfo.length > 0) {
            totalSeasons = seasonsInfo.length;
            const s1 = seasonsInfo.find((s) => s.seasonNumber === (media.season || 1));
            episodesPerSeason = s1 ? s1.episodeCount : seasonsInfo[0].episodeCount;
          }
        }
      }
    }

    const enriched: MediaItem = {
      ...media,
      id: imdbId || media.id,
      imdbId: imdbId || media.imdbId,
      totalSeasons,
      episodesPerSeason,
      seasonsInfo: seasonsInfo.length > 0 ? seasonsInfo : undefined,
    };

    showDetailsCache.set(cacheKey, enriched);
    return enriched;
  } catch (err) {
    console.warn('[TMDB Details] Failed to fetch show details:', err);
    return media;
  }
}

/**
 * Get paginated content for Movies, TV Shows, or Anime with infinite scrolling support (Curated fallback)
 */
export function getTmdbCategoryContent(
  category: ContentCategory,
  page: number = 1,
  pageSize: number = 12,
  searchQuery: string = ''
): { items: MediaItem[]; hasMore: boolean } {
  let baseList: MediaItem[] = [];

  if (category === 'movie') {
    baseList = [...POPULAR_MOVIES];
  } else if (category === 'tv') {
    baseList = [...POPULAR_TV_SHOWS];
  } else if (category === 'anime') {
    baseList = [...POPULAR_ANIME];
  }

  // Generate infinite expansion items for high page counts
  if (page > 1) {
    const templates = INFINITE_EXPANSION_TEMPLATES[category];
    const expansionCount = (page - 1) * pageSize;
    for (let i = 0; i < expansionCount; i++) {
      const tmpl = templates[i % templates.length];
      const offset = 30000000 + (page * 100) + i;
      const virtualId = `tt${offset}`;

      const generated: MediaItem = {
        ...tmpl,
        id: virtualId,
        title: `${tmpl.title}${i >= templates.length ? ` (Vol. ${Math.floor(i / templates.length) + 1})` : ''}`,
      };

      if (!baseList.some((item) => item.id === generated.id)) {
        baseList.push(generated);
      }
    }
  }

  // Filter by search query if any
  let filtered = baseList;
  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.genre?.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }

  const startIndex = 0;
  const endIndex = page * pageSize;
  const items = filtered.slice(startIndex, endIndex);

  return {
    items,
    hasMore: true,
  };
}

/**
 * Generate episodes list for a TV Show or Anime season
 */
export function getEpisodesForSeason(media: MediaItem, seasonNumber: number): number[] {
  if (media.seasonsInfo && media.seasonsInfo.length > 0) {
    const seasonData = media.seasonsInfo.find((s) => s.seasonNumber === seasonNumber);
    if (seasonData && seasonData.episodeCount > 0) {
      return Array.from({ length: seasonData.episodeCount }, (_, i) => i + 1);
    }
  }
  const count = media.episodesPerSeason || (media.type === 'anime' ? 24 : 10);
  const episodes: number[] = [];
  for (let i = 1; i <= count; i++) {
    episodes.push(i);
  }
  return episodes;
}
