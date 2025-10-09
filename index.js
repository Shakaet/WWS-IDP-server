import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from "nodemailer";
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import cookieParser from 'cookie-parser';


dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173',"https://wws-idp-website.vercel.app"],
    credentials: true
}));

// Email transporter (Gmail Example)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,   // তোমার Gmail
        pass: process.env.EMAIL_PASS    // App Password (normal password নয়)
    }
});


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
            collaborateCollection: db.collection('collaborate'),
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



        app.get("/user/ambassador",async(req,res)=>{

            try {
                const result = await dbCollections.usersCollection.find({role:"ambassador"}).toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: "Failed to fetch users." });
            }



        })

          app.patch('/user/ambassador/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const permissions = req.body;

                console.log(id,permissions)
                
                const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
                
                const updateDoc = {
                    $set: permissions
                };
                
                const result = await dbCollections.usersCollection.updateOne(query, updateDoc);
                res.send({ success: true, result });
            } catch (err) {
                console.error('Permission update error:', err);
                res.status(500).send({ success: false, message: 'Failed to update permissions' });
            }
        });

        app.get("/getUser/:email", async (req, res) => {

            let email = req.params.email

            let query = { email: email }
            let result = await dbCollections.usersCollection.findOne(query)

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
            let result = await dbCollections.usersCollection.findOne(query)

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
            let result = await dbCollections.usersCollection.findOne(query)

            if (!result) {
                return res.send({ message: "No user found" })
            }
            let ambassador = false
            if (result.role === "ambassador") {
                ambassador = true
            }

            res.send({ ambassador })



        })


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


        app.patch("/help-from-wws/:id", async (req, res) => {

            let id = req.params.id
            let status = req.body.status

            let query = { _id: new ObjectId(id) }

            let updatedDoc = {
                $set: {
                    status: status
                }
            }

            let result = await dbCollections.helpCollection.updateOne(query, updatedDoc)

            res.send(result)
        });


        app.get('/help-from-wws/:userEmail', async (req, res) => {
            try {

                let userEmail = req.params.userEmail

                let query = { userEmail }
                const result = await dbCollections.helpCollection.find(query).toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: 'Failed to fetch enquiries' });
            }
        });


        app.delete('/help-from-wws/:id', async (req, res) => {
            try {
                let id = req.params.id

                let query = { _id: new ObjectId(id) }

                const result = await dbCollections.helpCollection.deleteOne(query);
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: 'Failed to delete enquiry' });
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



        app.get("/api/scholarships", async (req, res) => {
            const data = await dbCollections.scholarshipsCollection.find().toArray();
            res.send(data);


        })

        app.get("/api/universities", async (req, res) => {
            const data = await dbCollections.universitiesCollection.find().toArray();
            res.send(data);


        })

        app.get("/api/events", async (req, res) => {
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

        app.get("/api/scholarship/:id", async (req, res) => {

            let id = req.params.id

            // OR query বানানো হচ্ছে
            const query = {
                $or: [
                    { _id: id }, // string match
                    ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId match (valid হলে)
                ].filter(Boolean) // null বাদ দেওয়ার জন্য
            };

            let result = await dbCollections.scholarshipsCollection.findOne(query)

            res.send(result)
        })

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

        app.get("/api/event/:id", async (req, res) => {

            let id = req.params.id
            console.log(id)

            // OR query বানানো হচ্ছে
            const query = {
                $or: [
                    { _id: id }, // string match
                    ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId match (valid হলে)
                ].filter(Boolean) // null বাদ দেওয়ার জন্য
            };
            let result = await dbCollections.eventsCollection.findOne(query)
            console.log(result)

            res.send(result)
        })




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




        app.get("/api/university/:id", async (req, res) => {

            let id = req.params.id

            // OR query বানানো হচ্ছে
            const query = {
                $or: [
                    { _id: id }, // string match
                    ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId match (valid হলে)
                ].filter(Boolean) // null বাদ দেওয়ার জন্য
            };

            let result = await dbCollections.universitiesCollection.findOne(query)

            res.send(result)
        })

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


        app.get("/api/course/:id", async (req, res) => {


            let id = req.params.id
            // console.log(id)

            // OR query বানানো হচ্ছে
            const query = {
                $or: [
                    { _id: id }, // string match
                    ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId match (valid হলে)
                ].filter(Boolean) // null বাদ দেওয়ার জন্য
            };

            let result = await dbCollections.coursesCollection.findOne(query)

            res.send(result)
        })

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

        app.get('/collaborate', async (req, res) => {
            try {
                const data = await dbCollections.collaborateCollection.find().toArray();
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
                const result = await dbCollections.collaborateCollection.insertOne(enquiry);
                res.send({ message: 'Enquiry submitted successfully', id: result.insertedId });
                // 2. Email পাঠাও
                // const mailOptions = {
                // from: process.env.EMAIL_USER,
                // to: email,   // ইউজারের original email
                // subject: "Your Post has been Submitted",
                // text: `${enquiry.email}, your post has been submitted successfully. We will contact you soon!`
                // };

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

            } catch (err) {
                res.status(500).send({ message: 'Failed to submit enquiry' });
            }
        });




        app.post('/add-new-scholarship', async (req, res) => {
            try {
                const data = req.body;


                const result = await dbCollections.scholarshipsCollection.insertOne(data);
                res.status(201).send({ message: 'Scholarship added successfully', userId: result.insertedId });
            } catch (err) {
                res.status(500).send({ message: 'Failed to add Scholarship' });
            }
        });

        // Normal Update Scholarship by id
        app.put('/api/scholarship/:id', async (req, res) => {
            try {
                const id = req.params.id;
                // OR query বানানো হচ্ছে
                const query = {
                    $or: [
                        { _id: id }, // string match
                        ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId match (valid হলে)
                    ].filter(Boolean) // null বাদ দেওয়ার জন্য
                };

                const updateDoc = {
                    $set: req.body   // সরাসরি যা আসবে body থেকে, সেটাই update হবে
                };

                const result = await dbCollections.scholarshipsCollection.updateOne(query, updateDoc);

                res.send(result);   // result এর মধ্যে matchedCount, modifiedCount থাকবে
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error updating scholarship' });
            }
        });


        // Delete a scholarship by id
        app.delete('/api/scholarship/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
                const result = await dbCollections.scholarshipsCollection.deleteOne(query);
                res.send({ success: true, deletedCount: result.deletedCount });
            } catch (err) {
                res.status(500).send({ success: false, message: 'Failed to delete scholarship' });
            }
        });

        app.post('/add-new-university', async (req, res) => {
            try {
                const data = req.body;


                const result = await dbCollections.universitiesCollection.insertOne(data);
                res.status(201).send({ message: 'University added successfully', userId: result.insertedId });
            } catch (err) {
                res.status(500).send({ message: 'Failed to add University' });
            }
        });

        // Normal Update University by id (pattern aligned with scholarship)
        app.put('/api/university/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = {
                    $or: [
                        { _id: id },
                        ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null
                    ].filter(Boolean)
                };

                const updateDoc = { $set: req.body };
                const result = await dbCollections.universitiesCollection.updateOne(query, updateDoc);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error updating university' });
            }
        });

        // Delete a university by id
        app.delete('/api/university/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
                const result = await dbCollections.universitiesCollection.deleteOne(query);
                res.send({ success: true, deletedCount: result.deletedCount });
            } catch (err) {
                res.status(500).send({ success: false, message: 'Failed to delete university' });
            }
        });

        // ==================Get All Course ==================
        app.get("/api/course", async (req, res) => {
            const data = await dbCollections.coursesCollection.find().toArray();
            res.send(data);
        })
 
        // ================== Add New Course ==================
        app.post('/add-new-course', async (req, res) => {
            try {
                const data = req.body;

                const result = await dbCollections.coursesCollection.insertOne(data);
                res.status(201).send({ message: 'Course added successfully', courseId: result.insertedId });
            } catch (err) {
                res.status(500).send({ message: 'Failed to add Course' });
            }
        });

        // ================== Update Course by ID ==================
        app.put('/api/course/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = {
                    $or: [
                        { _id: id },
                        ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null
                    ].filter(Boolean)
                };

                const updateDoc = { $set: req.body };
                const result = await dbCollections.coursesCollection.updateOne(query, updateDoc);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error updating course' });
            }
        });

        // ================== Delete Course by ID ==================
        app.delete('/api/course/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
                const result = await dbCollections.coursesCollection.deleteOne(query);
                res.send({ success: true, deletedCount: result.deletedCount });
            } catch (err) {
                res.status(500).send({ success: false, message: 'Failed to delete course' });
            }
        });


        // ================== Add New Event ==================
        app.post('/add-new-event', async (req, res) => {
            try {
                const data = req.body;
                const result = await dbCollections.eventsCollection.insertOne(data);
                res.status(201).send({ message: 'Event added successfully', eventId: result.insertedId });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: 'Failed to add Event' });
            }
        });

        // ================== Update Event by ID ==================
        app.put('/api/event/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const query = {
                    $or: [
                        { _id: id },
                        ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null
                    ].filter(Boolean)
                };

                const updateDoc = { $set: req.body };
                const result = await dbCollections.eventsCollection.updateOne(query, updateDoc);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error updating event' });
            }
        });

        // ================== Delete Event by ID ==================
        app.delete('/api/event/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
                const result = await dbCollections.eventsCollection.deleteOne(query);
                res.send({ success: true, deletedCount: result.deletedCount });
            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, message: 'Failed to delete event' });
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

        // ================== Get Single Event by ID ==================
        app.get('/api/event/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
                const event = await dbCollections.eventsCollection.findOne(query);

                if (!event) {
                    return res.status(404).send({ success: false, message: 'Event not found' });
                }

                res.send({ success: true, data: event });
            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, message: 'Failed to fetch event' });
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
