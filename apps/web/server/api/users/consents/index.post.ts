import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import { submitUserConsent } from "#server/services/consent-service";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const SubmitConsentSchema = z
  .object({
    consent_type: z.enum(["terms", "privacy", "child_data"]),
    requirement_at: z.string().nullable().optional(),
    accept: z.literal(true),
  })
  .strict();

type RawConsentBody =
  | Record<string, string | number | boolean | null | undefined>
  | null
  | undefined;

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const eventBody = (event.context as { body?: RawConsentBody })?.body;
  const rawBody: RawConsentBody =
    eventBody ||
    (await readBody<RawConsentBody>(event).catch(() => null)) ||
    {};

  const parsed = SubmitConsentSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Dữ liệu đồng ý không hợp lệ.");
  }

  const result = await submitUserConsent({
    userId,
    consentType: parsed.data.consent_type,
    requirementAt: parsed.data.requirement_at,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || "unknown",
  });

  setResponseStatus(event, 201);
  return result;
});
