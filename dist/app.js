"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const mongodb_1 = require("mongodb");
const db_1 = require("./db");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', "https://wws-idp-website.vercel.app", "https://graceful-sable-b6d5d1.netlify.app"],
    credentials: true
}));
// Email transporter (Gmail Example)
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // তোমার Gmail
        pass: process.env.EMAIL_PASS // App Password (normal password নয়)
    }
});
// Use centralized DB initializer
async function run() {
    try {
        console.log('Initializing DB');
        await (0, db_1.initDb)();
        const cols = (0, db_1.getCollections)();
        const usersCollection = cols.users;
        const coursesCollection = cols.courses;
        const scholarshipsCollection = cols.scholarships;
        const universitiesCollection = cols.universities;
        const eventsCollection = cols.events;
        const collaborateCollection = cols.collaborate;
        // Mount routers
        app.use('/popular', require(path_1.default.join(__dirname, 'routes/popular')));
        app.use('/chatbot', require(path_1.default.join(__dirname, 'routes/chatbot')));
        app.get("/getUser/:email", async (req, res) => {
            let email = req.params.email;
            let query = { email: email };
            let result = await usersCollection.findOne(query);
            if (!result) {
                return res.send({ message: "No user found" });
            }
            let user = false;
            if (result.role === "user") {
                user = true;
            }
            res.send({ user });
        });
        app.get("/getAdmin/:email", async (req, res) => {
            let email = req.params.email;
            let query = { email: email };
            let result = await usersCollection.findOne(query);
            if (!result) {
                return res.send({ message: "No user found" });
            }
            let admin = false;
            if (result.role === "admin") {
                admin = true;
            }
            res.send({ admin });
        });
        app.get("/getAmbassador/:email", async (req, res) => {
            let email = req.params.email;
            let query = { email: email };
            let result = await usersCollection.findOne(query);
            if (!result) {
                return res.send({ message: "No user found" });
            }
            let ambassador = false;
            if (result.role === "ambassador") {
                ambassador = true;
            }
            res.send({ ambassador });
        });
        // ===== Ambassador Permission Routes =====
        app.use('/user', require(path_1.default.join(__dirname, 'routes/user')));
        app.get("/ambassador/access/:email", async (req, res) => {
            try {
                const { email } = req.params;
                if (!email) {
                    return res.status(400).json({ message: "Email is required" });
                }
                let User = usersCollection;
                const user = await User.findOne({ email }, { projection: { role: 1, scholarships: 1, courses: 1, universities: 1, events: 1 } });
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                // ✅ role ambassador না হলে access deny
                if (user.role !== "ambassador") {
                    return res.status(403).json({ message: "Access denied: Not an ambassador" });
                }
                // ✅ শুধু true field গুলো পাঠানো হবে
                const trueFields = {};
                if (user.scholarships)
                    trueFields.scholarships = true;
                if (user.courses)
                    trueFields.courses = true;
                if (user.universities)
                    trueFields.universities = true;
                if (user.events)
                    trueFields.events = true;
                return res.json({
                    role: user.role,
                    access: trueFields,
                });
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
        app.post('/post-users', async (req, res) => {
            try {
                const user = req.body;
                if (!user || !user.email)
                    return res.status(400).send({ message: 'User data or email is missing' });
                const existingUser = await usersCollection.findOne({ email: user.email });
                if (existingUser)
                    return res.status(409).send({ message: 'User already exists' });
                const result = await usersCollection.insertOne(user);
                res.status(201).send({ message: 'User added successfully', userId: result.insertedId });
            }
            catch (err) {
                res.status(500).send({ message: 'Failed to add user' });
            }
        });
        // ===== Help Routes =====
        app.use('/help-from-wws', require(path_1.default.join(__dirname, 'routes/help-from-wws')));
        app.use('/api', require(path_1.default.join(__dirname, 'routes/api')));
        app.get('/users', async (req, res) => {
            try {
                const data = await usersCollection.find().toArray();
                res.send({ success: true, data });
            }
            catch (err) {
                res.status(500).send({ success: false, message: 'Failed to fetch users' });
            }
        });
        // Update user (PATCH)
        app.patch('/users/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body; // { role: 'admin' } or any field
                const result = await usersCollection.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: updateData });
                if (result.modifiedCount === 0) {
                    return res.send({ success: false, message: 'No changes made or user not found' });
                }
                res.send({ success: true, message: 'User updated successfully' });
            }
            catch (err) {
                res.status(500).send({ success: false, message: 'Failed to update user' });
            }
        });
        // Delete user (DELETE)
        app.delete('/users/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await usersCollection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
                if (result.deletedCount === 0) {
                    return res.send({ success: false, message: 'User not found' });
                }
                res.send({ success: true, message: 'User deleted successfully' });
            }
            catch (err) {
                res.status(500).send({ success: false, message: 'Failed to delete user' });
            }
        });
        app.get('/collaborate', async (req, res) => {
            try {
                const data = await collaborateCollection.find().toArray();
                res.send(data);
            }
            catch (err) {
                res.status(500).send({ success: false, message: 'Failed to fetch universities' });
            }
        });
        app.post('/collaborate', async (req, res) => {
            try {
                let email = "abdshakaet@gmail.com";
                const enquiry = req.body;
                // console.log(enquiry)
                if (!enquiry)
                    return res.status(400).send({ message: 'No data provided' });
                const result = await collaborateCollection.insertOne(enquiry);
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
                    to: email, // তোমার ইমেইল, যেটাতে message যাবে
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
            }
            catch (err) {
                res.status(500).send({ message: 'Failed to submit enquiry' });
            }
        });
        // ==================Get All Scholarship ==================
        app.post('/add-new-scholarship', async (req, res) => {
            try {
                const data = req.body;
                const result = await scholarshipsCollection.insertOne(data);
                res.status(201).send({ message: 'Scholarship added successfully', userId: result.insertedId });
            }
            catch (err) {
                res.status(500).send({ message: 'Failed to add Scholarship' });
            }
        });
        app.post('/add-new-university', async (req, res) => {
            try {
                const data = req.body;
                const result = await universitiesCollection.insertOne(data);
                res.status(201).send({ message: 'University added successfully', userId: result.insertedId });
            }
            catch (err) {
                res.status(500).send({ message: 'Failed to add University' });
            }
        });
        // ================== Add New Course ==================
        app.post('/add-new-course', async (req, res) => {
            try {
                const data = req.body;
                const result = await coursesCollection.insertOne(data);
                res.status(201).send({ message: 'Course added successfully', courseId: result.insertedId });
            }
            catch (err) {
                res.status(500).send({ message: 'Failed to add Course' });
            }
        });
        // ================== Add New Event ==================
        app.post('/add-new-event', async (req, res) => {
            try {
                const data = req.body;
                const result = await eventsCollection.insertOne(data);
                res.status(201).send({ message: 'Event added successfully', eventId: result.insertedId });
            }
            catch (err) {
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
    }
    catch (err) {
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
