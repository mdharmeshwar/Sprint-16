import { rateLimit } from 'express-rate-limit';

const configuredLimit = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const rateLimitResponse = (_req: unknown, res: any) => res.status(429).json({
  success: false,
  message: 'Too many requests. Please try again later.',
  code: 'RATE_LIMITED',
  errors: [],
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: configuredLimit(process.env.LOGIN_RATE_LIMIT_MAX, 5),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitResponse,
});

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: configuredLimit(process.env.AI_RATE_LIMIT_MAX, 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
});