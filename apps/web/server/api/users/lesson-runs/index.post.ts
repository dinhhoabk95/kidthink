import { requireUserAuth } from "@mindkid/auth";
import { NoActiveChildError } from "@mindkid/errors/child";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { ContentArchivedError } from "@mindkid/errors/content";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import { LessonSessionRunnerService } from "#server/services/index.js";

import { getOptionalActiveChildUuid } from "#server/utils/auth-runtime";

const StartRunSchema = z.object({
  lesson_code: z.string().min(1),
  child_profile_uuid: z.string().uuid().optional(),
});

export default defineEventHandler(async (event) => {
  const auth = requireUserAuth(event);
  const rawBody = await readBody(event);
  const parsed = StartRunSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw new ValidationError("VALIDATION_FAILED");
  }

  try {
    const result = await LessonSessionRunnerService.startLessonRun({
      userId: auth.user_id,
      // Không truyền uuid trong body thì lấy trẻ đang chọn từ cookie. Bản cũ
      // đọc `auth.active_child_id` — trường số chưa bao giờ được ghi vào
      // session, nên nhánh dự phòng này luôn rỗng và client không gửi uuid thì
      // luôn nhận NO_ACTIVE_CHILD.
      childProfileUuid:
        parsed.data.child_profile_uuid ??
        (getOptionalActiveChildUuid(event) || undefined),
      lessonCode: parsed.data.lesson_code,
    });

    setResponseStatus(event, 201);
    return result;
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : "";
    if (errorName === "NO_ACTIVE_CHILD") {
      throw new NoActiveChildError(
        "Vui lòng chọn một hồ sơ trẻ trước khi bắt đầu tiết học."
      );
    }
    if (errorName === "CONTENT_ARCHIVED") {
      throw new ContentArchivedError("Tiết học này đã được lưu trữ.");
    }
    if (errorName === "NOT_FOUND") {
      throw new NotFoundError("Không tìm thấy bài học tương ứng.");
    }
    throw err;
  }
});
