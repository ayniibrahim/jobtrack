import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import noteRoutes from './routes/noteRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp() {
  const app = express();

  // Basic Middleware
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads
  const uploadsDir = path.join(__dirname, 'uploads');
  app.use('/server/uploads', express.static(uploadsDir));
  app.use('/uploads', express.static(uploadsDir));

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/contacts', contactRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/notes', noteRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  });

  // Central Error Handler Middleware
  app.use((err, req, res, next) => {
    console.error('[API Error]:', err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'An unexpected server error occurred.'
    });
  });

  return app;
}

export { connectDB, seedDatabase };
export default createExpressApp;
