import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { updateChildPlaySettings } from "#server/services/child-report-service";
import {
  getParentGateSecret,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const patchSettingsSchema = z
  .object({
    daily_play_cap_minutes: z.number().int(),
    gate_token: z.string().min(1).max(2048).optional(),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const user = requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError();
  }

  const eventContext = event.context as {
    body?: { daily_play_cap_minutes?: number; gate_token?: string };
  };
  const raw =
    eventContext?.body ??
    (await readBody<{ daily_play_cap_minutes?: number; gate_token?: string }>(
      event
    ).catch(() => ({})));
  const parsed = patchSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError({
      message: "daily_play_cap_minutes là bắt buộc.",
    });
  }

  const gateToken =
    parsed.data.gate_token ?? getHeader(event, "x-parent-gate-token");

  return await updateChildPlaySettings({
    userId: Number(user.user_id),
    childUuid: uuid,
    dailyPlayCapMinutes: parsed.data.daily_play_cap_minutes,
    gateToken,
    parentGateSecret: getParentGateSecret(event),
  });
});
