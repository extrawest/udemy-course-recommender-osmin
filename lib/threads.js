export function ownsThread(sessionId, threadId) {
  return typeof threadId === "string" && threadId.startsWith(`${sessionId}_`);
}
