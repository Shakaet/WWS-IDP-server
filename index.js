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

let dbCollections = {}; // All collections centralized

async function run() {
    try {
        console.log("Connected to MongoDB");
        const db = client.db('wwsDB');
        
        // Define collections centrally
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


        app.get("/api/course",async(req,res)=>{
            const data = await dbCollections.coursesCollection.find().toArray();
                res.send(data);


        })

        app.get("/api/scholarships",async(req,res)=>{
            const data = await dbCollections.scholarshipsCollection.find().toArray();
                res.send(data);


        })

        app.get("/api/universities",async(req,res)=>{
            const data = await dbCollections.universitiesCollection.find().toArray();
                res.send(data);


        })

        app.get("/api/events",async(req,res)=>{
            const data = await dbCollections.eventsCollection.find().toArray();
                res.send(data);


        })
        
        // ===== Search GET Routes (All) =====
        app.get('/api/search/course', async (req, res) => {
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

        // ===== Scholarships Search POST Route (Fixed for flat structure) =====
        app.post('/api/search/scholarships', async (req, res) => {
            try {
                const { studyLevel, destination } = req.body;
                console.log("Scholarships Request body:", req.body);
                
                // Build query for flat structure
                const query = {};
                if (studyLevel) query.studyLevel = { $regex: studyLevel, $options: "i" };
                if (destination) query.destination = { $regex: destination, $options: "i" };
                
                console.log("Scholarships query:", query);
                
                // Find matching documents
                const results = await dbCollections.scholarshipsCollection.find(query).toArray();
                console.log("Scholarships results:", results);
                
                res.json({ success: true, data: results });
            } catch (error) {
                console.error("Scholarships search error:", error);
                res.status(500).json({ success: false, message: "Scholarship search failed" });
            }
        });
        
        // ===== Universities Search POST Route (Fixed for flat structure) =====
        app.post('/api/search/universities', async (req, res) => {
            try {
                const { universityName, destination } = req.body;
                console.log("Universities Request body:", req.body);
                
                // Build query for flat structure
                const query = {};
                if (universityName) query.universityName = { $regex: universityName, $options: "i" };
                if (destination) query.destination = { $regex: destination, $options: "i" };
                
                console.log("Universities query:", query);
                
                // Find matching documents
                const results = await dbCollections.universitiesCollection.find(query).toArray();
                console.log("Universities results:", results);
                
                res.json({ success: true, data: results });
            } catch (error) {
                console.error("Universities search error:", error);
                res.status(500).json({ success: false, message: "University search failed" });
            }
        });
        
        // ===== Events Search POST Route (Fixed for flat structure) =====
        app.post('/api/search/events', async (req, res) => {
            try {
                const { city, month, destination } = req.body;
                console.log("Events Request body:", req.body);
                
                // Build query for flat structure
                const query = {};
                if (city) query.city = { $regex: city, $options: "i" };
                if (month) query.month = { $regex: month, $options: "i" };
                if (destination) query.destination = { $regex: destination, $options: "i" };
                
                console.log("Events query:", query);
                
                // Find matching documents
                const results = await dbCollections.eventsCollection.find(query).toArray();
                console.log("Events results:", results);
                
                res.json({ success: true, data: results });
            } catch (error) {
                console.error("Events search error:", error);
                res.status(500).json({ success: false, message: "Event search failed" });
            }
        });
        
        // ===== Course Search POST Route (Fixed for flat structure) =====
        app.post("/api/search/course", async (req, res) => {
            try {
                const { subject, studyLevel, destination } = req.body;
                console.log("Course Request body:", req.body);
                
                // Build query for flat structure
                const query = {};
                if (subject) query.subject = { $regex: subject, $options: "i" };
                if (studyLevel) query.studyLevel = { $regex: studyLevel, $options: "i" };
                if (destination) query.destination = { $regex: destination, $options: "i" };
                
                console.log("Course query:", query);
                
                // Find matching documents
                const results = await dbCollections.coursesCollection.find(query).toArray();
                console.log("Course results:", results);
                
                res.json({ success: true, data: results });
            } catch (error) {
                console.error("Course search error:", error);
                res.status(500).json({ success: false, message: "Course search failed" });
            }
        });
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