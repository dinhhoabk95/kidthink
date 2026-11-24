import { isValidParentGateToken } from "@mindkid/auth";
import { ParentGateRequiredError } from "@mindkid/errors/auth";
import { defineEventHandler, deleteCookie, getHeader, readBody } from "h3";
import { z } from "zod";
import {
  getParentGateSecret,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const deleteActiveChildSchema = z
  .object({
    gate_token: z.string().min(1).max(2048).optional(),
  })
  .strict()
  .optional();

export default defineEventHandler(async (event) => {
  const user = requireWebUserSession(event);
  const userId = Number(user.user_id);

  const eventContext = event.context as { body?: { gate_token?: string } };
  const raw =
    eventContext?.body ??
    (await readBody<{ gate_token?: string }>(event).catch(() => ({}))) ??
    {};
  const parsed = deleteActiveChildSchema.safeParse(raw);
  const bodyToken = parsed.success ? parsed.data?.gate_token : undefined;
  const headerToken = getHeader(event, "x-parent-gate-token");
  const gateToken = bodyToken || headerToken || "";

  if (
    !(
      gateToken &&
      isValidParentGateToken(gateToken, userId, getParentGateSecret(event))
    )
  ) {
    throw new ParentGateRequiredError(
      "Cần xác nhận cổng người lớn để thoát hồ sơ trẻ."
    );
  }

  deleteCookie(event, "active_child_id", { path: "/" });
  return { success: true };
});
