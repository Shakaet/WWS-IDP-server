import { model } from "../model";
import { SYSTEM_MESSAGE } from "../prompt";
import { AgentState } from "../AgentState";
import { BaseMessage } from "@langchain/core/messages";

export async function llmNode(state: AgentState) : Promise<Partial<AgentState>> {
  
  const prompt = `
${SYSTEM_MESSAGE}

User input:
${state.messages.map((msg) => `${msg.type}: ${msg.content}`).join("\n")}

Tool result:
${state.final_output ?? "none"}
`;

  console.log("LLM Prompt:", prompt);
  const raw = await model.invoke(prompt);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("LLM did not return valid JSON");
  }
  return {
    toolCall: parsed.tool
      ? {
          tool: parsed.tool,
          args: parsed.args,
        }
      : null,
    final_output: parsed.tool ? null : parsed.response,
    // Optionally, you can append the AI message to the messages array
    messages: parsed.tool
      ? state.messages
      : [
          ...state.messages,
          {
            type: "ai", // or appropriate BaseMessage type
            content: parsed.response ?? "",
          } as BaseMessage,
        ],
  };
}
