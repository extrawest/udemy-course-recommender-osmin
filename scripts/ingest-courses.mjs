// Offline one-time seed: parse the Kaggle Udemy CSV, embed each course, and upsert it into
// Pinecone. Run once against your own Pinecone project:
//   npm run ingest ./data/udemy_courses.csv
// Dataset: https://www.kaggle.com/datasets/yusufdelikkaya/udemy-online-education-courses
import { createHash } from "node:crypto";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";

const CSV_PATH = process.argv[2] || "./data/udemy_courses.csv";
const INDEX = process.env.PINECONE_INDEX_NAME || "udemy-courses";
const NAMESPACE = process.env.PINECONE_NAMESPACE || "courses";
const BATCH = 50;

// CSVLoader renders each row as "column: value" lines; pull a single column back out.
function field(pageContent, key) {
  const line = pageContent.split("\n").find((l) => l.startsWith(`${key}:`));
  return line ? line.slice(key.length + 1).trim() : "";
}

async function main() {
  const docs = await new CSVLoader(CSV_PATH).load();
  console.log(`Loaded ${docs.length} rows from ${CSV_PATH}`);

  const courses = docs
    .map((d) => ({
      id: field(d.pageContent, "course_id") || createHash("sha1").update(field(d.pageContent, "url")).digest("hex"),
      title: field(d.pageContent, "course_title"),
      url: field(d.pageContent, "url"),
      level: field(d.pageContent, "level"),
      subject: field(d.pageContent, "subject"),
    }))
    .filter((c) => c.title && c.url);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: process.env.EMBEDDING_MODEL || "gemini-embedding-001",
    apiKey: process.env.GOOGLE_API_KEY,
    taskType: "RETRIEVAL_DOCUMENT",
  });
  const index = new Pinecone({ apiKey: process.env.PINECONE_API_KEY }).index(INDEX).namespace(NAMESPACE);

  for (let i = 0; i < courses.length; i += BATCH) {
    const batch = courses.slice(i, i + BATCH);
    const vectors = await embeddings.embedDocuments(
      batch.map((c) => `${c.title}. Subject: ${c.subject}. Level: ${c.level}.`)
    );
    await index.upsert(
      batch.map((c, j) => ({
        id: c.id,
        values: vectors[j],
        metadata: { title: c.title, url: c.url, level: c.level, subject: c.subject },
      }))
    );
    console.log(`Upserted ${Math.min(i + BATCH, courses.length)}/${courses.length}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
