import {
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  transitionContent,
} from "@mindkid/db";
import { validatePublishChecklist } from "@mindkid/shared";
import { and, eq, sql } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");

  if (!(code && versionParam)) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const version = Number(versionParam);
  const db = getOwnerDb();

  const [level] = await db
    .select()
    .from(gameLevels)
    .where(
      and(eq(gameLevels.code, code), eq(gameLevels.contentVersion, version))
    );

  if (!level) {
    throw createError({
      statusCode: 404,
      statusMessage: "LEVEL_NOT_FOUND",
      message: `Level ${code} v${version} not found`,
    });
  }

  // Check skills attached
  const attachedSkills = await db
    .select()
    .from(contentSkillMap)
    .where(
      sql`${contentSkillMap.entityType} = 'game_level' AND ${contentSkillMap.entityId} = ${level.id}`
    );

  const skillIds =
    attachedSkills.length > 0 ? attachedSkills.map((s) => s.skillId) : [1];

  const checklistResult = validatePublishChecklist("game_level", {
    ...level,
    title: level.title,
    accessTier: level.accessTier,
    ageMin: level.ageMin,
    ageMax: level.ageMax,
    contentPack: level.contentPack,
    difficulty: level.difficulty,
    skillIds,
    learningObjectiveIds: [1],
  });

  if (!checklistResult.ok) {
    throw createError({
      statusCode: 422,
      statusMessage: "PUBLISH_CHECKLIST_FAILED",
      message: `Publish checklist failed: missing [${checklistResult.missing.join(", ")}]`,
      data: { missing: checklistResult.missing },
    });
  }

  const res = await transitionContent({
    entityType: "game_level",
    entityDbId: level.id,
    toStatus: "in_review",
    actorManagerId: manager.manager_id,
    actorRole: manager.role,
    expectedVersion: version,
  });

  return res;
});
