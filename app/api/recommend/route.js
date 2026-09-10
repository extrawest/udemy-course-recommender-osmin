import { HumanMessage } from "@langchain/core/messages";
import { appGraph, ready } from "@/lib/graph/graph";
import { ownsThread } from "@/lib/threads";
import { textOf } from "@/utils/messages";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  let threadId, message, sessionId;
  try {
    ({ threadId, message, sessionId } = await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!threadId || !message || !sessionId) {
    return Response.json({ error: "Missing threadId, message or sessionId" }, { status: 400 });
  }
  if (!ownsThread(sessionId, threadId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await ready();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const events = await appGraph.stream(
          { mode: "recommend", messages: [new HumanMessage(message)] },
          { configurable: { thread_id: threadId }, streamMode: "messages" }
        );
        for await (const [msg] of events) {
          if (msg?._getType?.() === "tool") continue;
          const token = textOf(msg);
          if (token) send({ token });
        }
      } catch (err) {
        console.error("Recommendation stream failed:", err);
        send({ error: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
}
