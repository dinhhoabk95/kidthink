import { getBrowserSessionService, requireUserAuth } from "@mindkid/auth";
import { activeSessions, getOwnerDb } from "@mindkid/db";
import { and, eq, isNull, ne } from "drizzle-orm";
import type { H3Event } from "h3";

/**
 * UC-004 BR-021: đổi mật khẩu từ một thiết bị chấm dứt mọi phiên khác — cả phiên
 * Redis (cơ chế xác thực thật) lẫn hàng `active_sessions` (danh sách thiết bị).
 */
export async function revokeOtherUserSessions(
  event: H3Event,
  now: Date = new Date()
): Promise<void> {
  const user = requireUserAuth(event);
  const { keptDeviceId } = await getBrowserSessionService().revokeOtherDevices(
    "user",
    user.user_id,
    user.session_id
  );
  const db = getOwnerDb();
  const sameUser = and(
    eq(activeSessions.accountType, "user"),
    eq(activeSessions.accountId, user.user_id),
    isNull(activeSessions.revokedAt)
  );
  await db
    .update(activeSessions)
    .set({ revokedAt: now })
    .where(
      keptDeviceId
        ? and(sameUser, ne(activeSessions.deviceId, keptDeviceId))
        : sameUser
    );
}

/**
 * UC-005 BR-003: đặt lại mật khẩu thu hồi mọi phiên và mọi khả năng ghi nhớ,
 * vì hệ thống không biết ai yêu cầu.
 */
export async function revokeAllUserSessions(userId: number): Promise<void> {
  await getBrowserSessionService().revokeAll({
    account_type: "user",
    account_id: userId,
  });
}
