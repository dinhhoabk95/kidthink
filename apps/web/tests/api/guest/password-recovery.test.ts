import {
  generateSecureToken,
  hashPassword,
  hashSecureToken,
} from "@kidthink/auth";
import {
  activeSessions,
  getAppDb,
  notifications,
  users,
  verificationTokens,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { truncateAllTestTables } from "../../../../../packages/db/tests/global-setup";

describe("Task 4 — Password Recovery (BR-PWR-01..09)", () => {
  beforeEach(async () => {
    await truncateAllTestTables();
  });

  it("handles forgot password and returns 200 without leaking email presence (BR-PWR-01..03)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");

    const [user] = await db
      .insert(users)
      .values({
        email: "forgot@example.com",
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
      context: { body: { email: "forgot@example.com" } },
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
      context: { body: { email: "nonexistent@example.com" } },
    } as any;

    const noUserRes = await forgotHandler(noUserEvent);
    expect(noUserRes.ok).toBe(true);
  });

  it("resets password with valid token and revokes all active sessions (BR-PWR-05..07)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");

    const [user] = await db
      .insert(users)
      .values({
        email: "reset@example.com",
        passwordHash: passHash,
        displayName: "Reset User",
        status: "active",
      })
      .returning();

    // Insert active session
    await db.insert(activeSessions).values({
      accountType: "user",
      accountId: user.id,
      refreshTokenHash: "old_session_hash",
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

    // User refresh_token_version incremented
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(updatedUser.refreshTokenVersion).toBe(user.refreshTokenVersion + 1);
  });
});
