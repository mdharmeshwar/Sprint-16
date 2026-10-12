import type { Request, Response, NextFunction } from 'express';

export const validateTaskPayload = (req: Request, res: Response, next: NextFunction) => {
  const { title, description, priority, status } = req.body || {};
  const normalizedTitle = typeof title === 'string' ? title.trim() : '';
  const normalizedDescription = typeof description === 'string' ? description.trim() : '';
  const normalizedPriority = typeof priority === 'string' ? priority.trim().toLowerCase() : '';
  const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : '';

  if (!normalizedTitle || !normalizedDescription || !normalizedPriority || !normalizedStatus) {
    return res.status(400).json({ success: false, message: 'Title, description, priority, and status are required.' });
  }

  if (!['todo', 'in-progress', 'done', 'blocked'].includes(normalizedStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid task status.' });
  }

  if (!['low', 'medium', 'high', 'urgent'].includes(normalizedPriority)) {
    return res.status(400).json({ success: false, message: 'Invalid task priority.' });
  }

  req.body.title = normalizedTitle;
  req.body.description = normalizedDescription;
  req.body.priority = normalizedPriority;
  req.body.status = normalizedStatus;

  return next();
};
