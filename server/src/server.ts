import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured in production.');
      if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured in production.');
    }
    await connectDB();
    const server = http.createServer(app);
    server.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'production') {
        console.info(`Server running on http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', { errorName: (error as Error).name || 'Error' });
    process.exit(1);
  }
};

startServer();
