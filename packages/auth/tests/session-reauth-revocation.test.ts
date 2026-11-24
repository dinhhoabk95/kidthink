import { describe, expect, it } from "vitest";
import { verifyReauthWindow } from "#src/index";

describe("Reauth Window Verification (BR-AUT-13, BR-ADA-09)", () => {
  it("verifyReauthWindow enforces 5-minute window strictly", () => {
    const t0 = new Date("2026-10-14T08:00:00Z");
    expect(() =>
      verifyReauthWindow(t0, ["password"], new Date(t0.getTime() + 299_000))
    ).not.toThrow();
    expect(() =>
      verifyReauthWindow(t0, ["password"], new Date(t0.getTime() + 301_000))
    ).toThrowError(
      expect.objectContaining({ code: "REAUTH_REQUIRED", status: 428 })
    );
  });
});
