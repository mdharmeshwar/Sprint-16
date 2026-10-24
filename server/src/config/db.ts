import { connect } from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('MONGODB_URI not set; running without MongoDB persistence.');
    return;
  }

  try {
    await connect(mongoUri);
    if (process.env.NODE_ENV !== 'production') {
      console.info('MongoDB connected');
    }
  } catch (error) {
    console.error('MongoDB connection failed:', { errorName: (error as Error).name || 'Error' });
    throw error;
  }
};
