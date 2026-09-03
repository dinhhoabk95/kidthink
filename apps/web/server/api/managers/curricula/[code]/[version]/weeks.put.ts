import { writeAudit } from "@mindkid/audit";
import { curricula, curriculumWeeks, getOwnerDb } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const putCurriculumWeeksSchema = z.object({
  expected_version: z.number().int({
    message: "Bắt buộc truyền expected_version để kiểm soát đồng thời",
  }),
  weeks: z.array(
    z.object({
      week_no: z.number().int().positive("Tuần phải là số dương"),
      goal: z.string().min(1, "Mục tiêu tuần không được để trống"),
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
  const parsed = putCurriculumWeeksSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: parsed.error.issues[0]?.message || "Dữ liệu weeks không hợp lệ",
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
  for (const wk of data.weeks) {
    if (wk.week_no > curr.durationWeeks) {
      throw createError({
        statusCode: 422,
        statusMessage: "WEEK_OUT_OF_BOUNDS",
        message: `Tuần ${wk.week_no} vượt quá tổng số tuần của chương trình (${curr.durationWeeks} tuần)`,
      });
    }
  }

  // Validation: duplicate week_no
  const weekSet = new Set<number>();
  for (const wk of data.weeks) {
    if (weekSet.has(wk.week_no)) {
      throw createError({
        statusCode: 422,
        statusMessage: "DUPLICATE_WEEK",
        message: `Trùng lặp mục tiêu tuần ${wk.week_no}`,
      });
    }
    weekSet.add(wk.week_no);
  }

  // Atomic transaction replacement
  await db.transaction(async (tx) => {
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
      .delete(curriculumWeeks)
      .where(eq(curriculumWeeks.curriculumId, curr.id));

    if (data.weeks.length > 0) {
      await tx.insert(curriculumWeeks).values(
        data.weeks.map((wk) => ({
          curriculumId: curr.id,
          weekNo: wk.week_no,
          goal: wk.goal,
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
        weeks_count: data.weeks.length,
      },
    });
  });

  return {
    ok: true,
    count: data.weeks.length,
  };
});
