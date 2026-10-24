import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const nonEmptyText = (max: number) => z.string().trim().min(1).max(max);
const taskPayloadSchema = z.object({
  title: nonEmptyText(160),
  description: nonEmptyText(2000),
  priority: z.string().trim().toLowerCase().pipe(z.enum(['low', 'medium', 'high', 'urgent'])),
  status: z.string().trim().toLowerCase().pipe(z.enum(['todo', 'in-progress', 'done', 'blocked'])),
  dueDate: z.union([z.string().datetime(), z.string().date()]).optional(),
}).strict();
const taskUpdateSchema = taskPayloadSchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one editable task field is required.',
});

export const requestSchemas = {
  task: taskPayloadSchema,
  taskUpdate: taskUpdateSchema,
  register: z.object({
    name: nonEmptyText(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
  }).strict(),
  login: z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
  }).strict(),
  aiSuggestion: z.object({ text: nonEmptyText(2000) }).strict(),
};

export type RequestSchema = keyof typeof requestSchemas;

export const validateRequest = (schemaName: RequestSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = requestSchemas[schemaName].safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Request validation failed.',
      code: 'VALIDATION_ERROR',
      errors: result.error.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
    });
  }

  req.body = result.data;
  return next();
};

