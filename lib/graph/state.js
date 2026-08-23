import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  ...MessagesAnnotation.spec,
  mode: Annotation, // "ingest" | "recommend"
  fileKind: Annotation, // "image" | "pdf" | "docx"
  mimeType: Annotation,
  fileData: Annotation, // base64 input; cleared right after extraction so it isn't re-serialized
  cvText: Annotation,
  profile: Annotation, // { level, role, skills, summary }
});
