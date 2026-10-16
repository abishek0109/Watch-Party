import { MovieMetadata } from './types';

export const DEMO_MOVIES: MovieMetadata[] = [
  {
    id: 'demo-1',
    title: 'Big Buck Bunny',
    overview: 'A large and lovable rabbit deals with bullying forest creatures in this groundbreaking open-source animated comedy masterpiece.',
    posterPath: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    releaseDate: '2008-04-10',
    voteAverage: 8.4,
    genres: ['Animation', 'Comedy', 'Family'],
    playableDemoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'demo-2',
    title: 'Tears of Steel',
    overview: 'Set in a dystopian future Amsterdam, a group of scientists and warriors attempt to stage an alternate reality to save planet Earth from destructive robotic invaders.',
    posterPath: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    releaseDate: '2012-09-26',
    voteAverage: 7.9,
    genres: ['Sci-Fi', 'Action', 'Cyberpunk'],
    playableDemoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  },
  {
    id: 'demo-3',
    title: 'Elephants Dream',
    overview: 'Two eccentric mechanics wander through the labyrinthine gears and shifting architecture of an infinite steam-powered computational machine.',
    posterPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    releaseDate: '2006-03-24',
    voteAverage: 7.6,
    genres: ['Animation', 'Sci-Fi', 'Fantasy'],
    playableDemoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'demo-4',
    title: 'Sintel: The Dragon Hunter',
    overview: 'A determined young warrior embarks on a dangerous pilgrimage across snowbound mountains and ruined cities to rescue her stolen baby dragon.',
    posterPath: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    releaseDate: '2010-09-27',
    voteAverage: 8.8,
    genres: ['Animation', 'Adventure', 'Fantasy'],
    playableDemoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
  {
    id: 'demo-5',
    title: 'Cosmos Laundromat',
    overview: 'On a desolate Scottish island, a suicidal sheep named Franck meets a mysterious salesman who offers him the chance to experience dozens of alternate lives.',
    posterPath: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    releaseDate: '2015-08-10',
    voteAverage: 8.1,
    genres: ['Animation', 'Comedy', 'Sci-Fi'],
    playableDemoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'demo-6',
    title: 'Subaru: The Escape Route',
    overview: 'High-octane chase sequence through neon-drenched mountain switchbacks with cinematic drift sequences and pulsing synthesizer soundtrack.',
    posterPath: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
    releaseDate: '2023-05-14',
    voteAverage: 8.3,
    genres: ['Action', 'Thriller'],
    playableDemoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'demo-7',
    title: 'Chronicles of the Deep Blue',
    overview: 'An awe-inspiring underwater voyage exploring deep-sea hydrothermal vents, glowing bioluminescent fauna, and ancient sunken ships.',
    posterPath: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    releaseDate: '2021-11-03',
    voteAverage: 8.7,
    genres: ['Documentary', 'Nature'],
    playableDemoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  },
  {
    id: 'demo-8',
    title: 'Neon Odyssey: 2099',
    overview: 'In orbital megacity Neo-Tokyo, a rogue courier uncovers an artificial intelligence consciousness trying to escape to outer planetary space.',
    posterPath: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    releaseDate: '2024-02-18',
    voteAverage: 9.1,
    genres: ['Sci-Fi', 'Thriller', 'Mystery'],
    playableDemoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  }
];

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export function filterAndSearchMovies(
  movies: MovieMetadata[],
  query?: string,
  genre?: string,
  year?: string,
  sort?: string
): MovieMetadata[] {
  let results = [...movies];

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    results = results.filter((m) => {
      const titleLower = m.title.toLowerCase();
      const overviewLower = m.overview.toLowerCase();
      const genresMatch = m.genres.some((g: string) => g.toLowerCase().includes(q));

      if (titleLower.includes(q) || overviewLower.includes(q) || genresMatch) {
        return true;
      }

      const words = titleLower.split(/\s+/);
      return words.some((word) => levenshteinDistance(word, q) <= 2);
    });
  }

  if (genre && genre !== 'all') {
    results = results.filter((m) => m.genres.some((g: string) => g.toLowerCase() === genre.toLowerCase()));
  }

  if (year && year !== 'all') {
    results = results.filter((m) => m.releaseDate.startsWith(year));
  }

  if (sort === 'rating') {
    results.sort((a, b) => b.voteAverage - a.voteAverage);
  } else if (sort === 'date') {
    results.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
  } else if (sort === 'title') {
    results.sort((a, b) => a.title.localeCompare(b.title));
  }

  return results;
}
