import { tool } from "@langchain/core/tools";
import { ToolMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { z } from "zod";
import { ocrImage, loadPdf, loadDocx } from "@/lib/cvExtract";
import { summarizeCv } from "@/lib/cvSummary";

export function makeIntakeTools(state) {
  const extractCvText = tool(
    async (_input, config) => {
      const { fileData, mimeType, fileKind } = config.configurable || {};
      let cvText = "";
      if (fileData) {
        if (fileKind === "image") cvText = await ocrImage(fileData, mimeType);
        else if (fileKind === "pdf") cvText = await loadPdf(fileData);
        else cvText = await loadDocx(fileData);
      }
      return new Command({
        update: {
          cvText,
          messages: [
            new ToolMessage({
              content: cvText ? `Extracted ${cvText.length} characters of CV text.` : "No readable text found.",
              tool_call_id: config.toolCall.id,
            }),
          ],
        },
      });
    },
    {
      name: "extract_cv_text",
      description: "Read the uploaded CV/resume file and return its text. Call this first.",
      schema: z.object({}),
    }
  );

  const buildProfile = tool(
    async (_input, config) => {
      const profile = await summarizeCv(state.cvText || "");
      return new Command({
        update: {
          profile,
          cvText: "",
          messages: [
            new ToolMessage({
              content: JSON.stringify(profile),
              tool_call_id: config.toolCall.id,
            }),
          ],
        },
      });
    },
    {
      name: "build_profile",
      description:
        "Classify the extracted CV text into a developer profile (level, role, skills). Call this after extract_cv_text.",
      schema: z.object({}),
    }
  );

  return [extractCvText, buildProfile];
}
