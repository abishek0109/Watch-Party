import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const userController = {
  async getWatchlist(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const items = await prisma.watchlistItem.findMany({
        where: { userId: req.user.id },
        orderBy: { addedAt: 'desc' },
      });

      return res.json(items);
    } catch (err: any) {
      console.error('[Get Watchlist Error]', err);
      return res.status(500).json({ message: 'Failed to fetch watchlist' });
    }
  },

  async addToWatchlist(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { movieId, movieTitle, posterPath, overview, rating } = req.body;

      if (!movieId || !movieTitle) {
        return res.status(400).json({ message: 'Movie ID and title required' });
      }

      const item = await prisma.watchlistItem.upsert({
        where: {
          userId_movieId: {
            userId: req.user.id,
            movieId: String(movieId),
          },
        },
        update: {
          movieTitle,
          posterPath,
          overview: overview || null,
          rating: rating || null,
        },
        create: {
          userId: req.user.id,
          movieId: String(movieId),
          movieTitle,
          posterPath,
          overview: overview || null,
          rating: rating || null,
        },
      });

      return res.status(201).json(item);
    } catch (err: any) {
      console.error('[Add Watchlist Error]', err);
      return res.status(500).json({ message: 'Failed to add to watchlist' });
    }
  },

  async removeFromWatchlist(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { movieId } = req.params;

      await prisma.watchlistItem.deleteMany({
        where: {
          userId: req.user.id,
          movieId: String(movieId),
        },
      });

      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Remove Watchlist Error]', err);
      return res.status(500).json({ message: 'Failed to remove from watchlist' });
    }
  },

  async getHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const history = await prisma.watchHistory.findMany({
        where: { userId: req.user.id },
        orderBy: { watchedAt: 'desc' },
        take: 30,
      });

      return res.json(history);
    } catch (err: any) {
      console.error('[Get History Error]', err);
      return res.status(500).json({ message: 'Failed to fetch watch history' });
    }
  },
};
