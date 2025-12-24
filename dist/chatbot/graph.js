import { StateGraph, END, START } from "@langchain/langgraph";
import { llmNode } from "./nodes/llmNode.js";
import { toolNode } from "./nodes/toolNode.js";
import { StateAnnotation } from "./AgentState.js";
const graph = new StateGraph(StateAnnotation)
    .addNode("llm", llmNode)
    .addNode("tool", toolNode)
    .addEdge(START, "llm")
    .addConditionalEdges("llm", (state) => state.toolCall ? "tool" : END)
    .addEdge("tool", "llm")
    .compile();
export const chatbot = graph;
