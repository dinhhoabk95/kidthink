import type { RouteClassName } from "./rate-limiting.js";

/**
 * Lý do một path được miễn giới hạn. Danh sách này là **đóng**: `BR-RTL-10` cấm
 * nhánh mặc định không giới hạn, nên mọi trường hợp miễn phải có tên và có dòng
 * tương ứng trong `docs/specs/01-platform/rate-limiting.md` §7.2.
 */
export type RateLimitExemptReason =
  | "not-api"
  | "provider-webhook"
  | "health-probe"
  | "unclassified-user-route";

export type RateLimitRouteResolution =
  | { mode: "middleware"; className: RouteClassName }
  | { mode: "in-route"; className: RouteClassName }
  | { mode: "exempt"; reason: RateLimitExemptReason };

const ORDER_PROOF_PATH = /^\/api\/users\/orders\/[^/]+\/proof$/;
const PLAY_EVENTS_PATH =
  /^\/api\/(?:users|guest)\/play-sessions\/[^/]+\/events$/;
const TRAILING_SLASH = /\/+$/;

/** Bỏ query và slash cuối để một path chỉ có đúng một dạng chuẩn. */
export function normalizeRateLimitPath(rawPath: string): string {
  const withoutQuery = rawPath.split("?")[0] ?? "";
  const trimmed = withoutQuery.replace(TRAILING_SLASH, "");
  return trimmed || "/";
}

/**
 * Route tự gọi `enforceTwoAxisRateLimit` trong handler vì trục account cần email
 * nằm trong body — middleware không đọc body. Trả `in-route` để middleware bỏ
 * qua thay vì tiêu thêm một lượt trên cùng bucket.
 *
 * Danh sách này là **đúng những handler đang gọi**, không phải cả cây
 * `/api/guest/auth/`. Sáu route auth còn lại không gọi gì cả và được middleware
 * phủ ở `resolveGuestAuthRoute` — trong đó `reset-password` là bề mặt dò mã
 * đặt lại mật khẩu.
 */
const IN_ROUTE_CLASSES: Readonly<Record<string, RouteClassName>> = {
  "/api/guest/auth/users/login": "auth:login",
  "/api/guest/auth/managers/login": "auth:login",
  "/api/guest/auth/users/register": "auth:register",
  "/api/guest/auth/users/forgot-password": "auth:forgot-password",
  "/api/guest/auth/users/social-login": "auth:social-login",
  "/api/guest/auth/managers/mfa": "auth:mfa",
  "/api/guest/auth/managers/mfa-setup": "auth:mfa",
  "/api/users/auth/resend-verification": "auth:forgot-password",
};

const OAUTH_START_PATH = /^\/api\/guest\/auth\/oauth\/[^/]+\/start$/;
const OAUTH_CALLBACK_PATH = /^\/api\/guest\/auth\/oauth\/[^/]+\/callback$/;

function resolveInRoute(path: string): RateLimitRouteResolution | null {
  const className = IN_ROUTE_CLASSES[path];
  if (className) {
    return { mode: "in-route", className };
  }
  if (OAUTH_START_PATH.test(path)) {
    return { mode: "in-route", className: "auth:oauth:start" };
  }
  if (OAUTH_CALLBACK_PATH.test(path)) {
    return { mode: "in-route", className: "auth:oauth:callback" };
  }
  return null;
}

/** Route auth không tự giới hạn: middleware phủ, trục IP là trục duy nhất. */
const GUEST_AUTH_CLASSES: Readonly<Record<string, RouteClassName>> = {
  "/api/guest/auth/users/mfa": "auth:mfa",
  "/api/guest/auth/users/mfa-recovery/verify": "auth:mfa",
  "/api/guest/auth/users/reset-password": "auth:forgot-password",
  "/api/guest/auth/users/verify-email": "auth:forgot-password",
  "/api/guest/auth/verify-email-change": "auth:forgot-password",
  "/api/guest/auth/oauth/providers": "read:public",
};

function resolveGuestAuthRoute(path: string): RateLimitRouteResolution | null {
  const className = GUEST_AUTH_CLASSES[path];
  return className ? { mode: "middleware", className } : null;
}

function resolveExempt(path: string): RateLimitRouteResolution | null {
  if (!(path === "/api" || path.startsWith("/api/"))) {
    return { mode: "exempt", reason: "not-api" };
  }
  if (path.startsWith("/api/guest/webhooks/")) {
    return { mode: "exempt", reason: "provider-webhook" };
  }
  if (path === "/api/guest/health") {
    return { mode: "exempt", reason: "health-probe" };
  }
  return null;
}

function resolveSessionRoute(path: string): RateLimitRouteResolution | null {
  if (
    path === "/api/users/auth/restore" ||
    path === "/api/managers/auth/restore"
  ) {
    return { mode: "middleware", className: "auth:refresh" };
  }
  if (
    path === "/api/users/auth/reauth" ||
    path === "/api/managers/auth/reauth"
  ) {
    return { mode: "middleware", className: "auth:login" };
  }
  return null;
}

function resolveManagerRoute(
  path: string,
  method: string
): RateLimitRouteResolution | null {
  if (!(path === "/api/managers" || path.startsWith("/api/managers/"))) {
    return null;
  }
  if (path === "/api/managers/images" && method === "POST") {
    return { mode: "middleware", className: "upload:image" };
  }
  return { mode: "middleware", className: "managers:*" };
}

function resolveUserRoute(
  path: string,
  method: string
): RateLimitRouteResolution | null {
  if (path === "/api/users/orders" && method === "POST") {
    return { mode: "middleware", className: "payment:create" };
  }
  if (ORDER_PROOF_PATH.test(path) && method === "POST") {
    return { mode: "middleware", className: "payment:proof" };
  }
  if (path === "/api/users/ai/search") {
    return { mode: "middleware", className: "search" };
  }
  if (path === "/api/users/data-export") {
    return { mode: "middleware", className: "export:data" };
  }
  if (path === "/api/users/exports" && method === "POST") {
    return { mode: "middleware", className: "export:data" };
  }
  return null;
}

/**
 * Suy lớp giới hạn từ path, theo đúng thứ tự luật ở
 * `docs/specs/01-platform/rate-limiting.md` §7.2 (`BR-RTL-10`).
 *
 * Hàm này **luôn** trả một kết quả: không có nhánh `undefined`, và nhánh đáy là
 * `read:public` chứ không phải "không giới hạn".
 */
export function resolveRateLimitRouteClass(
  rawPath: string,
  rawMethod = "GET"
): RateLimitRouteResolution {
  const path = normalizeRateLimitPath(rawPath);
  const method = rawMethod.toUpperCase();

  const exempt = resolveExempt(path);
  if (exempt) {
    return exempt;
  }

  const inRoute = resolveInRoute(path);
  if (inRoute) {
    return inRoute;
  }

  const guestAuth = resolveGuestAuthRoute(path);
  if (guestAuth) {
    return guestAuth;
  }

  const session = resolveSessionRoute(path);
  if (session) {
    return session;
  }

  const manager = resolveManagerRoute(path, method);
  if (manager) {
    return manager;
  }

  if (PLAY_EVENTS_PATH.test(path) && method === "POST") {
    return { mode: "middleware", className: "play:events" };
  }

  const user = resolveUserRoute(path, method);
  if (user) {
    return user;
  }

  if (path.startsWith("/api/guest/")) {
    return { mode: "middleware", className: "read:public" };
  }
  if (path === "/api/users" || path.startsWith("/api/users/")) {
    return { mode: "exempt", reason: "unclassified-user-route" };
  }
  return { mode: "middleware", className: "read:public" };
}
