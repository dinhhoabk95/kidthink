import { appError } from "@mindkid/auth";
import {
  enforceTwoAxisRateLimit,
  resolveRateLimitRouteClass,
} from "@mindkid/shared";
import { defineEventHandler, getRequestURL, setHeader } from "h3";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

/**
 * Giới hạn tần suất hai trục cho mọi route `/api/*` — RATE-LIMITING §3, §4.1,
 * `BR-RTL-01`, `BR-RTL-10`.
 *
 * Vì sao là middleware chứ không rải vào từng route: §7.2 khai 17 luật cho hơn
 * 280 route. Trước thay đổi này, 8 trong 16 lớp của registry **không route nào
 * gọi** — hạn mức tồn tại trên giấy còn `export:data` (5 IP/1 account mỗi 24h)
 * thực tế là không giới hạn.
 *
 * Thứ tự middleware của Nitro là theo tên file: `auth` → `consent-gate` →
 * `rate-limit`. Chạy sau `auth` là **bắt buộc**, vì trục account đọc
 * `event.context.user` / `event.context.manager` do `auth` đặt.
 */
function getAccountIdentifier(event: {
  context: { user?: { user_id?: number }; manager?: { manager_id?: number } };
}): string | undefined {
  const userId = event.context.user?.user_id;
  if (userId !== undefined) {
    return `u:${userId}`;
  }
  const managerId = event.context.manager?.manager_id;
  if (managerId !== undefined) {
    return `m:${managerId}`;
  }
  return;
}

export default defineEventHandler(async (event) => {
  const resolution = resolveRateLimitRouteClass(
    getRequestURL(event).pathname,
    event.method
  );

  // `in-route`: handler tự gọi vì trục account cần email trong body.
  // `exempt`: bốn lý do đã liệt kê ở §7.2, không phải nhánh mặc định.
  if (resolution.mode !== "middleware") {
    return;
  }

  const result = await enforceTwoAxisRateLimit({
    routeClass: resolution.className,
    remoteIp: getVerifiedRemoteIp(event),
    accountIdentifier: getAccountIdentifier(event),
  });

  if (result.statusCode === 200) {
    return;
  }

  const retryAfter = result.body?.details?.retry_after_s;
  if (retryAfter !== undefined) {
    // BR-RTL-03 — client cần biết chờ bao lâu.
    setHeader(event, "Retry-After", retryAfter);
    throw appError("RATE_LIMITED", { retry_after_s: retryAfter });
  }

  throw appError(
    result.statusCode === 429 ? "RATE_LIMITED" : "SERVICE_UNAVAILABLE"
  );
});
