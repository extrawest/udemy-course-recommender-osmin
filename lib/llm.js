import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

let chat;
export function getModel() {
  if (!chat) {
    chat = new ChatGoogleGenerativeAI({
      model: CHAT_MODEL,
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,
      streaming: true,
    });
  }
  return chat;
}

let extractor;
export function getExtractorModel() {
  if (!extractor) {
    extractor = new ChatGoogleGenerativeAI({
      model: CHAT_MODEL,
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0,
    });
  }
  return extractor;
}
