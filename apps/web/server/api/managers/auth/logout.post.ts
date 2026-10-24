import { getBrowserSessionService } from "@mindkid/auth";
import { activeSessions, getOwnerDb } from "@mindkid/db";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, type H3Event } from "h3";
import {
  clearManagerRememberCookie,
  validateManagerCsrf,
} from "#server/utils/admin-auth-runtime";
import { getManagerSessionConfig } from "#server/utils/session-runtime";

/**
 * Logout tolerant có chủ đích (giữ nguyên hành vi trước Task #104): một phiên
 * đã hết hạn hoặc bị thu hồi vẫn còn cookie trên máy manager. Đòi phiên hợp lệ
 * ở đây sẽ trả 401 và **không** xoá cookie, khoá manager ở trạng thái nửa đăng
 * nhập mà chính họ không tự thoát được. CSRF vẫn bắt buộc — đó mới là thứ chặn
 * logout bị ép từ site khác.
 */
export async function handleLogout(event: H3Event) {
  validateManagerCsrf(event);

  const manager = event.context.manager;
  if (manager) {
    const deviceId = await getBrowserSessionService()
      .revokeSession("manager", manager.manager_id, manager.session_id)
      .catch(() => null);
    if (deviceId) {
      await getOwnerDb()
        .update(activeSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(activeSessions.accountType, "manager"),
            eq(activeSessions.accountId, manager.manager_id),
            eq(activeSessions.deviceId, deviceId),
            isNull(activeSessions.revokedAt)
          )
        )
        .catch(() => null);
    }
  }

  await clearUserSession(event, getManagerSessionConfig());
  clearManagerRememberCookie(event);

  return { success: true };
}

export default defineEventHandler((event) => handleLogout(event));
