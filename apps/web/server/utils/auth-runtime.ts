import {
  type ManagerTokenPayload,
  requireUserAuth,
  type UserTokenPayload,
} from "@mindkid/auth";
import { isCloudflareRuntime, requireEnv } from "@mindkid/config";
import {
  USER_STATUS,
  type UserStatus,
  type UserStatusLabel,
} from "@mindkid/db";
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
} from "./auth-runtime-factory.js";

export const DEFAULT_MAX_JSON_BODY_BYTES = FACTORY_DEFAULT_MAX_JSON_BODY_BYTES;
export const assertRateLimitAllowed = factoryAssertRateLimitAllowed;
export const assertRequestBodySize = factoryAssertRequestBodySize;
export const assertPayloadSize = factoryAssertPayloadSize;
export const assertSameOriginRequest = factoryAssertSameOriginRequest;

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

const IPV4_MAPPED_PREFIX = "::ffff:";

function normalizeIp(value: string | undefined): string {
  const trimmed = (value ?? "").trim().toLowerCase();
  return trimmed.startsWith(IPV4_MAPPED_PREFIX)
    ? trimmed.slice(IPV4_MAPPED_PREFIX.length)
    : trimmed;
}

/**
 * IP client dùng cho rate limit và audit (BR-RTL-04, BR-RTL-11).
 *
 * - Cloudflare: `CF-Connecting-IP` — biên Cloudflare tự đặt, client không giả được.
 * - Ngoài Cloudflare (dev/test): địa chỉ socket. Không đọc header IP nào vì không có
 *   proxy tin cậy; `X-Forwarded-For` và `X-Real-IP` là input của kẻ tấn công.
 */
export function getVerifiedRemoteIp(event: H3Event): string {
  if (isCloudflareRuntime()) {
    const cfIp = normalizeIp(getHeader(event, "cf-connecting-ip"));
    if (!cfIp) {
      // Request từ internet luôn có CF-Connecting-IP; thiếu = subrequest nội bộ / service binding.
      // Không fail-closed (sẽ làm gãy lời gọi nội bộ hợp lệ) — chỉ cảnh báo để thấy bucket `unknown` bị dùng chung.
      console.warn(
        JSON.stringify({
          level: "warn",
          event: "rate_limit.cf_connecting_ip_missing",
          path: event.path,
        })
      );
      return "unknown";
    }
    return cfIp;
  }
  const request = event.node?.req as
    | { socket?: { remoteAddress?: string } }
    | undefined;
  return normalizeIp(request?.socket?.remoteAddress) || "unknown";
}

/** CSRF do `middleware/01-guards.ts` kiểm một lần cho mọi mutation `/api/*` (BR-CSRF-02). */
export function requireWebUserSession(event: H3Event): UserTokenPayload {
  return requireUserAuth(event);
}

export function assertUnrestrictedUser(
  status: UserStatus | UserStatusLabel
): void {
  if (
    status === USER_STATUS.PENDING_VERIFICATION ||
    status === "pending_verification"
  ) {
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
