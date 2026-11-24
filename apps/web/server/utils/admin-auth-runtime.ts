import {
  type ManagerTokenPayload,
  requireManagerAuth,
  requireRole,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import type { H3Event } from "h3";
import { enforceTwoAxisRateLimit as runtimeEnforceTwoAxisRateLimit } from "./auth-runtime.js";
import {
  factoryAssertRateLimitAllowed,
  factoryAssertRequestBodySize,
  factoryAssertSameOriginRequest,
} from "./auth-runtime-factory.js";

export const assertManagerRateLimitAllowed = factoryAssertRateLimitAllowed;
export const assertManagerRequestBodySize = factoryAssertRequestBodySize;
export const assertManagerSameOriginRequest = factoryAssertSameOriginRequest;
export const enforceTwoAxisRateLimit = runtimeEnforceTwoAxisRateLimit;

export function getMfaEncryptionKey(): string {
  const secret = requireEnv("MFA_ENCRYPTION_KEY");
  if (new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error(
      "MFA_ENCRYPTION_KEY is not configured with at least 32 bytes"
    );
  }
  return secret;
}

/** CSRF do `middleware/01-guards.ts` kiểm một lần cho mọi mutation `/api/*` (BR-CSRF-02). */
export function requireManagerSession(event: H3Event): ManagerTokenPayload {
  return requireManagerAuth(event);
}

export function requireSuperAdminSession(event: H3Event): ManagerTokenPayload {
  requireRole(event, "super_admin");
  return requireManagerAuth(event);
}
