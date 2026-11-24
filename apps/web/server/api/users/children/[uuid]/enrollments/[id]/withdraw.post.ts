import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { withdrawChildCurriculumEnrollment } from "#server/services/child-curriculum-service";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  const idParam = getRouterParam(event, "id");
  const enrollmentId = idParam ? Number(idParam) : undefined;
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  return await withdrawChildCurriculumEnrollment({
    userId: Number(user.user_id),
    childUuid: uuid,
    ipAddress: getVerifiedRemoteIp(event),
    enrollmentId:
      enrollmentId !== undefined && !Number.isNaN(enrollmentId)
        ? enrollmentId
        : undefined,
  });
});
