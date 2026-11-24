import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import {
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import { enrollChildInCurriculum } from "#server/services/child-curriculum-service";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const createEnrollmentSchema = z.object({
  curriculum_code: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const eventBody = Reflect.get(event.context, "body");
  const raw = eventBody || (await readBody(event).catch(() => ({})));
  const parsed = createEnrollmentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError("Mã chương trình là bắt buộc.");
  }

  const result = await enrollChildInCurriculum({
    userId: Number(user.user_id),
    childUuid: uuid,
    curriculumCode: parsed.data.curriculum_code,
    ipAddress: getVerifiedRemoteIp(event),
  });

  setResponseStatus(event, 201);
  return result;
});
