import { getRequestHeader } from "h3";
import { z } from "zod";
import { optInUserRecurringSubscription } from "#server/services/subscription-service";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

const optInRecurringSchema = z
  .object({
    package_code: z.string().min(1),
    billing_period: z.enum(["monthly", "annual"]),
    offer_code: z.string().min(1).optional(),
    consent_accepted: z.literal(true).optional(),
    consent: z.literal(true).optional(),
    terms_version: z.string().min(1).optional(),
  })
  .refine((data) => data.consent_accepted === true || data.consent === true, {
    message: "Vui lòng xác nhận đồng ý điều khoản gia hạn tự động.",
    path: ["consent_accepted"],
  });

export default defineApiRoute({
  auth: "user",
  body: optInRecurringSchema,
  handler: async ({ event, auth: session, body }) => {
    const ipAddress = getVerifiedRemoteIp(event);
    const userAgent = getRequestHeader(event, "user-agent") || "unknown";

    return await optInUserRecurringSubscription({
      userId: session.user_id,
      packageCode: body.package_code,
      billingPeriod: body.billing_period,
      offerCode: body.offer_code,
      termsVersion: body.terms_version,
      ipAddress,
      userAgent,
    });
  },
});
