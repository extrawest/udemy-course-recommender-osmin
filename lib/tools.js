import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getQueryEmbeddings } from "@/lib/embeddings";
import { searchCourses } from "@/lib/graph/vectordb";

const CANDIDATES = 8;

export const searchCoursesTool = tool(
  async ({ query }) => {
    const vector = await getQueryEmbeddings().embedQuery(query);
    const courses = await searchCourses(vector, CANDIDATES);
    return JSON.stringify({ courses });
  },
  {
    name: "search_courses",
    description:
      "Semantic search over the Udemy course catalog. Pass a focused query describing the target " +
      "role, level and skills (e.g. 'beginner React frontend course' or 'mobile development for web developers'). " +
      "Returns candidate courses with title, url, level and subject.",
    schema: z.object({
      query: z.string().describe("A focused course search query built from the user's profile and request"),
    }),
  }
);
