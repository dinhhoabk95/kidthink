import { requireUserAuth } from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import { RestrictedModeError } from "@mindkid/errors/auth";
import { NoActiveChildError } from "@mindkid/errors/child";
import { getCookie, getHeader, type H3Event, setCookie } from "h3";
import {
  createAuthRuntime,
  assertRateLimitAllowed as factoryAssertRateLimitAllowed,
  assertRequestBodySize as factoryAssertRequestBodySize,
  assertSameOriginRequest as factoryAssertSameOriginRequest,
  isAllowedApiOrigin as factoryIsAllowedApiOrigin,
} from "./auth-runtime-factory.js";

export const assertRateLimitAllowed = factoryAssertRateLimitAllowed;
export const assertRequestBodySize = factoryAssertRequestBodySize;
export const assertSameOriginRequest = factoryAssertSameOriginRequest;
export const isAllowedApiOrigin = factoryIsAllowedApiOrigin;

export const USER_REMEMBER_COOKIE = "tm_u_remember";
export const MANAGER_REMEMBER_COOKIE = "tm_m_remember";

const DEFAULT_TRUSTED_PROXY_IPS = "127.0.0.1,::1";
const IPV4_MAPPED_PREFIX = "::ffff:";

interface TrustedProxyConfig {
  readonly raw: string;
  readonly exact: ReadonlySet<string>;
  readonly cidrs: readonly string[];
}

let trustedProxyCache: TrustedProxyConfig | null = null;
let hasLoggedFirstPeerIp = false;

/** Node báo IPv4 qua socket IPv6 dưới dạng `::ffff:127.0.0.1`. */
function normalizeIp(value: string | undefined): string {
  const trimmed = (value ?? "").trim().toLowerCase();
  return trimmed.startsWith(IPV4_MAPPED_PREFIX)
    ? trimmed.slice(IPV4_MAPPED_PREFIX.length)
    : trimmed;
}

function parseIpv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }
  let num = 0;
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) {
      return null;
    }
    // biome-ignore lint/suspicious/noBitwiseOperators: IPv4 calculation
    num = (num << 8) + n;
  }
  // biome-ignore lint/suspicious/noBitwiseOperators: IPv4 calculation
  return num >>> 0;
}

function matchesCidr(ip: string, cidr: string): boolean {
  const [range, prefixStr] = cidr.split("/");
  if (!(range && prefixStr)) {
    return false;
  }
  const prefix = Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }
  const ipNum = parseIpv4ToNumber(ip);
  const rangeNum = parseIpv4ToNumber(range);
  if (ipNum === null || rangeNum === null) {
    return false;
  }
  if (prefix === 0) {
    return true;
  }
  // biome-ignore lint/suspicious/noBitwiseOperators: CIDR mask calculation
  const mask = (0xff_ff_ff_ff << (32 - prefix)) >>> 0;
  // biome-ignore lint/suspicious/noBitwiseOperators: CIDR mask calculation
  return (ipNum & mask) === (rangeNum & mask);
}

function getTrustedProxyIps(): TrustedProxyConfig {
  const raw =
    process.env.TRUSTED_PROXY_IPS?.trim() || DEFAULT_TRUSTED_PROXY_IPS;
  if (trustedProxyCache?.raw === raw) {
    return trustedProxyCache;
  }
  const items = raw
    .split(",")
    .map((item) => normalizeIp(item))
    .filter((item) => item.length > 0);

  const exact = new Set<string>();
  const cidrs: string[] = [];

  for (const item of items) {
    if (item.includes("/")) {
      cidrs.push(item);
    } else {
      exact.add(item);
    }
  }

  trustedProxyCache = { raw, exact, cidrs };
  return trustedProxyCache;
}

function isTrustedProxy(socketIp: string): boolean {
  const config = getTrustedProxyIps();
  if (config.exact.has(socketIp)) {
    return true;
  }
  for (const cidr of config.cidrs) {
    if (matchesCidr(socketIp, cidr)) {
      return true;
    }
  }
  return false;
}

