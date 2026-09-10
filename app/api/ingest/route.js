import { createHash } from "node:crypto";
import { HumanMessage } from "@langchain/core/messages";
import { appGraph, ready } from "@/lib/graph/graph";
import { fileKind } from "@/lib/cvExtract";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request) {
  let file, sessionId;
  try {
    const form = await request.formData();
    file = form.get("file");
    sessionId = form.get("sessionId");
  } catch {
    return Response.json({ error: "Invalid multipart form" }, { status: 400 });
  }
  if (!file || typeof file.arrayBuffer !== "function") {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: "File too large. Max 5 MB." }, { status: 400 });
  }

  const kind = fileKind(file.type, file.name);
  if (!kind) {
    return Response.json({ error: "Unsupported file type. Upload a PDF, DOCX or PNG/JPG." }, { status: 400 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const cvId = createHash("sha1").update(base64).digest("hex").slice(0, 12);
  const threadId = `${sessionId}_${cvId}`;

  try {
    await ready();

    const saved = await appGraph.getState({ configurable: { thread_id: threadId } });
    if (saved?.values?.profile) return Response.json({ threadId, profile: saved.values.profile });

    const result = await appGraph.invoke(
      { mode: "ingest", messages: [new HumanMessage("Please review my uploaded CV.")] },
      { configurable: { thread_id: threadId, fileData: base64, mimeType: file.type, fileKind: kind } }
    );
    if (result?.profile) return Response.json({ threadId, profile: result.profile });
    return Response.json({ error: "Could not read any text from this CV." }, { status: 422 });
  } catch (err) {
    console.error("CV ingest failed:", err);
    return Response.json({ error: "Could not process this CV." }, { status: 500 });
  }
}
