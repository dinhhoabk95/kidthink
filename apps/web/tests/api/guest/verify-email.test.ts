import {
  generateSecureToken,
  hashPassword,
  hashSecureToken,
} from "@mindkid/auth";
import { getAppDb, users, verificationTokens } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

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

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: { body: { token: rawToken } },
    } as any;

    const res = await handler(event);
    expect(res.status).toBe("active");

    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(updatedUser.status).toBe("active");
    expect(updatedUser.emailVerifiedAt).not.toBeNull();
  });

  it("returns status active when token is already used but user is active (BR-EVF-04)", async () => {
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

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: { body: { token: rawToken } },
    } as any;

    const res = await handler(event);
    expect(res.status).toBe("active");
  });

  it("invalidates old token on resend verification (BR-EVF-03, BR-EVF-07)", async () => {
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

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: { body: { email } },
    } as any;

    const resendRes = await resendHandler(event);
    expect(resendRes.ok).toBe(true);

    // Try verifying with old token -> 410 or 404 (BR-EVF-03)
    const { default: verifyHandler } = await import(
      "#server/api/guest/auth/users/verify-email.post"
    );

    const verifyEvent = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: { body: { token: oldToken } },
    } as any;

    await expect(verifyHandler(verifyEvent)).rejects.toThrow();
  });
});
