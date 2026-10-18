import {
  contentSkillMap,
  getOwnerDb,
  lessonActivities,
  lessons,
  skills,
} from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { LessonNotFoundError } from "@mindkid/errors/content";
import { and, desc, eq, or } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { loadLatestActivitiesByEntityId } from "#server/utils/lesson-activities";
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
        eq(lessons.code, code),
        eq(lessons.id, Number(code)),
        eq(lessons.entityId, Number(code))
      )
    : eq(lessons.code, code);

  const rows =
    Number.isInteger(version) && version > 0
      ? await db
          .select()
          .from(lessons)
          .where(and(codeFilter, eq(lessons.contentVersion, version)))
          .limit(1)
      : await db
          .select()
          .from(lessons)
          .where(codeFilter)
          .orderBy(desc(lessons.contentVersion))
          .limit(1);

  const lesson = rows[0];
  if (!lesson) {
    throw new LessonNotFoundError();
  }

  // Fetch attached activities with current metadata
  const attachedActivities = await db
    .select({
      position: lessonActivities.position,
      activityId: lessonActivities.activityId,
      isRequired: lessonActivities.isRequired,
    })
    .from(lessonActivities)
    .where(eq(lessonActivities.lessonId, lesson.id))
    .orderBy(lessonActivities.position);

  // Một query cho cả tập, thay vì một query mỗi activity (pool là max: 1).
  const latestActivities = await loadLatestActivitiesByEntityId(
    attachedActivities.map((item) => item.activityId)
  );

  const resolvedActivities = attachedActivities.map((item) => ({
    position: item.position,
    activity_id: item.activityId,
    is_required: item.isRequired,
    activity: latestActivities.get(item.activityId) ?? null,
  }));

  // Fetch skills
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
        eq(contentSkillMap.entityType, "lesson"),
        eq(contentSkillMap.entityId, lesson.entityId)
      )
    );

  const previewToken = issuePreviewToken({
    entityType: "lesson",
    id: lesson.id,
    version: lesson.contentVersion,
    managerId: manager.manager_id,
  });

  return {
    ...lesson,
    activities: resolvedActivities,
    skills: attachedSkills,
    preview_token: previewToken,
  };
});
