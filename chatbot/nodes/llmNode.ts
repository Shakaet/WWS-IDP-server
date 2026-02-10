import { SYSTEM_MESSAGE } from "../prompt.js"
import { AgentState } from "../AgentState.js"
import {AIMessage, AIMessageChunk, SystemMessage} from "@langchain/core/messages"
import { modelwithtool } from "../model.js"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"

const AVAILABLE_MODELS: string[] = [
    'meta-llama/llama-3-70b-instruct:free',
    'microsoft/wizardlm-2-8x22b:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-7b-it:free',
    'meta-llama/llama-3-8b-instruct', // Try without :free
    'anthropic/claude-3-haiku',
    'openai/gpt-3.5-turbo',
    'openai/gpt-4o-mini'
];

export async function llmNode(state: AgentState) : Promise<Partial<AgentState>> {
  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(SYSTEM_MESSAGE),
    new MessagesPlaceholder("messages"),
  ]);

  const model = await modelwithtool(AVAILABLE_MODELS[7] as string);
  const chain: any = prompt.pipe(model);

  const response : AIMessageChunk = await chain.invoke({
    messages: state.messages,
  });

  const raw: string = response.content as string;
  const cleaned = raw.replace(/\n/g, "")
    .replace(/<\/?html>/gi, "")
    .replace(/<\/?body>/gi, "")
    .replace(/<\/?head>.*?<\/head>/gi, "")
    .replace(/<\/?DOCTYPE[^>]*>/gi, "")
    .trim();
  const tool_calls = response.tool_calls || [];

  // console.log("LLM Response content:", cleaned);
  // console.log("LLM Response tool_calls:", JSON.stringify(tool_calls, null, 2));
  
  // Check if there are tool calls
  if (tool_calls.length > 0) {

    return {
      messages: [new AIMessage({
          content: cleaned,
          tool_calls: response.tool_calls,
      })], // Append the AI message with tool calls
      toolCall: tool_calls.map(tc => ({
        tool: tc.name,
        args: tc.args as Record<string, unknown>,
        tool_call_id: tc.id as string,
      })),
      final_output: null, // No final output yet
    };
  } else {
    
    return {
      messages: [new AIMessage(cleaned)],
      toolCall: [], // Clear tool calls
      final_output: cleaned,
    };
  }
}
