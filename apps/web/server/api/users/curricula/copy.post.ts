import { copySystemCurriculumSchema } from "@mindkid/shared";
import { getRequestHeader } from "h3";
import { copySystemCurriculumWithKoguma } from "#server/services/play-experience-service";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

export default defineApiRoute({
  auth: "user",
  body: copySystemCurriculumSchema,
  status: 201,
  async handler({ event, auth, body }) {
    const userId = Number(auth.user_id);
    const entitlements = await resolveUserActiveEntitlements(userId);

    return await copySystemCurriculumWithKoguma(
      {
        userId,
        entitlements,
        ip: getVerifiedRemoteIp(event),
        userAgent: getRequestHeader(event, "user-agent"),
      },
      body
    );
  },
});
