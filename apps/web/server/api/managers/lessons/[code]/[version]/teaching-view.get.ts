import { getOwnerDb, lessonActivities, lessons } from "@mindkid/db";
import { and, desc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { loadLatestActivitiesByEntityId } from "#server/utils/lesson-activities";

const SPLIT_MATERIALS_REGEX = /[\n,;•\-*]/;

function extractMaterialList(rawText?: string | null): string[] {
  if (!rawText || typeof rawText !== "string") {
    return [];
  }
  return rawText
    .split(SPLIT_MATERIALS_REGEX)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

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

  // Fetch attached activities
  const attached = await db
    .select({
      position: lessonActivities.position,
      activityId: lessonActivities.activityId,
      isRequired: lessonActivities.isRequired,
    })
    .from(lessonActivities)
    .where(eq(lessonActivities.lessonId, lesson.id))
    .orderBy(lessonActivities.position);

  let totalActivityMinutes = 0;
  const materialsSet = new Set<string>();

  // Add lesson materials
  for (const m of extractMaterialList(lesson.materials)) {
    materialsSet.add(m);
  }

  // Một query cho cả tập, thay vì một query mỗi activity (pool là max: 1).
  const latestActivities = await loadLatestActivitiesByEntityId(
    attached.map((item) => item.activityId)
  );

  const activitiesView = attached.map((item) => {
    const act = latestActivities.get(item.activityId) ?? null;

    if (act) {
      totalActivityMinutes += act.estimatedMinutes || 0;
      for (const m of extractMaterialList(act.materials)) {
        materialsSet.add(m);
      }
    }

    return {
      position: item.position,
      activity_id: item.activityId,
      is_required: item.isRequired,
      is_offscreen: act ? act.kind !== "digital_game" : true,
      activity: act,
    };
  });

  const durationDiff = Math.abs(totalActivityMinutes - lesson.estimatedMinutes);
  let durationWarning: string | null = null;
  if (totalActivityMinutes > 45) {
    durationWarning = `Tổng thời lượng hoạt động (${totalActivityMinutes} phút) vượt quá trần 45 phút`;
  } else if (durationDiff > 5) {
    durationWarning = `Tổng thời lượng các hoạt động (${totalActivityMinutes} phút) lệch quá 5 phút so với thời lượng bài học (${lesson.estimatedMinutes} phút)`;
  }

  return {
    lesson: {
      id: lesson.id,
      code: lesson.code,
      content_version: lesson.contentVersion,
      title: lesson.title,
      guide: lesson.guide,
      target_age_min: lesson.targetAgeMin,
      target_age_max: lesson.targetAgeMax,
      estimated_minutes: lesson.estimatedMinutes,
      warm_up: lesson.warmUp,
      reflection: lesson.reflection,
      assessment: lesson.assessment,
      extension: lesson.extension,
      access_tier: lesson.accessTier,
      status: lesson.status,
    },
    activities: activitiesView,
    materials_union: Array.from(materialsSet),
    total_activity_minutes: totalActivityMinutes,
    duration_warning: durationWarning,
    has_offscreen_activity: activitiesView.some((a) => a.is_offscreen),
  };
});
