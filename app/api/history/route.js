import { appGraph, ready } from "@/lib/graph/graph";
import { ownsThread } from "@/lib/threads";
import { textOf } from "@/utils/messages";

export const runtime = "nodejs";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const threadId = params.get("threadId");
  const sessionId = params.get("sessionId");
  if (!threadId || !sessionId) return Response.json({ error: "Missing threadId or sessionId" }, { status: 400 });
  if (!ownsThread(sessionId, threadId)) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    await ready();
    const snapshot = await appGraph.getState({ configurable: { thread_id: threadId } });
    const values = snapshot?.values || {};
    const messages = (values.messages || [])
      .filter((m) => {
        const type = m._getType?.();
        if (type === "human") return true;
        if (type === "ai") return !m.tool_calls?.length;
        return false;
      })
      .map((m) => ({
        role: m._getType?.() === "human" ? "user" : "assistant",
        content: textOf(m),
      }));

    return Response.json({ threadId, profile: values.profile || null, messages });
  } catch (err) {
    console.error("Failed to read history:", err);
    return Response.json({ error: "Could not read chat history." }, { status: 500 });
  }
}
