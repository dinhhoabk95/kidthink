import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import {
  createSocialSignupConsentTicket,
  getAuthRedisClient,
  InMemoryRedisClient,
  SOCIAL_SIGNUP_CONSENT_COOKIE,
  setAuthRedisClient,
} from "@mindkid/auth";
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
import { and, eq, inArray } from "drizzle-orm";
import { createEvent, type H3Event } from "h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import socialConsentHandler from "#server/api/guest/auth/users/social-consent.post";
import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

interface SocialSignInInitResponse {
  url?: string;
  redirect?: boolean;
}

interface MockOAuthProfile {
  readonly sub: string;
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly picture?: string;
  readonly email_verified: boolean;
}

function encodeBase64Url(json: string): string {
  return Buffer.from(json, "utf8").toString("base64url");
}

function buildUnsignedIdToken(profile: MockOAuthProfile): string {
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      ...profile,
      iss: "https://accounts.google.com",
      aud: "test-google-client-id",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  return `${header}.${payload}.signature`;
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

function buildGuestConsentEvent(
  body: Record<string, string | boolean | null | undefined>
): { event: H3Event; res: ServerResponse } {
  const socket = new Socket();
  Object.defineProperty(socket, "remoteAddress", { value: "127.0.0.1" });
  const req = new IncomingMessage(socket);
  req.method = "POST";
  req.url = "/api/guest/auth/users/social-consent";
  req.headers = {
    host: "localhost:3000",
    origin: "http://localhost:3000",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (ConsentTest)",
  };
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  event.context.body = body;
  return { event, res };
}

async function executeSocialCallback(input: {
  readonly provider: "google" | "facebook";
  readonly requestSignUp: boolean;
  readonly consentToken?: string;
  readonly profile: MockOAuthProfile;
}): Promise<Response> {
  const ctx = await getUserAuth().$context;
  const providerObj = ctx.socialProviders.find((p) => p.id === input.provider);
  if (!providerObj) {
    throw new Error(`OAuth provider ${input.provider} not registered`);
  }

  const validateSpy = vi
    .spyOn(providerObj, "validateAuthorizationCode")
    .mockResolvedValue({
      accessToken: "mock-provider-access-token-secret",
      refreshToken: "mock-provider-refresh-token-secret",
      idToken: buildUnsignedIdToken(input.profile),
      accessTokenExpiresAt: new Date(Date.now() + 3_600_000),
      refreshTokenExpiresAt: new Date(Date.now() + 86_400_000),
      scopes: ["openid", "email", "profile"],
    });

  try {
    const initRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-in/social", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          provider: input.provider,
          requestSignUp: input.requestSignUp,
          callbackURL: "/me",
          errorCallbackURL: "/login",
          disableRedirect: true,
        }),
      })
    );
    expect(initRes.status).toBe(200);
    const initJson = (await initRes.json()) as SocialSignInInitResponse;
    const authUrl = new URL(initJson.url ?? "");
    const state = authUrl.searchParams.get("state") ?? "";
    const stateCookie = collectCookie(initRes);

    const cookieParts = [stateCookie];
    if (input.consentToken) {
      cookieParts.push(
        `${SOCIAL_SIGNUP_CONSENT_COOKIE}=${encodeURIComponent(input.consentToken)}`
      );
    }

    return await getUserAuth().handler(
      new Request(
        `http://localhost:3000/api/auth/users/callback/${input.provider}?code=mock_code_123&state=${encodeURIComponent(state)}`,
        {
          method: "GET",
          headers: {
            origin: "http://localhost:3000",
            cookie: cookieParts.filter(Boolean).join("; "),
          },
        }
      )
    );
  } finally {
    validateSpy.mockRestore();
  }
}

