import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getQueryEmbeddings } from "@/lib/embeddings";
import { searchCourses } from "@/lib/graph/vectordb";

const CANDIDATES = 8;

const LEVELS = ["All Levels", "Beginner Level", "Intermediate Level", "Expert Level"];
const SUBJECTS = ["Business Finance", "Graphic Design", "Musical Instruments", "Web Development"];

export const searchCoursesTool = tool(
  async ({ query, level, subject }) => {
    const filter = {};
    if (level) filter.level = { $eq: level };
    if (subject) filter.subject = { $eq: subject };

    const vector = await getQueryEmbeddings().embedQuery(query);
    const courses = await searchCourses(vector, CANDIDATES, Object.keys(filter).length ? filter : undefined);
    return JSON.stringify({ courses });
  },
  {
    name: "search_courses",
    description:
      "Semantic search over the Udemy course catalog. Pass a focused query describing the target " +
      "role, level and skills (e.g. 'beginner React frontend course' or 'mobile development for web developers'). " +
      "Optionally pass level and/or subject to narrow results by metadata. " +
      "Returns candidate courses with title, url, level and subject.",
    schema: z.object({
      query: z.string().describe("A focused course search query built from the user's profile and request"),
      level: z.enum(LEVELS).optional().describe("Filter to a single course level"),
      subject: z.enum(SUBJECTS).optional().describe("Filter to a single catalog subject"),
    }),
  }
);