function logFirstPeerIpOnce(socketIp: string, isTrusted: boolean): void {
  if (hasLoggedFirstPeerIp) {
    return;
  }
  hasLoggedFirstPeerIp = true;
  console.info(
    `[proxy-ip:startup] First peer IP observed: "${socketIp}", in TRUSTED_PROXY_IPS: ${isTrusted}`
  );
}

/**
 * BR-RTL-11 — IP dùng cho giới hạn tần suất.
 *
 * nginx là edge và proxy tới loopback, đặt `X-Real-IP $remote_addr`
 * (`infra/nginx/mindkid-proxy.conf:8`). Nếu chỉ đọc địa chỉ socket thì mọi
 * request trong production đều là `127.0.0.1` và trục IP sụp thành một bucket
 * toàn cục. Nhưng header chỉ đáng tin khi **peer là proxy đã cấu hình** — đọc
 * nó vô điều kiện là để client tự khai IP.
 *
 * Cấm — NEVER đọc `X-Forwarded-For`: nó nối thêm được từ phía client.
 */
export function getVerifiedRemoteIp(event: H3Event): string {
  const request = event.node?.req as
    | { socket?: { remoteAddress?: string } }
    | undefined;
  const socketIp = normalizeIp(request?.socket?.remoteAddress);
  if (!socketIp) {
    return "unknown";
  }
  const trusted = isTrustedProxy(socketIp);
  logFirstPeerIpOnce(socketIp, trusted);
  if (!trusted) {
    return socketIp;
  }
  return normalizeIp(getHeader(event, "x-real-ip")) || socketIp;
}

const userRuntime = createAuthRuntime("user");

export const {
  ensureCsrfCookie: ensureUserCsrfCookie,
  validateCsrf: validateUserCsrf,
  setRememberCookie: setUserRememberCookie,
  clearRememberCookie: clearUserRememberCookie,
  getRememberCookie: getUserRememberCookie,
  respondToAuthError: respondToUserAuthError,
} = userRuntime;

export function requireWebUserSession(event: H3Event) {
  validateUserCsrf(event);
  return requireUserAuth(event);
}

export function assertUnrestrictedUser(status: string): void {
  if (status === "pending_verification") {
    throw new RestrictedModeError();
  }
}

/**
 * Cookie `active_child_id` mang **UUID** của hồ sơ trẻ, không phải khoá chính.
 * Mọi consumer tra bằng `childProfiles.uuid` (`game-config-runtime.ts`).
 *
 * Cấm — NEVER lấy lại giá trị này từ `event.context`: `UserTokenPayload` mang
 * `active_child_db_id` kiểu số, và không route nào ghi nó. Nhánh fallback cũ
 * `String()` một id số vào ô chờ UUID, làm mọi level bậc ≥ login trả 404.
 */
export function getOptionalActiveChildUuid(event: H3Event): string | null {
  const cookieVal =
    getCookie(event, "active_child_id") ||
    getCookie(event, "active_child_uuid");
  return cookieVal ? String(cookieVal) : null;
}

export function getActiveChildUuid(event: H3Event): string {
  const val = getOptionalActiveChildUuid(event);
  if (!val) {
    throw new NoActiveChildError();
  }
  return val;
}

const GUEST_DEVICE_ID_REGEX = /^[0-9a-fA-F-]{16,64}$/;

export function getOrSetGuestDeviceId(event: H3Event): string {
  const current = getCookie(event, "guest_device_id");
  if (current && GUEST_DEVICE_ID_REGEX.test(current)) {
    return current;
  }

  const id = crypto.randomUUID();
  setCookie(event, "guest_device_id", id, {
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return id;
}

export function getParentGateSecret(_event?: H3Event): string {
  return requireEnv("PARENT_GATE_SECRET");
}
