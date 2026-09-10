import { StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { GraphState } from "@/lib/graph/state";
import { intakeNode, recommendNode } from "@/lib/graph/nodes";
import { entryRouter, intakeShouldContinue, recommendShouldContinue } from "@/lib/graph/routing";
import { makeIntakeTools } from "@/lib/graph/intakeTools";
import { searchCoursesTool } from "@/lib/tools";
import { RETRY_OPTIONS } from "@/lib/graph/retry";

const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL);

let setupPromise;
export function ready() {
  if (!setupPromise) setupPromise = checkpointer.setup();
  return setupPromise;
}

async function intakeTools(state, config) {
  return new ToolNode(makeIntakeTools(state)).invoke(state, config);
}

const graph = new StateGraph(GraphState)
  .addNode("intake", intakeNode, { retryPolicy: RETRY_OPTIONS })
  .addNode("intakeTools", intakeTools, { retryPolicy: RETRY_OPTIONS })
  .addNode("recommend", recommendNode, { retryPolicy: RETRY_OPTIONS })
  .addNode("tools", new ToolNode([searchCoursesTool]), { retryPolicy: RETRY_OPTIONS })
  .addConditionalEdges(START, entryRouter, ["intake", "recommend"])
  .addConditionalEdges("intake", intakeShouldContinue, ["intakeTools", END])
  .addEdge("intakeTools", "intake")
  .addConditionalEdges("recommend", recommendShouldContinue, ["tools", END])
  .addEdge("tools", "recommend");

export const appGraph = graph.compile({ checkpointer });
