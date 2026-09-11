import { resolveRequestBodySizeLimit } from "@mindkid/shared";
import { defineEventHandler, getRequestURL } from "h3";
import {
  assertRequestBodySize,
  assertSameOriginRequest,
} from "#server/utils/auth-runtime-factory";

/**
 * Middleware phổ quát bảo vệ request cho mọi `/api/*` — Task #264, BR-CSRF-02, BR-SEC-03.
 *
 * Thứ tự middleware của Nitro theo bảng chữ cái tên file:
 * `auth` → `consent-gate` → `guards` → `rate-limit` → `security-headers`.
 *
 * `guards` BẮT BUỘC chạy trước `rate-limit` để từ chối request vượt trần kích thước (413)
 * trước khi tiêu một lượt bucket rate-limit (T3.1f), và chặn CSRF / cross-site (403)
 * trước khi vào handler nghiệp vụ (T3.1g, T3.1h).
 */
const MUTATING_METHODS: ReadonlySet<string> = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

function isMutatingMethod(method: string | undefined): boolean {
  return (
    typeof method === "string" && MUTATING_METHODS.has(method.toUpperCase())
  );
}

export default defineEventHandler((event) => {
  const url = getRequestURL(event);
  const pathname = url.pathname;

  if (!(pathname === "/api" || pathname.startsWith("/api/"))) {
    return;
  }

  if (!isMutatingMethod(event.method)) {
    return;
  }

  // Provider webhooks verify signatures in their service layer
  if (pathname.startsWith("/api/guest/webhooks/")) {
    return;
  }

  // 1. Trần kích thước request body (T3.1d, BR-SEC-03)
  const maxBytes = resolveRequestBodySizeLimit(pathname);
  if (maxBytes !== null) {
    assertRequestBodySize(event, maxBytes);
  }

  // 2. Kiểm tra same-origin / CSRF bảo vệ mutation (T3.1a, BR-CSRF-02, S1)
  assertSameOriginRequest(event);
});
