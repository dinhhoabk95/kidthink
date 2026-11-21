import {
  createSocialSignupConsentTicket,
  getAuthRedisClient,
  SOCIAL_SIGNUP_CONSENT_COOKIE,
  SOCIAL_SIGNUP_CONSENT_TTL_SECONDS,
} from "@mindkid/auth";
import { getHeader, setCookie } from "h3";
import { z } from "zod";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { validateSignupConsentMarkers } from "#server/utils/better-auth";
import { defineApiRoute } from "#server/utils/define-api-route";

const SocialConsentBodySchema = z.object({
  accept_terms: z.literal(true),
  accept_privacy: z.literal(true),
  terms_requirement_at: z.string().nullable().optional(),
  privacy_requirement_at: z.string().nullable().optional(),
});

export default defineApiRoute({
  auth: "guest",
  body: SocialConsentBodySchema,
  handler: async ({ event, body }) => {
    const termsReq = body.terms_requirement_at ?? null;
    const privacyReq = body.privacy_requirement_at ?? null;

    await validateSignupConsentMarkers({
      termsRequirementAt: termsReq,
      privacyRequirementAt: privacyReq,
    });

    const token = await createSocialSignupConsentTicket(getAuthRedisClient(), {
      termsRequirementAt: termsReq,
      privacyRequirementAt: privacyReq,
      ipAddress: getVerifiedRemoteIp(event),
      userAgent: getHeader(event, "user-agent") ?? "MindKid Browser",
    });

    setCookie(event, SOCIAL_SIGNUP_CONSENT_COOKIE, token, {
      httpOnly: true,
      maxAge: SOCIAL_SIGNUP_CONSENT_TTL_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return { ok: true };
  },
});
