import {
  generateSecureToken,
  hashPassword,
  hashSecureToken,
} from "@mindkid/auth";
import {
  getAppDb,
  notificationDeliveries,
  notifications,
  users,
  verificationTokens,
} from "@mindkid/db";
import { renderEmailTemplate } from "@mindkid/notification";
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

describe("Task 2 — Email Verification (BR-EVF-01..08)", () => {
  it("verifies user email with valid token and sets status to active (BR-EVF-01, BR-EVF-02, BR-EVF-08)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const email = `verify1-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: passHash,
        displayName: "User Verify 1",
        status: "pending_verification",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert test user");
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      accountType: "user",
      accountId: user.id,
      purpose: "email_verify",
      tokenHash,
      expiresAt,
    });

    const { default: handler } = await import(
      "#server/api/guest/auth/users/verify-email.post"
    );

    const event = createMockPostEvent({ token: rawToken });

    const res = await handler(event);
    expect(res.status).toBe("active");
    expect(res.already_verified).toBe(false);

    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(updatedUser?.status).toBe("active");
    expect(updatedUser?.emailVerifiedAt).not.toBeNull();
  });

  it("returns status active and already_verified true when token is already used but user is active (BR-EVF-04)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const email = `verify2-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: passHash,
        displayName: "User Verify 2",
        status: "active",
        emailVerifiedAt: new Date(),
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert test user");
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      accountType: "user",
      accountId: user.id,
      purpose: "email_verify",
      tokenHash,
      expiresAt,
      usedAt: new Date(),
    });

    const { default: handler } = await import(
      "#server/api/guest/auth/users/verify-email.post"
    );

    const event = createMockPostEvent({ token: rawToken });

    const res = await handler(event);
    expect(res.status).toBe("active");
    expect(res.already_verified).toBe(true);
  });

  it("invalidates old token on resend verification, omits raw token from DB, and enqueues email:send job with url (BR-EVF-01, BR-EVF-03, BR-EVF-07, #289 S2)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const email = `resend-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: passHash,
        displayName: "User Resend",
        status: "pending_verification",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert test user");
    }

    const oldToken = generateSecureToken();
    const oldHash = hashSecureToken(oldToken);

    await db.insert(verificationTokens).values({
      accountType: "user",
      accountId: user.id,
      purpose: "email_verify",
      tokenHash: oldHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const { default: resendHandler } = await import(
      "#server/api/users/auth/resend-verification.post"
    );

    const event = createMockPostEvent({ email });

    const resendRes = await resendHandler(event);
    expect(resendRes.ok).toBe(true);

    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id));
    expect(notifs).toHaveLength(1);
    const notif = notifs[0];
    expect(notif?.templateCode).toBe("email_verification");

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
    expect(jobPayload?.url).toContain("/xac-thuc?token=");
    expect(jobPayload?.token).toBeTruthy();

    const rendered = await renderEmailTemplate("email_verification", {
      url: jobPayload?.url ?? "",
    });
    expect(rendered.html).toContain(jobPayload?.url ?? "");

    // Try verifying with old token -> 410 or 404 (BR-EVF-03)
    const { default: verifyHandler } = await import(
      "#server/api/guest/auth/users/verify-email.post"
    );

    const verifyEvent = createMockPostEvent({ token: oldToken });

    await expect(verifyHandler(verifyEvent)).rejects.toThrow();
  }, 30_000);

  it("rejects email verification token if user account is suspended or deleted (prevents unban bypass)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const email = `verify-suspended-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: passHash,
        displayName: "Suspended User",
        status: "suspended",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert test user");
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      accountType: "user",
      accountId: user.id,
      purpose: "email_verify",
      tokenHash,
      expiresAt,
    });

    const { default: handler } = await import(
      "#server/api/guest/auth/users/verify-email.post"
    );

    const event = createMockPostEvent({ token: rawToken });
    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 403,
      code: "ACCOUNT_SUSPENDED",
    });

    const [stillSuspended] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(stillSuspended?.status).toBe("suspended");
  });
});
