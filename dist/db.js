"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.getCollections = getCollections;
exports.closeDb = closeDb;
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_1 = require("mongodb");
dotenv_1.default.config();
const url = process.env.MONGO_DB_URl;
if (!url) {
    throw new Error('MONGO_DB_URI is not set in environment');
}
const client = new mongodb_1.MongoClient(url, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
let db = null;
let collections = null;
async function initDb() {
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
function getCollections() {
    if (!collections)
        throw new Error('Database not initialized. Call initDb() first.');
    return collections;
}
async function closeDb() {
    await client.close();
    db = null;
    collections = null;
}
