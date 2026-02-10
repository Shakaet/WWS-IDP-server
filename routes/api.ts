import express from "express";

const router = express.Router();

import { getCollections } from "../db.js";
import { ObjectId } from 'mongodb';


export function parseObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid ObjectId");
  }
  return new ObjectId(id);
}

interface queryParams {
    $regex: string;
    $options: "i" 
}

interface FilterQuery {
    studyLevel?: queryParams;
    destination?: queryParams;
    universityName?: queryParams;
    city?: queryParams;
    month?: queryParams;
    subject?: queryParams;
}

router.get("/scholarships", async (req: express.Request, res: express.Response): Promise<void> => {
    const { scholarships : scholarshipsCollection } = getCollections();
    const data = await scholarshipsCollection.find().toArray();
    res.send(data)
})

router.get("/universities", async (req: express.Request, res: express.Response): Promise<void> => {
    const { universities : universitiesCollection } = getCollections();
    const data = await universitiesCollection.find().toArray();
    res.send(data);
})

router.get("/events", async (req: express.Request, res: express.Response): Promise<void> => {
    const { events : eventsCollection } = getCollections();
    const data = await eventsCollection.find().toArray();
    res.send(data);
})

// ===== Search GET Routes (All) =====
router.get('/search/course', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { courses : coursesCollection } = getCollections();
        const data = await coursesCollection.find().toArray();
        res.send({ success: true, data });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Failed to fetch courses' });
    }
});

router.get("/scholarship/:id", async (req: express.Request, res: express.Response): Promise<void> => {
    // const { scholarships : scholarshipsCollection } = getCollections();
    // let id = req.params.id

    // // OR query বানানো হচ্ছে
    // const query = { _id: parseObjectId(id) };

    // let result = await scholarshipsCollection.findOne(query)

    // res.send(result)
       const { scholarships } = getCollections();
    let id = req.params.id
     console.log(id)

    // OR query বানানো হচ্ছে
    // const query = { _id: new ObjectId(id) };

     // OR query বানানো হচ্ছে
            const query = {
                $or: [
                    { _id: id }, // string match
                    ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId match (valid হলে)
                ].filter(Boolean) // null বাদ দেওয়ার জন্য
            };

    let result = await scholarships.findOne(query)

    console.log(result)

    res.send(result)


})

router.get('/search/scholarships', async (req, res) => {
    try {
        const { scholarships : scholarshipsCollection } = getCollections();
        const data = await scholarshipsCollection.find().toArray();
        res.send({ success: true, data });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Failed to fetch scholarships' });
    }
});

   

router.get('/search/universities', async (req, res) => {
    try {
        const { universities : universitiesCollection } = getCollections();
        const data = await universitiesCollection.find().toArray();
        res.send({ success: true, data });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Failed to fetch universities' });
    }
});

// ================== Get Single Event by ID ==================
router.get('/event/:id', async (req, res) => {
    // try {
    //     const { events : eventsCollection } = getCollections();
    //     const id = req.params.id;
    //     const event = await eventsCollection.findOne({_id: parseObjectId(req.params.id)});

    //     if (!event) {
    //         return res.status(404).send({ success: false, message: 'Event not found' });
    //     }

    //     res.send({ success: true, data: event });
    // } catch (err) {
    //     console.error(err);
    //     res.status(500).send({ success: false, message: 'Failed to fetch event' });
    // }

       const {  events :  events } = getCollections();
    let id = req.params.id
     console.log(id)

    // OR query বানানো হচ্ছে
    // const query = { _id: new ObjectId(id) };

     // OR query বানানো হচ্ছে
            const query = {
                $or: [
                    { _id: id }, // string match
                    ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId match (valid হলে)
                ].filter(Boolean) // null বাদ দেওয়ার জন্য
            };

    let result = await  events.findOne(query)

    console.log(result)

    res.send(result)
});
router.get('/search/events', async (req, res) => {
    try {
        const { events : eventsCollection } = getCollections();
        const data = await eventsCollection.find().toArray();
        res.send({ success: true, data });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Failed to fetch events' });
    }
});

// ===== Scholarships Search POST Route (Fixed for flat structure) =====
router.post('/search/scholarships', async (req, res) => {
    try {
        const { scholarships : scholarshipsCollection } = getCollections();
        const { studyLevel, destination } = req.body;
        console.log("Scholarships Request body:", req.body);

        // Build query for flat structure
        const query: FilterQuery = {};
        if (studyLevel) query.studyLevel = { $regex: studyLevel, $options: "i" };
        if (destination) query.destination = { $regex: destination, $options: "i" };

        console.log("Scholarships query:", query);

        // Find matching documents
        const results = await scholarshipsCollection.find(query).toArray();
        console.log("Scholarships results:", results);

        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Scholarships search error:", error);
        res.status(500).json({ success: false, message: "Scholarship search failed" });
    }
});

router.get("/university/:id", async (req, res) => {
    // const { universities : universitiesCollection } = getCollections();
    // let id = req.params.id

    // // OR query বানানো হচ্ছে
    // const query = { _id: parseObjectId(id) };

    // let result = await universitiesCollection.findOne(query)

    // res.send(result)
       const { universities : universityCollection } = getCollections();
    let id = req.params.id
     console.log(id)

    // OR query বানানো হচ্ছে
    // const query = { _id: new ObjectId(id) };

     // OR query বানানো হচ্ছে
            const query = {
                $or: [
                    { _id: id }, // string match
                    ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId match (valid হলে)
                ].filter(Boolean) // null বাদ দেওয়ার জন্য
            };

    let result = await universityCollection.findOne(query)

    console.log(result)

    res.send(result)
})

