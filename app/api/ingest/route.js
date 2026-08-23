import { createHash } from "node:crypto";
import { appGraph } from "@/lib/graph/graph";
import { fileKind } from "@/lib/cvExtract";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const kind = fileKind(file.type, file.name);
  if (!kind) {
    return Response.json({ error: "Unsupported file type. Upload a PDF, DOCX or PNG/JPG." }, { status: 400 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const cvId = createHash("sha1").update(base64).digest("hex").slice(0, 12);
  const threadId = `${sessionId}_${cvId}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        send({ status: "processing", threadId });
        let ready = false;
        const updates = await appGraph.stream(
          { mode: "ingest", fileKind: kind, mimeType: file.type, fileData: base64 },
          { configurable: { thread_id: threadId }, streamMode: "updates" }
        );
        for await (const update of updates) {
          const profile = update.summarize?.profile;
          if (profile) {
            ready = true;
            send({ status: "ready", threadId, profile });
          }
        }
        if (!ready) send({ error: "Could not read any text from this CV." });
      } catch (err) {
        console.error("CV ingest failed:", err);
        send({ error: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
}
