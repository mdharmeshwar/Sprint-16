import { connect } from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('MONGODB_URI not set; running without MongoDB persistence.');
    return;
  }

  try {
    await connect(mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', (error as Error).message);
    throw error;
  }
};
