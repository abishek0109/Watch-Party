import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'syncscreen_super_secret_jwt_key_2026_cinematic';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    isGuest: boolean;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      isGuest: Boolean(decoded.isGuest),
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = {
        id: decoded.id,
        username: decoded.username,
        isGuest: Boolean(decoded.isGuest),
      };
    } catch (err) {
      // Ignored for optional auth
    }
  }
  next();
}

export function signToken(payload: { id: string; username: string; isGuest?: boolean }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
