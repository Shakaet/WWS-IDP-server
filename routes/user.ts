import express from "express";

const router = express.Router();

import { getCollections } from "../db.js";
import { ObjectId } from 'mongodb';

router.get('/ambassador', async (req : express.Request, res: express.Response): Promise<void> => {
    try {
        const { users: usersCollection } = getCollections();
        const result = await usersCollection.find({ role: "ambassador" }).toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ message: 'Failed to fetch ambassadors' });
    }
});

router.patch(
  '/ambassador/:id/show',
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { users: usersCollection } = getCollections();
      const { id } = req.params;
      const { show } = req.body;

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            show: Boolean(show) // 🔥 field না থাকলে create হবে
          }
        }
      );

      res.send({
        success: true,
        modifiedCount: result.modifiedCount
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        message: 'Failed to update show status'
      });
    }
  }
);



router.get(
  '/ambassador/show',
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { users: usersCollection } = getCollections();

      const result = await usersCollection
        .find({
          role: "ambassador",
          show: true
        })
        .toArray();

      res.send(result);
    } catch (err) {
      res.status(500).send({
        success: false,
        message: 'Failed to fetch visible ambassadors'
      });
    }
  }
);



router.patch('/ambassador/:id', async (req, res) => {
    try {
        const { users: usersCollection } = getCollections();
        const id = req.params.id;
        const permissions = req.body;

        console.log(id,permissions)
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const query = { _id: new ObjectId(id) };

        const updateDoc = {
            $set: permissions
        };
        
        const result = await usersCollection.updateOne(query, updateDoc);
        res.send({ success: true, result });
    } catch (err) {
        console.error('Permission update error:', err);
        res.status(500).send({ success: false, message: 'Failed to update permissions' });
    }
});

export default router;