describe("Task 3, 4 & 5 — Better Auth Social Login & Registration (BR-SCL-01..14, BR-SIB-10)", () => {
  const db = getOwnerDb();
  const createdUserIds: number[] = [];
  let prevGoogleId: string | undefined;
  let prevGoogleSecret: string | undefined;
  let prevFbId: string | undefined;
  let prevFbSecret: string | undefined;

  const genEmail = (prefix: string) =>
    `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;

  beforeEach(() => {
    prevGoogleId = process.env.GOOGLE_CLIENT_ID;
    prevGoogleSecret = process.env.GOOGLE_CLIENT_SECRET;
    prevFbId = process.env.FACEBOOK_CLIENT_ID;
    prevFbSecret = process.env.FACEBOOK_CLIENT_SECRET;

    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
    process.env.FACEBOOK_CLIENT_ID = "test-facebook-client-id";
    process.env.FACEBOOK_CLIENT_SECRET = "test-facebook-client-secret";

    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  afterEach(async () => {
    process.env.GOOGLE_CLIENT_ID = prevGoogleId;
    process.env.GOOGLE_CLIENT_SECRET = prevGoogleSecret;
    process.env.FACEBOOK_CLIENT_ID = prevFbId;
    process.env.FACEBOOK_CLIENT_SECRET = prevFbSecret;
    resetBetterAuthInstancesForTests();

    if (createdUserIds.length > 0) {
      const ids = [...createdUserIds];
      createdUserIds.length = 0;
      await db
        .delete(consentLogs)
        .where(inArray(consentLogs.userId, ids))
        .catch(() => undefined);
      await db
        .delete(users)
        .where(inArray(users.id, ids))
        .catch(() => undefined);
    }
  });

  it("BR-SCL-01: blocks implicit OAuth signup without requestSignUp and rejects signup missing consent ticket", async () => {
    const email = genEmail("no_consent");
    const sub = `google_noconsent_${Date.now()}`;

    const implicitRes = await executeSocialCallback({
      provider: "google",
      requestSignUp: false,
      profile: {
        sub,
        id: sub,
        email,
        name: "Parent No Implicit",
        email_verified: true,
      },
    });
    expect(implicitRes.headers.get("location") ?? "").toContain(
      "signup_disabled"
    );

    const missingTicketRes = await executeSocialCallback({
      provider: "google",
      requestSignUp: true,
      profile: {
        sub,
        id: sub,
        email,
        name: "Parent Missing Ticket",
        email_verified: true,
      },
    });
    expect(missingTicketRes.headers.get("location") ?? "").toContain(
      "CONSENT_REQUIRED"
    );

    const rows = await db.select().from(users).where(eq(users.email, email));
    expect(rows).toHaveLength(0);

    const badConsentCall = buildGuestConsentEvent({
      accept_terms: false,
      accept_privacy: true,
    });
    await expect(
      socialConsentHandler(badConsentCall.event)
    ).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it("BR-SCL-02, BR-SCL-05, BR-SCL-08, BR-SCL-12, BR-SIB-10: Google signup with consent ticket creates active user, 2 consent_logs, and strips OAuth tokens", async () => {
    const email = genEmail("google_verified");
    const sub = `google_sub_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const markers = await readConsentMarkers();

    const consentCall = buildGuestConsentEvent({
      accept_terms: true,
      accept_privacy: true,
      terms_requirement_at: markers.termsRequirementAt,
      privacy_requirement_at: markers.privacyRequirementAt,
    });
    const consentOut = await socialConsentHandler(consentCall.event);
    expect(consentOut.ok).toBe(true);

    const rawSetCookie = String(consentCall.res.getHeader("set-cookie") ?? "");
    expect(rawSetCookie).toContain(`${SOCIAL_SIGNUP_CONSENT_COOKIE}=`);
    const cookieValue =
      rawSetCookie
        .split(";")[0]
        ?.slice(`${SOCIAL_SIGNUP_CONSENT_COOKIE}=`.length) ?? "";
    const consentToken = decodeURIComponent(cookieValue);

    const callbackRes = await executeSocialCallback({
      provider: "google",
      requestSignUp: true,
      consentToken,
      profile: {
        sub,
        id: sub,
        email,
        name: "Verified Parent",
        picture: "https://lh3.googleusercontent.com/avatar.png",
        email_verified: true,
      },
    });
    expect(callbackRes.status).toBe(302);
    expect(collectCookie(callbackRes)).toContain("mindkid-user.session_token=");

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (!dbUser) {
      throw new Error("Expected created Google user");
    }
    createdUserIds.push(dbUser.id);

    expect(dbUser.status).toBe("active");
    expect(dbUser.emailVerified).toBe(true);
    expect(dbUser.emailVerifiedAt).toBeInstanceOf(Date);
    expect(dbUser.passwordHash).toBeNull();
    expect(dbUser.image).toBeNull();

    const [account] = await db
      .select()
      .from(userAccounts)
      .where(
        and(
          eq(userAccounts.userId, dbUser.id),
          eq(userAccounts.providerId, "google")
        )
      );
    expect(account).toBeDefined();
    expect(account?.accountId).toBe(sub);
    expect(account?.accessToken).toBeNull();
    expect(account?.refreshToken).toBeNull();
    expect(account?.idToken).toBeNull();
    expect(account?.accessTokenExpiresAt).toBeNull();
    expect(account?.refreshTokenExpiresAt).toBeNull();

    const consents = await db
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, dbUser.id));
    expect(consents).toHaveLength(2);
    expect(consents.map((c) => c.consentType).sort()).toEqual([
      "privacy",
      "terms",
    ]);

    const [sess] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, dbUser.id));
    expect(sess?.authMethod).toBe("social");
  });

  it("BR-SCL-05 & BR-OAP-08: Facebook signup forces emailVerified false -> pending_verification + email_verification queued + tokens stripped", async () => {
    const email = genEmail("fb_user");
    const sub = `fb_sub_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const markers = await readConsentMarkers();

    const consentToken = await createSocialSignupConsentTicket(
      getAuthRedisClient(),
      {
        termsRequirementAt: markers.termsRequirementAt,
        privacyRequirementAt: markers.privacyRequirementAt,
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (FBTest)",
      }
    );

    const callbackRes = await executeSocialCallback({
      provider: "facebook",
      requestSignUp: true,
      consentToken,
      profile: {
        sub,
        id: sub,
        email,
        name: "FB User",
        email_verified: true,
      },
    });
    expect(callbackRes.status).toBe(302);

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (!dbUser) {
      throw new Error("Expected created Facebook user");
    }
    createdUserIds.push(dbUser.id);

    expect(dbUser.status).toBe("pending_verification");
    expect(dbUser.emailVerified).toBe(false);
    expect(dbUser.emailVerifiedAt).toBeNull();

    const [fbAccount] = await db
      .select()
      .from(userAccounts)
      .where(
        and(
          eq(userAccounts.userId, dbUser.id),
          eq(userAccounts.providerId, "facebook")
        )
      );
    expect(fbAccount?.accessToken).toBeNull();
    expect(fbAccount?.refreshToken).toBeNull();
    expect(fbAccount?.idToken).toBeNull();

    const [notif] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, dbUser.id));
    expect(notif?.templateCode).toBe("email_verification");

    if (notif) {
      const deliveries = await db
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.notificationId, notif.id));
      expect(deliveries).toHaveLength(1);
      expect(deliveries[0]?.channel).toBe("email");
    }
  });

  it("BR-SCL-04: disableImplicitLinking refuses to auto-link when email matches existing password account", async () => {
    const email = genEmail("existing_pwd");
    const [existingUser] = await db
      .insert(users)
      .values({
        email,
        displayName: "Existing Parent",
        passwordHash: "$argon2id$v=19$m=19456,p=1,t=2$dummyhash",
        status: "active",
        emailVerified: true,
        emailVerifiedAt: new Date(),
      })
      .returning();
    if (!existingUser) {
      throw new Error("Expected existing user");
    }
    createdUserIds.push(existingUser.id);

    await db.insert(userAccounts).values({
      userId: existingUser.id,
      accountId: String(existingUser.id),
      providerId: "credential",
      password: "$argon2id$v=19$m=19456,p=1,t=2$dummyhash",
    });

    const markers = await readConsentMarkers();
    const consentToken = await createSocialSignupConsentTicket(
      getAuthRedisClient(),
      {
        termsRequirementAt: markers.termsRequirementAt,
        privacyRequirementAt: markers.privacyRequirementAt,
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (ConflictTest)",
      }
    );

    const attackerSub = `google_attacker_${Date.now()}`;
    const conflictRes = await executeSocialCallback({
      provider: "google",
      requestSignUp: true,
      consentToken,
      profile: {
        sub: attackerSub,
        id: attackerSub,
        email,
        name: "Attacker Name",
        email_verified: true,
      },
    });
    expect(conflictRes.headers.get("location") ?? "").toContain(
      "account_not_linked"
    );

    const linkedSocials = await db
      .select()
      .from(userAccounts)
      .where(
        and(
          eq(userAccounts.userId, existingUser.id),
          eq(userAccounts.providerId, "google")
        )
      );
    expect(linkedSocials).toHaveLength(0);
  });
});
