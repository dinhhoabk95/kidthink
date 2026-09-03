import { getOwnerDb, learningObjectives, skills } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, setHeader } from "h3";

const SKILL_CODE_REGEX = /^C[1-6]\.[A-Z]{2,5}\.\d{2}$/;

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const code = getRouterParam(event, "code");

  if (!code?.match(SKILL_CODE_REGEX)) {
    throw createError({
      statusCode: 400,
      statusMessage: "INVALID_CODE_FORMAT",
      data: { code: "INVALID_CODE_FORMAT" },
    });
  }

  const db = getOwnerDb();

  const skillRows = await db.select().from(skills).where(eq(skills.code, code));
  const targetSkill = skillRows[0];
  if (!targetSkill) {
    throw createError({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
      data: { code: "NOT_FOUND" },
    });
  }

  const loRows = await db
    .select()
    .from(learningObjectives)
    .where(eq(learningObjectives.skillId, targetSkill.id));

  return {
    skill: targetSkill,
    learningObjectives: loRows,
    publishedAssetCount: 0,
  };
});
