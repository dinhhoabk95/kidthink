import {
  activities,
  contentSkillMap,
  getOwnerDb,
  lessonActivities,
  lessons,
  skills,
} from "@kidthink/db";
import { and, desc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "../../../../../utils/admin-auth-runtime.js";

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

  if (!rows || rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "LESSON_NOT_FOUND",
      message: `Lesson ${code} (version ${versionParam || "latest"}) not found`,
    });
  }

  const lesson = rows[0];

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

  // For each attached activity, resolve details via entity_id (latest version)
  const resolvedActivities = await Promise.all(
    attachedActivities.map(async (item) => {
      const [act] = await db
        .select({
          id: activities.id,
          entityId: activities.entityId,
          code: activities.code,
          contentVersion: activities.contentVersion,
          kind: activities.kind,
          titleVi: activities.titleVi,
          instructionVi: activities.instructionVi,
          materialsVi: activities.materialsVi,
          estimatedMinutes: activities.estimatedMinutes,
          accessTier: activities.accessTier,
          status: activities.status,
        })
        .from(activities)
        .where(eq(activities.entityId, item.activityId))
        .orderBy(desc(activities.contentVersion))
        .limit(1);

      return {
        position: item.position,
        activity_id: item.activityId,
        is_required: item.isRequired,
        activity: act || null,
      };
    })
  );

  // Fetch skills
  const attachedSkills = await db
    .select({
      skillId: contentSkillMap.skillId,
      skillCode: skills.code,
      skillNameVi: skills.nameVi,
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
