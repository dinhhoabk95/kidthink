import { PayloadTooLargeError } from "@mindkid/errors/common";
import {
  canonicalizeRequestPath,
  resolveRequestBodySizeLimit,
} from "@mindkid/shared";
import {
  defineEventHandler,
  getRequestURL,
  type H3Event,
  readRawBody,
} from "h3";
import {
  assertRequestBodySize,
  assertSameOriginRequest,
} from "#server/utils/auth-runtime";

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

/**
 * Request không khai `Content-Length` (chunked) thì header không nói lên kích thước thật:
 * đọc thân thô (h3 v1 cache lại cho handler phía sau) rồi đo byte thực (BR-SEC-13).
 */
async function assertActualBodySize(
  event: H3Event,
  maxBytes: number
): Promise<void> {
  const raw = await readRawBody(event, false);
  if (raw && raw.byteLength > maxBytes) {
    throw new PayloadTooLargeError();
  }
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

  // 1. Trần kích thước request body (T3.1d, BR-SEC-03)
  const maxBytes = resolveRequestBodySizeLimit(pathname);
  if (maxBytes !== null) {
    assertRequestBodySize(event, maxBytes);
    if (!event.node.req.headers["content-length"]) {
      return assertActualBodySize(event, maxBytes).then(() =>
        assertSameOriginRequest(event)
      );
    }
  }

  // 2. Kiểm tra same-origin / CSRF bảo vệ mutation (T3.1a, BR-CSRF-02, S1)
  assertSameOriginRequest(event);
});
