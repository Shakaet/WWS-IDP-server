import { BaseMessage } from "@langchain/core/messages";
import { Annotation} from "@langchain/langgraph";

// 1. Define your state with Annotation.Root
export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    value: (prev, next) => prev.concat(next),
    default: () => [],
  }),
  final_output: Annotation<string | null>({
    value: (_prev, next) => next ,
    default: () => null,
  }),
  toolCall: Annotation<{
    tool: string;
    args: any;
  } | null>({
    value: (_prev, next) => next,
    default: () => null,
  }),
});

// 2. Type of your state
export type AgentState = typeof StateAnnotation.State;
