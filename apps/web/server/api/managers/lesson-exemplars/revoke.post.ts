import { InsufficientRoleError } from "@mindkid/errors/auth";
import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { LessonExemplarService } from "#server/services/index.js";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

const revokeBodySchema = z.object({
  lesson_id: z.number().int().positive(),
  reason: z.string().min(5).max(1000),
});

export default defineEventHandler(async (event) => {
  const manager = await requireSuperAdminSession(event);
  const rawBody = await readBody(event);
  const parsed = revokeBodySchema.safeParse(rawBody);

  if (!parsed.success) {
    throw new ValidationError("Dữ liệu gỡ cờ mẫu không hợp lệ");
  }

  try {
    const result = await LessonExemplarService.revokeExemplar({
      lessonId: parsed.data.lesson_id,
      managerId: manager.manager_id,
      reason: parsed.data.reason,
    });

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "INSUFFICIENT_ROLE") {
      throw new InsufficientRoleError(
        "Chỉ chuyên gia thẩm định sư phạm mới có quyền gỡ cờ mẫu."
      );
    }
    throw err;
  }
});
