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

export const DEFAULT_REQUEST_BODY_SIZE_BYTES = 128 * 1024; // 128 KiB (Task #264)
export const MULTIPART_TRANSPORT_OVERHEAD_BYTES = 64 * 1024; // 64 KiB buffer cho multipart headers
export const MANAGER_IMAGE_BODY_LIMIT_BYTES =
  2 * 1024 * 1024 + MULTIPART_TRANSPORT_OVERHEAD_BYTES; // 2 MiB + 64 KiB (BR-IMG-04, I2)
export const ORDER_PROOF_BODY_LIMIT_BYTES =
  5 * 1024 * 1024 + MULTIPART_TRANSPORT_OVERHEAD_BYTES; // 5 MiB + 64 KiB (PROOF_MAX_IMAGE_SIZE_BYTES, C1)

export const ROUTE_BODY_SIZE_LIMITS: Readonly<Record<string, number>> = {
  "/api/managers/images": MANAGER_IMAGE_BODY_LIMIT_BYTES,
  "/api/guest/auth/users/register": 32 * 1024,
};

const BODY_SIZE_PATTERNS: ReadonlyArray<{ pattern: RegExp; limit: number }> = [
  { pattern: ORDER_PROOF_PATH, limit: ORDER_PROOF_BODY_LIMIT_BYTES },
  { pattern: PLAY_EVENTS_PATH, limit: 64 * 1024 },
  { pattern: /^\/api\/users\/consents(?:\/withdraw)?$/, limit: 8 * 1024 },
  { pattern: /^\/api\/managers\/legal-consent-forces$/, limit: 8 * 1024 },
  { pattern: /^\/api\/users\/(?:password|email)$/, limit: 8 * 1024 },
  { pattern: /^\/api\/(?:users|managers)\/auth\/reauth$/, limit: 8 * 1024 },
  { pattern: /^\/api\/users\/account\/delete\/cancel$/, limit: 8 * 1024 },
  { pattern: /^\/api\/users\/parent-gate\/verify$/, limit: 8 * 1024 },
  { pattern: /^\/api\/guest\/auth\/verify-email-change$/, limit: 8 * 1024 },
  { pattern: /^\/api\/users\/notification-preferences$/, limit: 8 * 1024 },
  {
    pattern:
      /^\/api\/users\/children\/[^/]+\/(?:curriculum\/complete-item|enrollments|grant-extra-time)$/,
    limit: 8 * 1024,
  },
  { pattern: /^\/api\/users\/children\/[^/]+$/, limit: 16 * 1024 },
  {
    pattern: /^\/api\/users\/children\/[^/]+\/(?:activate|settings)$/,
    limit: 16 * 1024,
  },
  { pattern: /^\/api\/users\/children$/, limit: 16 * 1024 },
  { pattern: /^\/api\/users\/profile$/, limit: 16 * 1024 },
  {
    pattern: /^\/api\/(?:guest|users)\/play-sessions\/[^/]+\/complete$/,
    limit: 16 * 1024,
  },
  { pattern: /^\/api\/guest\/auth\//, limit: 16 * 1024 },
];

export function resolveRequestBodySizeLimit(path: string): number | null {
  const normalized = normalizeRateLimitPath(path);
  if (normalized.startsWith("/api/guest/webhooks/")) {
    return null; // Exempt provider webhooks
  }
  const explicit = ROUTE_BODY_SIZE_LIMITS[normalized];
  if (explicit !== undefined) {
    return explicit;
  }
  for (const entry of BODY_SIZE_PATTERNS) {
    if (entry.pattern.test(normalized)) {
      return entry.limit;
    }
  }
  return DEFAULT_REQUEST_BODY_SIZE_BYTES;
}
