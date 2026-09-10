async function streamNdjson(url, body, onDelta) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      const delta = JSON.parse(line);
      if (delta.error) throw new Error(delta.error);
      onDelta(delta);
    }
  }
}

export async function ingestCv(file, sessionId) {
  const form = new FormData();
  form.append("file", file);
  form.append("sessionId", sessionId);
  const res = await fetch("/api/ingest", { method: "POST", body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export function recommend(threadId, sessionId, message, onDelta) {
  return streamNdjson("/api/recommend", { threadId, sessionId, message }, onDelta);
}

export async function fetchHistory(threadId, sessionId) {
  const query = new URLSearchParams({ threadId, sessionId });
  const res = await fetch(`/api/history?${query}`);
  if (!res.ok) throw new Error("Could not read chat history.");
  return res.json();
}
