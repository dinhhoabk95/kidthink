import { describe, expect, it } from "vitest";
import { REAUTH_MAX_AGE_SECONDS, verifyReauthWindow } from "#src/index";

describe("Task 1 — Shared Reauth Guard Surface (BR-ACS-01, BR-ACS-03, BR-ADL-03, D-IJ)", () => {
  describe("BR-ACS-01, BR-ACS-03 & BR-ADL-03: Reauthentication Window Enforcement", () => {
    it("uses REAUTH_MAX_AGE_SECONDS = 300 (5 minutes) from P0.3 without redefinition", () => {
      expect(REAUTH_MAX_AGE_SECONDS).toBe(300);
    });

    it("BR-ACS-01: throws 428 REAUTH_REQUIRED when reauth_at is null", () => {
      try {
        verifyReauthWindow(null, ["password", "totp"]);
        expect.fail("Should have thrown REAUTH_REQUIRED");
      } catch (err: any) {
        expect(err.code).toBe("REAUTH_REQUIRED");
        expect(err.status).toBe(428);
        expect(err.details).toEqual({ methods: ["password", "totp"] });
      }
    });

    it("BR-ACS-03: throws 428 REAUTH_REQUIRED when reauth_at is older than 5 minutes", () => {
      const now = new Date("2026-08-14T10:00:00Z");
      const expiredReauth = new Date("2026-08-14T09:54:00Z"); // 6 minutes ago

      try {
        verifyReauthWindow(expiredReauth, ["password"], now);
        expect.fail("Should have thrown REAUTH_REQUIRED");
      } catch (err: any) {
        expect(err.code).toBe("REAUTH_REQUIRED");
        expect(err.status).toBe(428);
        expect(err.details).toEqual({ methods: ["password"] });
      }
    });

    it("passes cleanly when reauth_at is within the 5-minute window", () => {
      const now = new Date("2026-08-14T10:00:00Z");
      const recentReauth = new Date("2026-08-14T09:57:30Z"); // 2.5 minutes ago

      expect(() => {
        verifyReauthWindow(recentReauth, ["password"], now);
      }).not.toThrow();
    });

    it("BR-ADL-03: provides dynamic methods matching account data (social only for passwordless accounts)", () => {
      try {
        verifyReauthWindow(null, ["social"]);
        expect.fail("Should have thrown REAUTH_REQUIRED");
      } catch (err: any) {
        expect(err.code).toBe("REAUTH_REQUIRED");
        expect(err.status).toBe(428);
        expect(err.details).toEqual({ methods: ["social"] });
      }
    });

    it("regression: reauthentication on device A has distinct timestamp from device B", () => {
      const sessionA = {
        id: "sess_a",
        reauth_at: new Date("2026-08-14T10:00:00Z"),
      };
      const sessionB = { id: "sess_b", reauth_at: null };

      const now = new Date("2026-08-14T10:02:00Z");
      expect(() =>
        verifyReauthWindow(sessionA.reauth_at, ["password"], now)
      ).not.toThrow();
      expect(() =>
        verifyReauthWindow(sessionB.reauth_at, ["password"], now)
      ).toThrow();
    });
  });
});
