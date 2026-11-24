import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import {
  getOwnerDb,
  NOTIFICATION_STATUS,
  notificationDeliveries,
  notifications,
  USER_STATUS,
  userAccounts,
  users,
} from "@mindkid/db";
import { getLocalQueueRuntime } from "@mindkid/local-runtime";
import { and, desc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

interface ResetRequestResponse {
  status?: boolean;
  message?: string;
}

interface ResetEmailJobPayload {
  token?: string;
  reset_url?: string;
  verify_url?: string;
  url?: string;
}

async function seedActiveUserWithPassword(
  tag: string,
  password = "chuoixanh123"
) {
  const db = getOwnerDb();
  const email = `pwd-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;
  const ctx = await getUserAuth().$context;
  const passwordHash = await ctx.password.hash(password);

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      displayName: `Recovery ${tag}`,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    })
    .returning();
  if (!user) {
    throw new Error("Failed to insert test user");
  }

  await ctx.internalAdapter.linkAccount({
    userId: String(user.id),
    providerId: "credential",
    accountId: String(user.id),
    password: passwordHash,
  });

  return { user, email, password };
}

describe("Task 4 — Better Auth Password Recovery (BR-PWR-01..09)", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("handles request-password-reset, enqueues password_reset email with url, and returns identical 200 for unknown email (BR-PWR-01..03)", async () => {
    const db = getOwnerDb();
    const { user, email } = await seedActiveUserWithPassword("forgot");

    const res = await getUserAuth().handler(
      new Request(
        "http://localhost:3000/api/auth/users/request-password-reset",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            email,
            redirectTo: "/reset-password",
          }),
        }
      )
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as ResetRequestResponse;
    expect(body.status).toBe(true);

    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id));
    expect(notifs).toHaveLength(1);
    const notif = notifs[0];
    expect(notif?.templateCode).toBe("password_reset");

    const deliveries = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, notif?.id ?? 0));
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.status).toBe(NOTIFICATION_STATUS.QUEUED);

    const job = await getLocalQueueRuntime()?.peek(
      `email:send:${notif?.id ?? 0}`
    );
    expect(job).toBeDefined();
    const notifPayload = notif?.payload as ResetEmailJobPayload | undefined;
    expect(notifPayload?.token).toBeUndefined();
    expect(notifPayload?.reset_url).toBeUndefined();
    expect(notifPayload?.verify_url).toBeUndefined();
    expect(notifPayload?.url).toBeUndefined();

    const jobPayload = job?.data.payload as ResetEmailJobPayload | undefined;
    const resetUrl = jobPayload?.reset_url ?? jobPayload?.url ?? "";
    expect(resetUrl).toContain("/reset-password/");
    expect(jobPayload?.token).toBeTruthy();

    const unknownRes = await getUserAuth().handler(
      new Request(
        "http://localhost:3000/api/auth/users/request-password-reset",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            email: `nonexistent-${Date.now()}@example.com`,
            redirectTo: "/reset-password",
          }),
        }
      )
    );
    expect(unknownRes.status).toBe(200);
    const unknownBody = (await unknownRes.json()) as ResetRequestResponse;
    expect(unknownBody).toEqual(body);
  }, 30_000);

  it("resets password with valid token, mirrors Argon2id hash, consumes single-use token, and authenticates new password (BR-PWR-03..07)", async () => {
    const db = getOwnerDb();
    const { user, email } = await seedActiveUserWithPassword("reset");

    const reqRes = await getUserAuth().handler(
      new Request(
        "http://localhost:3000/api/auth/users/request-password-reset",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            email,
            redirectTo: "/reset-password",
          }),
        }
      )
    );
    expect(reqRes.status).toBe(200);

    const [notif] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id))
      .orderBy(desc(notifications.id))
      .limit(1);
    const job = await getLocalQueueRuntime()?.peek(
      `email:send:${notif?.id ?? 0}`
    );
    const notifPayload = notif?.payload as ResetEmailJobPayload | undefined;
    expect(notifPayload?.token).toBeUndefined();
    expect(notifPayload?.reset_url).toBeUndefined();
    expect(notifPayload?.verify_url).toBeUndefined();
    expect(notifPayload?.url).toBeUndefined();

    const jobPayload = job?.data.payload as ResetEmailJobPayload | undefined;
    const rawToken = jobPayload?.token ?? "";
    expect(rawToken.length).toBeGreaterThan(10);

    const newPassword = "newpassword456";
    const resetRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          token: rawToken,
          newPassword,
        }),
      })
    );
    expect(resetRes.status).toBe(200);

    const reuseRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          token: rawToken,
          newPassword: "anotherpassword789",
        }),
      })
    );
    expect(reuseRes.status).toBe(400);

    const [credRow] = await db
      .select()
      .from(userAccounts)
      .where(
        and(
          eq(userAccounts.userId, user.id),
          eq(userAccounts.providerId, "credential")
        )
      );
    expect(credRow?.password?.startsWith("pbkdf2$")).toBe(true);
    expect(credRow?.password).not.toBe(user.passwordHash);

    const oldLogin = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email, password: "chuoixanh123" }),
      })
    );
    expect(oldLogin.status).toBe(401);

    const newLogin = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email, password: newPassword }),
      })
    );
    expect(newLogin.status).toBe(200);
  }, 30_000);
});
