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
const MULTIPLE_SLASHES = /\/{2,}/g;
const TRAILING_SLASH = /\/+$/;
const DECODE_TOKEN_RE = /(%(?:25|2[fF]))|((?:%(?!25|2[fF])[0-9a-fA-F]{2})+)/g;
const SINGLE_HEX_RE = /%[0-9a-fA-F]{2}/g;

function decodePercentSequence(seq: string): string {
  try {
    return decodeURIComponent(seq);
  } catch {
    return seq.replace(SINGLE_HEX_RE, (token) => {
      try {
        return decodeURIComponent(token);
      } catch {
        return token;
      }
    });
  }
}

/** Giải mã path theo quy tắc `_decodePath` của h3/ufo: giữ nguyên `%25`, `%2f`, `%2F`. */
function decodeUrlPath(rawPath: string): string {
  return rawPath.replace(
    DECODE_TOKEN_RE,
    (
      match: string,
      preserved: string | undefined,
      encodedSeq: string | undefined
    ) => {
      if (preserved) {
        return preserved;
      }
      return encodedSeq ? decodePercentSequence(encodedSeq) : match;
    }
  );
}

/** Chuẩn hóa pathname request: bỏ query/hash, giải mã percent-encoding an toàn, gộp `//`, bỏ slash cuối. */
export function canonicalizeRequestPath(pathname: string): string {
  const qIndex = pathname.indexOf("?");
  const hIndex = pathname.indexOf("#");
  let cutIndex = pathname.length;
  if (qIndex !== -1 && qIndex < cutIndex) {
    cutIndex = qIndex;
  }
  if (hIndex !== -1 && hIndex < cutIndex) {
    cutIndex = hIndex;
  }
  const withoutQueryOrHash = pathname.slice(0, cutIndex);
  const decoded = decodeUrlPath(withoutQueryOrHash);
  const collapsed = decoded.replace(MULTIPLE_SLASHES, "/");
  const trimmed = collapsed.replace(TRAILING_SLASH, "");
  return trimmed || "/";
}

