import { writeAudit } from "@mindkid/audit";
import {
  contentSkillMap,
  getOwnerDb,
  lessonActivities,
  lessons,
} from "@mindkid/db";
import { InternalError, ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

const createLessonSchema = z.object({
  code: z
    .string()
    .regex(
      /^LES-(?:\d{4}|C[1-6]-[A-Z]{2,5}-\d{4})$/,
      "Mã sai định dạng LES-xxxx"
    )
    .optional(),
  title: z.string().min(1, "Tiêu đề bài học không được rỗng"),
  guide: z.string().min(1, "Hướng dẫn cho người lớn không được rỗng"),
  target_age_min: z.number().int().min(3).max(6).default(3),
  target_age_max: z.number().int().min(3).max(6).default(6),
  estimated_minutes: z
    .number()
    .int()
    .min(5, "Thời lượng tối thiểu 5 phút")
    .max(45, "Thời lượng tối đa 45 phút")
    .default(20),
  materials: z.string().nullable().optional(),
  warm_up: z.string().nullable().optional(),
  reflection: z.string().nullable().optional(),
  assessment: z.string().nullable().optional(),
  extension: z.string().nullable().optional(),
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
    await db.insert(lessonActivities).values(
      activitiesList.map((actItem) => ({
        lessonId: createdLessonId,
        position: actItem.position,
        activityId: actItem.activity_id,
        isRequired: actItem.is_required,
      }))
    );
  }

  if (skillIds && skillIds.length > 0) {
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
}

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const rawBody = await readBody(event);

  const parsed = createLessonSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const data = parsed.data;
  if (data.target_age_min > data.target_age_max) {
    throw new ValidationError(
      "target_age_min không được lớn hơn target_age_max"
    );
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
      title: data.title,
      guide: data.guide,
      targetAgeMin: data.target_age_min,
      targetAgeMax: data.target_age_max,
      estimatedMinutes: data.estimated_minutes,
      materials: data.materials || null,
      warmUp: data.warm_up || null,
      reflection: data.reflection || null,
      assessment: data.assessment || null,
      extension: data.extension || null,
      accessTier: data.access_tier,
      status: "draft",
      origin: "human",
      authoredIn: "studio",
      createdByManagerId: session.manager_id,
    })
    .returning();

  if (!created) {
    throw new InternalError("Tạo bài học thất bại");
  }

  await attachLessonActivitiesAndSkills(
    db,
    created.id,
    entityId,
    data.activities,
    data.skill_ids
  );

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: session.manager_id,
      action: "content_created",
      entity_type: "lesson",
      entity_id: String(created.id),
      after_data: created as unknown as Record<string, unknown>,
      reason: "Manager created lesson via Studio",
    });
  });

  setResponseStatus(event, 201);
  return created;
});
