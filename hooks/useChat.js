import { useState, useEffect } from "react";
import { App } from "antd";
import * as api from "@/lib/api";

export function useChat(threadId) {
  const { message } = App.useApp();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!threadId) return;
    let active = true;

    async function loadHistory() {
      try {
        const data = await api.fetchHistory(threadId);
        if (active && data?.messages?.length) {
          setMessages(data.messages.map((m) => ({ ...m, id: crypto.randomUUID() })));
        }
      } catch (err) {
        if (!active) return;
        console.error("Failed to load chat history:", err);
        message.error("Could not load chat history.");
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, [threadId, message]);

  async function send(text) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
      { id: crypto.randomUUID(), role: "assistant", content: "" },
    ]);
    setLoading(true);

    try {
      await api.recommend(threadId, text, (delta) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = { ...next[next.length - 1] };
          if (delta.token) last.content += delta.token;
          next[next.length - 1] = last;
          return next;
        });
      });
    } catch (err) {
      console.error("Recommendation request failed:", err);
      message.error(`Request failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return { messages, send, loading };
}
