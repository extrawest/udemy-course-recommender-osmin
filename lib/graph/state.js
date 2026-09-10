import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  ...MessagesAnnotation.spec,
  mode: Annotation, // "ingest" | "recommend"
  cvText: Annotation,
  profile: Annotation, // { level, role, skills, summary }
});
