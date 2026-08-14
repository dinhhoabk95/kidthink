import { AppError } from "@kidthink/auth";
import { childProfiles, consentLogs, getOwnerDb } from "@kidthink/db";
import { CONSENT_POLICY_MAP } from "@kidthink/shared";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  deleteCookie,
  getHeader,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  getVerifiedRemoteIp,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";
import { executeArchiveChildProfile } from "../../../utils/child-archive-runtime.js";

const WithdrawConsentSchema = z
  .object({
    consent_type: z.enum(["terms", "privacy", "child_data"]),
    confirm: z.literal(true),
  })
  .strict();

export default defineEventHandler(async (event) => {
  try {
    assertRequestBodySize(event, 8 * 1024);
    const userSession = await requireWebUserSession(event);
    const userId = Number(userSession.user_id);

    const eventBody = (event.context as { body?: Record<string, unknown> })
      ?.body;
    const rawBody =
      eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

    const parsed = WithdrawConsentSchema.safeParse(rawBody);
    if (!parsed.success) {
      setResponseStatus(event, 422);
      throw createError({
        statusCode: 422,
        statusMessage: "VALIDATION_FAILED",
        data: {
          code: "VALIDATION_FAILED",
          message: "Yêu cầu rút đồng ý không hợp lệ hoặc thiếu xác nhận.",
        },
      });
    }

    const { consent_type: consentType } = parsed.data;

    // Withdrawing terms or privacy must be performed via account deletion
    if (consentType === "terms" || consentType === "privacy") {
      setResponseStatus(event, 400);
      throw createError({
        statusCode: 400,
        statusMessage: "WITHDRAWAL_REQUIRES_ACCOUNT_DELETION",
        data: {
          code: "WITHDRAWAL_REQUIRES_ACCOUNT_DELETION",
          message:
            "Rút đồng ý điều khoản hoặc quyền riêng tư tương đương yêu cầu xoá tài khoản. Vui lòng thực hiện tại trang Xoá tài khoản.",
          deletion_url: "/me/settings/delete",
        },
      });
    }

    const ipAddress = getVerifiedRemoteIp(event);
    const userAgent = getHeader(event, "user-agent") || "unknown";
    const now = new Date();
    const purgeAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const db = getOwnerDb();

    // BR-CSM-01: INSERT-only record into consent_logs
    await db.insert(consentLogs).values({
      userId,
      consentType: "child_data_withdrawn",
      policyVersion: CONSENT_POLICY_MAP.child_data.currentVersion,
      ipAddress,
      userAgent,
      createdAt: now,
    });

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
      status: "withdrawn",
      archived_children_count: children.length,
      grace_period_days: 30,
      purge_at: purgeAt.toISOString(),
      message: `Đã rút đồng ý thu thập dữ liệu trẻ em. ${children.length} hồ sơ trẻ đã được chuyển sang trạng thái lưu trữ trong 30 ngày.`,
    };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: err.toResponse(),
      });
    }
    return respondToUserAuthError(event, err);
  }
});
