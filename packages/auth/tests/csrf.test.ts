import { describe, expect, it } from "vitest";
import {
  generateCsrfToken,
  MANAGER_CSRF_COOKIE_NAME,
  USER_CSRF_COOKIE_NAME,
  validateCsrfToken,
} from "../src/csrf";

describe("CSRF Double-Submit Protection", () => {
  it("uses separate cookie namespaces for User and Manager", () => {
    expect(USER_CSRF_COOKIE_NAME).toBe("tm_u_csrf");
    expect(MANAGER_CSRF_COOKIE_NAME).toBe("tm_m_csrf");
    expect(USER_CSRF_COOKIE_NAME).not.toBe(MANAGER_CSRF_COOKIE_NAME);
  });

  it("generates 32-byte hex CSRF tokens", () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();

    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64);
  });

  it("allows safe HTTP methods (GET, HEAD, OPTIONS) without CSRF header", () => {
    expect(() =>
      validateCsrfToken({
        method: "GET",
        cookieToken: undefined,
        headerToken: undefined,
      })
    ).not.toThrow();

    expect(() =>
      validateCsrfToken({
        method: "HEAD",
        cookieToken: undefined,
        headerToken: undefined,
      })
    ).not.toThrow();
  });

  it("validates double-submit CSRF tokens for state-changing HTTP methods", () => {
    const csrfToken = generateCsrfToken();

    expect(() =>
      validateCsrfToken({
        method: "POST",
        cookieToken: csrfToken,
        headerToken: csrfToken,
      })
    ).not.toThrow();
  });

  it("throws 403 when CSRF header is missing or mismatch on unsafe methods", () => {
    const csrfToken = generateCsrfToken();

    expect(() =>
      validateCsrfToken({
        method: "POST",
        cookieToken: csrfToken,
        headerToken: undefined,
      })
    ).toThrowError(
      expect.objectContaining({ code: "CSRF_INVALID", status: 403 })
    );

    expect(() =>
      validateCsrfToken({
        method: "POST",
        cookieToken: csrfToken,
        headerToken: "mismatched-token",
      })
    ).toThrowError(
      expect.objectContaining({ code: "CSRF_INVALID", status: 403 })
    );
  });

  it("rejects different-length values without throwing a crypto range error", () => {
    expect(() =>
      validateCsrfToken({
        method: "POST",
        cookieToken: generateCsrfToken(),
        headerToken: "short",
      })
    ).toThrowError(
      expect.objectContaining({ code: "CSRF_INVALID", status: 403 })
    );
  });
});
