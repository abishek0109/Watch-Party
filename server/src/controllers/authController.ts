import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db';
import { signToken, AuthRequest } from '../middleware/auth';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ username }, ...(email ? [{ email }] : [])],
        },
      });

      if (existing) {
        return res.status(409).json({ message: 'Username or email already in use' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

      const user = await prisma.user.create({
        data: {
          username,
          email: email || null,
          passwordHash,
          avatarUrl,
          isGuest: false,
        },
      });

      const token = signToken({ id: user.id, username: user.username, isGuest: false });

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          isGuest: false,
        },
      });
    } catch (err: any) {
      console.error('[Auth register error]', err);
      return res.status(500).json({ message: 'Failed to register user' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = signToken({ id: user.id, username: user.username, isGuest: user.isGuest });

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          isGuest: user.isGuest,
        },
      });
    } catch (err: any) {
      console.error('[Auth login error]', err);
      return res.status(500).json({ message: 'Failed to login' });
    }
  },

  async createGuest(req: Request, res: Response) {
    try {
      const { displayName } = req.body;
      const guestName = displayName && displayName.trim() ? displayName.trim() : `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
      const guestId = `guest_${uuidv4().slice(0, 8)}`;
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(guestName)}`;

      const user = await prisma.user.create({
        data: {
          id: guestId,
          username: guestName,
          avatarUrl,
          isGuest: true,
        },
      });

      const token = signToken({ id: user.id, username: user.username, isGuest: true });

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          isGuest: true,
        },
      });
    } catch (err: any) {
      console.error('[Auth guest error]', err);
      return res.status(500).json({ message: 'Failed to create guest' });
    }
  },

  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isGuest: user.isGuest,
        },
      });
    } catch (err: any) {
      console.error('[Auth getMe error]', err);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};
