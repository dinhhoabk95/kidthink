import { getBrowserSessionService } from "@mindkid/auth";
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
    await getBrowserSessionService()
      .revokeAll({
        account_type: "manager",
        account_id: manager.manager_id,
      })
      .catch(() => null);
  }

  await clearUserSession(event, getManagerSessionConfig());
  clearManagerRememberCookie(event);

  return { success: true };
}

export default defineEventHandler((event) => handleLogout(event));
