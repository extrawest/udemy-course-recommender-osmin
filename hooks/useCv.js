import { useState } from "react";
import { App } from "antd";
import * as api from "@/lib/api";

export function useCv() {
  const { message } = App.useApp();
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(false);

  async function upload(file, sessionId) {
    if (!file || loading) return;
    setLoading(true);

    try {
      const { threadId, profile } = await api.ingestCv(file, sessionId);
      setCv({ threadId, profile });
    } catch (err) {
      console.error("Failed to process CV:", err);
      message.error(err.message || "Could not process this CV.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setCv(null);
  }

  return { cv, loading, upload, reset };
}
