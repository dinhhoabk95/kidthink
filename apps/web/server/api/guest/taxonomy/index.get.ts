import { getOwnerDb, skills, strands } from "@mindkid/db";
import { COMPETENCIES } from "@mindkid/taxonomy";
import { defineEventHandler, getQuery, setHeader } from "h3";
import { z } from "zod";

const GuestTaxonomyQuerySchema = z.object({
  depth: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // BR-TAX-10: Public max-age 3600 cache
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const parsedQuery = GuestTaxonomyQuerySchema.safeParse(getQuery(event));
  const depth = (parsedQuery.success && parsedQuery.data.depth) || "skill";

  if (depth === "competency") {
    return { competencies: COMPETENCIES };
  }

  const db = getOwnerDb();
  const dbStrands = await db.select().from(strands);

  if (depth === "strand") {
    return {
      competencies: COMPETENCIES,
      strands: dbStrands,
    };
  }

  const dbSkills = await db.select().from(skills);

  return {
    competencies: COMPETENCIES,
    strands: dbStrands,
    skills: dbSkills,
  };
});
