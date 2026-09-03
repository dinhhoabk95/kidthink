import { getOwnerDb, skills, strands } from "@mindkid/db";
import { COMPETENCIES } from "@mindkid/taxonomy";
import { defineEventHandler, getQuery, setHeader } from "h3";

export default defineEventHandler(async (event) => {
  // BR-TAX-10: Public max-age 3600 cache
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const query = getQuery(event);
  const depth = (query.depth as string) || "skill";

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
