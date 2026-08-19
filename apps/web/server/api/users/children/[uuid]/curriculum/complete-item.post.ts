import {
  childProfiles,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  getOwnerDb,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  requireWebUserSession,
} from "../../../../../utils/auth-runtime.js";

const completeItemSchema = z.object({
  curriculum_item_id: z.coerce.number().int().positive(),
});

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 16 * 1024);
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // 1. Verify child belongs to user
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, uuid),
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, "active")
      )
    );

  if (!child) {
    setResponseStatus(event, 404);
    throw createError({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
      data: { code: "NOT_FOUND", message: "Không tìm thấy hồ sơ trẻ." },
    });
  }

  const eventBody = (event.context as { body?: unknown })?.body;
  const raw = eventBody || (await readBody(event).catch(() => ({})));
  const parsed = completeItemSchema.safeParse(raw);

  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message: "curriculum_item_id là bắt buộc.",
      },
    });
  }

  const curriculumItemId = parsed.data.curriculum_item_id;

  // 2. Find active enrollment
  const [enrollment] = await db
    .select()
    .from(curriculumEnrollments)
    .where(
      and(
        eq(curriculumEnrollments.childId, child.id),
        eq(curriculumEnrollments.status, "active")
      )
    );

  if (!enrollment) {
    setResponseStatus(event, 404);
    throw createError({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
      data: {
        code: "NOT_FOUND",
        message: "Bé chưa ghi danh chương trình nào.",
      },
    });
  }

  // 3. Verify curriculum_item belongs to enrolled curriculum
  const [item] = await db
    .select()
    .from(curriculumItems)
    .where(
      and(
        eq(curriculumItems.id, curriculumItemId),
        eq(curriculumItems.curriculumId, enrollment.curriculumId)
      )
    );

  if (!item) {
    setResponseStatus(event, 404);
    throw createError({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
      data: {
        code: "NOT_FOUND",
        message: "Không tìm thấy hoạt động trong chương trình học.",
      },
    });
  }

  // 4. Upsert progress idempotently (D-MC)
  await db
    .insert(curriculumItemProgress)
    .values({
      enrollmentId: enrollment.id,
      childId: child.id,
      curriculumItemId: item.id,
      status: "completed",
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        curriculumItemProgress.enrollmentId,
        curriculumItemProgress.curriculumItemId,
      ],
      set: {
        status: "completed",
        updatedAt: new Date(),
      },
    });

  return {
    ok: true,
    item_id: item.id,
    completed: true,
  };
});
