import { isValidParentGateToken } from "@mindkid/auth";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { grantChildExtraPlayTime } from "#server/services/child-report-service";
import {
  getParentGateSecret,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const GrantExtraTimeSchema = z
  .object({
    gate_token: z.string().min(1).max(2048).optional(),
    minutes: z.number().int().min(1).max(30),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError();
  }

  const eventBody = Reflect.get(event.context, "body");
  const body = eventBody || (await readBody(event).catch(() => ({}))) || {};
  const parsed = GrantExtraTimeSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError();
  }

  const { minutes, gate_token: gateToken } = parsed.data;
  const userId = Number(user.user_id);

  if (
    !(
      gateToken &&
      isValidParentGateToken(gateToken, userId, getParentGateSecret(event))
    )
  ) {
    throw new InsufficientRoleError({
      message: "Cần xác minh cổng người lớn.",
    });
  }

  return await grantChildExtraPlayTime({
    userId,
    childUuid: uuid,
    minutes,
  });
});
