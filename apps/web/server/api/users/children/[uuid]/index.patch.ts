import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import {
  type PatchChildBody,
  updateChildProfileForUser,
} from "#server/services/child-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const eventContext = event.context as { body?: PatchChildBody };
  const body: PatchChildBody =
    eventContext?.body || (await readBody<PatchChildBody>(event)) || {};

  return await updateChildProfileForUser({
    userId: Number(user.user_id),
    childUuid: uuid,
    rawBody: body,
  });
});
