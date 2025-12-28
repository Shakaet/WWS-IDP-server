import { chatbot } from "../chatbot/graph.js";
import { AgentState } from "../chatbot/AgentState.js";
import { v4 as uuidv4 } from "uuid"; // for generating new thread IDs

// 2. Export the function with proper types
const chatbotHandler = (io: any) => {
  // Create the typed namespace
  const chatNamespace = io.of('/chatbot');

  let threadId: string;

  chatNamespace.on('connection', (socket: any) => {
    console.log(`User joined the Chatbot: ${socket.id}`);
    const initialState: AgentState = {
        messages: [],
        final_output: null,
        toolCall: null,
    };      

    socket.on("init_thread", async (clientThreadId: string | null) => {
        if (!clientThreadId)   threadId = uuidv4();
        // Send the thread object back to the client
        
    });

    // TypeScript now knows 'msg' is a string
    socket.on('chat_message', async (msg: string, clientThreadId: string | null) => {
        if (!clientThreadId) {
            threadId = uuidv4();
            chatNamespace.emit("thread_initialized", { thread_id: threadId});
        }
        console.log(`Message received in /chatbot: ${msg}`);
        // Invoke chatbot with timeout wrapper
        const result: AgentState = await Promise.race([
            chatbot.invoke(initialState),
            new Promise<AgentState>((_, reject) =>
                setTimeout(() => reject(new Error("LLM call timed out")), 130000) // 30s timeout
            ),
        ]);

        chatNamespace.emit('response', ` ${result.final_output}`);
    });

    socket.on('disconnect', () => {
      console.log('User left the chatbot');
    });
  });
};

export default chatbotHandler