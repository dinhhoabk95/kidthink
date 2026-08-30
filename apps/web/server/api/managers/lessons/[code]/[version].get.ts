import {
  contentSkillMap,
  getOwnerDb,
  lessonActivities,
  lessons,
  skills,
} from "@mindkid/db";
import { and, desc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { loadLatestActivitiesByEntityId } from "#server/utils/lesson-activities";

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
          .from(lessons)
          .where(
            and(eq(lessons.code, code), eq(lessons.contentVersion, version))
          )
          .limit(1)
      : await db
          .select()
          .from(lessons)
          .where(eq(lessons.code, code))
          .orderBy(desc(lessons.contentVersion))
          .limit(1);

  const lesson = rows[0];
  if (!lesson) {
    throw createError({
      statusCode: 404,
      statusMessage: "LESSON_NOT_FOUND",
      message: `Lesson ${code} (version ${versionParam || "latest"}) not found`,
    });
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

  return {
    ...lesson,
    activities: resolvedActivities,
    skills: attachedSkills,
  };
});
