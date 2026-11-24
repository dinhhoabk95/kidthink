import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { checkUserLevelReadiness } from "#server/services/catalog-service";
import {
  getOptionalActiveChildUuid,
  getOrSetGuestDeviceId,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const activeChildUuid = getOptionalActiveChildUuid(event);
  const code = getRouterParam(event, "code");
  if (!code) {
    throw new NotFoundError("NOT_FOUND");
  }

  const guestDeviceId = getOrSetGuestDeviceId(event);
  const readiness = await checkUserLevelReadiness({
    code,
    userId: user.user_id,
    activeChildUuid,
    guestDeviceId,
  });

  if (!readiness) {
    throw new NotFoundError("NOT_FOUND");
  }

  return readiness;
});
