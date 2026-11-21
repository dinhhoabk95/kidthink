import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import {
  consentLogs,
  consentRequirements,
  getOwnerDb,
  notificationDeliveries,
  notifications,
  userAccounts,
  userSessions,
  users,
} from "@mindkid/db";
import { getQueue } from "@mindkid/queue";
import { and, eq, inArray } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

const PROVIDER_LEAK_REGEX = /google|facebook/i;

interface SignUpResponsePayload {
  token?: string | null;
  user?: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    status?: string;
    uuid?: string;
  };
  code?: string;
  message?: string;
}

interface ConsentMarkers {
  readonly termsRequirementAt: string | null;
  readonly privacyRequirementAt: string | null;
}

async function readCurrentConsentMarkers(): Promise<ConsentMarkers> {
  const db = getOwnerDb();
  const rows = await db
    .select()
    .from(consentRequirements)
    .where(inArray(consentRequirements.consentType, ["terms", "privacy"]));

  let termsRequirementAt: string | null = null;
  let privacyRequirementAt: string | null = null;

  for (const row of rows) {
    const iso = row.reconsentRequiredAt
      ? row.reconsentRequiredAt.toISOString()
      : null;
    if (row.consentType === "terms") {
      termsRequirementAt = iso;
    } else if (row.consentType === "privacy") {
      privacyRequirementAt = iso;
    }
  }
  return { termsRequirementAt, privacyRequirementAt };
}

function postSignUpEmail(
  body: Record<string, string | boolean | null | undefined>
): Promise<Response> {
  return getUserAuth().handler(
    new Request("http://localhost:3000/api/auth/users/sign-up/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-real-ip": "127.0.0.1",
        "user-agent": "Mozilla/5.0 (TestClient)",
      },
      body: JSON.stringify(body),
    })
  );
}

describe("Task 1 — Better Auth POST /api/auth/users/sign-up/email (BR-REG-01..10)", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("registers user with valid data, Argon2id hash, 2 consent logs, session, and queued email delivery (BR-REG-01, BR-REG-03, BR-REG-05)", async () => {
    const db = getOwnerDb();
    const markers = await readCurrentConsentMarkers();
    const email = `parent-reg-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const res = await postSignUpEmail({
      email,
      password: "chuoixanh123",
      name: "Người Dùng",
      accept_terms: true,
      accept_privacy: true,
      terms_requirement_at: markers.termsRequirementAt,
      privacy_requirement_at: markers.privacyRequirementAt,
    });

    expect(res.status).toBe(200);
    const setCookies = res.headers.getSetCookie().join("; ");
    expect(setCookies).toContain("mindkid-user.session_token=");

    const payload = (await res.json()) as SignUpResponsePayload;
    expect(payload.user).toBeDefined();
    expect(payload.user?.emailVerified).toBe(false);

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    expect(userRows).toHaveLength(1);
    const createdUser = userRows[0];
    if (!createdUser) {
      throw new Error("Expected created user");
    }

    expect(createdUser.status).toBe("pending_verification");
    expect(createdUser.uuid).toBeTruthy();
    expect(createdUser.passwordHash?.startsWith("$argon2id$")).toBe(true);

    const [credAccount] = await db
      .select()
      .from(userAccounts)
      .where(
        and(
          eq(userAccounts.userId, createdUser.id),
          eq(userAccounts.providerId, "credential")
        )
      );
    expect(credAccount?.password?.startsWith("$argon2id$")).toBe(true);

    const sessionRows = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, createdUser.id));
    expect(sessionRows).toHaveLength(1);

    const consentRows = await db
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, createdUser.id));
    expect(consentRows).toHaveLength(2);
    expect(consentRows.map((c) => c.consentType).sort()).toEqual([
      "privacy",
      "terms",
    ]);

    const notifRows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, createdUser.id));
    expect(notifRows).toHaveLength(1);
    const notif = notifRows[0];
    expect(notif?.templateCode).toBe("email_verification");

    if (notif) {
      const deliveryRows = await db
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.notificationId, notif.id));
      expect(deliveryRows).toHaveLength(1);
      expect(deliveryRows[0]?.channel).toBe("email");

      const job = await getQueue().getJob(`email:send:${notif.id}`);
      expect(job).toBeDefined();
    }
  });

  it("rejects registration without terms or privacy checkboxes with 422 (BR-REG-02)", async () => {
    const markers = await readCurrentConsentMarkers();
    const res = await postSignUpEmail({
      email: `noterms-${Date.now()}@example.com`,
      password: "chuoixanh123",
      name: "Người Dùng",
      accept_terms: false,
      accept_privacy: true,
      terms_requirement_at: markers.termsRequirementAt,
      privacy_requirement_at: markers.privacyRequirementAt,
    });

    expect(res.status).toBe(422);
    const errBody = (await res.json()) as SignUpResponsePayload;
    expect(errBody.code).toBe("VALIDATION_FAILED");
  });

  it("rejects weak or common passwords (BR-REG-05)", async () => {
    const markers = await readCurrentConsentMarkers();
    const shortRes = await postSignUpEmail({
      email: `weakshort-${Date.now()}@example.com`,
      password: "123",
      name: "Người Dùng",
      accept_terms: true,
      accept_privacy: true,
      terms_requirement_at: markers.termsRequirementAt,
      privacy_requirement_at: markers.privacyRequirementAt,
    });
    expect(shortRes.status).toBeGreaterThanOrEqual(400);

    const commonRes = await postSignUpEmail({
      email: `weakcommon-${Date.now()}@example.com`,
      password: "12345678",
      name: "Người Dùng",
      accept_terms: true,
      accept_privacy: true,
      terms_requirement_at: markers.termsRequirementAt,
      privacy_requirement_at: markers.privacyRequirementAt,
    });
    expect(commonRes.status).toBe(422);
  });

  it("rejects duplicate email case-insensitively without leaking provider (BR-REG-07, BR-REG-10)", async () => {
    const db = getOwnerDb();
    const markers = await readCurrentConsentMarkers();
    const email = `dupe-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    await db.insert(users).values({
      email,
      passwordHash: "dummy_hash",
      displayName: "Người Dùng Dupe",
      status: "pending_verification",
    });

    const res = await postSignUpEmail({
      email: email.toUpperCase(),
      password: "chuoixanh123",
      name: "Người Dùng Mới",
      accept_terms: true,
      accept_privacy: true,
      terms_requirement_at: markers.termsRequirementAt,
      privacy_requirement_at: markers.privacyRequirementAt,
    });

    expect(res.status).toBe(422);
    const errBody = (await res.json()) as SignUpResponsePayload;
    expect(errBody.message ?? "").not.toMatch(PROVIDER_LEAK_REGEX);
  });
});
