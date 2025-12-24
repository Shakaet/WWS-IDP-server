// Sample pseudo LLM outputs
const sampleResponses: string[] = [
  "Sure! I can help with that.",
  "Here's what I found for you.",
  "Let me check that quickly.",
  "Interesting question! Here's my thought.",
  "I recommend the following approach."
];

// Pseudo LLM node function
export const pseudoLlmNode = async (
  prompt: string
): Promise<string> => {
  // Pick a random response
  const randomResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];

  // Return in AgentState format
  return `{
   "tool": null,
   "response": "${randomResponse}"
}`
};

