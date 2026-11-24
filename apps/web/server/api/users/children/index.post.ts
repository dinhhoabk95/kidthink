import { defineEventHandler, readBody, setResponseStatus } from "h3";
import {
  createChildProfileForUser,
  type RawChildInputRecord,
} from "#server/services/child-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const eventBody = (event.context as { body?: RawChildInputRecord })?.body;
  const rawBody =
    eventBody || ((await readBody<RawChildInputRecord>(event)) ?? {});

  const result = await createChildProfileForUser({
    userId: Number(user.user_id),
    rawBody,
  });

  setResponseStatus(event, 201);
  return result;
});
