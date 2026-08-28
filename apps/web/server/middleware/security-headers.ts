import { defineEventHandler, getRequestURL, setHeader } from "h3";

/**
 * `nuxt-security` sở hữu CSP của **trang**: plugin `70-securityHeaders` chạy ở
 * hook `render:response` và `setResponseHeader` đè mọi header đặt ở middleware.
 * Đo trên dev server 2026-08-28: response trang trả đúng chính sách trong
 * `nuxt.config.ts`, còn `Referrer-Policy` / `X-Frame-Options` của file này bị
 * thay bằng giá trị mặc định của module.
 *
 * Hook đó **không** chạy cho `/api/*` (không có render), nên đây là chỗ duy
 * nhất đặt CSP cho response JSON. Cấm — NEVER đặt lại CSP của trang ở đây:
 * hai chính sách mà một cái âm thầm thắng là cách chính sách thật trôi đi mà
 * không ai thấy.
 */
const JSON_RESPONSE_CSP =
  "default-src 'none'; base-uri 'none'; frame-ancestors 'none'";

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export default defineEventHandler((event) => {
  setHeader(event, "X-Content-Type-Options", "nosniff");
  setHeader(event, "X-Frame-Options", "DENY");
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");
  setHeader(
    event,
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  if (!import.meta.dev) {
    setHeader(
      event,
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  if (isApiPath(getRequestURL(event).pathname)) {
    setHeader(event, "Content-Security-Policy", JSON_RESPONSE_CSP);
  }
});
