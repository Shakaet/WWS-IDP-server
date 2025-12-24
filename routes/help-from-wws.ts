import express from "express";

const router = express.Router();

import { getCollections } from "../db.js";
import { ObjectId } from 'mongodb';

// const { helpFrom: helpCollection } = getCollections();

router.get('/', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { helpFrom } = getCollections(); // ✅ SAFE

        const data = await helpFrom.find({}).toArray();
        res.json(data);
    } catch (err) {
        res.status(500).send({ message: 'Failed to fetch enquiries' });
    }
});

router.patch("/:id", async (req: express.Request, res: express.Response): Promise<void>=> {
    const { helpFrom: helpCollection } = getCollections();

    let id = req.params.id
    let status = req.body.status

    let query = { _id: new ObjectId(id) }

    let updatedDoc = {
        $set: {
            status: status
        }
    }

    let result = await helpCollection.updateOne(query, updatedDoc)

    res.send(result)
});

router.get('/:userEmail', async (req: express.Request, res: express.Response): Promise<void>=> {
    try {
        const { helpFrom: helpCollection } = getCollections();
        let userEmail = req.params.userEmail

        let query = { userEmail }
        const result = await helpCollection.find(query).toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ message: 'Failed to fetch enquiries' });
    }
});


router.delete('/:id', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { helpFrom: helpCollection } = getCollections();
        let id = req.params.id

        let query = { _id: new ObjectId(id) }

        const result = await helpCollection.deleteOne(query);
        res.send(result);
    } catch (err) {
        res.status(500).send({ message: 'Failed to delete enquiry' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { helpFrom: helpCollection } = getCollections();
        const enquiry = req.body;
        if (!enquiry) return res.status(400).send({ message: 'No data provided' });
        const result = await helpCollection.insertOne(enquiry);
        res.send({ message: 'Enquiry submitted successfully', id: result.insertedId });
    } catch (err) {
        res.status(500).send({ message: 'Failed to submit enquiry' });
    }
});

export default router