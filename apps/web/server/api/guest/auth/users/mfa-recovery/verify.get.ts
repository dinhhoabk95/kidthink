import crypto from "node:crypto";
import { auditLogs, getOwnerDb, mfaRecoveryRequests } from "@mindkid/db";
import { TokenExpiredError } from "@mindkid/errors/auth";
import { ValidationError } from "@mindkid/errors/common";
import { and, eq, gt } from "drizzle-orm";
import { defineEventHandler, getHeader, getQuery } from "h3";
import { z } from "zod";
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
  const token = parsed.data.token;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const db = getOwnerDb();
  const now = new Date();

  const [matchingReq] = await db
    .select()
    .from(mfaRecoveryRequests)
    .where(
      and(
        eq(mfaRecoveryRequests.verificationTokenHash, tokenHash),
        eq(mfaRecoveryRequests.status, "pending_verification"),
        gt(mfaRecoveryRequests.verificationTokenExpiresAt, now)
      )
    );

  if (!matchingReq) {
    throw new TokenExpiredError("Mã xác thực không hợp lệ hoặc đã hết hạn");
  }

  // Update status to waiting and clear token hash
  await db
    .update(mfaRecoveryRequests)
    .set({
      status: "waiting",
      emailVerifiedAt: now,
      verificationTokenHash: null,
      updatedAt: now,
    })
    .where(eq(mfaRecoveryRequests.id, matchingReq.id));

  await db.insert(auditLogs).values({
    actorType: "user",
    actorId: matchingReq.userId,
    action: "mfa.recovery_email_verified",
    entityType: "user",
    entityId: String(matchingReq.userId),
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });

  return {
    success: true,
    message:
      "Email đã được xác thực thành công. Yêu cầu khôi phục MFA sẽ sẵn sàng xử lý sau 48 giờ kể từ lúc tạo.",
  };
});
