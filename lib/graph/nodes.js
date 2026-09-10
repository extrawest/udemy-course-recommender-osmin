import { SystemMessage } from "@langchain/core/messages";
import { getModel } from "@/lib/llm";
import { makeIntakeTools } from "@/lib/graph/intakeTools";
import { searchCoursesTool } from "@/lib/tools";

export async function intakeNode(state) {
  const system = new SystemMessage(
    "You process a candidate's uploaded CV/resume.\n" +
      "First call extract_cv_text to read the file, then call build_profile to classify it. " +
      "Call one tool at a time and wait for its result before the next.\n" +
      "After build_profile returns, reply to the candidate with exactly these three lines:\n" +
      "Level: <level>\n" +
      "Developer Role: <role>\n" +
      "Skillset: <comma-separated skills>\n" +
      "Then invite them to say how they'd like to grow — level up their current role, or pivot to a new one."
  );
  const reply = await getModel().bindTools(makeIntakeTools(state)).invoke([system, ...state.messages]);
  return { messages: [reply] };
}

export async function recommendNode(state) {
  const summary = state.profile?.summary || "an unknown developer profile";
  const system = new SystemMessage(
    "You are a Udemy course recommendation assistant.\n" +
      `The user's developer profile: ${summary}.\n` +
      "Interpret their request as either levelling up in their current role or pivoting to a new role at their " +
      "current level, then call the search_courses tool with a focused query. Pass the optional level and/or " +
      "subject arguments to narrow results by catalog metadata whenever the request implies them.\n" +
      "Reply with the TOP 3 courses as a numbered list, each line formatted as `Title - url`, followed by one short " +
      "sentence on how the set helps. Recommend ONLY courses returned by the tool; never invent titles or URLs."
  );

  const reply = await getModel().bindTools([searchCoursesTool]).invoke([system, ...state.messages]);
  return { messages: [reply] };
}
