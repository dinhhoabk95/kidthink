import { describe, expect, it } from "vitest";
import { REAUTH_MAX_AGE_SECONDS, verifyReauthWindow } from "#src/reauth";

describe("Current-session reauth window and methods", () => {
  it("allows exactly the 5-minute boundary and rejects older or future timestamps", () => {
    const now = new Date("2026-08-09T12:00:00.000Z");
    const boundary = new Date(now.getTime() - REAUTH_MAX_AGE_SECONDS * 1000);
    expect(() => verifyReauthWindow(boundary, ["social"], now)).not.toThrow();

    expect(() =>
      verifyReauthWindow(
        new Date(boundary.getTime() - 1),
        ["social", "totp"],
        now
      )
    ).toThrowError(
      expect.objectContaining({
        code: "REAUTH_REQUIRED",
        status: 428,
        details: { methods: ["social", "totp"] },
      })
    );
    expect(() =>
      verifyReauthWindow(new Date(now.getTime() + 1), ["totp"], now)
    ).toThrowError(expect.objectContaining({ code: "REAUTH_REQUIRED" }));
  });
});
