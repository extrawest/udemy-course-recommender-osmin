import { Pinecone } from "@pinecone-database/pinecone";

const INDEX = process.env.PINECONE_INDEX_NAME || "udemy-courses";
// The course catalog is a single shared corpus, so one namespace serves every user.
const NAMESPACE = process.env.PINECONE_NAMESPACE || "courses";

// Created lazily so importing this module (e.g. during `next build`) doesn't require the API key.
let pinecone;
function courses() {
  if (!pinecone) pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pinecone.index(INDEX).namespace(NAMESPACE);
}

export async function searchCourses(queryVector, k = 5, filter) {
  const result = await courses().query({
    vector: queryVector,
    topK: k,
    includeMetadata: true,
    ...(filter && { filter }),
  });
  return (result.matches || []).map((m) => ({
    title: String(m.metadata?.title || ""),
    url: String(m.metadata?.url || ""),
    level: String(m.metadata?.level || ""),
    subject: String(m.metadata?.subject || ""),
  }));
}
