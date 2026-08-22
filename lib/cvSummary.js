import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { getExtractorModel } from "@/lib/llm";

const MAX_CV_CHARS = 20000;

const ProfileSchema = z.object({
  level: z
    .string()
    .describe("Seniority level: one of Junior, Middle, Senior, Lead, or Architect. Infer it from years of experience and scope of responsibility."),
  role: z
    .string()
    .describe("Primary developer role, e.g. Frontend, Backend, Full Stack, Mobile, DevOps, Data, QA, Designer, PM."),
  skills: z
    .array(z.string())
    .describe("Concrete technologies and tools found in the CV (e.g. HTML, CSS, React, Node.js, Python). Between 4 and 12 items, most relevant first."),
});

const SYSTEM = new SystemMessage(
  "You are a technical recruiter. Read the CV/resume text and classify the candidate. " +
    "Use ONLY evidence in the text — never invent skills. If seniority is unclear, estimate from experience."
);

export async function summarizeCv(cvText) {
  const model = getExtractorModel().withStructuredOutput(ProfileSchema, { name: "developer_profile" });
  const human = new HumanMessage(`CV / Resume:\n\n${cvText.slice(0, MAX_CV_CHARS)}`);
  const profile = await model.invoke([SYSTEM, human]);
  return { ...profile, summary: formatSummary(profile) };
}

function formatSummary({ level, role, skills }) {
  return `${level} Level, ${role} developer, skillset: ${skills.join(", ")}`;
}
