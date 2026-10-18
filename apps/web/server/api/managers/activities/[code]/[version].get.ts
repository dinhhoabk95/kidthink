import { activities, contentSkillMap, getOwnerDb, skills } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { ActivityNotFoundError } from "@mindkid/errors/content";
import { and, desc, eq, or } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { issuePreviewToken } from "#server/utils/preview-token";

const NUMERIC_REGEX = /^\d+$/;

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");

  if (!code) {
    throw new NotFoundError("NOT_FOUND");
  }

  const db = getOwnerDb();
  const version = Number(versionParam);
  const isNumeric = NUMERIC_REGEX.test(code);
  const codeFilter = isNumeric
    ? or(
        eq(activities.code, code),
        eq(activities.id, Number(code)),
        eq(activities.entityId, Number(code))
      )
    : eq(activities.code, code);

  const rows =
    Number.isInteger(version) && version > 0
      ? await db
          .select()
          .from(activities)
          .where(and(codeFilter, eq(activities.contentVersion, version)))
          .limit(1)
      : await db
          .select()
          .from(activities)
          .where(codeFilter)
          .orderBy(desc(activities.contentVersion))
          .limit(1);

  const activity = rows[0];
  if (!activity) {
    throw new ActivityNotFoundError();
  }

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

  const previewToken = issuePreviewToken({
    entityType: "activity",
    id: activity.id,
    version: activity.contentVersion,
    managerId: manager.manager_id,
  });

  return {
    ...activity,
    skills: attachedSkills,
    preview_token: previewToken,
  };
});
