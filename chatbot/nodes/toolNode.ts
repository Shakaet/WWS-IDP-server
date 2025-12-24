import { tools } from "../tools.js";
import { AgentState } from "../AgentState.js";

// interface validatedArgtype{
//     title: string;
//     start: string;
//     end: string;
//     attendees?: string | undefined;
//     location?: string | undefined;
// } 

export async function toolNode(state: AgentState) : Promise<Partial<AgentState>> {
    if (!state.toolCall) {
    return {};
  }
  const { tool, args }: { tool: string; args: any } = state.toolCall;

  const selectedTool = tools[tool];
  if (!selectedTool) {
    throw new Error(`Unknown tool: ${tool}`);
  }

  const validatedArgs = selectedTool.schema.parse(args);
  const result = await selectedTool.func(validatedArgs);

  return {
    toolCall: null,
    final_output: result,
  };
}
