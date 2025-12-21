import { StateGraph, END , Annotation, START} from "@langchain/langgraph";
import { llmNode } from "./nodes/llmNode";
import { toolNode } from "./nodes/toolNode";
import { StateAnnotation, AgentState } from "./AgentState";

const graph = new StateGraph(StateAnnotation)
  .addNode("llm", llmNode)
  .addNode("tool", toolNode)
  
  .addEdge(START, "llm")
  
  .addConditionalEdges("llm", (state) =>
    state.toolCall ? "tool" : END
  )
  .addEdge("tool", "llm")
  .compile();

export const chatbot = graph;
