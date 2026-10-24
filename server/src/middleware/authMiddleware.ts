import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getMemoryUserById, useMemoryStore } from '../utils/memoryStore.js';
import { buildErrorResponse } from '../utils/response.js';
import { getJwtSecret } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    id: string;
    email: string;
    name: string;
  };
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(buildErrorResponse('Authentication required.', 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  let decoded: { userId?: string; id?: string; email?: string; name?: string };

  try {
    decoded = jwt.verify(token, getJwtSecret()) as typeof decoded;
  } catch {
    return res.status(401).json(buildErrorResponse('Invalid or expired token.', 'UNAUTHORIZED'));
  }

  const userId = decoded.userId || decoded.id;
  if (!userId) {
    return res.status(401).json(buildErrorResponse('Invalid token payload.', 'UNAUTHORIZED'));
  }

  const user = useMemoryStore()
    ? getMemoryUserById(userId)
    : await User.findById(userId).select('-password');

  if (!user) {
    return res.status(401).json(buildErrorResponse('User no longer exists.', 'UNAUTHORIZED'));
  }

  req.user = {
    _id: user._id.toString(),
    id: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  return next();
};
