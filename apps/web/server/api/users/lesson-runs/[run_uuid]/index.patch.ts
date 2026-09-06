import { requireUserAuth } from "@mindkid/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { SessionAlreadyCompletedError } from "@mindkid/errors/play";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { LessonSessionRunnerService } from "#server/services/index.js";

const UpdateStepSchema = z.object({
  step_index: z.number().int().min(0),
  outcome: z.enum(["done", "skipped"]),
});

export default defineEventHandler(async (event) => {
  const auth = requireUserAuth(event);
  const runUuid = getRouterParam(event, "run_uuid");

  if (!runUuid) {
    throw new ValidationError("Thiếu run_uuid.");
  }

  const rawBody = await readBody(event);
  const parsed = UpdateStepSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw new ValidationError("VALIDATION_FAILED");
  }

  try {
    const result = await LessonSessionRunnerService.updateStep(
      runUuid,
      auth.user_id,
      parsed.data.step_index,
      parsed.data.outcome
    );

    return result;
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : "";
    if (errorName === "NOT_FOUND") {
      throw new NotFoundError("Không tìm thấy lượt chạy.");
    }
    if (errorName === "SESSION_ALREADY_COMPLETED") {
      throw new SessionAlreadyCompletedError("Lượt chạy tiết học đã kết thúc.");
    }
    if (errorName === "VALIDATION_FAILED") {
      throw new ValidationError("Bước không hợp lệ trong tiết học này.");
    }
    throw err;
  }
});