/** Bỏ query và slash cuối để một path chỉ có đúng một dạng chuẩn. */
export function normalizeRateLimitPath(rawPath: string): string {
  return canonicalizeRequestPath(rawPath);
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
export const IN_ROUTE_CLASSES: Readonly<Record<string, RouteClassName>> = {
  "/api/auth/users/sign-in/email": "auth:login",
  "/api/auth/managers/sign-in/email": "auth:login",
  "/api/auth/users/sign-up/email": "auth:register",
  "/api/auth/users/request-password-reset": "auth:forgot-password",
  "/api/users/account/delete/cancel": "auth:login",
};

const BETTER_AUTH_OAUTH_CALLBACK_PATH = /^\/api\/auth\/users\/callback\/[^/]+$/;
const BETTER_AUTH_MFA_OR_PASSKEY_PATH =
  /^\/api\/auth\/(?:users|managers)\/(?:two-factor|passkey)(?:\/|$)/;
const BETTER_AUTH_SESSION_OPS_PATH =
  /^\/api\/auth\/(?:users|managers)\/(?:get-session|list-sessions|sign-out|revoke-session|revoke-sessions|revoke-other-sessions)$/;
const BETTER_AUTH_SIGN_IN_PATH =
  /^\/api\/auth\/(?:users|managers)\/sign-in(?:\/|$)/;
const BETTER_AUTH_SIGN_UP_PATH =
  /^\/api\/auth\/(?:users|managers)\/sign-up(?:\/|$)/;
const BETTER_AUTH_PASSWORD_RESET_PATH =
  /^\/api\/auth\/(?:users|managers)\/(?:request-password-reset|forget-password|forgot-password|reset-password|verify-email|send-verification-email)(?:\/|$)/;

function resolveInRoute(path: string): RateLimitRouteResolution | null {
  const className = IN_ROUTE_CLASSES[path];
  return className ? { mode: "in-route", className } : null;
}

/** Route auth không tự giới hạn: middleware phủ, trục IP là trục duy nhất. */
export const GUEST_AUTH_CLASSES: Readonly<Record<string, RouteClassName>> = {
  "/api/auth/users/reset-password": "auth:forgot-password",
  "/api/auth/users/verify-email": "auth:forgot-password",
  "/api/auth/users/send-verification-email": "auth:forgot-password",
  "/api/auth/users/sign-in/social": "auth:oauth:start",
  "/api/auth/users/link-social": "auth:oauth:start",
  "/api/guest/auth/users/social-consent": "auth:social-login",
  "/api/guest/auth/users/mfa-recovery/verify": "auth:mfa",
  "/api/guest/auth/verify-email-change": "auth:forgot-password",
  "/api/guest/auth/oauth/providers": "read:public",
};

function resolveGuestAuthRoute(path: string): RateLimitRouteResolution | null {
  const className = GUEST_AUTH_CLASSES[path];
  if (className) {
    return { mode: "middleware", className };
  }
  if (BETTER_AUTH_OAUTH_CALLBACK_PATH.test(path)) {
    return { mode: "middleware", className: "auth:oauth:callback" };
  }
  if (BETTER_AUTH_MFA_OR_PASSKEY_PATH.test(path)) {
    return { mode: "middleware", className: "auth:mfa" };
  }
  if (BETTER_AUTH_SESSION_OPS_PATH.test(path)) {
    return { mode: "middleware", className: "auth:refresh" };
  }
  if (BETTER_AUTH_SIGN_IN_PATH.test(path)) {
    return { mode: "middleware", className: "auth:login" };
  }
  if (BETTER_AUTH_SIGN_UP_PATH.test(path)) {
    return { mode: "middleware", className: "auth:register" };
  }
  if (BETTER_AUTH_PASSWORD_RESET_PATH.test(path)) {
    return { mode: "middleware", className: "auth:forgot-password" };
  }
  if (path === "/api/auth" || path.startsWith("/api/auth/")) {
    return { mode: "middleware", className: "auth:login" };
  }
  return null;
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

export const SESSION_ROUTE_CLASSES: Readonly<Record<string, RouteClassName>> = {
  "/api/users/auth/reauth": "auth:login",
  "/api/managers/auth/reauth": "auth:login",
};

function resolveSessionRoute(path: string): RateLimitRouteResolution | null {
  const className = SESSION_ROUTE_CLASSES[path];
  return className ? { mode: "middleware", className } : null;
}

function resolveManagerRoute(path: string): RateLimitRouteResolution | null {
  if (!(path === "/api/managers" || path.startsWith("/api/managers/"))) {
    return null;
  }
  return { mode: "middleware", className: "managers:*" };
}

export interface UserLiteralRateLimitRule {
  /** `*` = mọi method. */
  readonly method: string;
  readonly path: string;
  readonly className: RouteClassName;
}

/** Path `/api/users/*` khớp đúng chuỗi; mỗi dòng phải trỏ về một route thật (gate `rate-limit-coverage`). */
export const USER_LITERAL_RULES: readonly UserLiteralRateLimitRule[] = [
  { method: "POST", path: "/api/users/orders", className: "payment:create" },
  {
    method: "POST",
    path: "/api/users/subscriptions/recurring/opt-in",
    className: "payment:create",
  },
  { method: "POST", path: "/api/users/offline/sync", className: "play:events" },
  {
    method: "POST",
    path: "/api/users/notification-endpoints",
    className: "search",
  },
  { method: "PUT", path: "/api/users/password", className: "auth:login" },
  { method: "POST", path: "/api/users/password", className: "auth:login" },
  { method: "POST", path: "/api/users/email", className: "auth:login" },
  {
    method: "POST",
    path: "/api/users/account/delete",
    className: "auth:login",
  },
  { method: "*", path: "/api/users/data-export", className: "export:data" },
  { method: "POST", path: "/api/users/exports", className: "export:data" },
];

/** Tiền tố `/api/users/*` — mỗi tiền tố phải có ít nhất một route thật bên dưới. */
export const USER_PREFIX_RULES: ReadonlyArray<{
  readonly prefix: string;
  readonly className: RouteClassName;
}> = [
  { prefix: "/api/users/parent-gate", className: "auth:mfa" },
  { prefix: "/api/users/ai", className: "search" },
];

function resolveUserRoute(
  path: string,
  method: string
): RateLimitRouteResolution | null {
  const literal = USER_LITERAL_RULES.find(
    (rule) =>
      rule.path === path && (rule.method === "*" || rule.method === method)
  );
  if (literal) {
    return { mode: "middleware", className: literal.className };
  }
  if (ORDER_PROOF_PATH.test(path) && method === "POST") {
    return { mode: "middleware", className: "payment:proof" };
  }
  const prefixed = USER_PREFIX_RULES.find(
    (rule) => path === rule.prefix || path.startsWith(`${rule.prefix}/`)
  );
  if (prefixed) {
    return { mode: "middleware", className: prefixed.className };
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

  const manager = resolveManagerRoute(path);
  if (manager) {
    return manager;
  }

  // BR-ING-07: rate limit riêng, rộng (600/IP · 300/account) cho route nhận event.
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
export const ORDER_PROOF_BODY_LIMIT_BYTES =
  1_572_864 + MULTIPART_TRANSPORT_OVERHEAD_BYTES; // 1,5 MiB + 64 KiB (PROOF_MAX_IMAGE_SIZE_BYTES, C1)

export const ROUTE_BODY_SIZE_LIMITS: Readonly<Record<string, number>> = {
  "/api/guest/auth/users/register": 32 * 1024,
};

const BODY_SIZE_PATTERNS: ReadonlyArray<{ pattern: RegExp; limit: number }> = [
  { pattern: ORDER_PROOF_PATH, limit: ORDER_PROOF_BODY_LIMIT_BYTES },
  { pattern: PLAY_EVENTS_PATH, limit: 64 * 1024 },
  { pattern: /^\/api\/users\/offline\/sync$/, limit: 64 * 1024 },
  { pattern: /^\/api\/users\/notification-endpoints$/, limit: 8 * 1024 },
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
  {
    pattern: /^\/api\/users\/play\/(?:mascot-gear|sticker-diorama)$/,
    limit: 16 * 1024,
  },
  { pattern: /^\/api\/guest\/auth\//, limit: 16 * 1024 },
  { pattern: /^\/api\/auth\/(?:users|managers)\//, limit: 32 * 1024 },
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
