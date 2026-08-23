import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { GraphState } from "@/lib/graph/state";
import { ocrNode, loadDocNode, summarizeNode, recommendNode } from "@/lib/graph/nodes";
import { entryRouter, afterExtract, recommendShouldContinue } from "@/lib/graph/routing";
import { searchCoursesTool } from "@/lib/tools";
import { RETRY_OPTIONS } from "@/lib/graph/retry";

const checkpointer = new MemorySaver();

const graph = new StateGraph(GraphState)
  .addNode("ocr", ocrNode, { retryPolicy: RETRY_OPTIONS })
  .addNode("loadDoc", loadDocNode, { retryPolicy: RETRY_OPTIONS })
  .addNode("summarize", summarizeNode, { retryPolicy: RETRY_OPTIONS })
  .addNode("recommend", recommendNode, { retryPolicy: RETRY_OPTIONS })
  .addNode("tools", new ToolNode([searchCoursesTool]), { retryPolicy: RETRY_OPTIONS })
  .addConditionalEdges(START, entryRouter, ["ocr", "loadDoc", "recommend"])
  .addConditionalEdges("ocr", afterExtract, ["summarize", END])
  .addConditionalEdges("loadDoc", afterExtract, ["summarize", END])
  .addEdge("summarize", END)
  .addConditionalEdges("recommend", recommendShouldContinue, ["tools", END])
  .addEdge("tools", "recommend");

export const appGraph = graph.compile({ checkpointer });
