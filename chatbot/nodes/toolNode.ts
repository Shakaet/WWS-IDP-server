import { AgentState } from "../AgentState.js";
import { ToolMessage } from "@langchain/core/messages";
import { getAllTools } from "../tools.js";

export async function toolNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log("🔧 Tool node executing...");
  console.log("Tool calls to execute:", state.toolCall.length);
  
  const tools = await getAllTools();
  const toolMap = new Map(tools.map(t => [t.name, t]));
  
  const toolMessages: ToolMessage[] = [];
  
  // Execute each tool call
  for (const toolCall of state.toolCall) {
    console.log(`Executing tool: ${toolCall.tool} with args:`, toolCall.args);
    const tool = toolMap.get(toolCall.tool);
    
    if (tool) {
      try {
        const result: string = await tool.invoke(toolCall.args);
        const result_json = JSON.parse(result)
        console.log(`✅ Tool ${toolCall.tool} succeeded with response\n ${result_json.documents}`);
        
        toolMessages.push(
          new ToolMessage({
            content: String(result_json.documents),
            tool_call_id: toolCall.tool_call_id,
          })
        );
      } catch (error) {
        console.error(`❌ Tool ${toolCall.tool} failed:`, error);
        
        toolMessages.push(
          new ToolMessage({
            content: `Error executing ${toolCall.tool}: ${error instanceof Error ? error.message : String(error)}`,
            tool_call_id: toolCall.tool_call_id,
          })
        );
      }
    } else {
      console.warn(`⚠️ Tool not found: ${toolCall.tool}`);
      
      toolMessages.push(
        new ToolMessage({
          content: `Tool ${toolCall.tool} not found`,
          tool_call_id: toolCall.tool_call_id,
        })
      );
    }
  }
  
  return {
    messages: toolMessages,
    toolCall: [], // Clear tool calls after execution
  };
}
