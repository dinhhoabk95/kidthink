import {
  generateSecureToken,
  hashPassword,
  hashSecureToken,
} from "@mindkid/auth";
import {
  activeSessions,
  getAppDb,
  notifications,
  users,
  verificationTokens,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

describe("Task 4 — Password Recovery (BR-PWR-01..09)", () => {
  it("handles forgot password and returns 200 without leaking email presence (BR-PWR-01..03)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const email = `forgot-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: passHash,
        displayName: "Forgot User",
        status: "active",
      })
      .returning();

    const { default: forgotHandler } = await import(
      "../../../server/api/guest/auth/users/forgot-password.post"
    );

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: { body: { email } },
    } as any;

    const res = await forgotHandler(event);
    expect(res.ok).toBe(true);

    const tokens = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.accountId, user.id));
    expect(tokens).toHaveLength(1);
    expect(tokens[0].purpose).toBe("password_reset");

    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id));
    expect(notifs).toHaveLength(1);
    expect(notifs[0].templateCode).toBe("password_reset");

    // Non-existent email should also return { ok: true }
    const noUserEvent = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: { body: { email: `nonexistent-${Date.now()}@example.com` } },
    } as any;

    const noUserRes = await forgotHandler(noUserEvent);
    expect(noUserRes.ok).toBe(true);
  }, 30_000);

  it("resets password with valid token and revokes all active sessions (BR-PWR-05..07)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const email = `reset-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: passHash,
        displayName: "Reset User",
        status: "active",
      })
      .returning();

    // Insert active session
    await db.insert(activeSessions).values({
      accountType: "user",
      accountId: user.id,
      deviceId: `dev_${user.id}`,
      authMethod: "password",
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);

    await db.insert(verificationTokens).values({
      accountType: "user",
      accountId: user.id,
      purpose: "password_reset",
      tokenHash,
      expiresAt: new Date(Date.now() + 3_600_000), // 1h
    });

    const { default: resetHandler } = await import(
      "../../../server/api/guest/auth/users/reset-password.post"
    );

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: { body: { token: rawToken, new_password: "newpassword456" } },
    } as any;

    const res = await resetHandler(event);
    expect(res.ok).toBe(true);

    // Active session should be deleted (BR-PWR-07)
    const sessionsAfter = await db
      .select()
      .from(activeSessions)
      .where(eq(activeSessions.accountId, user.id));
    expect(sessionsAfter).toHaveLength(0);

    // User session_version incremented
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(updatedUser.sessionVersion).toBe(user.sessionVersion + 1);
  }, 30_000);
});
