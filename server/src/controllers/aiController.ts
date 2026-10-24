import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { suggestTaskDescription } from '../services/aiService.js';

export const improveTaskDescription = async (req: AuthenticatedRequest, res: Response) => {
  const suggestion = await suggestTaskDescription(req.body.text);
  return res.status(200).json({ success: true, data: { suggestion } });
};