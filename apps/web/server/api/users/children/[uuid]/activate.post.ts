import { NotFoundError } from "@mindkid/errors/common";
import {
  defineEventHandler,
  getCookie,
  getHeader,
  getRouterParam,
  readBody,
  setCookie,
} from "h3";
import { z } from "zod";
import { activateChildProfileForUser } from "#server/services/child-service";
import { throwValidationError } from "#server/utils/api-error";
import {
  getParentGateSecret,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const activateChildSchema = z
  .object({
    gate_token: z.string().optional(),
  })
  .optional();

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const currentActiveUuid = getCookie(event, "active_child_id");
  const eventBody = (event.context as { body?: { gate_token?: string } })?.body;
  const raw =
    eventBody ||
    (await readBody<{ gate_token?: string }>(event).catch(() => ({})));
  const parsed = activateChildSchema.safeParse(raw);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const gateToken =
    parsed.data?.gate_token ?? getHeader(event, "x-parent-gate-token");

  const result = await activateChildProfileForUser({
    userId: Number(user.user_id),
    childUuid: uuid,
    currentActiveUuid,
    gateToken,
    parentGateSecret: getParentGateSecret(event),
  });

  setCookie(event, "active_child_id", result.child.uuid, {
    httpOnly: false,
    maxAge: 30 * 86_400,
    path: "/",
    sameSite: "lax",
    secure: !import.meta.dev,
  });

  return result;
});
