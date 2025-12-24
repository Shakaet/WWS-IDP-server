import { chatbot } from "../chatbot/graph.js";
import { v4 as uuidv4 } from "uuid"; // for generating new thread IDs
// 2. Export the function with proper types
const chatbotHandler = (io) => {
    // Create the typed namespace
    const chatNamespace = io.of('/chatbot');
    let threadId;
    chatNamespace.on('connection', (socket) => {
        console.log(`User joined the Chatbot: ${socket.id}`);
        const initialState = {
            messages: [],
            final_output: null,
            toolCall: null,
        };
        socket.on("init_thread", async (clientThreadId) => {
            if (!clientThreadId)
                threadId = uuidv4();
            // Send the thread object back to the client
        });
        // TypeScript now knows 'msg' is a string
        socket.on('chat_message', async (msg, clientThreadId) => {
            if (!clientThreadId) {
                threadId = uuidv4();
                chatNamespace.emit("thread_initialized", { thread_id: threadId });
            }
            console.log(`Message received in /chatbot: ${msg}`);
            // Invoke chatbot with timeout wrapper
            const result = await Promise.race([
                chatbot.invoke(initialState),
                new Promise((_, reject) => setTimeout(() => reject(new Error("LLM call timed out")), 130000) // 30s timeout
                ),
            ]);
            chatNamespace.emit('response', ` ${result.final_output}`);
        });
        socket.on('disconnect', () => {
            console.log('User left the chatbot');
        });
    });
};
export default chatbotHandler;
