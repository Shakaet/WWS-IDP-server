import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb';

dotenv.config();


const url = process.env.MONGO_DB_URL;

if (!url) {
  throw new Error('MONGO_DB_URL is not set in environment');
}

/* ---------- Types ---------- */

export interface wwsCollections {
  users: Collection;
  helpFrom: Collection;
  courses: Collection;
  scholarships: Collection;
  universities: Collection;
  events: Collection;
  collaborate: Collection;
  popular: Collection;
  chatHistory: Collection;
}

// creating a MongoClient
const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: Db | null = null;
let collections: wwsCollections | null = null;
let initPromise: Promise<wwsCollections> | null = null;


export async function initDb() : Promise<wwsCollections> {
  if (collections) return collections;
  if (initPromise) return initPromise;

  initPromise = (async () => {
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
      chatHistory: db.collection('chatHistory'),
    };
    return collections;
  })();
  
  return initPromise;
}

export function getCollections(): wwsCollections {
  if (!collections) throw new Error('Database not initialized. Call initDb() first.');
  return collections as wwsCollections;
}

export async function closeDb() {
  if (client) await client.close();

  db = null;
  collections = null;
  initPromise = null;
}
