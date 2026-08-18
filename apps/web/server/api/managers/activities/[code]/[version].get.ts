import { activities, contentSkillMap, getOwnerDb, skills } from "@mindkid/db";
import { and, desc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");

  if (!code) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const db = getOwnerDb();
  const version = Number(versionParam);

  const rows =
    Number.isInteger(version) && version > 0
      ? await db
          .select()
          .from(activities)
          .where(
            and(
              eq(activities.code, code),
              eq(activities.contentVersion, version)
            )
          )
          .limit(1)
      : await db
          .select()
          .from(activities)
          .where(eq(activities.code, code))
          .orderBy(desc(activities.contentVersion))
          .limit(1);

  if (!rows || rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "ACTIVITY_NOT_FOUND",
      message: `Activity ${code} (version ${versionParam || "latest"}) not found`,
    });
  }

  const activity = rows[0];

  // Fetch attached skills
  const attachedSkills = await db
    .select({
      skillId: contentSkillMap.skillId,
      skillCode: skills.code,
      skillName: skills.name,
      ageMin: skills.ageMin,
      ageMax: skills.ageMax,
      weight: contentSkillMap.weight,
    })
    .from(contentSkillMap)
    .leftJoin(skills, eq(contentSkillMap.skillId, skills.id))
    .where(
      and(
        eq(contentSkillMap.entityType, "activity"),
        eq(contentSkillMap.entityId, activity.entityId)
      )
    );

  return {
    ...activity,
    skills: attachedSkills,
  };
});
