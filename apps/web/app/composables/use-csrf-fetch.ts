import { useCookie } from "#imports";

/**
 * Header CSRF cho request đổi trạng thái tới `/api/users/*`.
 *
 * `requireWebUserSession` gọi `validateUserCsrf` **trước** `requireUserAuth`
 * (`server/utils/auth-runtime.ts`), nên thiếu header này là 403 chứ không phải
 * 401 — lỗi đó rất dễ đọc nhầm thành "chưa đăng nhập".
 *
 * Chỉ trả header chứ Cấm — NEVER bọc `$fetch`: Nitro suy kiểu response từ
 * chính đường dẫn route, một lớp bọc generic sẽ xoá mất suy kiểu đó và đẩy call
 * site vào chỗ phải ép kiểu.
 */
const CSRF_COOKIE_NAME = "tm_u_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

export function useCsrfHeaders() {
  const csrf = useCookie<string | null>(CSRF_COOKIE_NAME);

  function headers(): Record<string, string> {
    if (!csrf.value) {
      throw new Error(
        "Phiên bảo mật chưa sẵn sàng. Anh chị tải lại trang rồi thử lại giúp em nhé."
      );
    }
    return { [CSRF_HEADER_NAME]: csrf.value };
  }

  return { headers };
}
