import { LessonExemplarService } from "@mindkid/db";
import { createError, defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

const revokeBodySchema = z.object({
  lesson_id: z.number().int().positive(),
  reason: z.string().min(5).max(1000),
});

export default defineEventHandler(async (event) => {
  const manager = requireSuperAdminSession(event);
  const rawBody = await readBody(event);
  const parsed = revokeBodySchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "Dữ liệu gỡ cờ mẫu không hợp lệ",
      data: parsed.error.format(),
    });
  }

  try {
    const result = await LessonExemplarService.revokeExemplar({
      lessonId: parsed.data.lesson_id,
      managerId: manager.id,
      reason: parsed.data.reason,
    });

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "INSUFFICIENT_ROLE") {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Chỉ chuyên gia thẩm định sư phạm mới có quyền gỡ cờ mẫu.",
      });
    }
    throw err;
  }
});
