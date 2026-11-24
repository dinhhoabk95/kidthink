import {
  type ManagerTokenPayload,
  requireManagerAuth,
  requireRole,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import { MfaEnrollmentRequiredError } from "@mindkid/errors/auth";
import type { H3Event } from "h3";

export function getMfaEncryptionKey(): string {
  const secret = requireEnv("MFA_ENCRYPTION_KEY");
  if (new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error(
      "MFA_ENCRYPTION_KEY is not configured with at least 32 bytes"
    );
  }
  return secret;
}

/**
 * BR-ADA-01: Manager chưa `mfa_enabled` không được dùng API quản trị. Chỉ route thiết lập
 * (`requireManagerSessionForEnrollment`) bỏ qua kiểm này.
 */
function assertManagerMfaEnrolled(manager: ManagerTokenPayload): void {
  if (manager.mfa_enabled !== true) {
    throw new MfaEnrollmentRequiredError();
  }
}

/** CSRF do `middleware/01-guards.ts` kiểm một lần cho mọi mutation `/api/*` (BR-CSRF-02). */
export function requireManagerSession(event: H3Event): ManagerTokenPayload {
  const manager = requireManagerAuth(event);
  assertManagerMfaEnrolled(manager);
  return manager;
}

/** Allowlist: `POST /api/managers/auth/reauth` — cần để xác minh lại trước khi bật MFA. */
export function requireManagerSessionForEnrollment(
  event: H3Event
): ManagerTokenPayload {
  return requireManagerAuth(event);
}

export function requireSuperAdminSession(event: H3Event): ManagerTokenPayload {
  const manager = requireManagerAuth(event);
  requireRole(event, "super_admin");
  assertManagerMfaEnrolled(manager);
  return manager;
}
