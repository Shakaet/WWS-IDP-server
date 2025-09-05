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
// app.use(cors());
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


async function run() {
    try {

        const helpCollection = client.db('wwsDB').collection('helpFrom');
        const usersCollections = client.db('wwsDB').collection('users')


        // get all users
        app.get('/users', async (req, res) => {
            try {
                const result = await usersCollections.find().toArray();
                res.send(result)
            } catch (err) {
                res.status(500).send({ message: "Failed to fetch enquires." })
            }
        })

        // post the user here
        app.post('/post-users', async (req, res) => {
            try {
                const user = req.body;

                // 1️⃣ Validation
                if (!user || !user.email) {
                    return res.status(400).send({ message: 'User data or email is missing' });
                }

                // 2️⃣ Check if user already exists
                const existingUser = await usersCollections.findOne({ email: user.email });
                if (existingUser) {
                    return res.status(409).send({ message: 'User already exists' });
                }

                // 3️⃣ Insert new user
                const result = await usersCollections.insertOne(user);

                res.status(201).send({
                    message: 'User added successfully',
                    userId: result.insertedId,
                });

            } catch (err) {
                console.error('Error adding user:', err);
                res.status(500).send({ message: 'Failed to add user' });
            }
        });


        // GET all enquiries
        app.get('/help-from-wws', async (req, res) => {
            try {
                const result = await helpCollection.find().toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: 'Failed to fetch enquiries' });
            }
        });

        // POST a new enquiry
        app.post('/help-from-wws', async (req, res) => {
            try {
                const enquiry = req.body;
                if (!enquiry) {
                    return res.status(400).send({ message: 'No data provided' });
                }

                const result = await helpCollection.insertOne(enquiry);
                res.send({ message: 'Enquiry submitted successfully', id: result.insertedId });
            } catch (err) {
                res.status(500).send({ message: 'Failed to submit enquiry' });
            }
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
