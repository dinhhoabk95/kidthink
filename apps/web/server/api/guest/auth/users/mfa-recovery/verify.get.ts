import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getQuery } from "h3";
import { z } from "zod";
import { verifyMfaRecoveryToken } from "#server/services/account-lifecycle-service";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

const MfaVerifyQuerySchema = z.object({
  token: z.string().trim().min(1),
});

export default defineEventHandler(async (event) => {
  const rawQuery =
    Reflect.get(event, "_query") ||
    Reflect.get(event.context, "query") ||
    getQuery(event) ||
    {};
  const parsed = MfaVerifyQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    throw ValidationError.field(
      "token",
      "Mã xác thực token không được để trống"
    );
  }

  return await verifyMfaRecoveryToken({
    token: parsed.data.token,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });
});
