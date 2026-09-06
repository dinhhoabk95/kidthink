import { getOwnerDb, learningObjectives, skills } from "@mindkid/db";
import {
  InvalidCodeFormatError,
  SkillNotFoundError,
} from "@mindkid/errors/content";
import { eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, setHeader } from "h3";

const SKILL_CODE_REGEX = /^C[1-6]\.[A-Z]{2,5}\.\d{2}$/;

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const code = getRouterParam(event, "code");

  if (!code?.match(SKILL_CODE_REGEX)) {
    throw new InvalidCodeFormatError();
  }

  const db = getOwnerDb();

  const skillRows = await db.select().from(skills).where(eq(skills.code, code));
  const targetSkill = skillRows[0];
  if (!targetSkill) {
    throw new SkillNotFoundError(code);
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
