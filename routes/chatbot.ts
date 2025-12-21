import express from "express";
import { chatbot } from "../chatbot/graph";
import { AgentState } from "../chatbot/AgentState";
import { BaseMessage } from "@langchain/core/messages";

const router = express.Router();

router.get("/", async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { message } = req.body;

        console.log("Received message:", message);
        const initialState: AgentState = {
            messages: [
            {
                type: "user",
                content: message,
                } as BaseMessage, // adjust BaseMessage type if needed
            ],
            final_output: null,
            toolCall: null,
        };
        // Invoke chatbot with timeout wrapper
        const result = await Promise.race([
            chatbot.invoke(initialState),
            new Promise<AgentState>((_, reject) =>
                setTimeout(() => reject(new Error("LLM call timed out")), 130000) // 30s timeout
            ),
        ]);
        // const result = await chatbot.invoke(initialState);
        res.json({ result: result});
    }
    catch (err: any) {
        res.status(500).json({ error: err.message });
    }
})

module.exports = router;