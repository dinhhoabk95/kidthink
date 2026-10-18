import {
  generateSecureToken,
  hashPassword,
  hashSecureToken,
} from "@mindkid/auth";
import {
  activeSessions,
  getAppDb,
  notificationDeliveries,
  notifications,
  users,
  verificationTokens,
} from "@mindkid/db";
import { getQueue } from "@mindkid/queue";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { describe, expect, it } from "vitest";

function createMockPostEvent(body: Record<string, string>): H3Event {
  return {
    method: "POST",
    node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
    context: { body },
  } as H3Event;
}

describe("Task 4 — Password Recovery (BR-PWR-01..09)", () => {
  it("handles forgot password, enqueues password_reset email with url, omits raw token from DB, and returns 200 without leaking email presence (BR-PWR-01..03)", async () => {
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
    if (!user) {
      throw new Error("Failed to insert test user");
    }

    const { default: forgotHandler } = await import(
      "#server/api/guest/auth/users/forgot-password.post"
    );

    const event = createMockPostEvent({ email });

    const res = await forgotHandler(event);
    expect(res.ok).toBe(true);

    const tokens = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.accountId, user.id));
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.purpose).toBe("password_reset");

    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id));
    expect(notifs).toHaveLength(1);
    const notif = notifs[0];
    expect(notif?.templateCode).toBe("password_reset");

    const persistedPayload = notif?.payload as
      | Record<string, string>
      | undefined;
    expect(persistedPayload?.token).toBeUndefined();
    expect(persistedPayload?.url).toBeUndefined();

    const deliveries = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, notif?.id ?? 0));
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.status).toBe("queued");

    const job = await getQueue().getJob(`email:send:${notif?.id ?? 0}`);
    expect(job).toBeDefined();
    const jobPayload = job?.data.payload as Record<string, string> | undefined;
    expect(jobPayload?.url).toContain("/dat-lai-mat-khau?token=");
    expect(jobPayload?.token).toBeTruthy();

    // Non-existent email should also return { ok: true }
    const noUserEvent = createMockPostEvent({
      email: `nonexistent-${Date.now()}@example.com`,
    });

    const noUserRes = await forgotHandler(noUserEvent);
    expect(noUserRes).toEqual(res);
  }, 30_000);

  it("resets password with valid token, revokes all active sessions, and dispatches password_changed notification (BR-PWR-03..07)", async () => {
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
    if (!user) {
      throw new Error("Failed to insert test user");
    }

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
      "#server/api/guest/auth/users/reset-password.post"
    );

    const event = createMockPostEvent({
      token: rawToken,
      new_password: "newpassword456",
    });

    const res = await resetHandler(event);
    expect(res.ok).toBe(true);

    // Active session should be deleted (BR-PWR-03)
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
    expect(updatedUser?.sessionVersion).toBe(user.sessionVersion + 1);

    // BR-PWR-04: Notification dispatched via email:send queue
    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id));
    expect(notifs).toHaveLength(1);
    expect(notifs[0]?.templateCode).toBe("password_changed");

    const job = await getQueue().getJob(`email:send:${notifs[0]?.id ?? 0}`);
    expect(job).toBeDefined();
    expect(job?.data.code).toBe("password_changed");
  }, 30_000);
});
