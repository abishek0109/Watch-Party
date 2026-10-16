import { Request, Response } from 'express';
import { DEMO_MOVIES, filterAndSearchMovies } from '../../../shared/movieCatalog';
import { MovieMetadata } from '../../../shared/types';

export const movieController = {
  async getMovies(req: Request, res: Response) {
    try {
      const { query, genre, year, sort } = req.query;
      const apiKey = process.env.TMDB_API_KEY;

      // If TMDB API key is configured and there's a search query, fetch from TMDB
      if (apiKey && apiKey.trim() !== '' && query) {
        try {
          const tmdbRes = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
              String(query)
            )}&include_adult=false&language=en-US&page=1`
          );
          if (tmdbRes.ok) {
            const data: any = await tmdbRes.json();
            const tmdbMovies: MovieMetadata[] = data.results.slice(0, 15).map((m: any) => ({
              id: m.id,
              title: m.title,
              overview: m.overview || 'No overview available.',
              posterPath: m.poster_path
                ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
              backdropPath: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
              releaseDate: m.release_date || '2024-01-01',
              voteAverage: m.vote_average || 7.0,
              genres: ['Feature Film'],
              playableDemoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            }));

            return res.json({
              source: 'tmdb',
              movies: tmdbMovies,
            });
          }
        } catch (tmdbErr) {
          console.warn('[TMDB Error - falling back to demo catalog]', tmdbErr);
        }
      }

      // Built-in high quality catalog with fuzzy search
      const filtered = filterAndSearchMovies(
        DEMO_MOVIES,
        query ? String(query) : undefined,
        genre ? String(genre) : undefined,
        year ? String(year) : undefined,
        sort ? String(sort) : undefined
      );

      return res.json({
        source: apiKey && apiKey.trim() !== '' ? 'tmdb_fallback' : 'demo_catalog',
        movies: filtered,
      });
    } catch (err: any) {
      console.error('[Movie Controller Error]', err);
      return res.status(500).json({ message: 'Failed to search movies' });
    }
  },

  async getFeatured(req: Request, res: Response) {
    try {
      return res.json({
        featured: DEMO_MOVIES.slice(0, 5),
        trending: DEMO_MOVIES.slice(2, 7),
      });
    } catch (err: any) {
      console.error('[Movie Featured Error]', err);
      return res.status(500).json({ message: 'Failed to fetch featured movies' });
    }
  },
};
