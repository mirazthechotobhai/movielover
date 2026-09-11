import { MediaItem } from '../types';

export const TRENDING_MEDIA: MediaItem[] = [
  {
    id: 'tt31193180',
    title: 'Moana 2',
    type: 'movie',
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
    year: '2024',
    duration: '2h 46m',
    rating: '8.6',
    genre: 'Action / Adventure / Drama',
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
    id: 'tt3581920',
    title: 'The Last of Us',
    type: 'tv',
    year: '2023-2025',
    duration: 'Season 1-2',
    rating: '8.8',
    genre: 'Action / Adventure / Sci-Fi',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    description: 'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity\'s last hope.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 5,
    isTrending: true,
  },
  {
    id: 'tt12637874',
    title: 'Fallout',
    type: 'tv',
    year: '2024',
    duration: 'Season 1',
    rating: '8.4',
    genre: 'Action / Adventure / Sci-Fi',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    description: 'In a future, post-apocalyptic Los Angeles brought about by nuclear decimation, citizens must live in underground bunkers to protect from radiation and mutants.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 6,
    isTrending: true,
  },
  {
    id: 'tt11126994',
    title: 'Arcane',
    type: 'tv',
    year: '2021-2024',
    duration: 'Season 1-2',
    rating: '9.0',
    genre: 'Animation / Action / Sci-Fi',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    description: 'Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions-and the power that will tear them apart.',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 7,
    isTrending: true,
  },
  {
    id: '969681',
    title: 'Venom: The Last Dance',
    type: 'movie',
    year: '2024',
    duration: '1h 49m',
    rating: '6.5',
    genre: 'Action / Sci-Fi / Thriller',
    description: 'Eddie Brock and Venom are on the run. Hunted by both of their worlds, they are forced into a devastating decision.',
    posterUrl: 'https://images.unsplash.com/photo-1559583109-3e7968136c99?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1559583109-3e7968136c99?w=1200&auto=format&fit=crop&q=80',
    trendingRank: 8,
    isTrending: true,
  },
];

