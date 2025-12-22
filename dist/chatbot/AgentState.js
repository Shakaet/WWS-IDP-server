import { Annotation } from "@langchain/langgraph";
// 1. Define your state with Annotation.Root
export const StateAnnotation = Annotation.Root({
    messages: Annotation({
        value: (prev, next) => prev.concat(next),
        default: () => [],
    }),
    final_output: Annotation({
        value: (_prev, next) => next,
        default: () => null,
    }),
    toolCall: Annotation({
        value: (_prev, next) => next,
        default: () => null,
    }),
});
