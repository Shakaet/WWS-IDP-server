import express from "express";
import { chatbot } from "../chatbot/graph.js";
import { v4 as uuidv4 } from "uuid"; // for generating new thread IDs
import { getCollections } from "../db.js";
const router = express.Router();
// 2. Export the function with proper types
router.post("/connection", async (req, res) => {
    const { thread_id } = req.body;
    const { chatHistory: chatHistoryCollection } = getCollections();
    if (!thread_id) {
        console.log("User started a new Chatbot thread");
        const new_thread_id = uuidv4();
        await chatHistoryCollection.insertOne({ thread_id: new_thread_id, messages: [] });
        return res.status(400).json({
            status: "new_thread",
            thread_id: new_thread_id,
        });
    }
    else {
        const existingThread = await chatHistoryCollection.findOne({ thread_id: thread_id });
        if (!existingThread) {
            console.log(`No existing thread found for ID: ${thread_id}`);
            return res.status(404).json({
                status: "invalid_thread",
                error: "Thread ID not found"
            });
        }
        else {
            console.log(`User joined the Chatbot: ${thread_id}`);
            return res.status(200).json({
                status: "existing_thread",
                thread_id: thread_id
            });
        }
    }
});
router.post("/message", async (req, res) => {
    const { chatHistory: chatHistoryCollection } = getCollections();
    const { message, thread_id } = req.body;
    if (!thread_id) {
        console.log("No thread_id provided in /chatbot/message");
        return res.status(400).json({
            status: "error",
            error: "thread_id is required"
        });
    }
    console.log(`Message received in /chatbot/message: ${message} for thread: ${thread_id}`);
    const existingThread = await chatHistoryCollection.findOne({ thread_id: thread_id });
    const initialState = {
        messages: existingThread?.messages.concat([{ type: "user", content: message }]) || [{ type: "user", content: message }],
        final_output: existingThread ? existingThread.final_output : null,
        toolCall: existingThread ? existingThread.toolCall : null,
    };
    const result = await Promise.race([
        chatbot.invoke(initialState),
        new Promise((_, reject) => setTimeout(() => reject(new Error("LLM call timed out")), 130000) // 30s timeout
        ),
    ]);
    console.log(`Chatbot processing completed for thread ${thread_id} and final message array is:\n${JSON.stringify(result.messages, null, 2)}`);
    await chatHistoryCollection.updateOne({ thread_id: thread_id }, { $set: { messages: result.messages, final_output: result.final_output, toolCall: result.toolCall } });
    // console.log(`Chatbot response for thread ${thread_id}: ${result.final_output}`);
    return res.status(200).json({
        status: "success",
        response: result.final_output
    });
});
router.get("/chathistory", async (req, res) => {
    const { thread_id } = req.body;
    const { chatHistory: chatHistoryCollection } = getCollections();
    console.log(`Fetching chat history for thread: ${thread_id}`);
    const existingThread = await chatHistoryCollection.findOne({ thread_id: thread_id });
    if (!existingThread) {
        console.log(`No existing thread found for ID: ${thread_id}`);
        return res.status(404).json({
            status: "invalid_thread",
            error: "Thread ID not found"
        });
    }
    return res.status(200).json({
        status: "success",
        history: existingThread.messages
    });
});
export default router;