export const POPULAR_MOVIES: MediaItem[] = [
  ...TRENDING_MEDIA.filter((m) => m.type === 'movie'),
  {
    id: 'tt0816692',
    title: 'Interstellar',
    type: 'movie',
    year: '2014',
    duration: '2h 49m',
    rating: '8.7',
    genre: 'Adventure / Drama / Sci-Fi',
    description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt15398776',
    title: 'Oppenheimer',
    type: 'movie',
    year: '2023',
    duration: '3h 00m',
    rating: '8.9',
    genre: 'Biography / Drama / History',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt11315808',
    title: 'Avatar: The Way of Water',
    type: 'movie',
    year: '2022',
    duration: '3h 12m',
    rating: '7.6',
    genre: 'Action / Adventure / Fantasy',
    description: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns, Jake must work with Neytiri and the army of the Na\'vi.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt1877830',
    title: 'The Batman',
    type: 'movie',
    year: '2022',
    duration: '2h 56m',
    rating: '7.8',
    genre: 'Action / Crime / Drama',
    description: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt1087260',
    title: 'Spider-Man: No Way Home',
    type: 'movie',
    year: '2021',
    duration: '2h 28m',
    rating: '8.2',
    genre: 'Action / Adventure / Sci-Fi',
    description: 'With Spider-Man\'s identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds appear.',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt1375666',
    title: 'Inception',
    type: 'movie',
    year: '2010',
    duration: '2h 28m',
    rating: '8.8',
    genre: 'Action / Adventure / Sci-Fi',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt0468569',
    title: 'The Dark Knight',
    type: 'movie',
    year: '2008',
    duration: '2h 32m',
    rating: '9.0',
    genre: 'Action / Crime / Drama',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt14230458',
    title: 'Kingdom of the Planet of the Apes',
    type: 'movie',
    year: '2024',
    duration: '2h 25m',
    rating: '7.0',
    genre: 'Action / Adventure / Sci-Fi',
    description: 'Many years after the reign of Caesar, a young ape goes on a journey that will lead him to question everything he\'s been taught about the past and make choices that will define a future for apes and humans alike.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt8367814',
    title: 'Alien: Romulus',
    type: 'movie',
    year: '2024',
    duration: '1h 59m',
    rating: '7.3',
    genre: 'Horror / Sci-Fi / Thriller',
    description: 'While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt1517268',
    title: 'Barbie',
    type: 'movie',
    year: '2023',
    duration: '1h 54m',
    rating: '6.9',
    genre: 'Adventure / Comedy / Fantasy',
    description: 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt6791350',
    title: 'Guardians of the Galaxy Vol. 3',
    type: 'movie',
    year: '2023',
    duration: '2h 30m',
    rating: '7.9',
    genre: 'Action / Adventure / Comedy',
    description: 'Still reeling from the loss of Gamora, Peter Quill rallies his team to defend the universe and one of their own - a mission that could mean the end of the Guardians if not successful.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt9362722',
    title: 'Spider-Man: Across the Spider-Verse',
    type: 'movie',
    year: '2023',
    duration: '2h 20m',
    rating: '8.6',
    genre: 'Animation / Action / Adventure',
    description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt1630029',
    title: 'Avatar',
    type: 'movie',
    year: '2009',
    duration: '2h 42m',
    rating: '7.9',
    genre: 'Action / Adventure / Fantasy',
    description: 'A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt0133093',
    title: 'The Matrix',
    type: 'movie',
    year: '1999',
    duration: '2h 16m',
    rating: '8.7',
    genre: 'Action / Sci-Fi',
    description: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.',
    posterUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt0110912',
    title: 'Pulp Fiction',
    type: 'movie',
    year: '1994',
    duration: '2h 34m',
    rating: '8.9',
    genre: 'Crime / Drama',
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt0111161',
    title: 'The Shawshank Redemption',
    type: 'movie',
    year: '1994',
    duration: '2h 22m',
    rating: '9.3',
    genre: 'Drama',
    description: 'Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.',
    posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt0109830',
    title: 'Forrest Gump',
    type: 'movie',
    year: '1994',
    duration: '2h 22m',
    rating: '8.8',
    genre: 'Drama / Romance',
    description: 'The history of the United States from the 1950s to the \'70s unfolds from the perspective of an Alabama man with an IQ of 75, who yearns to be reunited with his childhood sweetheart.',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt0167260',
    title: 'The Lord of the Rings: The Return of the King',
    type: 'movie',
    year: '2003',
    duration: '3h 21m',
    rating: '9.0',
    genre: 'Action / Adventure / Drama',
    description: 'Gandalf and Aragorn lead the World of Men against Sauron\'s army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt0120737',
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    type: 'movie',
    year: '2001',
    duration: '2h 58m',
    rating: '8.8',
    genre: 'Action / Adventure / Drama',
    description: 'A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt0137523',
    title: 'Fight Club',
    type: 'movie',
    year: '1999',
    duration: '2h 19m',
    rating: '8.8',
    genre: 'Drama',
    description: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
];

export const POPULAR_TV_SHOWS: MediaItem[] = [
  ...TRENDING_MEDIA.filter((m) => m.type === 'tv'),
  {
    id: 'tt0903747',
    title: 'Breaking Bad',
    type: 'tv',
    year: '2008-2013',
    duration: 'Season 1-5',
    rating: '9.5',
    genre: 'Crime / Drama / Thriller',
    season: 1,
    episode: 1,
    totalSeasons: 5,
    description: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family\'s financial future.',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt4574334',
    title: 'Stranger Things',
    type: 'tv',
    year: '2016-2025',
    duration: 'Season 1-5',
    rating: '8.7',
    genre: 'Drama / Fantasy / Horror',
    season: 1,
    episode: 1,
    totalSeasons: 5,
    description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt9140554',
    title: 'Loki',
    type: 'tv',
    year: '2021-2023',
    duration: 'Season 1-2',
    rating: '8.2',
    genre: 'Action / Adventure / Fantasy',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    description: 'The mercurial villain Loki resumes his role as the God of Mischief in a new series that takes place after the events of Avengers: Endgame.',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt0944947',
    title: 'Game of Thrones',
    type: 'tv',
    year: '2011-2019',
    duration: 'Season 1-8',
    rating: '9.2',
    genre: 'Action / Adventure / Drama',
    season: 1,
    episode: 1,
    totalSeasons: 8,
    description: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt11198330',
    title: 'House of the Dragon',
    type: 'tv',
    year: '2022-Present',
    duration: 'Season 1-2',
    rating: '8.4',
    genre: 'Action / Adventure / Drama',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    description: 'An internal succession war within House Targaryen at the height of its power, 172 years before the birth of Daenerys Targaryen.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt1190634',
    title: 'The Boys',
    type: 'tv',
    year: '2019-Present',
    duration: 'Season 1-4',
    rating: '8.7',
    genre: 'Action / Comedy / Drama',
    season: 1,
    episode: 1,
    totalSeasons: 4,
    description: 'A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.',
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt3032476',
    title: 'Better Call Saul',
    type: 'tv',
    year: '2015-2022',
    duration: 'Season 1-6',
    rating: '9.0',
    genre: 'Crime / Drama',
    season: 1,
    episode: 1,
    totalSeasons: 6,
    description: 'The trials and tribulations of criminal lawyer Jimmy McGill in the years leading up to his fateful run-in with Walter White and Jesse Pinkman.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt8111088',
    title: 'The Mandalorian',
    type: 'tv',
    year: '2019-Present',
    duration: 'Season 1-3',
    rating: '8.6',
    genre: 'Action / Adventure / Sci-Fi',
    season: 1,
    episode: 1,
    totalSeasons: 3,
    description: 'The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt8772296',
    title: 'Euphoria',
    type: 'tv',
    year: '2019-Present',
    duration: 'Season 1-2',
    rating: '8.3',
    genre: 'Drama',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    description: 'A look at life for a group of high school students as they grapple with issues of drugs, sex, and identity.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt14452776',
    title: 'Shōgun',
    type: 'tv',
    year: '2024',
    duration: 'Season 1',
    rating: '8.7',
    genre: 'Adventure / Drama / History',
    season: 1,
    episode: 1,
    totalSeasons: 1,
    description: 'When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power.',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt1063870',
    title: 'Vikings',
    type: 'tv',
    year: '2013-2020',
    duration: 'Season 1-6',
    rating: '8.5',
    genre: 'Action / Adventure / Drama',
    season: 1,
    episode: 1,
    totalSeasons: 6,
    description: 'Ragnar Lothbrok, a legendary Norse hero, navigates the complexities of battle, conquest, and familial ties.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tt13406094',
    title: 'The White Lotus',
    type: 'tv',
    year: '2021-Present',
    duration: 'Season 1-3',
    rating: '8.0',
    genre: 'Comedy / Drama',
    season: 1,
    episode: 1,
    totalSeasons: 3,
    description: 'A sharp social satire following the exploits of various employees and guests at an exclusive Hawaiian resort over the span of a week.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
];

// Additional rich catalog items for continuous infinite scroll generation
const INFINITE_EXPANSION_CATALOG: Omit<MediaItem, 'id'>[] = [
  {
    title: 'John Wick: Chapter 4',
    type: 'movie',
    year: '2023',
    duration: '2h 49m',
    rating: '7.7',
    genre: 'Action / Crime / Thriller',
    description: 'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Top Gun: Maverick',
    type: 'movie',
    year: '2022',
    duration: '2h 10m',
    rating: '8.3',
    genre: 'Action / Drama',
    description: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN\'s elite graduates.',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Everything Everywhere All at Once',
    type: 'movie',
    year: '2022',
    duration: '2h 19m',
    rating: '7.8',
    genre: 'Action / Adventure / Comedy',
    description: 'A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Severance',
    type: 'tv',
    year: '2022-Present',
    duration: 'Season 1-2',
    rating: '8.7',
    genre: 'Drama / Mystery / Sci-Fi',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    description: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Peaky Blinders',
    type: 'tv',
    year: '2013-2022',
    duration: 'Season 1-6',
    rating: '8.8',
    genre: 'Crime / Drama',
    season: 1,
    episode: 1,
    totalSeasons: 6,
    description: 'A gangster family epic set in 1900s England, centering on a gang who sew razor blades in the peaks of their caps, and their fierce boss Tommy Shelby.',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Succession',
    type: 'tv',
    year: '2018-2023',
    duration: 'Season 1-4',
    rating: '8.9',
    genre: 'Drama',
    season: 1,
    episode: 1,
    totalSeasons: 4,
    description: 'The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their aging father steps down.',
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Cyberpunk: Edgerunners',
    type: 'tv',
    year: '2022',
    duration: 'Season 1',
    rating: '8.3',
    genre: 'Animation / Action / Sci-Fi',
    season: 1,
    episode: 1,
    totalSeasons: 1,
    description: 'A street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner.',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Furiosa: A Mad Max Saga',
    type: 'movie',
    year: '2024',
    duration: '2h 28m',
    rating: '7.6',
    genre: 'Action / Adventure / Sci-Fi',
    description: 'The origin story of renegade warrior Furiosa before her encounter and teamup with Mad Max.',
    posterUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Twisters',
    type: 'movie',
    year: '2024',
    duration: '2h 02m',
    rating: '6.7',
    genre: 'Action / Adventure / Thriller',
    description: 'Kate Carter and Tyler Owens find themselves in the midst of multiple storm systems converging over central Oklahoma.',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Godzilla x Kong: The New Empire',
    type: 'movie',
    year: '2024',
    duration: '1h 55m',
    rating: '6.1',
    genre: 'Action / Adventure / Sci-Fi',
    description: 'Two ancient titans, Godzilla and Kong, clash in an epic battle as humans unravel their intertwined origins and connection to Skull Island\'s mysteries.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'The Penguin',
    type: 'tv',
    year: '2024',
    duration: 'Season 1',
    rating: '8.8',
    genre: 'Crime / Drama',
    season: 1,
    episode: 1,
    totalSeasons: 1,
    description: 'Following the events of The Batman (2022), Oz Cobb, a.k.a. the Penguin, makes a play to seize the reins of the crime world in Gotham.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Squid Game',
    type: 'tv',
    year: '2021-2025',
    duration: 'Season 1-2',
    rating: '8.0',
    genre: 'Action / Drama / Mystery',
    season: 1,
    episode: 1,
    totalSeasons: 2,
    description: 'Hundreds of cash-strapped players accept a strange invitation to compete in children\'s games. Inside, a tempting prize awaits with deadly high stakes.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  },
];

/**
 * Builds the official EmbedMaster iframe URL based on configuration and media type
 * Movie: https://embedmaster.link/movie/{id}
 * TV:    https://embedmaster.link/tv/{id}/{season}/{episode}
 * Required: {id} - IMDb or TMDB id. IMDb id must have tt prefix!
 */
export function buildEmbedMasterUrl(
  media: MediaItem,
  options?: {
    skin?: 'onyx' | 'aurora';
    welcomePage?: 'on' | 'off';
    autoplay?: 'on' | 'off';
    subtitles?: { url: string; label: string }[];
  }
): string {
  let base: string;

  // Use IMDb ID (must have tt prefix) or numeric TMDB ID
  const mediaId = media.imdbId && media.imdbId.startsWith('tt')
    ? media.imdbId
    : (media.id || (media.tmdbId ? String(media.tmdbId) : 'tt31193180'));

  if (
    media.type === 'tv' ||
    (media.type === 'anime' &&
      (media.season !== undefined || (media.totalSeasons && media.totalSeasons > 0)))
  ) {
    const s = media.season || 1;
    const ep = media.episode || 1;
    base = `https://embedmaster.link/tv/${encodeURIComponent(mediaId)}/${s}/${ep}`;
  } else {
    base = `https://embedmaster.link/movie/${encodeURIComponent(mediaId)}`;
  }

  const queryParams = new URLSearchParams();

  if (options?.skin) {
    queryParams.set('skin', options.skin);
  }
  if (options?.welcomePage) {
    queryParams.set('welcome_page', options.welcomePage);
  }
  if (options?.autoplay) {
    queryParams.set('autoplay', options.autoplay);
  }

  // Handle custom subtitles: sub_url[]=...&sub_label[]=...
  if (options?.subtitles && options.subtitles.length > 0) {
    options.subtitles.forEach((sub) => {
      if (sub.url && sub.label) {
        queryParams.append('sub_url[]', sub.url);
        queryParams.append('sub_label[]', sub.label);
      }
    });
  }

  const queryString = queryParams.toString();
  return queryString ? `${base}?${queryString}` : base;
}

/**
 * Generator helper that dynamically creates paginated items for infinite scrolling.
 * Supports infinite batches so user can scroll indefinitely!
 */
export function getPaginatedMediaBatch(
  page: number,
  pageSize: number = 12,
  filterType: 'all' | 'movie' | 'tv' = 'all',
  selectedGenre: string = 'all',
  searchQuery: string = ''
): MediaItem[] {
  // Combine all base pools
  const combinedPool: MediaItem[] = [
    ...POPULAR_MOVIES,
    ...POPULAR_TV_SHOWS,
  ];

  // De-duplicate by ID
  const uniqueMap = new Map<string, MediaItem>();
  combinedPool.forEach((item) => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });
  let baseList = Array.from(uniqueMap.values());

  // If page is beyond base list length, generate pseudo-infinite items based on expansion catalog
  if (page > 1) {
    const expansionCount = (page - 1) * pageSize;
    for (let i = 0; i < expansionCount; i++) {
      const template = INFINITE_EXPANSION_CATALOG[i % INFINITE_EXPANSION_CATALOG.length];
      const virtualId = template.type === 'movie' ? `tt${10000000 + (page * 100) + i}` : `tt${20000000 + (page * 100) + i}`;
      
      const generatedItem: MediaItem = {
        ...template,
        id: virtualId,
        title: `${template.title}${i >= INFINITE_EXPANSION_CATALOG.length ? ` (Part ${Math.floor(i / INFINITE_EXPANSION_CATALOG.length) + 1})` : ''}`,
      };
      
      if (!uniqueMap.has(generatedItem.id)) {
        uniqueMap.set(generatedItem.id, generatedItem);
        baseList.push(generatedItem);
      }
    }
  }

  // Apply filters
  let filtered = baseList;
  if (filterType !== 'all') {
    filtered = filtered.filter((item) => item.type === filterType);
  }

  if (selectedGenre !== 'all') {
    filtered = filtered.filter((item) =>
      item.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.genre?.toLowerCase().includes(q)
    );
  }

  // Return sliced batch for the requested page
  const startIndex = 0;
  const endIndex = page * pageSize;
  return filtered.slice(startIndex, endIndex);
}
