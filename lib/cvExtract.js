import { HumanMessage } from "@langchain/core/messages";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { getExtractorModel } from "@/lib/llm";
import { textOf } from "@/utils/messages";

export function fileKind(mimeType = "", fileName = "") {
  const name = fileName.toLowerCase();
  if (mimeType.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(name)) return "image";
  if (mimeType === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx") || mimeType.includes("word") || mimeType.includes("officedocument")) return "docx";
  return null;
}

function toBlob(base64, mimeType) {
  return new Blob([Buffer.from(base64, "base64")], { type: mimeType });
}

export async function ocrImage(base64, mimeType = "image/png") {
  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text:
          "This image is a CV/resume. Transcribe ALL readable text verbatim, preserving section " +
          "order (summary, experience, skills, education). Output plain text only — no commentary.",
      },
      { type: "image_url", image_url: `data:${mimeType};base64,${base64}` },
    ],
  });
  return textOf(await getExtractorModel().invoke([message])).trim();
}

export async function loadPdf(base64) {
  const docs = await new PDFLoader(toBlob(base64, "application/pdf"), { splitPages: false }).load();
  return docs.map((d) => d.pageContent).join("\n\n").trim();
}

export async function loadDocx(base64) {
  const docs = await new DocxLoader(
    toBlob(base64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
  ).load();
  return docs.map((d) => d.pageContent).join("\n\n").trim();
}
