import { writeAudit } from "@mindkid/audit";
import { activities, getOwnerDb, lessonActivities, lessons } from "@mindkid/db";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import {
  ActivityNotFoundError,
  LessonNotFoundError,
  VersionConflictError,
} from "@mindkid/errors/content";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

const putActivitiesSchema = z.object({
  items: z.array(
    z.object({
      activity_code: z.string().optional(),
      activity_id: z.number().int().positive().optional(),
      position: z.number().int().positive("Vị trí phải là số nguyên dương"),
      is_required: z.boolean().default(true),
    })
  ),
  expected_version: z.number().int().positive().optional(),
});

type ActivityInputItem = z.infer<typeof putActivitiesSchema>["items"][number];

interface ResolvedActivityItem {
  position: number;
  activityId: number;
  isRequired: boolean;
}

async function resolveActivityItems(
  db: ReturnType<typeof getOwnerDb>,
  items: ActivityInputItem[]
): Promise<ResolvedActivityItem[]> {
  const resolvedItems: ResolvedActivityItem[] = [];
  const seenActivityIds = new Set<number>();

  for (const item of items) {
    let resolvedEntityId = item.activity_id;

    if (!resolvedEntityId && item.activity_code) {
      const [act] = await db
        .select({ entityId: activities.entityId })
        .from(activities)
        .where(eq(activities.code, item.activity_code))
        .limit(1);

      if (act) {
        resolvedEntityId = act.entityId;
      }
    }

    if (!resolvedEntityId) {
      throw new ActivityNotFoundError(
        `Activity ${item.activity_code || item.activity_id} not found`
      );
    }

    if (seenActivityIds.has(resolvedEntityId)) {
      throw new ValidationError(
        `Duplicate activity in lesson items: ${resolvedEntityId}`
      );
    }

    seenActivityIds.add(resolvedEntityId);
    resolvedItems.push({
      position: item.position,
      activityId: resolvedEntityId,
      isRequired: item.is_required,
    });
  }

  return resolvedItems;
}

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");

  if (!(code && versionParam)) {
    throw new NotFoundError("NOT_FOUND");
  }

  const version = Number(versionParam);
  if (!Number.isInteger(version) || version <= 0) {
    throw new ValidationError("INVALID_VERSION");
  }

  const rawBody = await readBody(event);
  const parsed = putActivitiesSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const { items, expected_version } = parsed.data;
  const db = getOwnerDb();

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.code, code), eq(lessons.contentVersion, version)))
    .limit(1);

  if (!lesson) {
    throw new LessonNotFoundError(
      `Lesson ${code} version ${version} not found`
    );
  }

  if (
    expected_version !== undefined &&
    expected_version !== lesson.contentVersion
  ) {
    throw new VersionConflictError(
      `Expected version ${expected_version}, but found ${lesson.contentVersion}`
    );
  }

  const resolvedItems = await resolveActivityItems(db, items);

  // Perform atomic replace inside transaction
  await db.transaction(async (tx) => {
    await tx
      .delete(lessonActivities)
      .where(eq(lessonActivities.lessonId, lesson.id));

    if (resolvedItems.length > 0) {
      await tx.insert(lessonActivities).values(
        resolvedItems.map((r) => ({
          lessonId: lesson.id,
          position: r.position,
          activityId: r.activityId,
          isRequired: r.isRequired,
        }))
      );
    }

    await tx
      .update(lessons)
      .set({ updatedAt: new Date() })
      .where(eq(lessons.id, lesson.id));
  });

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: session.manager_id,
      action: "content_created",
      entity_type: "lesson",
      entity_id: String(lesson.id),
      reason: `Manager updated lesson activities composition (${resolvedItems.length} items)`,
      after_data: {
        activities_count: resolvedItems.length,
      },
    });
  });

  return {
    lesson_id: lesson.id,
    lesson_code: lesson.code,
    content_version: lesson.contentVersion,
    activities: resolvedItems,
  };
});
