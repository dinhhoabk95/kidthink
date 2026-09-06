import { randomBytes, timingSafeEqual } from "node:crypto";
import { CsrfInvalidError } from "@mindkid/errors/auth";

export const USER_CSRF_COOKIE_NAME = "tm_u_csrf";
export const MANAGER_CSRF_COOKIE_NAME = "tm_m_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export interface ValidateCsrfOptions {
  readonly method: string;
  readonly cookieToken?: string;
  readonly headerToken?: string;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function validateCsrfToken(options: ValidateCsrfOptions): void {
  const method = options.method.toUpperCase();
  if (SAFE_METHODS.has(method)) {
    return;
  }

  if (
    !(
      options.cookieToken &&
      options.headerToken &&
      constantTimeEqual(options.cookieToken, options.headerToken)
    )
  ) {
    throw new CsrfInvalidError();
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return (
    leftBytes.byteLength === rightBytes.byteLength &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}
