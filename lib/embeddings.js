import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-001";

let query;
export function getQueryEmbeddings() {
  if (!query) {
    query = new GoogleGenerativeAIEmbeddings({
      model: MODEL,
      apiKey: process.env.GOOGLE_API_KEY,
      taskType: "RETRIEVAL_QUERY",
    });
  }
  return query;
}
