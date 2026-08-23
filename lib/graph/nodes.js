import { SystemMessage, AIMessage } from "@langchain/core/messages";
import { getModel } from "@/lib/llm";
import { ocrImage, loadPdf, loadDocx } from "@/lib/cvExtract";
import { summarizeCv } from "@/lib/cvSummary";
import { searchCoursesTool } from "@/lib/tools";

export async function ocrNode(state) {
  const cvText = await ocrImage(state.fileData, state.mimeType);
  return { cvText, fileData: "" };
}

export async function loadDocNode(state) {
  const cvText = state.fileKind === "pdf" ? await loadPdf(state.fileData) : await loadDocx(state.fileData);
  return { cvText, fileData: "" };
}

export async function summarizeNode(state) {
  const profile = await summarizeCv(state.cvText);
  const reply = new AIMessage(
    `Thanks! I read your CV — you look like ${profile.summary}.\n\n` +
      "Tell me how you'd like to grow and I'll suggest some courses."
  );
  return { profile, messages: [reply] };
}

export async function recommendNode(state) {
  const summary = state.profile?.summary || "an unknown developer profile";
  const system = new SystemMessage(
    "You are a Udemy course recommendation assistant.\n" +
      `The user's developer profile: ${summary}.\n` +
      "Interpret their request as either levelling up in their current role or pivoting to a new role at their " +
      "current level, then build a focused query and call the search_courses tool.\n" +
      "Reply with the TOP 3 courses as a numbered list, each line formatted as `Title - url`, followed by one short " +
      "sentence on how the set helps. Recommend ONLY courses returned by the tool; never invent titles or URLs."
  );

  const reply = await getModel().bindTools([searchCoursesTool]).invoke([system, ...state.messages]);
  return { messages: [reply] };
}
