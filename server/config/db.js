import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongodInstance = null;

export async function connectDB() {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      // Local persistent MongoDB instance using MongoMemoryServer with WiredTiger on-disk storage
      const dbPath = path.resolve(__dirname, '../data/mongodb');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      console.log('[Database] Starting persistent MongoDB instance at:', dbPath);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: 'wiredTiger'
        }
      });
      mongoUri = mongodInstance.getUri();
      console.log('[Database] Persistent MongoDB daemon active at:', mongoUri);
    } else {
      console.log('[Database] Connecting to external MongoDB at configured MONGODB_URI...');
    }

    await mongoose.connect(mongoUri, {
      autoIndex: true
    });

    console.log('[Database] Connected to MongoDB via Mongoose successfully.');
    return mongoose.connection;
  } catch (err) {
    console.error('[Database Connection Error]:', err);
    throw err;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[Database Disconnect Error]:', err);
  }
}

export default connectDB;
