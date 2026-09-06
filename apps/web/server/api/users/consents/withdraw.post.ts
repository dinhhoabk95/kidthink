import { childProfiles, consentLogs, getOwnerDb } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, deleteCookie, getHeader, readBody } from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { executeArchiveChildProfile } from "#server/utils/child-archive-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

const WithdrawConsentSchema = z
  .object({
    consent_type: z.enum(["terms", "privacy", "child_data"]),
    confirm: z.literal(true),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 8 * 1024);
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  // Require recent reauth (≤ 5 min)
  requireReauth(event);

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

  const parsed = WithdrawConsentSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError(
      "Yêu cầu rút đồng ý không hợp lệ hoặc thiếu xác nhận."
    );
  }

  const { consent_type: consentType } = parsed.data;
  const ipAddress = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") || "unknown";
  const now = new Date();

  const db = getOwnerDb();

  // BR-CSM-01: INSERT-only record into consent_logs
  await db.insert(consentLogs).values({
    userId,
    consentType,
    action: "withdrawn",
    ipAddress,
    userAgent,
    createdAt: now,
  });

  if (consentType === "child_data") {
    const purgeAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Find all active child profiles belonging to user
    const children = await db
      .select({ id: childProfiles.id, uuid: childProfiles.uuid })
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.userId, userId),
          eq(childProfiles.status, "active")
        )
      );

    // D-IG & BR-CSM-06: Use canonical executeArchiveChildProfile to archive child profiles with 30-day grace
    for (const child of children) {
      await executeArchiveChildProfile({
        childId: child.id,
        userId,
        reason: "consent_withdrawn",
        purgeAt,
      });
    }

    // Clear active_child_id cookie
    deleteCookie(event, "active_child_id", { path: "/" });

    return {
      consent_type: "child_data" as const,
      status: "withdrawn" as const,
      consequence: `Đã rút đồng ý thu thập dữ liệu trẻ em. ${children.length} hồ sơ trẻ đã được chuyển sang trạng thái lưu trữ trong 30 ngày.`,
      archived_children_count: children.length,
      grace_period_days: 30,
      purge_at: purgeAt.toISOString(),
    };
  }

  // Terms or privacy withdrawal leads to account deletion
  return {
    consent_type: consentType,
    status: "withdrawn" as const,
    consequence:
      "Từ chối điều khoản yêu cầu xoá tài khoản. Vui lòng hoàn tất tại trang Xoá tài khoản.",
    deletion_url: "/me/settings/delete",
  };
});
