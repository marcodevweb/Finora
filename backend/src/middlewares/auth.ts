import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/security';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const cookieHeader = req.headers.cookie || '';
  const token = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('finora_session='))
    ?.slice('finora_session='.length);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente para continuar.' });
    }
    req.user = user as AuthRequest['user'];
    next();
  });
};
