import express from "express";
import { chatbot } from "../chatbot/graph.js";
import { AgentState } from "../chatbot/AgentState.js";
import { v4 as uuidv4 } from "uuid"; // for generating new thread IDs
const router = express.Router();

// 2. Export the function with proper types
router.post("/connection", async (req: express.Request, res: express.Response) => {
  const { thread_id } = req.body as { thread_id: string | null };
  if (!thread_id) {
    console.log("User started a new Chatbot thread");
    const new_thread_id: string = uuidv4()
    return res.status(400).json({ 
      status: "new_thread", 
      thread_id: new_thread_id 
    });
  }else {
    console.log(`User joined the Chatbot: ${thread_id}`);
    return res.status(200).json({
      status: "existing_thread",
      thread_id: thread_id
    });
  }
});

router.post("/message", async (req: express.Request, res: express.Response) => {
  const { message, thread_id } = req.body as { message: string; thread_id: string | null };
  if (!thread_id) {
    console.log("No thread_id provided in /chatbot/message");
    return res.status(400).json({ 
      status: "error", 
      error: "thread_id is required" 
    });
  }
  console.log(`Message received in /chatbot/message: ${message} for thread: ${thread_id}`);
  const initialState: AgentState = {
      messages: [],
      final_output: null,
      toolCall: null,
  };      
  const result: AgentState = await Promise.race([
    chatbot.invoke(initialState),
    new Promise<AgentState>((_, reject) =>
        setTimeout(() => reject(new Error("LLM call timed out")), 130000) // 30s timeout
    ),
  ]);
  console.log(`Chatbot response for thread ${thread_id}: ${result.final_output}`);
  return res.status(200).json({ 
    status: "success", 
    response: result.final_output 
  });
});

router.get("/chathistory", async (req: express.Request, res: express.Response) => {
  const { thread_id } = req.body as { thread_id: string };
  console.log(`Fetching chat history for thread: ${thread_id}`);

  return res.status(200).json({ 
    status: "success", 
    history: [
      { role: "user", content: "Hello, how can I apply for scholarships?" },
      { role: "ai", content: "You can start by researching available scholarships on our platform..." }
    ] // Placeholder for actual chat history
  });
});

export default router