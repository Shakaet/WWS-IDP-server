import { HuggingFaceInference } from "@langchain/community/llms/hf";

// Initialize Hugging Face model
export const model = new HuggingFaceInference({
  // Example: Use a high-performance instruct model
  model: "stabilityai/stablelm-base-alpha-7b", 
  apiKey: process.env.HUGGINGFACEHUB_API_KEY, // Defaults to process.env.HUGGINGFACEHUB_API_KEY
  temperature: 0.1,
});

