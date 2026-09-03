import { requireUserAuth } from "@mindkid/auth";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import { LessonSessionRunnerService } from "#server/services/index.js";

const RecordObservationSchema = z.object({
  objective_code: z.string().min(1),
  level: z.enum(["did_it", "with_help", "not_yet"]),
});

function assertAllowedKeys(rawBody: unknown): void {
  if (rawBody && typeof rawBody === "object") {
    const keys = Object.keys(rawBody);
    const allowed = new Set(["objective_code", "level"]);
    const hasDisallowed = keys.some((k) => !allowed.has(k));
    if (hasDisallowed) {
      throw createError({
        statusCode: 422,
        statusMessage: "CHILD_FIELD_NOT_ALLOWED",
        data: {
          code: "CHILD_FIELD_NOT_ALLOWED",
          message:
            "Không được gửi trường văn bản tự do ngoài danh sách đóng về trẻ.",
        },
      });
    }
  }
}

function handleServiceError(err: unknown): never {
  const errorName = err instanceof Error ? err.name : "";
  const errorMessage = err instanceof Error ? err.message : "";
  if (errorName === "CHILD_FIELD_NOT_ALLOWED") {
    throw createError({
      statusCode: 422,
      statusMessage: "CHILD_FIELD_NOT_ALLOWED",
      data: {
        code: "CHILD_FIELD_NOT_ALLOWED",
        message:
          "Không được gửi trường văn bản tự do ngoài danh sách đóng về trẻ.",
      },
    });
  }
  if (errorName === "NOT_FOUND") {
    throw createError({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
      data: { code: "NOT_FOUND", message: "Không tìm thấy lượt chạy." },
    });
  }
  if (errorName === "VALIDATION_FAILED") {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: { code: "VALIDATION_FAILED", message: errorMessage },
    });
  }
  throw err;
}

export default defineEventHandler(async (event) => {
  const auth = requireUserAuth(event);
  const runUuid = getRouterParam(event, "run_uuid");

  if (!runUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "VALIDATION_FAILED",
      data: { code: "VALIDATION_FAILED", message: "Thiếu run_uuid." },
    });
  }

  const rawBody = await readBody(event);
  assertAllowedKeys(rawBody);

  const parsed = RecordObservationSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: { code: "VALIDATION_FAILED", issues: parsed.error.issues },
    });
  }

  try {
    const result = await LessonSessionRunnerService.recordObservation(
      runUuid,
      auth.user_id,
      parsed.data.objective_code,
      parsed.data.level,
      rawBody && typeof rawBody === "object" ? Object.keys(rawBody) : []
    );

    setResponseStatus(event, 201);
    return result;
  } catch (err: unknown) {
    handleServiceError(err);
  }
});
