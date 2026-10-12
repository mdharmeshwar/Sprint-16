import type { Request, Response } from 'express';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

export const getProjectStats = async (req: Request, res: Response) => {
  return res.status(200).json({ success: true, data: { projects: 0, workspaces: 0 } });
};
