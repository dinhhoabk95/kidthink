import { hashPassword } from "@kidthink/auth";
import { getAppDb, socialIdentities, users } from "@kidthink/db";
import { describe, expect, it } from "vitest";

describe("Task 5 — Identity Disclosure Prevention Test Suite (D-EP)", () => {
  it("returns identical 401 response and balanced response timing across existing, missing, and social users on login (BR-LGN-02, BR-LGN-03)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const suffix = Math.floor(Math.random() * 900_000 + 100_000).toString();
    const passEmail = `password_user_${suffix}@example.com`;
    const socialEmail = `social_user_${suffix}@example.com`;
    const nonExistEmail = `nonexistent_${suffix}@example.com`;

    // 1. Password user
    await db.insert(users).values({
      email: passEmail,
      passwordHash: passHash,
      displayName: "Password User",
      status: "active",
    });

    // 2. Social-only user (no passwordHash)
    const [socialUser] = await db
      .insert(users)
      .values({
        email: socialEmail,
        passwordHash: null,
        displayName: "Social User",
        status: "active",
      })
      .returning();

    await db.insert(socialIdentities).values({
      userId: socialUser.id,
      provider: "google",
      providerUserId: `google_${suffix}`,
    });

    const { default: loginHandler } = await import(
      "../../server/api/guest/auth/users/login.post"
    );

    // Test 1: Non-existent user
    const start1 = performance.now();
    const event1 = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: {
        body: {
          email: nonExistEmail,
          password: "wrongpassword123",
        },
      },
    } as any;

    let err1: any;
    try {
      await loginHandler(event1);
    } catch (e) {
      err1 = e;
    }
    const duration1 = performance.now() - start1;
    expect(err1.statusCode).toBe(401);
    expect(err1.data.code).toBe("INVALID_CREDENTIALS");

    // Test 2: Social-only user with wrong password
    const start2 = performance.now();
    const event2 = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: {
        body: {
          email: socialEmail,
          password: "wrongpassword123",
        },
      },
    } as any;

    let err2: any;
    try {
      await loginHandler(event2);
    } catch (e) {
      err2 = e;
    }
    const duration2 = performance.now() - start2;
    expect(err2.statusCode).toBe(401);
    expect(err2.data.code).toBe("INVALID_CREDENTIALS");

    // Test 3: Password user with wrong password
    const start3 = performance.now();
    const event3 = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: {
        body: {
          email: passEmail,
          password: "wrongpassword123",
        },
      },
    } as any;

    let err3: any;
    try {
      await loginHandler(event3);
    } catch (e) {
      err3 = e;
    }
    const duration3 = performance.now() - start3;
    expect(err3.statusCode).toBe(401);
    expect(err3.data.code).toBe("INVALID_CREDENTIALS");

    // D-EP timing delta check (< 150ms difference across execution paths)
    const maxDuration = Math.max(duration1, duration2, duration3);
    const minDuration = Math.min(duration1, duration2, duration3);
    const delta = maxDuration - minDuration;

    expect(delta).toBeLessThan(150);
  });

  it("returns identical 200 response for forgot-password regardless of email presence (BR-PWR-02)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const suffix = Math.floor(Math.random() * 900_000 + 100_000).toString();
    const existEmail = `exist_${suffix}@example.com`;
    const notExistEmail = `notexist_${suffix}@example.com`;

    await db.insert(users).values({
      email: existEmail,
      passwordHash: passHash,
      displayName: "Exist User",
      status: "active",
    });

    const { default: forgotHandler } = await import(
      "../../server/api/guest/auth/users/forgot-password.post"
    );

    const event1 = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: { body: { email: existEmail } },
    } as any;
    const res1 = await forgotHandler(event1);

    const event2 = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: { body: { email: notExistEmail } },
    } as any;
    const res2 = await forgotHandler(event2);

    expect(res1).toEqual(res2);
    expect(res1).toEqual({ ok: true });
  });

  it("does not leak social provider name when registration collides with existing social user (BR-REG-10)", async () => {
    const db = getAppDb();
    const suffix = Math.floor(Math.random() * 900_000 + 100_000).toString();
    const googleEmail = `google_only_${suffix}@example.com`;

    const [socialUser] = await db
      .insert(users)
      .values({
        email: googleEmail,
        passwordHash: null,
        displayName: "Google User",
        status: "active",
      })
      .returning();

    await db.insert(socialIdentities).values({
      userId: socialUser.id,
      provider: "google",
      providerUserId: `sub_${suffix}`,
    });

    const { default: registerHandler } = await import(
      "../../server/api/guest/auth/users/register.post"
    );

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: {
        body: {
          email: googleEmail,
          password: "password123",
          display_name: "Attacker",
          accept_terms: true,
          accept_privacy: true,
        },
      },
    } as any;

    let err: any;
    try {
      await registerHandler(event);
    } catch (e) {
      err = e;
    }

    expect(err.statusCode).toBe(409);
    expect(err.data.code).toBe("EMAIL_ALREADY_REGISTERED");
    expect(JSON.stringify(err)).not.toContain("google");
  });
});
