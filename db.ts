import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();

const url = process.env.MONGO_DB_URI;
if (!url) {
  throw new Error('MONGO_DB_URI is not set in environment');
}

const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: ReturnType<MongoClient['db']> | null = null;
let collections: Record<string, any> | null = null;

export async function initDb() {
  if (!db) {
    await client.connect();
    db = client.db('wwsDB');
    collections = {
      users: db.collection('users'),
      helpFrom: db.collection('helpFrom'),
      courses: db.collection('courses'),
      scholarships: db.collection('scholarships'),
      universities: db.collection('universities'),
      events: db.collection('events'),
      collaborate: db.collection('collaborate'),
      popular: db.collection('popular'),
    };
  }
  return collections;
}

export function getCollections() {
  if (!collections) throw new Error('Database not initialized. Call initDb() first.');
  return collections as {
    users: any;
    helpFrom: any;
    courses: any;
    scholarships: any;
    universities: any;
    events: any;
    collaborate: any;
    popular: any;
  };
}

export async function closeDb() {
  await client.close();
  db = null;
  collections = null;
}
