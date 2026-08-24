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

    let ready = null;
    try {
      await api.ingestCv(file, sessionId, (delta) => {
        if (delta.status === "ready") {
          ready = { threadId: delta.threadId, profile: delta.profile };
        }
      });
      if (ready) setCv(ready);
      else message.error("Could not read this CV.");
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
