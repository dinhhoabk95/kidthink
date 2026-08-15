import { getAppDb, notifications, users } from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

describe("Task 7 — Real Human End-toEnd Test Scenario", () => {
  it("executes complete lifecycle: Register -> Email Verify -> Login -> List Sessions -> Forgot Password -> Reset Password -> Re-login -> Logout", async () => {
    const db = getAppDb();
    const suffix = Math.floor(Math.random() * 900_000 + 100_000).toString();
    const humanEmail = `realhuman_${suffix}@example.com`;
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
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          },
        },
      },
      context: {
        body: {
          email: humanEmail,
          password: initialPass,
          display_name: "Human Tester",
          accept_terms: true,
          accept_privacy: true,
        },
      },
    } as any;

    const regRes = await registerHandler(regEvent);
    expect(regRes.user.uuid).toBeDefined();
    expect(regRes.user.status).toBe("pending_verification");

    const [createdUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, humanEmail));

    // 2. READ VERIFICATION TOKEN FROM EMAIL INBOX (NOTIFICATIONS)
    const emailNotifs = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.templateCode, "email_verification"),
          eq(notifications.recipientId, createdUser.id)
        )
      );

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

    // 4. LOGIN
    const { default: loginHandler } = await import(
      "../../server/api/guest/auth/users/login.post"
    );

    const setCookies: string[] = [];
    const loginEvent = {
      method: "POST",
      node: {
        req: {
          headers: {
            "x-forwarded-for": "192.168.1.50",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          },
        },
        res: {
          getHeader: () => undefined,
          setHeader: (name: string, value: any) => {
            if (name.toLowerCase() === "set-cookie") {
              if (Array.isArray(value)) {
                setCookies.push(...value);
              } else {
                setCookies.push(value);
              }
            }
          },
        },
      },
      context: {
        body: {
          email: humanEmail,
          password: initialPass,
        },
      },
    } as any;

    const loginRes = await loginHandler(loginEvent);
    expect(loginRes.user.displayName).toBe("Human Tester");
    expect(loginRes.user.status).toBe("active");

    // 5. LIST ACTIVE SESSIONS
    const { default: sessionsHandler } = await import(
      "../../server/api/users/auth/sessions.get"
    );

    const csrf =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const getSessionsEvent = {
      method: "GET",
      node: {
        req: {
          headers: {
            "x-csrf-token": csrf,
            cookie: `tm_u_csrf=${csrf}`,
          },
        },
      },
      context: {
        user: {
          user_id: createdUser?.id ?? 0,
          display_name: "Human Tester",
          session_id: "1",
          refresh_token_version: 0,
        },
      },
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
      .where(
        and(
          eq(notifications.templateCode, "password_reset"),
          eq(notifications.recipientId, createdUser.id)
        )
      );

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

    const logoutResHeaders: Record<string, string> = {};
    const logoutEvent = {
      method: "POST",
      node: {
        req: {
          headers: {
            "x-csrf-token": csrf,
            cookie: `tm_u_csrf=${csrf}`,
          },
        },
        res: {
          setHeader: (name: string, value: string) => {
            logoutResHeaders[name.toLowerCase()] = value;
          },
          getHeader: (name: string) => logoutResHeaders[name.toLowerCase()],
        },
      },
      context: {
        user: {
          user_id: createdUser.id,
          display_name: "Human Tester",
          session_id: "1",
          refresh_token_version: 0,
        },
      },
    } as any;

    const logoutRes = await logoutHandler(logoutEvent);
    expect(logoutRes.success).toBe(true);
  });
});
