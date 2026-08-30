import { LessonExemplarService } from "@mindkid/db";
import { createError, defineEventHandler, readBody } from "h3";

import { z } from "zod";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

const nominateBodySchema = z.object({
  lesson_id: z.number().int().positive(),
  competency: z.enum(["C1", "C2", "C3", "C4", "C5", "C6"]),
  age_band: z.enum(["3-4", "4-5", "5-6"]),
  notes: z.string().max(1000).optional(),
});

export default defineEventHandler(async (event) => {
  const manager = await requireSuperAdminSession(event);
  const rawBody = await readBody(event);
  const parsed = nominateBodySchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "Dữ liệu đề cử không hợp lệ",
      data: parsed.error.format(),
    });
  }

  try {
    const result = await LessonExemplarService.nominateExemplar({
      lessonId: parsed.data.lesson_id,
      managerId: manager.manager_id,
      competency: parsed.data.competency,
      ageBand: parsed.data.age_band,
      notes: parsed.data.notes,
    });

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === "VALIDATION_FAILED") {
        throw createError({
          statusCode: 422,
          statusMessage: err.message,
        });
      }
      if (err.name === "EXEMPLAR_CELL_LIMIT_EXCEEDED") {
        throw createError({
          statusCode: 422,
          statusMessage:
            "Ô ma trận đã đạt trần tối đa 2 tiết học mẫu (BR-LEX-08).",
        });
      }
      if (err.name === "INSUFFICIENT_ROLE") {
        throw createError({
          statusCode: 403,
          statusMessage:
            "Chỉ chuyên gia thẩm định sư phạm mới có quyền đề cử (BR-LEX-10).",
        });
      }
    }
    throw err;
  }
});
