import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import {
  CONSENT_TYPE,
  consentRequirements,
  getOwnerDb,
  NOTIFICATION_STATUS,
  notificationDeliveries,
  notifications,
  USER_STATUS,
  users,
} from "@mindkid/db";
import { renderEmailTemplate } from "@mindkid/notification";
import { disconnectQueue, getQueue } from "@mindkid/queue";
import { desc, eq, inArray } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

vi.hoisted(() => {
  process.env.VALKEY_QUEUE_PREFIX ??= `test-${process.pid}-${process.env.VITEST_POOL_ID ?? "0"}`;
});

interface VerifyEmailResponsePayload {
  status?: boolean;
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
  } | null;
}

interface EmailJobPayload {
  token?: string;
  verify_url?: string;
  reset_url?: string;
  url?: string;
}

async function readConsentMarkers(): Promise<{
  termsRequirementAt: string | null;
  privacyRequirementAt: string | null;
}> {
  const db = getOwnerDb();
  const rows = await db
    .select()
    .from(consentRequirements)
    .where(
      inArray(consentRequirements.consentType, [
        CONSENT_TYPE.TERMS,
        CONSENT_TYPE.PRIVACY,
      ])
    );

  let termsRequirementAt: string | null = null;
  let privacyRequirementAt: string | null = null;
  for (const row of rows) {
    const iso = row.reconsentRequiredAt
      ? row.reconsentRequiredAt.toISOString()
      : null;
    if (row.consentType === CONSENT_TYPE.TERMS) {
      termsRequirementAt = iso;
    } else if (row.consentType === CONSENT_TYPE.PRIVACY) {
      privacyRequirementAt = iso;
    }
  }
  return { termsRequirementAt, privacyRequirementAt };
}

async function registerPendingUser(tag: string) {
  const db = getOwnerDb();
  const markers = await readConsentMarkers();
  const email = `verify-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

  const signUpRes = await getUserAuth().handler(
    new Request("http://localhost:3000/api/auth/users/sign-up/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        email,
        password: "chuoixanh123",
        name: `Verify ${tag}`,
        accept_terms: true,
        accept_privacy: true,
        terms_requirement_at: markers.termsRequirementAt,
        privacy_requirement_at: markers.privacyRequirementAt,
      }),
    })
  );
  expect(signUpRes.status).toBe(200);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    throw new Error("Expected pending user");
  }

  const [notif] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientId, user.id))
    .orderBy(desc(notifications.id))
    .limit(1);
  if (!notif) {
    throw new Error("Expected verification notification");
  }

  const job = await getQueue().getJob(`email:send:${notif.id}`);
  const notifPayload = notif.payload as EmailJobPayload | undefined;
  expect(notifPayload?.token).toBeUndefined();
  expect(notifPayload?.verify_url).toBeUndefined();
  expect(notifPayload?.reset_url).toBeUndefined();
  expect(notifPayload?.url).toBeUndefined();

  const jobPayload = job?.data.payload as EmailJobPayload | undefined;
  const token = jobPayload?.token ?? "";
  const verifyUrl = jobPayload?.verify_url ?? jobPayload?.url ?? "";

  return { user, email, token, verifyUrl, notifId: notif.id };
}

function callVerifyEmail(token: string): Promise<Response> {
  const url = `http://localhost:3000/api/auth/users/verify-email?token=${encodeURIComponent(token)}`;
  return getUserAuth().handler(
    new Request(url, {
      method: "GET",
      headers: {
        origin: "http://localhost:3000",
      },
    })
  );
}

describe("Task 2 — Better Auth Email Verification (BR-EVF-01..08)", () => {
  beforeAll(async () => {
    if (getQueue().name !== "mindkid-jobs") {
      await getQueue().obliterate({ force: true });
    }
  });

  afterAll(async () => {
    if (getQueue().name !== "mindkid-jobs") {
      await getQueue().obliterate({ force: true });
    }
    await disconnectQueue();
  });

  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("verifies user email with valid token and sets status to active (BR-EVF-01, BR-EVF-02, BR-EVF-08)", async () => {
    const db = getOwnerDb();
    const { user, token } = await registerPendingUser("valid");
    expect(token.length).toBeGreaterThan(10);

    const res = await callVerifyEmail(token);
    expect(res.status).toBe(200);
    const body = (await res.json()) as VerifyEmailResponsePayload;
    expect(body.status).toBe(true);

    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(updatedUser?.status).toBe(USER_STATUS.ACTIVE);
    expect(updatedUser?.emailVerified).toBe(true);
    expect(updatedUser?.emailVerifiedAt).not.toBeNull();
  });

  it("returns status true with null user when email is already verified (BR-EVF-04)", async () => {
    const db = getOwnerDb();
    const { user, token } = await registerPendingUser("already");

    const firstRes = await callVerifyEmail(token);
    expect(firstRes.status).toBe(200);

    const secondRes = await callVerifyEmail(token);
    expect(secondRes.status).toBe(200);
    const secondBody = (await secondRes.json()) as VerifyEmailResponsePayload;
    expect(secondBody.status).toBe(true);
    expect(secondBody.user).toBeNull();

    const [stillActive] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(stillActive?.status).toBe(USER_STATUS.ACTIVE);
  });

  it("enqueues verification email via send-verification-email and rejects tampered tokens (BR-EVF-01, BR-EVF-03, BR-EVF-07)", async () => {
    const db = getOwnerDb();
    const { user, email } = await registerPendingUser("resend");

    const resendRes = await getUserAuth().handler(
      new Request(
        "http://localhost:3000/api/auth/users/send-verification-email",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            email,
            callbackURL: "/verify-email",
          }),
        }
      )
    );
    expect(resendRes.status).toBe(200);

    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id))
      .orderBy(desc(notifications.id));
    expect(notifs.length).toBeGreaterThanOrEqual(2);
    const latestNotif = notifs[0];
    expect(latestNotif?.templateCode).toBe("email_verification");

    const deliveries = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, latestNotif?.id ?? 0));
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.status).toBe(NOTIFICATION_STATUS.QUEUED);

    const job = await getQueue().getJob(`email:send:${latestNotif?.id ?? 0}`);
    expect(job).toBeDefined();
    const notifPayload = latestNotif?.payload as EmailJobPayload | undefined;
    expect(notifPayload?.token).toBeUndefined();
    expect(notifPayload?.verify_url).toBeUndefined();
    expect(notifPayload?.reset_url).toBeUndefined();
    expect(notifPayload?.url).toBeUndefined();

    const jobPayload = job?.data.payload as EmailJobPayload | undefined;
    const targetUrl = jobPayload?.verify_url ?? jobPayload?.url ?? "";
    expect(targetUrl).toContain("/verify-email?token=");
    expect(jobPayload?.token).toBeTruthy();

    const rendered = await renderEmailTemplate("email_verification", {
      url: targetUrl,
    });
    expect(rendered.html).toContain("/verify-email?token=");

    const invalidRes = await callVerifyEmail("tampered.invalid.jwt");
    expect(invalidRes.status).toBe(401);
  }, 30_000);

  it("prevents unban bypass when account is suspended and blocks suspended login with 403", async () => {
    const db = getOwnerDb();
    const { user, email, token } = await registerPendingUser("suspended");

    await db
      .update(users)
      .set({ status: USER_STATUS.SUSPENDED })
      .where(eq(users.id, user.id));

    await callVerifyEmail(token);

    const [stillSuspended] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(stillSuspended?.status).toBe(USER_STATUS.SUSPENDED);

    const loginRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email, password: "chuoixanh123" }),
      })
    );
    expect(loginRes.status).toBe(403);
  });
});
