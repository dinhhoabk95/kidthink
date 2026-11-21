import { describe, expect, it } from "vitest";
import { sanitizeRedirectTarget } from "#src/redirect-target";

describe("Open Redirect Sanitization (BR-OAP-05, BR-LGN-12)", () => {
  it("allows internal relative paths", () => {
    expect(sanitizeRedirectTarget("/me")).toBe("/me");
    expect(sanitizeRedirectTarget("/me/settings/security")).toBe(
      "/me/settings/security"
    );
    expect(sanitizeRedirectTarget("/games/GL-C1-001")).toBe("/games/GL-C1-001");
  });

  it("falls back to /me for external or protocol-relative URLs", () => {
    expect(sanitizeRedirectTarget("https://evil.example.com")).toBe("/me");
    expect(sanitizeRedirectTarget("http://evil.example.com")).toBe("/me");
    expect(sanitizeRedirectTarget("//evil.example.com")).toBe("/me");
    expect(sanitizeRedirectTarget("javascript:alert(1)")).toBe("/me");
    expect(sanitizeRedirectTarget("")).toBe("/me");
    expect(sanitizeRedirectTarget(null)).toBe("/me");
    expect(sanitizeRedirectTarget(undefined)).toBe("/me");
  });
});
