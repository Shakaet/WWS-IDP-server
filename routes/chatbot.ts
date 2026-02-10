import express from "express";
import { chatbot } from "../chatbot/graph.js";
import { AgentState } from "../chatbot/AgentState.js";
import { v4 as uuidv4 } from "uuid"; // for generating new thread IDs
import { getCollections } from "../db.js";
import { BaseMessage, HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
const router = express.Router();


// 2. Export the function with proper types
router.post("/connection", async (req: express.Request, res: express.Response) => {
  const { thread_id } = req.body as { thread_id: string | null };
  const { chatHistory : chatHistoryCollection } = getCollections();
  if (!thread_id) {
    console.log("User started a new Chatbot thread");
    const new_thread_id: string = uuidv4()
    await chatHistoryCollection.insertOne({ thread_id: new_thread_id, messages: [] });
    return res.status(400).json({ 
      status: "new_thread", 
      thread_id: new_thread_id ,
    });
  }else {
    const existingThread = await chatHistoryCollection.findOne({ thread_id: thread_id });
    if (!existingThread) {
      console.log(`No existing thread found for ID: ${thread_id}`);
      return res.status(404).json({ 
        status: "invalid_thread", 
        error: "Thread ID not found" 
      });
    }else{
      console.log(`User joined the Chatbot: ${thread_id}`);
      return res.status(200).json({
        status: "existing_thread",
        thread_id: thread_id
      });
    }
  }
});

router.post("/message", async (req: express.Request, res: express.Response) => {
  const { chatHistory : chatHistoryCollection } = getCollections();
  const { message, thread_id } = req.body as { message: string; thread_id: string | null };
  if (!thread_id) {
    console.log("No thread_id provided in /chatbot/message");
    return res.status(400).json({ 
      status: "error", 
      error: "thread_id is required" 
    });
  }
  // console.log(`Message received in /chatbot/message: ${message} for thread: ${thread_id}`);
  const existingThread = await chatHistoryCollection.findOne({ thread_id: thread_id }) as AgentState | null;

  if (!existingThread) {
    console.log(`No existing thread found for ID: ${thread_id} in /chatbot/message`);
    return res.status(404).json({
      status: "invalid_thread",
      error: "Thread ID not found"
    });
  }

  const initialState: AgentState = {
      messages: existingThread.messages.concat(new HumanMessage(message)) ,
      final_output: existingThread ? existingThread.final_output : null,
      toolCall: existingThread ? existingThread.toolCall : [],
  };

  try {
    const result: AgentState = await Promise.race([
      chatbot.invoke(initialState),
      new Promise<AgentState>((_, reject) =>
        setTimeout(() => reject(new Error("LLM call timed out")), 50000) // 30s timeout
      ),
    ]);

    await chatHistoryCollection.updateOne(
      { thread_id: thread_id },
      { $set: { messages: result.messages, final_output: result.final_output, toolCall: result.toolCall } }
    );

    return res.status(200).json({
      status: "success",
      response: result.final_output,
    });
  } catch (err: any) {
    console.error(`Error in /chatbot/message for thread ${thread_id}:`, err);
    if (err && err.message && err.message.includes('timed out')) {
      return res.status(504).json({ status: 'error', error: 'LLM call timed out' });
    }
    return res.status(500).json({ status: 'error', error: 'Internal server error' });
  }
});

router.get("/chathistory", async (req: express.Request, res: express.Response) => {
  const { thread_id } = req.body as { thread_id: string };
  const { chatHistory : chatHistoryCollection } = getCollections();
  console.log(`Fetching chat history for thread: ${thread_id}`);
  const existingThread = await chatHistoryCollection.findOne({ thread_id: thread_id });
  if (!existingThread) {
    console.log(`No existing thread found for ID: ${thread_id}`);
    return res.status(404).json({
      status: "invalid_thread",
      error: "Thread ID not found"
    });
  }

  const a = existingThread.messages.reduce((acc: string[], e: AIMessage | ToolMessage | HumanMessage) => {
    if (e.type === "ai") {
      const aiMessage = e as AIMessage;
      const calls = aiMessage.tool_calls ?? [];
      if (calls.length === 0) {
        acc.push(aiMessage.content as string);
      }
    } else if (e.type === "human") {
      acc.push(e.content as string);
    }
    return acc;
  }, [] as string[]);

  return res.status(200).json({ 
    status: "success", 
    history: a
  });
});

router.post("/human_feedback", async (req: express.Request, res: express.Response) => {
  const { thread_id, feedback } = req.body as { thread_id: string; feedback: string };
  const { chatHistory : chatHistoryCollection } = getCollections();

  const existingThread = await chatHistoryCollection.findOne({ thread_id: thread_id });
  if (!existingThread) {
    console.log(`No existing thread found for ID: ${thread_id}`);
    return res.status(404).json({
      status: "invalid_thread",
      error: "Thread ID not found"
    });
  }

  const updatedMessages = [...existingThread.messages, new HumanMessage(`Human Feedback: ${feedback}`)];
  await chatHistoryCollection.updateOne(
    { thread_id: thread_id },
    { $set: { messages: updatedMessages } }
  );

  return res.status(200).json({
    status: "success",
    message: "Feedback recorded successfully"
  });
});

export default router