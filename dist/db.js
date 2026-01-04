import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';
dotenv.config();
const url = process.env.MONGO_DB_URl;
if (!url) {
    throw new Error('MONGO_DB_URL is not set in environment');
}
// creating a MongoClient
const client = new MongoClient(url, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
let db = null;
let collections = null;
let initPromise = null;
export async function initDb() {
    if (collections)
        return collections;
    if (initPromise)
        return initPromise;
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
export function getCollections() {
    if (!collections)
        throw new Error('Database not initialized. Call initDb() first.');
    return collections;
}
export async function closeDb() {
    if (client)
        await client.close();
    db = null;
    collections = null;
    initPromise = null;
}
