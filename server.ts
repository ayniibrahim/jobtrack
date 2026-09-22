import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectDB, createExpressApp, seedDatabase } from './server/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  try {
    // 1. Connect to MongoDB via Mongoose
    console.log('[Startup] Initializing MongoDB connection...');
    await connectDB();

    // 2. Seed initial demo data in MongoDB if needed
    console.log('[Startup] Verifying database seeding...');
    await seedDatabase();

    const app = createExpressApp();
    const server = http.createServer(app);

    if (!isProd) {
      // Vite development middleware
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR !== 'true'
        },
        appType: 'spa'
      });

      app.use(vite.middlewares);
    } else {
      // Production static serving
      const distPath = path.resolve(__dirname, 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.resolve(distPath, 'index.html'));
        });
      }
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[JobTrack Server] Running at http://0.0.0.0:${PORT} (Mode: ${isProd ? 'production' : 'development'})`);
    });
  } catch (err) {
    console.error('[Server Startup Error]:', err);
    process.exit(1);
  }
}

startServer();
