import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));

// MongoDB client
const client = new MongoClient(process.env.MONGO_DB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let dbCollections = {}; // 🟢 All collections centralized

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('wwsDB');

        // 🟢 Define collections centrally
        dbCollections = {
            helpCollection: db.collection('helpFrom'),
            usersCollection: db.collection('users'),
            coursesCollection: db.collection('courses'),
            scholarshipsCollection: db.collection('scholarships'),
            universitiesCollection: db.collection('universities'),
            eventsCollection: db.collection('events'),
        };

        // Test connection
        await db.command({ ping: 1 });
        console.log("Pinged MongoDB successfully");

        // ===== Users Routes =====
        app.get('/users', async (req, res) => {
            try {
                const result = await dbCollections.usersCollection.find().toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: "Failed to fetch users." });
            }
        });

        app.post('/post-users', async (req, res) => {
            try {
                const user = req.body;
                if (!user || !user.email) return res.status(400).send({ message: 'User data or email is missing' });

                const existingUser = await dbCollections.usersCollection.findOne({ email: user.email });
                if (existingUser) return res.status(409).send({ message: 'User already exists' });

                const result = await dbCollections.usersCollection.insertOne(user);
                res.status(201).send({ message: 'User added successfully', userId: result.insertedId });
            } catch (err) {
                res.status(500).send({ message: 'Failed to add user' });
            }
        });

        // ===== Help Routes =====
        app.get('/help-from-wws', async (req, res) => {
            try {
                const result = await dbCollections.helpCollection.find().toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: 'Failed to fetch enquiries' });
            }
        });

        app.post('/help-from-wws', async (req, res) => {
            try {
                const enquiry = req.body;
                if (!enquiry) return res.status(400).send({ message: 'No data provided' });

                const result = await dbCollections.helpCollection.insertOne(enquiry);
                res.send({ message: 'Enquiry submitted successfully', id: result.insertedId });
            } catch (err) {
                res.status(500).send({ message: 'Failed to submit enquiry' });
            }
        });

        // ===== Search GET Routes (All) =====
        app.get('/api/search/courses', async (req, res) => {
            try {
                const data = await dbCollections.coursesCollection.find().toArray();
                res.send({ success: true, data });
            } catch (err) {
                res.status(500).send({ success: false, message: 'Failed to fetch courses' });
            }
        });

        app.get('/api/search/scholarships', async (req, res) => {
            try {
                const data = await dbCollections.scholarshipsCollection.find().toArray();
                res.send({ success: true, data });
            } catch (err) {
                res.status(500).send({ success: false, message: 'Failed to fetch scholarships' });
            }
        });

        app.get('/api/search/universities', async (req, res) => {
            try {
                const data = await dbCollections.universitiesCollection.find().toArray();
                res.send({ success: true, data });
            } catch (err) {
                res.status(500).send({ success: false, message: 'Failed to fetch universities' });
            }
        });

        app.get('/api/search/events', async (req, res) => {
            try {
                const data = await dbCollections.eventsCollection.find().toArray();
                res.send({ success: true, data });
            } catch (err) {
                res.status(500).send({ success: false, message: 'Failed to fetch events' });
            }
        });

        // ===== Search POST Routes (Filters) =====
        app.post('/api/search/courses', async (req, res) => {
            try {
                const { subject, studyLevel, destination } = req.body;
                const query = {};
                if (subject) query.subject = { $regex: subject, $options: 'i' };
                if (studyLevel) query.studyLevel = studyLevel;
                if (destination) query.destination = destination;

                const data = await dbCollections.coursesCollection.find(query).toArray();
                res.send({ success: true, data });
            } catch (err) {
                res.status(500).send({ success: false, message: 'Search failed' });
            }
        });

        // 🎯 Similarly, you can create POST filters for scholarships, universities, events

    } catch (err) {
        console.error(err);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("World Wise Scholar Server is cooking...!");
});

app.listen(port, () => {
    console.log('Server running on port', port);
});
