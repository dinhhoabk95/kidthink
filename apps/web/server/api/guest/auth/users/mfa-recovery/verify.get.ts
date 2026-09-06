import crypto from "node:crypto";
import { auditLogs, getOwnerDb, mfaRecoveryRequests } from "@mindkid/db";
import { TokenExpiredError } from "@mindkid/errors/auth";
import { ValidationError } from "@mindkid/errors/common";
import { and, eq, gt } from "drizzle-orm";
import { defineEventHandler, getHeader, getQuery } from "h3";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const rawQuery =
    (event as unknown as { _query?: Record<string, unknown> })._query ||
    (event.context as { query?: Record<string, unknown> })?.query ||
    getQuery(event) ||
    {};
  const token =
    typeof (rawQuery as Record<string, unknown>)?.token === "string"
      ? ((rawQuery as Record<string, unknown>).token as string).trim()
      : "";

  if (!token) {
    throw ValidationError.field(
      "token",
      "Mã xác thực token không được để trống"
    );
  }

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
