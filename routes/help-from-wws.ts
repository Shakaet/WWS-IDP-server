import express from "express";

const router = express.Router();

import { getCollections } from "../db";
import { ObjectId } from 'mongodb';

const { helpFrom: helpCollection } = getCollections();

router.get('/', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const result = await helpCollection.find().toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ message: 'Failed to fetch enquiries' });
    }
});

router.patch("/:id", async (req: express.Request, res: express.Response): Promise<void>=> {

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
        const enquiry = req.body;
        if (!enquiry) return res.status(400).send({ message: 'No data provided' });
        const result = await helpCollection.insertOne(enquiry);
        res.send({ message: 'Enquiry submitted successfully', id: result.insertedId });
    } catch (err) {
        res.status(500).send({ message: 'Failed to submit enquiry' });
    }
});

module.exports = router;