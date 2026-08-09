import { randomBytes } from "node:crypto";
import { appError } from "./errors";

export const CSRF_COOKIE_NAME = "tm_csrf_token";
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
    !(options.cookieToken && options.headerToken) ||
    options.cookieToken !== options.headerToken
  ) {
    throw appError("INSUFFICIENT_ROLE");
  }
}
