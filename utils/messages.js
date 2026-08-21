export function textOf(m) {
  if (!m) return "";
  if (typeof m.content === "string") return m.content;
  if (Array.isArray(m.content)) {
    return m.content.map((c) => (typeof c === "string" ? c : c?.text || "")).join(" ");
  }
  return String(m.content ?? "");
}
