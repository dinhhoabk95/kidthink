import {
  contentSkillMap,
  getOwnerDb,
  lessonActivities,
  lessons,
  writeAudit,
} from "@kidthink/db";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

const createLessonSchema = z.object({
  code: z
    .string()
    .regex(
      /^LES-(?:\d{4}|C[1-6]-[A-Z]{2,5}-\d{4})$/,
      "Mã sai định dạng LES-xxxx"
    )
    .optional(),
  title: z.string().min(1, "Tiêu đề bài học không được rỗng"),
  guide_vi: z.string().min(1, "Hướng dẫn cho người lớn không được rỗng"),
  target_age_min: z.number().int().min(3).max(6).default(3),
  target_age_max: z.number().int().min(3).max(6).default(6),
  estimated_minutes: z
    .number()
    .int()
    .min(5, "Thời lượng tối thiểu 5 phút")
    .max(45, "Thời lượng tối đa 45 phút")
    .default(20),
  materials_vi: z.string().nullable().optional(),
  warm_up_vi: z.string().nullable().optional(),
  reflection_vi: z.string().nullable().optional(),
  assessment_vi: z.string().nullable().optional(),
  extension_vi: z.string().nullable().optional(),
  access_tier: z
    .enum(["free", "login", "standard", "premium"])
    .default("standard"),
  skill_ids: z.array(z.number().int()).max(3, "Tối đa 3 skill").optional(),
  activities: z
    .array(
      z.object({
        activity_id: z.number().int().positive(),
        position: z.number().int().positive(),
        is_required: z.boolean().default(true),
      })
    )
    .optional(),
});

async function attachLessonActivitiesAndSkills(
  db: ReturnType<typeof getOwnerDb>,
  createdLessonId: number,
  entityId: number,
  activitiesList?: {
    activity_id: number;
    position: number;
    is_required: boolean;
  }[],
  skillIds?: number[]
) {
  if (activitiesList && activitiesList.length > 0) {
    for (const actItem of activitiesList) {
      await db.insert(lessonActivities).values({
        lessonId: createdLessonId,
        position: actItem.position,
        activityId: actItem.activity_id,
        isRequired: actItem.is_required,
      });
    }
  }

  if (skillIds && skillIds.length > 0) {
    const weightPerSkill = (1.0 / skillIds.length).toFixed(2);
    for (const skillId of skillIds) {
      await db
        .insert(contentSkillMap)
        .values({
          entityType: "lesson",
          entityId,
          skillId,
          weight: weightPerSkill,
        })
        .onConflictDoNothing();
    }
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const rawBody = await readBody(event);

  const parsed = createLessonSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: parsed.error.issues.map((i) => i.message).join("; "),
      data: parsed.error.issues,
    });
  }

  const data = parsed.data;
  if (data.target_age_min > data.target_age_max) {
    throw createError({
      statusCode: 422,
      statusMessage: "INVALID_AGE_RANGE",
      message: "target_age_min không được lớn hơn target_age_max",
    });
  }

  const db = getOwnerDb();
  const code = data.code || `LES-${String(Date.now() % 9000).padStart(4, "0")}`;
  const entityId = Date.now();

  const [created] = await db
    .insert(lessons)
    .values({
      entityId,
      code,
      contentVersion: 1,
      titleVi: data.title,
      guideVi: data.guide_vi,
      targetAgeMin: data.target_age_min,
      targetAgeMax: data.target_age_max,
      estimatedMinutes: data.estimated_minutes,
      materialsVi: data.materials_vi || null,
      warmUpVi: data.warm_up_vi || null,
      reflectionVi: data.reflection_vi || null,
      assessmentVi: data.assessment_vi || null,
      extensionVi: data.extension_vi || null,
      accessTier: data.access_tier,
      status: "draft",
      origin: "human",
      authoredIn: "studio",
      createdByManagerId: session.manager_id,
    })
    .returning();

  await attachLessonActivitiesAndSkills(
    db,
    created.id,
    entityId,
    data.activities,
    data.skill_ids
  );

  await writeAudit(db, {
    actorType: "manager",
    actorId: session.manager_id,
    action: "create",
    entityType: "lesson",
    entityId: String(created.id),
    afterState: created,
    reason: "Manager created lesson via Studio",
  });

  setResponseStatus(event, 201);
  return created;
});
