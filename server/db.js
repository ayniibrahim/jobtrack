import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'jobtrack_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB Structure
const initialData = {
  users: [],
  applications: [],
  companies: [],
  contacts: [],
  interviews: [],
  documents: [],
  notifications: [],
  activities: []
};

// In-memory cache synced with disk
let dbMemory = { ...initialData };

// Load from disk if exists
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbMemory = { ...initialData, ...JSON.parse(raw) };
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbMemory, null, 2));
  }
} catch (err) {
  console.error('[DB] Error reading persistent storage, initializing fresh:', err);
  dbMemory = { ...initialData };
}

// Helper to persist database to disk
function saveDb() {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbMemory, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Error saving to disk:', err);
  }
}

// Generate unique Mongo-like ObjectId string
export function generateId() {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
  const random = 'xxxxxxxxxxxxxxxx'
    .replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16))
    .toLowerCase();
  return timestamp + random;
}

// Match query filter against a document
function matchQuery(doc, query = {}) {
  for (const key of Object.keys(query)) {
    if (key === '$or') {
      const orConditions = query[key];
      const anyMatch = orConditions.some(subQuery => matchQuery(doc, subQuery));
      if (!anyMatch) return false;
      continue;
    }
    if (key === '$and') {
      const andConditions = query[key];
      const allMatch = andConditions.every(subQuery => matchQuery(doc, subQuery));
      if (!allMatch) return false;
      continue;
    }

    const val = query[key];
    const docVal = doc[key];

    // Regex matcher
    if (val instanceof RegExp) {
      if (!val.test(String(docVal || ''))) return false;
      continue;
    }

    // Operator matcher ($regex, $in, $gte, $lte, $ne, $exists)
    if (val && typeof val === 'object' && !(val instanceof Date)) {
      if (val.$regex) {
        const regex = new RegExp(val.$regex, val.$options || 'i');
        if (!regex.test(String(docVal || ''))) return false;
      }
      if (val.$in && Array.isArray(val.$in)) {
        if (!val.$in.includes(docVal)) return false;
      }
      if (val.$nin && Array.isArray(val.$nin)) {
        if (val.$nin.includes(docVal)) return false;
      }
      if (val.$gte !== undefined) {
        if (docVal === undefined || docVal < val.$gte) return false;
      }
      if (val.$lte !== undefined) {
        if (docVal === undefined || docVal > val.$lte) return false;
      }
      if (val.$gt !== undefined) {
        if (docVal === undefined || docVal <= val.$gt) return false;
      }
      if (val.$lt !== undefined) {
        if (docVal === undefined || docVal >= val.$lt) return false;
      }
      if (val.$ne !== undefined) {
        if (docVal === val.$ne) return false;
      }
      continue;
    }

    // Direct equality
    if (docVal !== val) {
      // Allow string/number mismatch on IDs
      if (String(docVal) !== String(val)) {
        return false;
      }
    }
  }
  return true;
}

// Model wrapper providing Mongoose-compatible interface
export class CollectionModel {
  constructor(collectionName) {
    this.name = collectionName;
    if (!dbMemory[this.name]) {
      dbMemory[this.name] = [];
    }
  }

  get data() {
    if (!dbMemory[this.name]) {
      dbMemory[this.name] = [];
    }
    return dbMemory[this.name];
  }

  find(query = {}) {
    let current = this.data.filter(doc => matchQuery(doc, query)).map(doc => ({ ...doc }));
    current._results = current;

    // Return chainable query object that also resolves when awaited
    const cursor = {
      _results: current,
      sort(sortCriteria) {
        if (typeof sortCriteria === 'object') {
          current.sort((a, b) => {
            for (const field of Object.keys(sortCriteria)) {
              const dir = sortCriteria[field] === -1 || sortCriteria[field] === 'desc' ? -1 : 1;
              const valA = a[field];
              const valB = b[field];
              if (valA === valB) continue;
              if (valA === undefined) return 1;
              if (valB === undefined) return -1;
              return valA > valB ? dir : -dir;
            }
            return 0;
          });
        }
        current._results = current;
        cursor._results = current;
        return cursor;
      },
      skip(count) {
        current = current.slice(Number(count) || 0);
        current._results = current;
        cursor._results = current;
        return cursor;
      },
      limit(count) {
        if (count > 0) {
          current = current.slice(0, Number(count));
          current._results = current;
          cursor._results = current;
        }
        return cursor;
      },
      then(resolve, reject) {
        current._results = current;
        return Promise.resolve(current).then(resolve, reject);
      },
      exec() {
        current._results = current;
        return Promise.resolve(current);
      }
    };

    return cursor;
  }

  async findOne(query = {}) {
    const found = this.data.find(doc => matchQuery(doc, query));
    return found ? { ...found } : null;
  }

  async findById(id) {
    if (!id) return null;
    const found = this.data.find(doc => String(doc._id) === String(id) || String(doc.id) === String(id));
    return found ? { ...found } : null;
  }

  async create(docData) {
    const now = new Date().toISOString();
    const newDoc = {
      _id: docData._id || generateId(),
      ...docData,
      createdAt: docData.createdAt || now,
      updatedAt: now
    };
    this.data.push(newDoc);
    saveDb();
    return { ...newDoc };
  }

  async insertMany(docs) {
    const created = [];
    for (const doc of docs) {
      created.push(await this.create(doc));
    }
    return created;
  }

  async findByIdAndUpdate(id, updates, options = { new: true }) {
    const index = this.data.findIndex(doc => String(doc._id) === String(id) || String(doc.id) === String(id));
    if (index === -1) return null;

    const current = this.data[index];
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data[index] = updated;
    saveDb();
    return { ...updated };
  }

  async updateOne(query, updates) {
    const doc = await this.findOne(query);
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };
    await this.findByIdAndUpdate(doc._id, updates);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async findByIdAndDelete(id) {
    const index = this.data.findIndex(doc => String(doc._id) === String(id) || String(doc.id) === String(id));
    if (index === -1) return null;

    const removed = this.data.splice(index, 1)[0];
    saveDb();
    return removed;
  }

  async deleteMany(query = {}) {
    const initialCount = this.data.length;
    const remaining = this.data.filter(doc => !matchQuery(doc, query));
    const deletedCount = initialCount - remaining.length;
    dbMemory[this.name] = remaining;
    saveDb();
    return { deletedCount };
  }

  async countDocuments(query = {}) {
    return this.data.filter(doc => matchQuery(doc, query)).length;
  }
}

// Pre-instantiated Models
export const User = new CollectionModel('users');
export const Application = new CollectionModel('applications');
export const Company = new CollectionModel('companies');
export const Contact = new CollectionModel('contacts');
export const Interview = new CollectionModel('interviews');
export const Document = new CollectionModel('documents');
export const Notification = new CollectionModel('notifications');
export const Activity = new CollectionModel('activities');

export default {
  User,
  Application,
  Company,
  Contact,
  Interview,
  Document,
  Notification,
  Activity,
  saveDb
};
