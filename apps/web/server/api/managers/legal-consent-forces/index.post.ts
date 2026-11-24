import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import { forceManagerReconsent } from "#server/services/consent-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

const ForceReconsentSchema = z
  .object({
    consent_type: z.enum(["terms", "privacy", "child_data"]),
    notice: z.string().min(20).max(500),
    reason: z.string().min(20).max(500),
    expected_requirement_at: z.string().nullable().optional(),
    confirm_deployed: z.literal(true),
    confirm_all_users: z.literal(true),
  })
  .strict();

type ForceReconsentInput = z.input<typeof ForceReconsentSchema>;

export default defineEventHandler(async (event) => {
  const superAdminSession = requireSuperAdminSession(event);
  const managerId = Number(superAdminSession.manager_id);

  requireReauth(event);

  const eventBody = (event.context as { body?: ForceReconsentInput })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as ForceReconsentInput) || {};

  const parsed = ForceReconsentSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Dữ liệu yêu cầu tái đồng ý không hợp lệ.");
  }

  const result = await forceManagerReconsent({
    managerId,
    consentType: parsed.data.consent_type,
    notice: parsed.data.notice,
    reason: parsed.data.reason,
    expectedRequirementAt: parsed.data.expected_requirement_at,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || "unknown",
  });

  setResponseStatus(event, 201);
  return result;
});
