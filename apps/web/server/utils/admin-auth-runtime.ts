import { requireManagerAuth, requireRole } from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import type { H3Event } from "h3";
import {
  createAuthRuntime,
  factoryAssertRateLimitAllowed,
  factoryAssertRequestBodySize,
  factoryAssertSameOriginRequest,
} from "./auth-runtime-factory.js";

export const assertManagerRateLimitAllowed = factoryAssertRateLimitAllowed;
export const assertManagerRequestBodySize = factoryAssertRequestBodySize;
export const assertManagerSameOriginRequest = factoryAssertSameOriginRequest;

const managerRuntime = createAuthRuntime("manager");

export const {
  ensureCsrfCookie: ensureManagerCsrfCookie,
  validateCsrf: validateManagerCsrf,
  setRememberCookie: setManagerRememberCookie,
  clearRememberCookie: clearManagerRememberCookie,
  getRememberCookie: getManagerRememberCookie,
  respondToAuthError: respondToManagerAuthError,
} = managerRuntime;

export function getMfaEncryptionKey(): string {
  const secret = requireEnv("MFA_ENCRYPTION_KEY");
  if (new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error(
      "MFA_ENCRYPTION_KEY is not configured with at least 32 bytes"
    );
  }
  return secret;
}

export function requireManagerSession(event: H3Event) {
  validateManagerCsrf(event);
  return requireManagerAuth(event);
}

export function requireSuperAdminSession(event: H3Event) {
  validateManagerCsrf(event);
  requireRole(event, "super_admin");
  return requireManagerAuth(event);
}
