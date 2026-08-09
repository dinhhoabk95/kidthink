import { describe, expect, it } from "vitest";
import {
  getAvailableReauthMethods,
  REAUTH_MAX_AGE_SECONDS,
  verifyReauthWindow,
} from "../src/reauth";

describe("Current-session reauth window and methods", () => {
  it("allows actions within 5-minute reauth window", () => {
    const recentReauth = new Date(Date.now() - 2 * 60 * 1000); // 2 mins ago

    expect(() => verifyReauthWindow(recentReauth)).not.toThrow();
  });

  it("throws REAUTH_REQUIRED (428) when reauthAt is missing or older than 5 minutes", () => {
    expect(() => verifyReauthWindow(null)).toThrowError(
      expect.objectContaining({ code: "REAUTH_REQUIRED", status: 428 })
    );

    const oldReauth = new Date(
      Date.now() - (REAUTH_MAX_AGE_SECONDS + 10) * 1000
    ); // >5 mins ago
    expect(() => verifyReauthWindow(oldReauth)).toThrowError(
      expect.objectContaining({ code: "REAUTH_REQUIRED", status: 428 })
    );
  });

  it("returns available methods for current account auth method", () => {
    const methodsPassword = getAvailableReauthMethods("password");
    expect(methodsPassword).toEqual({ methods: ["password"] });

    const methodsSocial = getAvailableReauthMethods("social");
    expect(methodsSocial).toEqual({ methods: ["social"] });
  });
});
