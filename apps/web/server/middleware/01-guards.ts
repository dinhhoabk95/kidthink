import {
  canonicalizeRequestPath,
  resolveRequestBodySizeLimit,
} from "@mindkid/shared";
import { defineEventHandler, getRequestURL, type H3Event } from "h3";
import {
  assertRequestBodySize,
  assertSameOriginRequest,
} from "#server/utils/auth-runtime";
import { readBoundedRawBody } from "#server/utils/bounded-body";

/**
 * Middleware phổ quát bảo vệ request cho mọi `/api/*` — Task #264, BR-CSRF-02, BR-SEC-13.
 *
 * Thứ tự middleware của Nitro theo bảng chữ cái tên file (`scanDir` sắp `localeCompare`):
 * `00-cors` → `00-security-headers` → `01-guards` → `auth` → `consent-gate` → `rate-limit`.
 *
 * `01-guards` BẮT BUỘC chạy trước `auth` và `rate-limit`: từ chối rẻ (413 vượt trần kích thước,
 * 403 CSRF / cross-site) xảy ra trước khi đụng DB/Redis để resolve phiên và trước khi tiêu một
 * lượt bucket rate-limit (T3.1f, T3.1g, T3.1h). `00-security-headers` chạy đầu để mọi response,
 * kể cả lỗi bị từ chối sớm, đều mang header bảo mật.
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

/**
 * Request không khai `Content-Length` (chunked) thì header không nói lên kích thước thật:
 * đọc luồng và đếm byte thực, cắt ở trần (BR-SEC-13); thân đã đọc được gắn lại cho handler sau.
 */
async function assertActualBodySize(
  event: H3Event,
  maxBytes: number
): Promise<void> {
  // Đếm byte theo luồng, ném 413 ngay khi vượt trần — không buffer hết rồi mới so.
  await readBoundedRawBody(event, maxBytes);
}

export default defineEventHandler((event): Promise<void> | undefined => {
  const pathname = canonicalizeRequestPath(
    event.path || getRequestURL(event).pathname
  );

  if (!(pathname === "/api" || pathname.startsWith("/api/"))) {
    return undefined;
  }

  if (!isMutatingMethod(event.method)) {
    return undefined;
  }

  // Provider webhooks verify signatures in their service layer
  if (pathname.startsWith("/api/guest/webhooks/")) {
    return undefined;
  }

  // 1. Trần kích thước request body (T3.1d, BR-SEC-13)
  const maxBytes = resolveRequestBodySizeLimit(pathname);
  if (maxBytes !== null) {
    assertRequestBodySize(event, maxBytes);
    if (!event.node.req.headers["content-length"]) {
      // Chặn cross-site TRƯỚC khi đọc thân: không tốn tài nguyên đọc body của kẻ tấn công.
      assertSameOriginRequest(event);
      return assertActualBodySize(event, maxBytes);
    }
  }

  // 2. Kiểm tra same-origin / CSRF bảo vệ mutation (T3.1a, BR-CSRF-02, S1)
  assertSameOriginRequest(event);
});
