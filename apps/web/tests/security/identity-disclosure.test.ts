import {
  hashPassword,
  InMemoryRedisClient,
  setAuthRedisClient,
} from "@mindkid/auth";
import { getOwnerDb, userAccounts, users } from "@mindkid/db";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

async function postUserAuth(
  subpath: string,
  body: Record<string, string | boolean>
): Promise<{ status: number; payload: Record<string, string | boolean> }> {
  const res = await getUserAuth().handler(
    new Request(`http://localhost:3000/api/auth/users${subpath}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-real-ip": "127.0.0.1",
      },
      body: JSON.stringify(body),
    })
  );
  const payload = (await res.json().catch(() => ({}))) as Record<
    string,
    string | boolean
  >;
  return { status: res.status, payload };
}

describe("Task 5 — Identity Disclosure Prevention Test Suite (D-EP)", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("returns identical 401 response and balanced Argon2id timing across existing, missing, and social-only users on login (BR-LGN-02, BR-LGN-03)", async () => {
    const db = getOwnerDb();
    const passHash = await hashPassword("chuoixanh123");
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 900_000 + 100_000)}`;
    const passEmail = `password_user_${suffix}@example.com`;
    const socialEmail = `social_user_${suffix}@example.com`;
    const nonExistEmail = `nonexistent_${suffix}@example.com`;

    const [pwdUser] = await db
      .insert(users)
      .values({
        email: passEmail,
        passwordHash: passHash,
        displayName: "Password User",
        status: "active",
      })
      .returning({ id: users.id });
    if (!pwdUser) {
      throw new Error("Expected password user");
    }

    await db.insert(userAccounts).values({
      userId: pwdUser.id,
      providerId: "credential",
      accountId: String(pwdUser.id),
      password: passHash,
    });

    const [socialUser] = await db
      .insert(users)
      .values({
        email: socialEmail,
        passwordHash: null,
        displayName: "Social User",
        status: "active",
      })
      .returning({ id: users.id });
    if (!socialUser) {
      throw new Error("Expected social user");
    }

    await db.insert(userAccounts).values({
      userId: socialUser.id,
      providerId: "google",
      accountId: `google_${suffix}`,
    });

    const start1 = performance.now();
    const r1 = await postUserAuth("/sign-in/email", {
      email: nonExistEmail,
      password: "wrongpassword123",
    });
    const duration1 = performance.now() - start1;

    const start2 = performance.now();
    const r2 = await postUserAuth("/sign-in/email", {
      email: socialEmail,
      password: "wrongpassword123",
    });
    const duration2 = performance.now() - start2;

    const start3 = performance.now();
    const r3 = await postUserAuth("/sign-in/email", {
      email: passEmail,
      password: "wrongpassword123",
    });
    const duration3 = performance.now() - start3;

    expect(r1.status).toBe(401);
    expect(r2.status).toBe(401);
    expect(r3.status).toBe(401);

    const delta =
      Math.max(duration1, duration2, duration3) -
      Math.min(duration1, duration2, duration3);
    expect(delta).toBeLessThan(500);
  });

  it("returns identical 200 response for request-password-reset regardless of email presence (BR-PWR-02)", async () => {
    const db = getOwnerDb();
    const passHash = await hashPassword("chuoixanh123");
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 900_000 + 100_000)}`;
    const existEmail = `exist_${suffix}@example.com`;
    const notExistEmail = `notexist_${suffix}@example.com`;

    const [u] = await db
      .insert(users)
      .values({
        email: existEmail,
        passwordHash: passHash,
        displayName: "Exist User",
        status: "active",
      })
      .returning({ id: users.id });
    if (u) {
      await db.insert(userAccounts).values({
        userId: u.id,
        providerId: "credential",
        accountId: String(u.id),
        password: passHash,
      });
    }

    const r1 = await postUserAuth("/request-password-reset", {
      email: existEmail,
      redirectTo: "/reset-password",
    });
    const r2 = await postUserAuth("/request-password-reset", {
      email: notExistEmail,
      redirectTo: "/reset-password",
    });

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.payload.status).toBe(true);
    expect(r2.payload.status).toBe(true);
  });

  it("does not leak social provider name when registration collides with existing social user (BR-REG-10)", async () => {
    const db = getOwnerDb();
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 900_000 + 100_000)}`;
    const googleEmail = `google_only_${suffix}@example.com`;

    const [socialUser] = await db
      .insert(users)
      .values({
        email: googleEmail,
        passwordHash: null,
        displayName: "Google User",
        status: "active",
      })
      .returning({ id: users.id });
    if (socialUser) {
      await db.insert(userAccounts).values({
        userId: socialUser.id,
        providerId: "google",
        accountId: `sub_${suffix}`,
      });
    }

    const res = await postUserAuth("/sign-up/email", {
      name: "Attacker",
      email: googleEmail,
      password: "StrongPassword123!",
      accept_terms: true,
      accept_privacy: true,
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(res.payload).toLowerCase()).not.toContain("google");
  });
});
