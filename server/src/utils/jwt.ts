import jwt from 'jsonwebtoken';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production.');
  }
  return 'taskmatrix-dev-secret-key';
};

export const signToken = (userId: string) => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
};
