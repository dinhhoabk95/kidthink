import {
  type ManagerTokenPayload,
  requireUserAuth,
  type UserTokenPayload,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import { RestrictedModeError } from "@mindkid/errors/auth";
import { NoActiveChildError } from "@mindkid/errors/child";
import {
  RATE_LIMIT_CONFIGS,
  type RouteClassName,
  enforceTwoAxisRateLimit as sharedEnforceTwoAxisRateLimit,
} from "@mindkid/shared";
import { getCookie, getHeader, type H3Event, setCookie } from "h3";

declare module "h3" {
  interface H3EventContext {
    user?: UserTokenPayload;
    manager?: ManagerTokenPayload;
  }
}

import {
  DEFAULT_MAX_JSON_BODY_BYTES as FACTORY_DEFAULT_MAX_JSON_BODY_BYTES,
  factoryAssertPayloadSize,
  factoryAssertRateLimitAllowed,
  factoryAssertRequestBodySize,
  factoryAssertSameOriginRequest,
  factoryIsAllowedApiOrigin,
} from "./auth-runtime-factory.js";

export const DEFAULT_MAX_JSON_BODY_BYTES = FACTORY_DEFAULT_MAX_JSON_BODY_BYTES;
export const assertRateLimitAllowed = factoryAssertRateLimitAllowed;
export const assertRequestBodySize = factoryAssertRequestBodySize;
export const assertPayloadSize = factoryAssertPayloadSize;
export const assertSameOriginRequest = factoryAssertSameOriginRequest;
export const isAllowedApiOrigin = factoryIsAllowedApiOrigin;

export async function enforceTwoAxisRateLimit(
  event: H3Event,
  routeClass: string,
  accountIdentifier?: string
): Promise<void> {
  const context = event.context as { _rateLimitChecked?: boolean };
  if (context._rateLimitChecked) {
    return;
  }
  const actualClass =
    routeClass in RATE_LIMIT_CONFIGS
      ? (routeClass as RouteClassName)
      : "auth:login";
  const remoteIp = getVerifiedRemoteIp(event);
  const res = await sharedEnforceTwoAxisRateLimit({
    routeClass: actualClass,
    remoteIp: remoteIp.trim() ? remoteIp : "127.0.0.1",
    accountIdentifier,
  });
  assertRateLimitAllowed(res.statusCode);
  context._rateLimitChecked = true;
}

const DEFAULT_TRUSTED_PROXY_IPS = "127.0.0.1,::1";
const IPV4_MAPPED_PREFIX = "::ffff:";

interface TrustedProxyConfig {
  readonly raw: string;
  readonly exact: ReadonlySet<string>;
  readonly cidrs: readonly string[];
}

let trustedProxyCache: TrustedProxyConfig | null = null;
let hasLoggedFirstPeerIp = false;

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

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function validateUserCsrf(event: H3Event): void {
  if (event.method && MUTATING_METHODS.has(event.method.toUpperCase())) {
    factoryAssertSameOriginRequest(event);
  }
}

export function requireWebUserSession(event: H3Event): UserTokenPayload {
  validateUserCsrf(event);
  return requireUserAuth(event);
}

export function assertUnrestrictedUser(status: string): void {
  if (status === "pending_verification") {
    throw new RestrictedModeError();
  }
}

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
