import { HumanMessage } from "@langchain/core/messages";
import mammoth from "mammoth";
import { getExtractorModel } from "@/lib/llm";
import { textOf } from "@/utils/messages";

export function fileKind(mimeType = "", fileName = "") {
  const name = fileName.toLowerCase();
  if (mimeType.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(name)) return "image";
  if (mimeType === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx") || mimeType.includes("word") || mimeType.includes("officedocument")) return "docx";
  return null;
}

const TRANSCRIBE_PROMPT =
  "This is a CV/resume. Transcribe ALL readable text verbatim, preserving section order " +
  "(summary, experience, skills, education). Output plain text only — no commentary.";

async function transcribe(part) {
  const message = new HumanMessage({ content: [{ type: "text", text: TRANSCRIBE_PROMPT }, part] });
  return textOf(await getExtractorModel().invoke([message])).trim();
}

export function ocrImage(base64, mimeType = "image/png") {
  return transcribe({ type: "image_url", image_url: `data:${mimeType};base64,${base64}` });
}

export function loadPdf(base64) {
  return transcribe({ type: "media", mimeType: "application/pdf", data: base64 });
}

export async function loadDocx(base64) {
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(base64, "base64") });
  return value.trim();
}
