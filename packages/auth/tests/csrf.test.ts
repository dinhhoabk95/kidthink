import { describe, expect, it } from "vitest";
import { generateCsrfToken, validateCsrfToken } from "../src/csrf";

describe("CSRF Double-Submit Protection", () => {
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
      expect.objectContaining({ code: "INSUFFICIENT_ROLE", status: 403 })
    );

    expect(() =>
      validateCsrfToken({
        method: "POST",
        cookieToken: csrfToken,
        headerToken: "mismatched-token",
      })
    ).toThrowError(
      expect.objectContaining({ code: "INSUFFICIENT_ROLE", status: 403 })
    );
  });
});
