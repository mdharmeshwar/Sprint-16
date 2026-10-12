import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getMemoryUserById, useMemoryStore } from '../utils/memoryStore.js';

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
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'taskmatrix-dev-secret-key';

    const decoded = jwt.verify(token, secret) as { userId?: string; id?: string; email?: string; name?: string };
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload.' });
    }

    let user: any = null;

    if (useMemoryStore()) {
      user = getMemoryUserById(userId);
    } else {
      user = await User.findById(userId).select('-password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    req.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
