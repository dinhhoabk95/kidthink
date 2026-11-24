import { useCookie } from "#imports";

/**
 * Header bảo mật cho request đổi trạng thái tới `/api/users/*`.
 *
 * Dưới kiến trúc Better Auth (`BR-AUT-41`), server xác thực `Origin` /
 * `Sec-Fetch-Site` tại `middleware/guards.ts`. Composable giữ tương thích ngược
 * cho các call-site hiện hữu; nếu môi trường test có sẵn cookie `tm_u_csrf`
 * thì đính kèm, còn mặc định trả `{}` để không chặn request hợp lệ cùng origin.
 */
const CSRF_COOKIE_NAME = "tm_u_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

export function useCsrfHeaders() {
  const csrf = useCookie<string | null>(CSRF_COOKIE_NAME);

  function headers(): Record<string, string> {
    if (csrf.value) {
      return { [CSRF_HEADER_NAME]: csrf.value };
    }
    return {};
  }

  return { headers };
}
