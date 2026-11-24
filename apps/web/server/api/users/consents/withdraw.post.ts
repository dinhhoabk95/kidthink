import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, deleteCookie, getHeader, readBody } from "h3";
import { z } from "zod";
import { withdrawUserConsent } from "#server/services/consent-service";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

const WithdrawConsentSchema = z
  .object({
    consent_type: z.enum(["terms", "privacy", "child_data"]),
    confirm: z.literal(true),
  })
  .strict();

type RawWithdrawConsentBody =
  | Record<string, string | number | boolean | null | undefined>
  | null
  | undefined;

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  requireReauth(event);

  const eventBody = (event.context as { body?: RawWithdrawConsentBody })?.body;
  const rawBody: RawWithdrawConsentBody =
    eventBody ||
    (await readBody<RawWithdrawConsentBody>(event).catch(() => null)) ||
    {};

  const parsed = WithdrawConsentSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError(
      "Yêu cầu rút đồng ý không hợp lệ hoặc thiếu xác nhận."
    );
  }

  const result = await withdrawUserConsent({
    userId,
    consentType: parsed.data.consent_type,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || "unknown",
  });

  if (result.shouldClearActiveChildCookie) {
    deleteCookie(event, "active_child_id", { path: "/" });
    return {
      consent_type: result.consent_type,
      status: result.status,
      consequence: result.consequence,
      archived_children_count: result.archived_children_count,
      grace_period_days: result.grace_period_days,
      purge_at: result.purge_at,
    };
  }

  return {
    consent_type: result.consent_type,
    status: result.status,
    consequence: result.consequence,
    deletion_url: result.deletion_url,
  };
});
