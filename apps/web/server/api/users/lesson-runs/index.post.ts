import { requireUserAuth } from "@mindkid/auth";
import { LessonSessionRunnerService } from "@mindkid/db";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";

const StartRunSchema = z.object({
  lesson_code: z.string().min(1),
  child_profile_uuid: z.string().uuid().optional(),
});

export default defineEventHandler(async (event) => {
  const auth = requireUserAuth(event);
  const rawBody = await readBody(event);
  const parsed = StartRunSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "VALIDATION_FAILED",
      data: { code: "VALIDATION_FAILED", issues: parsed.error.issues },
    });
  }

  try {
    const result = await LessonSessionRunnerService.startLessonRun({
      userId: auth.user_id,
      childProfileUuid: parsed.data.child_profile_uuid,
      childProfileId: auth.active_child_id,
      lessonCode: parsed.data.lesson_code,
    });

    setResponseStatus(event, 201);
    return result;
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : "";
    if (errorName === "NO_ACTIVE_CHILD") {
      throw createError({
        statusCode: 409,
        statusMessage: "NO_ACTIVE_CHILD",
        data: {
          code: "NO_ACTIVE_CHILD",
          message: "Vui lòng chọn một hồ sơ trẻ trước khi bắt đầu tiết học.",
        },
      });
    }
    if (errorName === "CONTENT_ARCHIVED") {
      throw createError({
        statusCode: 422,
        statusMessage: "CONTENT_ARCHIVED",
        data: {
          code: "CONTENT_ARCHIVED",
          message: "Tiết học này đã được lưu trữ.",
        },
      });
    }
    if (errorName === "NOT_FOUND") {
      throw createError({
        statusCode: 404,
        statusMessage: "NOT_FOUND",
        data: {
          code: "NOT_FOUND",
          message: "Không tìm thấy bài học tương ứng.",
        },
      });
    }
    throw err;
  }
});
