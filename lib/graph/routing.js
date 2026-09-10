import { END } from "@langchain/langgraph";

export function entryRouter(state) {
  return state.mode === "recommend" ? "recommend" : "intake";
}

function continueToTools(target) {
  return (state) => {
    const last = state.messages[state.messages.length - 1];
    return last?.tool_calls?.length ? target : END;
  };
}

export const intakeShouldContinue = continueToTools("intakeTools");
export const recommendShouldContinue = continueToTools("tools");
