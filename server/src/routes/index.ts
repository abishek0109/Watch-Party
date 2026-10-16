import { Router } from 'express';
import { authController } from '../controllers/authController';
import { roomController } from '../controllers/roomController';
import { movieController } from '../controllers/movieController';
import { userController } from '../controllers/userController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/guest', authController.createGuest);
router.get('/auth/me', authMiddleware, authController.getMe);

// Room routes
router.post('/rooms', optionalAuthMiddleware, roomController.createRoom);
router.get('/rooms/public', roomController.getPublicRooms);
router.get('/rooms/:roomIdOrCode', roomController.getRoom);
router.post('/rooms/:roomId/memories', roomController.saveMemory);
router.get('/rooms/:roomId/memories', roomController.getMemories);

// Movie routes
router.get('/movies', movieController.getMovies);
router.get('/movies/featured', movieController.getFeatured);

// User Watchlist & History
router.get('/user/watchlist', authMiddleware, userController.getWatchlist);
router.post('/user/watchlist', authMiddleware, userController.addToWatchlist);
router.delete('/user/watchlist/:movieId', authMiddleware, userController.removeFromWatchlist);
router.get('/user/history', authMiddleware, userController.getHistory);

export default router;
