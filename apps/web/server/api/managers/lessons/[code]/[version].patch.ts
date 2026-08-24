import {
  contentSkillMap,
  getOwnerDb,
  lessonActivities,
  lessons,
  writeAudit,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  guide: z.string().min(1).optional(),
  target_age_min: z.number().int().min(3).max(6).optional(),
  target_age_max: z.number().int().min(3).max(6).optional(),
  estimated_minutes: z.number().int().min(5).max(45).optional(),
  materials: z.string().nullable().optional(),
  warm_up: z.string().nullable().optional(),
  reflection: z.string().nullable().optional(),
  assessment: z.string().nullable().optional(),
  extension: z.string().nullable().optional(),
  access_tier: z.enum(["free", "login", "standard", "premium"]).optional(),
  expected_version: z.number().int().positive().optional(),
  skill_ids: z.array(z.number().int()).max(3).optional(),
});

type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

async function syncLessonSkills(
  db: ReturnType<typeof getOwnerDb>,
  entityId: number,
  skillIds?: number[]
) {
  if (!skillIds || skillIds.length === 0) {
    return;
  }
  await db
    .delete(contentSkillMap)
    .where(
      and(
        eq(contentSkillMap.entityType, "lesson"),
        eq(contentSkillMap.entityId, entityId)
      )
    );
  const weightPerSkill = (1.0 / skillIds.length).toFixed(2);
  await db
    .insert(contentSkillMap)
    .values(
      skillIds.map((skillId) => ({
        entityType: "lesson" as const,
        entityId,
        skillId,
        weight: weightPerSkill,
      }))
    )
    .onConflictDoNothing();
}

async function handlePublishedLessonFork(
  db: ReturnType<typeof getOwnerDb>,
  existing: typeof lessons.$inferSelect,
  data: UpdateLessonInput,
  managerId: number
) {
  const newVersion = existing.contentVersion + 1;
  const [created] = await db
    .insert(lessons)
    .values({
      entityId: existing.entityId,
      code: existing.code,
      contentVersion: newVersion,
      title: data.title ?? existing.title,
      guide: data.guide ?? existing.guide,
      targetAgeMin: data.target_age_min ?? existing.targetAgeMin,
      targetAgeMax: data.target_age_max ?? existing.targetAgeMax,
      estimatedMinutes: data.estimated_minutes ?? existing.estimatedMinutes,
      materials:
        data.materials === undefined ? existing.materials : data.materials,
      warmUp: data.warm_up === undefined ? existing.warmUp : data.warm_up,
      reflection:
        data.reflection === undefined ? existing.reflection : data.reflection,
      assessment:
        data.assessment === undefined ? existing.assessment : data.assessment,
      extension:
        data.extension === undefined ? existing.extension : data.extension,
      accessTier: data.access_tier ?? existing.accessTier,
      status: "draft",
      origin: existing.origin,
      authoredIn: "studio",
      createdByManagerId: managerId,
    })
    .returning();

  const existingActivities = await db
    .select()
    .from(lessonActivities)
    .where(eq(lessonActivities.lessonId, existing.id));

  if (existingActivities.length > 0) {
    await db.insert(lessonActivities).values(
      existingActivities.map((act) => ({
        lessonId: created.id,
        position: act.position,
        activityId: act.activityId,
        isRequired: act.isRequired,
      }))
    );
  }

  await syncLessonSkills(db, existing.entityId, data.skill_ids);

  await writeAudit(db, {
    actorType: "manager",
    actorId: managerId,
    action: "create",
    entityType: "lesson",
    entityId: String(created.id),
    beforeState: existing,
    afterState: created,
    reason: `Manager created new draft version ${newVersion} from published lesson`,
  });

  return created;
}

async function handleDraftLessonUpdate(
  db: ReturnType<typeof getOwnerDb>,
  existing: typeof lessons.$inferSelect,
  data: UpdateLessonInput,
  managerId: number
) {
  const patch: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) {
    patch.title = data.title;
  }
  if (data.guide !== undefined) {
    patch.guide = data.guide;
  }
  if (data.target_age_min !== undefined) {
    patch.targetAgeMin = data.target_age_min;
  }
  if (data.target_age_max !== undefined) {
    patch.targetAgeMax = data.target_age_max;
  }
  if (data.estimated_minutes !== undefined) {
    patch.estimatedMinutes = data.estimated_minutes;
  }
  if (data.materials !== undefined) {
    patch.materials = data.materials;
  }
  if (data.warm_up !== undefined) {
    patch.warmUp = data.warm_up;
  }
  if (data.reflection !== undefined) {
    patch.reflection = data.reflection;
  }
  if (data.assessment !== undefined) {
    patch.assessment = data.assessment;
  }
  if (data.extension !== undefined) {
    patch.extension = data.extension;
  }
  if (data.access_tier !== undefined) {
    patch.accessTier = data.access_tier;
  }

  const [updated] = await db
    .update(lessons)
    .set(patch)
    .where(eq(lessons.id, existing.id))
    .returning();

  await syncLessonSkills(db, existing.entityId, data.skill_ids);

  await writeAudit(db, {
    actorType: "manager",
    actorId: managerId,
    action: "update",
    entityType: "lesson",
    entityId: String(updated.id),
    beforeState: existing,
    afterState: updated,
    reason: "Manager updated lesson via Studio",
  });

  return updated;
}

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");

  if (!(code && versionParam)) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const version = Number(versionParam);
  if (!Number.isInteger(version) || version <= 0) {
    throw createError({ statusCode: 400, statusMessage: "INVALID_VERSION" });
  }

  const rawBody = await readBody(event);
  const parsed = updateLessonSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const data = parsed.data;
  const db = getOwnerDb();

  const [existing] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.code, code), eq(lessons.contentVersion, version)))
    .limit(1);

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "LESSON_NOT_FOUND",
      message: `Lesson ${code} version ${version} not found`,
    });
  }

  if (
    data.expected_version !== undefined &&
    data.expected_version !== existing.contentVersion
  ) {
    throw createError({
      statusCode: 409,
      statusMessage: "VERSION_CONFLICT",
      message: `Expected version ${data.expected_version} but found ${existing.contentVersion}`,
    });
  }

  if (existing.status === "published") {
    return await handlePublishedLessonFork(
      db,
      existing,
      data,
      session.manager_id
    );
  }

  return await handleDraftLessonUpdate(db, existing, data, session.manager_id);
});
