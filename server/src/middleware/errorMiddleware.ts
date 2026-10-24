import type { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
    code: 'NOT_FOUND',
    errors: [],
  });
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  let statusCode = typeof err.status === 'number' ? err.status : 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected server error occurred.';
  let errors: Array<{ path?: string; message: string }> = [];

  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_IDENTIFIER';
    message = 'The supplied identifier is invalid.';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed.';
    errors = Object.values(err.errors || {}).map((detail: any) => ({ path: detail.path, message: detail.message }));
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'A resource with those details already exists.';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload is too large.';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body must contain valid JSON.';
  } else if (err.name === 'AiServiceError' && (err.status === 502 || err.status === 503)) {
    statusCode = err.status;
    code = 'AI_PROVIDER_UNAVAILABLE';
    message = err.message;
  } else if (statusCode >= 400 && statusCode < 500) {
    code = statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : 'BAD_REQUEST';
    message = statusCode === 404 ? 'Resource not found.' : 'The request could not be completed.';
  }

  if (statusCode >= 500) {
    console.error('Request failed', { statusCode, errorName: err.name || 'Error' });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
  });
};
