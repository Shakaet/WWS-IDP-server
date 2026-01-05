import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from "nodemailer";
import { ObjectId } from 'mongodb';
import { initDb, getCollections } from './db.js';
import cookieParser from 'cookie-parser';

// router imports
import popularRouter from './routes/popular.js';
import helpFromWWSRouter from './routes/help-from-wws.js';
import apiRouter from './routes/api.js';
import userRouter from './routes/user.js';
import chatbotRouter from './routes/chatbot.js';
 
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173',"https://wws-idp-website.vercel.app","https://graceful-sable-b6d5d1.netlify.app"],
    credentials: true
}));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
// Email transporter (Gmail Example)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,   // তোমার Gmail
        pass: process.env.EMAIL_PASS    // App Password (normal password নয়)
    }
});

// Use centralized DB initializer
async function run() {
    try {
        console.log('Initializing DB');
        await initDb();
        const cols = getCollections();

        const usersCollection = cols.users;
        const coursesCollection = cols.courses;
        const scholarshipsCollection = cols.scholarships;
        const universitiesCollection = cols.universities;
        const eventsCollection = cols.events;
        const collaborateCollection = cols.collaborate;

        // Mount routers
        app.use('/popular', popularRouter);
                
        app.use('/help-from-wws', helpFromWWSRouter);

        app.use('/api', apiRouter);

        app.use('/user', userRouter);

        app.use('/chatbot', chatbotRouter);

       
        app.get("/getUser/:email", async (req, res) => {

            let email = req.params.email

            let query = { email: email }
            let result = await usersCollection.findOne(query)

                        if (!result) {
                            return res.send({ message: "No user found" })
                        }
                        let user = false
                        if (result.role === "user") {
                            user = true
                        }

                        res.send({ user })
        })

        app.get("/getAdmin/:email", async (req, res) => {

            let email = req.params.email

            let query = { email: email }
            let result = await usersCollection.findOne(query)

            if (!result) {
                return res.send({ message: "No user found" })
            }
            let admin = false
            if (result.role === "admin") {
                admin = true
            }

            res.send({ admin })
        })

        app.get("/getAmbassador/:email", async (req, res) => {

            let email = req.params.email

            let query = { email: email }
            let result = await usersCollection.findOne(query)

            if (!result) {
                return res.send({ message: "No user found" })
            }
            let ambassador = false
            if (result.role === "ambassador") {
                ambassador = true
            }

            res.send({ ambassador })
        })

        app.get("/ambassador/access/:email",async(req,res)=>{

            try {
                const { email } = req.params;

                if (!email) {
                return res.status(400).json({ message: "Email is required" });
                }

                let User=usersCollection

                const user = await User.findOne(
                        { email },
                        { projection: { role: 1, scholarships: 1, courses: 1, universities: 1, events: 1 } }
                        );

                if (!user) {
                return res.status(404).json({ message: "User not found" });
                }

                // ✅ role ambassador না হলে access deny
                if (user.role !== "ambassador") {
                return res.status(403).json({ message: "Access denied: Not an ambassador" });
                }

                // ✅ শুধু true field গুলো পাঠানো হবে
                const trueFields: any = {};
                if (user.scholarships) trueFields.scholarships = true;
                if (user.courses) trueFields.courses = true;
                if (user.universities) trueFields.universities = true;
                if (user.events) trueFields.events = true;

                return res.json({
                role: user.role,
                access: trueFields,
                });
            } catch (error: any) {
                res.status(500).json({ message: error.message });
            }

        })
      
        app.post('/post-users', async (req, res) => {
            try {
                const user = req.body;
                if (!user || !user.email) return res.status(400).send({ message: 'User data or email is missing' });
                const existingUser = await usersCollection.findOne({ email: user.email });
                if (existingUser) return res.status(409).send({ message: 'User already exists' });
                const result = await usersCollection.insertOne(user);
                res.status(201).send({ message: 'User added successfully', userId: result.insertedId });
            } catch (err) {
                res.status(500).send({ message: 'Failed to add user' });
            }
        });
      
        app.get('/users', async (req, res) => {
            try {
                const data = await usersCollection.find().toArray();
                res.send({ success: true, data });
            } catch (err) {
                res.status(500).send({ success: false, message: 'Failed to fetch users' });
            }
        });

        // Update user (PATCH)
        app.patch('/users/:id', async (req, res) => {
        try {
            const id = req.params.id;
            const updateData = req.body;   // { role: 'admin' } or any field

            const result = await usersCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
            );

            if (result.modifiedCount === 0) {
            return res.send({ success: false, message: 'No changes made or user not found' });
            }

            res.send({ success: true, message: 'User updated successfully' });
        } catch (err) {
            res.status(500).send({ success: false, message: 'Failed to update user' });
        }
        });

        // Delete user (DELETE)
        app.delete('/users/:id', async (req, res) => {
        try {
            const id = req.params.id;

            const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

            if (result.deletedCount === 0) {
            return res.send({ success: false, message: 'User not found' });
            }

            res.send({ success: true, message: 'User deleted successfully' });
        } catch (err) {
            res.status(500).send({ success: false, message: 'Failed to delete user' });
        }
        });

        app.get('/collaborate', async (req, res) => {
            try {
                const data = await collaborateCollection.find().toArray();
                res.send(data);
            } catch (err) {
                res.status(500).send({ success: false, message: 'Failed to fetch universities' });
            }
        });

        app.post('/collaborate', async (req, res) => {
            try {
                let email = "abdshakaet@gmail.com"
                const enquiry = req.body;
                // console.log(enquiry)
                if (!enquiry) return res.status(400).send({ message: 'No data provided' });
                // 2. Email পাঠাও
                // const mailOptions = {
                // from: process.env.EMAIL_USER,
                // to: email,   // ইউজারের original email
                // subject: "Your Post has been Submitted",
                // text: `${enquiry.email}, your post has been submitted successfully. We will contact you soon!`
                // };

                const result = await collaborateCollection.insertOne(enquiry);

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,   // তোমার ইমেইল, যেটাতে message যাবে
                    subject: "New Post Submitted by User",
                    text: `
                    Hi Abdulla Al Shakaet,

                    A new post has been submitted by a user. Here are the details:

                    ----------------------------------------
                    Name: ${enquiry.name}
                    Email: ${enquiry.email}
                    Message: ${enquiry.message}
                    ----------------------------------------

                    Please follow up with the user as needed.

                    Thank you,
                    World Wise Scholar Team
                    `
                };

                await transporter.sendMail(mailOptions);

                res.send({ message: 'Enquiry submitted successfully', id: result.insertedId });

            } catch (err) {
                console.error('Error in /collaborate:', err);
                res.status(500).send({ message: 'Failed to submit enquiry' });
            }
        });

        // ==================Get All Scholarship ==================
        app.post('/add-new-scholarship', async (req, res) => {
            try {
                const data = req.body;


                const result = await scholarshipsCollection.insertOne(data);
                res.status(201).send({ message: 'Scholarship added successfully', userId: result.insertedId });
            } catch (err) {
                res.status(500).send({ message: 'Failed to add Scholarship' });
            }
        });
        
        app.post('/add-new-university', async (req, res) => {
            try {
                const data = req.body;


                const result = await universitiesCollection.insertOne(data);
                res.status(201).send({ message: 'University added successfully', userId: result.insertedId });
            } catch (err) {
                res.status(500).send({ message: 'Failed to add University' });
            }
        });
 
        // ================== Add New Course ==================
        app.post('/add-new-course', async (req, res) => {
            try {
                const data = req.body;

                const result = await coursesCollection.insertOne(data);
                res.status(201).send({ message: 'Course added successfully', courseId: result.insertedId });
            } catch (err) {
                res.status(500).send({ message: 'Failed to add Course' });
            }
        });


        // ================== Add New Event ==================
        app.post('/add-new-event', async (req, res) => {
            try {
                const data = req.body;
                const result = await eventsCollection.insertOne(data);
                res.status(201).send({ message: 'Event added successfully', eventId: result.insertedId });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: 'Failed to add Event' });
            }
        });

        
        // // ================== Get All Events ==================
        // app.get('/api/events', async (req, res) => {
        //     try {
        //         const events = await dbCollections.eventsCollection.find().toArray();
        //         res.send({ success: true, data: events });
        //     } catch (err) {
        //         console.error(err);
        //         res.status(500).send({ success: false, message: 'Failed to fetch events' });
        //     }
        // });

    } catch (err) {
        console.error(err);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("World Wise Scholar Server is cooking...!")
});
