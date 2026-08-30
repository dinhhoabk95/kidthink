import {
  curricula,
  curriculumItems,
  getOwnerDb,
  writeAudit,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const putCurriculumItemsSchema = z.object({
  expected_version: z.number().int({
    message: "Bắt buộc truyền expected_version để kiểm soát đồng thời",
  }),
  items: z.array(
    z.object({
      week_no: z.number().int().positive("Tuần phải là số dương"),
      session_no: z.number().int().positive("Buổi phải là số dương"),
      position: z.number().int().positive("Thứ tự vị trí phải là số dương"),
      entity_type: z.enum(["lesson", "game_level"]),
      entity_id: z.number().int().positive("entity_id phải là số dương"),
      is_required: z.boolean().default(true),
    })
  ),
});

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");
  const version = Number(versionParam) || 1;

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "BAD_REQUEST",
      message: "Thiếu tham số mã chương trình",
    });
  }

  const rawBody =
    event.context?.body ?? (await readBody(event).catch(() => ({}))) ?? {};
  const parsed = putCurriculumItemsSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: parsed.error.issues[0]?.message || "Dữ liệu items không hợp lệ",
    });
  }

  const data = parsed.data;
  const db = getOwnerDb();
  const managerId = session.manager_id;

  const [curr] = await db
    .select()
    .from(curricula)
    .where(
      and(eq(curricula.code, code), eq(curricula.contentVersion, version))
    );

  if (!curr) {
    throw createError({
      statusCode: 404,
      statusMessage: "CURRICULUM_NOT_FOUND",
      message: `Không tìm thấy chương trình ${code} version ${version}`,
    });
  }

  if (curr.contentVersion !== data.expected_version) {
    throw createError({
      statusCode: 409,
      statusMessage: "VERSION_CONFLICT",
      message: `Xung đột phiên bản: version hiện tại là ${curr.contentVersion}, nhưng bạn đang lưu trên version ${data.expected_version}`,
    });
  }

  // Validation: week_no <= duration_weeks
  for (const item of data.items) {
    if (item.week_no > curr.durationWeeks) {
      throw createError({
        statusCode: 422,
        statusMessage: "WEEK_OUT_OF_BOUNDS",
        message: `Tuần ${item.week_no} vượt quá tổng số tuần của chương trình (${curr.durationWeeks} tuần)`,
      });
    }
  }

  // Validation: duplicate positions
  const posSet = new Set<string>();
  for (const item of data.items) {
    const key = `${item.week_no}_${item.session_no}_${item.position}`;
    if (posSet.has(key)) {
      throw createError({
        statusCode: 422,
        statusMessage: "DUPLICATE_POSITION",
        message: `Trùng lặp vị trí: tuần ${item.week_no} buổi ${item.session_no} vị trí ${item.position} đã tồn tại`,
      });
    }
    posSet.add(key);
  }

  // Atomic transaction replacement
  await db.transaction(async (tx) => {
    // Re-verify expected_version inside transaction
    const [lockedCurr] = await tx
      .select()
      .from(curricula)
      .where(eq(curricula.id, curr.id))
      .for("update");

    if (!lockedCurr || lockedCurr.contentVersion !== data.expected_version) {
      throw createError({
        statusCode: 409,
        statusMessage: "VERSION_CONFLICT",
        message: "Xung đột phiên bản khi ghi đồng thời",
      });
    }

    await tx
      .delete(curriculumItems)
      .where(eq(curriculumItems.curriculumId, curr.id));

    if (data.items.length > 0) {
      await tx.insert(curriculumItems).values(
        data.items.map((item) => ({
          curriculumId: curr.id,
          weekNo: item.week_no,
          sessionNo: item.session_no,
          position: item.position,
          entityType: item.entity_type,
          entityId: item.entity_id,
          isRequired: item.is_required,
        }))
      );
    }

    await tx
      .update(curricula)
      .set({ updatedAt: new Date() })
      .where(eq(curricula.id, curr.id));
  });

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      action: "content_created",
      actor_type: "manager",
      actor_id: managerId,
      entity_type: "curriculum",
      entity_id: String(curr.id),
      after_data: {
        code: curr.code,
        version: curr.contentVersion,
        items_count: data.items.length,
      },
    });
  });

  return { ok: true, count: data.items.length };
});
