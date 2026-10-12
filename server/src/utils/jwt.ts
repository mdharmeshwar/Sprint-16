import jwt from 'jsonwebtoken';

export const getJwtSecret = () => process.env.JWT_SECRET || 'taskmatrix-dev-secret-key';

export const signToken = (userId: string) => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
};