// ===== Universities Search POST Route (Fixed for flat structure) =====
router.post('/search/universities', async (req, res) => {
    try {
        const { universities : universitiesCollection } = getCollections();
        const { universityName, destination } = req.body;
        console.log("Universities Request body:", req.body);

        // Build query for flat structure
        const query:FilterQuery = {};
        if (universityName) query.universityName = { $regex: universityName, $options: "i" };
        if (destination) query.destination = { $regex: destination, $options: "i" };

        console.log("Universities query:", query);

        // Find matching documents
        const results = await universitiesCollection.find(query).toArray();
        console.log("Universities results:", results);

        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Universities search error:", error);
        res.status(500).json({ success: false, message: "University search failed" });
    }
});

// ===== Events Search POST Route (Fixed for flat structure) =====
router.post('/search/events', async (req, res) => {
    try {
        const { events : eventsCollection } = getCollections();
        const { city, month, destination } = req.body;
        console.log("Events Request body:", req.body);

        // Build query for flat structure
        const query:FilterQuery = {};
        if (city) query.city = { $regex: city, $options: "i" };
        if (month) query.month = { $regex: month, $options: "i" };
        if (destination) query.destination = { $regex: destination, $options: "i" };

        console.log("Events query:", query);

        // Find matching documents
        const results = await eventsCollection.find(query).toArray();
        console.log("Events results:", results);

        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Events search error:", error);
        res.status(500).json({ success: false, message: "Event search failed" });
    }
});

router.get("/course/:id", async (req, res) => {
    const { courses : coursesCollection } = getCollections();
    let id = req.params.id
     console.log(id)

    // OR query বানানো হচ্ছে
    // const query = { _id: new ObjectId(id) };

     // OR query বানানো হচ্ছে
            const query = {
                $or: [
                    { _id: id }, // string match
                    ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId match (valid হলে)
                ].filter(Boolean) // null বাদ দেওয়ার জন্য
            };

    let result = await coursesCollection.findOne(query)

    console.log(result)

    res.send(result)
})

// ===== Course Search POST Route (Fixed for flat structure) =====
router.post("/search/course", async (req, res) => {
    try {
        const { courses : coursesCollection } = getCollections();
        const { subject, studyLevel, destination } = req.body;
        console.log("Course Request body:", req.body);

        // Build query for flat structure
        const query: FilterQuery = {};
        if (subject) query.subject = { $regex: subject, $options: "i" };
        if (studyLevel) query.studyLevel = { $regex: studyLevel, $options: "i" };
        if (destination) query.destination = { $regex: destination, $options: "i" };

        console.log("Course query:", query);

        // Find matching documents
        const results = await coursesCollection.find(query).toArray();
        console.log("Course results:", results);

        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Course search error:", error);
        res.status(500).json({ success: false, message: "Course search failed" });
    }
});

// Normal Update Scholarship by id
router.put('/scholarship/:id', async (req, res) => {
    try {
        const { scholarships : scholarshipsCollection } = getCollections();
        const id = req.params.id;
        // OR query বানানো হচ্ছে
        const query = { _id: parseObjectId(id) };

        const updateDoc = {
            $set: req.body   // সরাসরি যা আসবে body থেকে, সেটাই update হবে
        };

        const result = await scholarshipsCollection.updateOne(query, updateDoc);

        res.send(result);   // result এর মধ্যে matchedCount, modifiedCount থাকবে
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error updating scholarship' });
    }
});

// Delete a scholarship by id
router.delete('/scholarship/:id', async (req, res) => {
    try {
        const { scholarships : scholarshipsCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: parseObjectId(id) };
        const result = await scholarshipsCollection.deleteOne(query);
        res.send({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Failed to delete scholarship' });
    }
});

// Normal Update University by id (pattern aligned with scholarship)
router.put('/university/:id', async (req, res) => {
    try {
        const { universities : universitiesCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: parseObjectId(id) };

        const updateDoc = { $set: req.body };
        const result = await universitiesCollection.updateOne(query, updateDoc);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error updating university' });
    }
});

// Delete a university by id
router.delete('/university/:id', async (req, res) => {
    try {
        const { universities : universitiesCollection } = getCollections();
        const id = req.params.id;
        const query = {_id : parseObjectId(id) };
        const result = await universitiesCollection.deleteOne(query);
        res.send({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Failed to delete university' });
    }
});

// ==================Get All Course ==================
router.get("/course", async (req, res) => {
    const { courses : coursesCollection } = getCollections();
    const data = await coursesCollection.find().toArray();
    res.send(data);
})

// ================== Update Course by ID ==================
router.put('/course/:id', async (req, res) => {
    try {
        const { courses : coursesCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: parseObjectId(id) };
        const updateDoc = { $set: req.body };
        const result = await coursesCollection.updateOne(query, updateDoc);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error updating course' });
    }
});

// ================== Delete Course by ID ==================
router.delete('/course/:id', async (req, res) => {
    try {
        const { courses : coursesCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: parseObjectId(id) };
        const result = await coursesCollection.deleteOne(query);

        res.send({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Failed to delete course' });
    }
});

// ================== Update Event by ID ==================
router.put('/event/:id', async (req, res) => {
    try {
        const { events : eventsCollection } = getCollections();
        const id = req.params.id;
        
        const query = { _id: parseObjectId(id)};

        const updateDoc = { $set: req.body };
        const result = await eventsCollection.updateOne(query, updateDoc);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error updating event' });
    }
});

// ================== Delete Event by ID ==================
router.delete('/event/:id', async (req, res) => {
    try {
        const { events : eventsCollection } = getCollections();
        const id = req.params.id;
        const result = await eventsCollection.deleteOne({_id: parseObjectId(req.params.id)});
        res.send({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: 'Failed to delete event' });
    }
});



export default router;
