import { END } from "@langchain/langgraph";

export function entryRouter(state) {
  if (state.mode === "recommend") return "recommend";
  return state.fileKind === "image" ? "ocr" : "loadDoc";
}

export function afterExtract(state) {
  return state.cvText?.trim() ? "summarize" : END;
}

export function recommendShouldContinue(state) {
  const last = state.messages[state.messages.length - 1];
  return last?.tool_calls?.length ? "tools" : END;
}
