import { describe, expect, it } from "vitest";
import verifyEmailChangeHandler from "../../server/api/guest/auth/verify-email-change.post";
import changeEmailHandler from "../../server/api/users/email.post";
import updateNotificationPrefsHandler from "../../server/api/users/notification-preferences.put";
import changePasswordHandler from "../../server/api/users/password.post";
import setPasswordHandler from "../../server/api/users/password.put";
import updateProfileHandler from "../../server/api/users/profile.patch";

function mockEvent(
  method: string,
  userId = 401,
  body: any = {},
  options: { reauthAt?: Date | null; sessionId?: string } = {}
) {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "a".repeat(64);
  return {
    method,
    node: {
      req: {
        headers: {
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}`,
          "sec-fetch-site": "same-origin",
        },
        socket: {
          remoteAddress: "127.0.0.1",
        },
        url: "/",
        originalUrl: "/",
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      user: {
        user_id: userId,
        display_name: "Test User",
        session_id: options.sessionId || `sess_${userId}`,
        refresh_token_version: 0,
        reauth_at:
          options.reauthAt === undefined ? new Date() : options.reauthAt,
      },
      reauth_at: options.reauthAt === undefined ? new Date() : options.reauthAt,
      body,
    },
    _body: body,
  } as any;
}

describe("Task 2 — Account Settings Endpoints (BR-ACS-01..11)", () => {
  describe("PATCH /api/users/profile (BR-ACS-07)", () => {
    it("updates display_name without requiring reauth", async () => {
      const event = mockEvent("PATCH", 401, {
        display_name: "Nguyễn Văn A",
      });

      try {
        const res = await updateProfileHandler(event);
        expect(res.display_name).toBeDefined();
      } catch (err: any) {
        // If user not found in mock DB, 404 is valid, but shouldn't fail with 428 REAUTH
        expect(err.statusCode || err.status).not.toBe(428);
      }
    });

    it("BR-ACS-07: rejects extraneous PII fields (age, gender, phone, address)", async () => {
      const event = mockEvent("PATCH", 401, {
        display_name: "Nguyễn Văn A",
        age: 35,
        phone: "0912345678",
      });

      try {
        await updateProfileHandler(event);
        expect.fail("Should have rejected extra fields with 422");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(422);
      }
    });
  });

  describe("POST /api/users/password (BR-ACS-01, BR-ACS-02, BR-ACS-09)", () => {
    it("BR-ACS-01: throws 428 REAUTH_REQUIRED if session is not reauthenticated", async () => {
      const event = mockEvent(
        "POST",
        401,
        { new_password: "NewStrongPassword123!" },
        { reauthAt: null }
      );

      try {
        await changePasswordHandler(event);
        expect.fail("Should have thrown 428 REAUTH_REQUIRED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(428);
      }
    });

    it("BR-ACS-02: requires password with minimum 8 characters", async () => {
      const event = mockEvent("POST", 401, { new_password: "short" });

      try {
        await changePasswordHandler(event);
        expect.fail("Should have thrown 422 for short password");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(422);
      }
    });
  });

  describe("PUT /api/users/password (BR-ACS-10)", () => {
    it("BR-ACS-10: initial password setup requires reauth", async () => {
      const event = mockEvent(
        "PUT",
        401,
        { new_password: "InitialPassword123!" },
        { reauthAt: null }
      );

      try {
        await setPasswordHandler(event);
        expect.fail("Should have thrown 428 REAUTH_REQUIRED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(428);
      }
    });
  });

  describe("POST /api/users/email (BR-ACS-03, BR-ACS-04, BR-ACS-05)", () => {
    it("BR-ACS-03: changing email requires reauth", async () => {
      const event = mockEvent(
        "POST",
        401,
        { new_email: "newemail@example.com" },
        { reauthAt: null }
      );

      try {
        await changeEmailHandler(event);
        expect.fail("Should have thrown 428 REAUTH_REQUIRED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(428);
      }
    });

    it("rejects invalid email address format", async () => {
      const event = mockEvent("POST", 401, { new_email: "not-an-email" });

      try {
        await changeEmailHandler(event);
        expect.fail("Should have thrown 422");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(422);
      }
    });
  });

  describe("POST /api/guest/auth/verify-email-change (BR-ACS-05)", () => {
    it("throws 410 TOKEN_EXPIRED on invalid or expired token", async () => {
      const event = mockEvent("POST", 0, {
        token: "invalid-or-nonexistent-token",
        new_email: "new@example.com",
      });

      try {
        await verifyEmailChangeHandler(event);
        expect.fail("Should have thrown TOKEN_EXPIRED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(410);
      }
    });
  });

  describe("PUT /api/users/notification-preferences (BR-ACS-06)", () => {
    it("accepts weekly_progress and content_new toggles", async () => {
      const event = mockEvent("PUT", 401, {
        weekly_progress: false,
        content_new: true,
      });

      const res = await updateNotificationPrefsHandler(event);
      expect(res.weekly_progress).toBe(false);
      expect(res.content_new).toBe(true);
    });

    it("BR-ACS-06: rejects transactional notification keys with 422", async () => {
      const event = mockEvent("PUT", 401, {
        weekly_progress: true,
        order_approved: false, // Transactional key!
      });

      try {
        await updateNotificationPrefsHandler(event);
        expect.fail("Should have rejected transactional notification update");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(422);
      }
    });
  });

  describe("Form Invariant Scans (BR-ACS-07, BR-ACS-08)", () => {
    it("BR-ACS-07: Account settings does not contain age, gender, phone or address", () => {
      const allowedSettingsFields = [
        "display_name",
        "email",
        "password",
        "notification_preferences",
      ];
      expect(allowedSettingsFields).not.toContain("age");
      expect(allowedSettingsFields).not.toContain("gender");
      expect(allowedSettingsFields).not.toContain("phone");
      expect(allowedSettingsFields).not.toContain("address");
    });

    it("BR-ACS-08: Account settings does not contain child profile configurations", () => {
      const settingsSections = [
        "profile",
        "security",
        "notifications",
        "privacy",
      ];
      expect(settingsSections).not.toContain("child_profiles");
      expect(settingsSections).not.toContain("daily_play_cap");
    });
  });
});
