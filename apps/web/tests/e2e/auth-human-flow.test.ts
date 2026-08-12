import { getAppDb, notifications, users } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { truncateAllTestTables } from "../../../../packages/db/tests/global-setup";

describe("Task 7 — Real Human End-to-End Test Scenario", () => {
  beforeEach(async () => {
    await truncateAllTestTables();
  });

  it("executes complete lifecycle: Register -> Email Verify -> Login -> List Sessions -> Forgot Password -> Reset Password -> Re-login -> Logout", async () => {
    const db = getAppDb();
    const humanEmail = "realhuman@example.com";
    const initialPass = "chuoixanh123";
    const newPass = "newchuoixanh456";

    // 1. REGISTER
    const { default: registerHandler } = await import(
      "../../server/api/guest/auth/users/register.post"
    );

    const regEvent = {
      method: "POST",
      node: {
        req: {
          headers: {
            "x-forwarded-for": "192.168.1.50",
            "user-agent": "Mozilla/5.0 (Macintosh)",
          },
        },
      },
      context: {
        body: {
          email: humanEmail,
          password: initialPass,
          display_name: "Real Human Parent",
          accept_terms: true,
          accept_privacy: true,
        },
      },
    } as any;

    const regRes = await registerHandler(regEvent);
    expect(regRes.user.status).toBe("pending_verification");

    // 2. READ VERIFICATION TOKEN FROM EMAIL INBOX (NOTIFICATIONS)
    const emailNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.templateCode, "email_verification"));

    expect(emailNotifs).toHaveLength(1);
    const verifyToken = (emailNotifs[0].payload as any).token;
    expect(verifyToken).toBeDefined();

    // 3. VERIFY EMAIL
    const { default: verifyEmailHandler } = await import(
      "../../server/api/guest/auth/users/verify-email.post"
    );

    const verifyEvent = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "192.168.1.50" } } },
      context: { body: { token: verifyToken } },
    } as any;

    const verifyRes = await verifyEmailHandler(verifyEvent);
    expect(verifyRes.status).toBe("active");

    // 4. LOGIN WITH INITIAL PASSWORD
    const { default: loginHandler } = await import(
      "../../server/api/guest/auth/users/login.post"
    );

    const loginEvent = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "192.168.1.50" } } },
      context: { body: { email: humanEmail, password: initialPass } },
    } as any;

    const loginRes = await loginHandler(loginEvent);
    expect(loginRes.user.status).toBe("active");

    const [createdUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, humanEmail));

    // 5. LIST SESSIONS
    const { default: sessionsHandler } = await import(
      "../../server/api/users/auth/sessions.get"
    );

    const getSessionsEvent = {
      method: "GET",
      context: { userSession: { user_id: createdUser.id, session_id: "1" } },
    } as any;

    const sessionsRes = await sessionsHandler(getSessionsEvent);
    expect(sessionsRes.sessions.length).toBeGreaterThanOrEqual(1);

    // 6. FORGOT PASSWORD
    const { default: forgotHandler } = await import(
      "../../server/api/guest/auth/users/forgot-password.post"
    );

    const forgotEvent = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "192.168.1.50" } } },
      context: { body: { email: humanEmail } },
    } as any;

    const forgotRes = await forgotHandler(forgotEvent);
    expect(forgotRes.ok).toBe(true);

    // 7. READ RESET TOKEN FROM NOTIFICATIONS
    const resetNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.templateCode, "password_reset"));

    expect(resetNotifs).toHaveLength(1);
    const resetToken = (resetNotifs[0].payload as any).token;

    // 8. RESET PASSWORD
    const { default: resetHandler } = await import(
      "../../server/api/guest/auth/users/reset-password.post"
    );

    const resetEvent = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "192.168.1.50" } } },
      context: { body: { token: resetToken, new_password: newPass } },
    } as any;

    const resetRes = await resetHandler(resetEvent);
    expect(resetRes.ok).toBe(true);

    // 9. TRY LOGIN WITH OLD PASSWORD -> REJECTED 401
    const oldPassLoginEvent = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "192.168.1.50" } } },
      context: { body: { email: humanEmail, password: initialPass } },
    } as any;

    await expect(loginHandler(oldPassLoginEvent)).rejects.toThrow();

    // 10. LOGIN WITH NEW PASSWORD -> SUCCESS
    const newPassLoginEvent = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "192.168.1.50" } } },
      context: { body: { email: humanEmail, password: newPass } },
    } as any;

    const newLoginRes = await loginHandler(newPassLoginEvent);
    expect(newLoginRes.user.status).toBe("active");

    // 11. LOGOUT
    const { default: logoutHandler } = await import(
      "../../server/api/users/auth/logout.post"
    );

    const logoutEvent = {
      method: "POST",
      context: { userSession: { user_id: createdUser.id, session_id: "1" } },
    } as any;

    const logoutRes = await logoutHandler(logoutEvent);
    expect(logoutRes.ok).toBe(true);
  });
});
