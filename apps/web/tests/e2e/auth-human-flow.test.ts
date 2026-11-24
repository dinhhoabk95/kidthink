import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import {
  CONSENT_TYPE,
  consentRequirements,
  getOwnerDb,
  notifications,
  USER_STATUS,
  userSessions,
  users,
} from "@mindkid/db";
import { disconnectQueue, getQueue } from "@mindkid/queue";
import { and, desc, eq, inArray } from "drizzle-orm";
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

interface EmailJobPayload {
  token?: string;
  verify_url?: string;
  reset_url?: string;
  url?: string;
}

function collectCookie(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.length > 0 && !pair.endsWith("="))
    .join("; ");
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

describe("Task 7 — Real Human End-to-End Better Auth Lifecycle", () => {
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

  it("executes complete lifecycle: Register -> Email Verify -> Login -> List Sessions -> Forgot Password -> Reset Password -> Re-login -> Logout", async () => {
    const db = getOwnerDb();
    const markers = await readConsentMarkers();
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 900_000 + 100_000)}`;
    const humanEmail = `realhuman_${suffix}@example.com`;
    const initialPass = "chuoixanh123";
    const newPass = "newchuoixanh456";

    // 1. REGISTER
    const regRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "x-real-ip": "192.168.1.50",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
        body: JSON.stringify({
          email: humanEmail,
          password: initialPass,
          name: "Human Tester",
          accept_terms: true,
          accept_privacy: true,
          terms_requirement_at: markers.termsRequirementAt,
          privacy_requirement_at: markers.privacyRequirementAt,
        }),
      })
    );
    expect(regRes.status).toBe(200);

    const [createdUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, humanEmail));
    if (!createdUser) {
      throw new Error("Expected created user");
    }
    expect(createdUser.uuid).toBeTruthy();
    expect(createdUser.status).toBe(USER_STATUS.PENDING_VERIFICATION);

    // 2. READ VERIFICATION TOKEN FROM QUEUED NOTIFICATION
    const [verifyNotif] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.templateCode, "email_verification"),
          eq(notifications.recipientId, createdUser.id)
        )
      )
      .orderBy(desc(notifications.id))
      .limit(1);
    expect(verifyNotif).toBeDefined();

    const verifyJob = await getQueue().getJob(
      `email:send:${verifyNotif?.id ?? 0}`
    );
    const verifyNotifPayload = verifyNotif?.payload as
      | EmailJobPayload
      | undefined;
    expect(verifyNotifPayload?.token).toBeUndefined();
    expect(verifyNotifPayload?.verify_url).toBeUndefined();
    expect(verifyNotifPayload?.reset_url).toBeUndefined();
    expect(verifyNotifPayload?.url).toBeUndefined();

    const verifyPayload = verifyJob?.data.payload as
      | EmailJobPayload
      | undefined;
    const verifyToken = verifyPayload?.token ?? "";
    expect(verifyToken.length).toBeGreaterThan(10);

    // 3. VERIFY EMAIL
    const verifyRes = await getUserAuth().handler(
      new Request(
        `http://localhost:3000/api/auth/users/verify-email?token=${encodeURIComponent(verifyToken)}`,
        {
          method: "GET",
          headers: { origin: "http://localhost:3000" },
        }
      )
    );
    expect(verifyRes.status).toBe(200);

    const [verifiedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, createdUser.id));
    expect(verifiedUser?.status).toBe(USER_STATUS.ACTIVE);
    expect(verifiedUser?.emailVerified).toBe(true);

    // 4. LOGIN
    const loginRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
        body: JSON.stringify({
          email: humanEmail,
          password: initialPass,
        }),
      })
    );
    expect(loginRes.status).toBe(200);
    const loginCookie = collectCookie(loginRes);
    expect(loginCookie).toContain("mindkid-user.session_token=");

    // 5. LIST ACTIVE SESSIONS
    const sessionsList = await getUserAuth().api.listSessions({
      headers: new Headers({ cookie: loginCookie }),
    });
    expect(sessionsList.length).toBeGreaterThanOrEqual(1);

    // 6. FORGOT PASSWORD
    const forgotRes = await getUserAuth().handler(
      new Request(
        "http://localhost:3000/api/auth/users/request-password-reset",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            email: humanEmail,
            redirectTo: "/reset-password",
          }),
        }
      )
    );
    expect(forgotRes.status).toBe(200);

    // 7. READ RESET TOKEN FROM QUEUED NOTIFICATION
    const [resetNotif] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.templateCode, "password_reset"),
          eq(notifications.recipientId, createdUser.id)
        )
      )
      .orderBy(desc(notifications.id))
      .limit(1);
    expect(resetNotif).toBeDefined();

    const resetJob = await getQueue().getJob(
      `email:send:${resetNotif?.id ?? 0}`
    );
    const resetNotifPayload = resetNotif?.payload as
      | EmailJobPayload
      | undefined;
    expect(resetNotifPayload?.token).toBeUndefined();
    expect(resetNotifPayload?.verify_url).toBeUndefined();
    expect(resetNotifPayload?.reset_url).toBeUndefined();
    expect(resetNotifPayload?.url).toBeUndefined();

    const resetPayload = resetJob?.data.payload as EmailJobPayload | undefined;
    const resetToken = resetPayload?.token ?? "";
    expect(resetToken.length).toBeGreaterThan(10);

    // 8. RESET PASSWORD
    const resetRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: newPass,
        }),
      })
    );
    expect(resetRes.status).toBe(200);

    // 9. TRY LOGIN WITH OLD PASSWORD -> REJECTED 401
    const oldPassLoginRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: humanEmail,
          password: initialPass,
        }),
      })
    );
    expect(oldPassLoginRes.status).toBe(401);

    // 10. LOGIN WITH NEW PASSWORD -> SUCCESS
    const newPassLoginRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: humanEmail,
          password: newPass,
        }),
      })
    );
    expect(newPassLoginRes.status).toBe(200);
    const newCookie = collectCookie(newPassLoginRes);

    // 11. LOGOUT
    const logoutRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-out", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          cookie: newCookie,
        },
      })
    );
    expect(logoutRes.status).toBe(200);

    const sessionAfterLogout = await getUserAuth().api.getSession({
      headers: new Headers({ cookie: newCookie }),
    });
    expect(sessionAfterLogout).toBeNull();

    // Cleanup remaining sessions if initial sign-up session existed
    await db
      .delete(userSessions)
      .where(eq(userSessions.userId, createdUser.id));
  }, 30_000);
});
