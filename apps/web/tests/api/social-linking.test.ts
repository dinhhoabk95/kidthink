import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import {
  auditLogs,
  getOwnerDb,
  NOTIFICATION_CHANNEL,
  notificationDeliveries,
  notifications,
  USER_STATUS,
  userAccounts,
  users,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createEvent, type H3Event } from "h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import deleteSocialIdentityHandler from "#server/api/users/social-identities/[provider].delete";
import getSocialIdentitiesHandler from "#server/api/users/social-identities/index.get";
import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

interface LinkSocialInitResponse {
  url?: string;
  redirect?: boolean;
}

interface HttpErrorShape {
  statusCode?: number;
  status?: number;
  code?: string;
  data?: {
    code?: string;
    details?: {
      set_password_url?: string;
    };
  };
}

function collectCookie(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.length > 0 && !pair.endsWith("="))
    .join("; ");
}

function buildUnsignedGoogleIdToken(sub: string, email: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
    "utf8"
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub,
      id: sub,
      email,
      name: "Linked Google Account",
      email_verified: true,
      iss: "https://accounts.google.com",
      aud: "test-google-client-id",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
    "utf8"
  ).toString("base64url");
  return `${header}.${payload}.sig`;
}

function createUserH3Event(
  method: "GET" | "DELETE",
  userId: number,
  options: {
    reauthAt?: Date | null;
    sessionId?: string;
    params?: Record<string, string>;
  } = {}
): H3Event {
  const socket = new Socket();
  Object.defineProperty(socket, "remoteAddress", { value: "127.0.0.1" });
  const req = new IncomingMessage(socket);
  req.method = method;
  req.url = "/api/users/social-identities";
  req.headers = {
    host: "localhost:3000",
    origin: "http://localhost:3000",
    "sec-fetch-site": "same-origin",
    "user-agent": "VitestSocialLinking/1.0",
  };
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  const resolvedReauth =
    options.reauthAt === undefined ? new Date() : options.reauthAt;

  event.context.user = {
    user_id: userId,
    display_name: "Test User",
    session_id: options.sessionId ?? `sess_${userId}`,
    reauth_at: resolvedReauth ?? undefined,
  };
  event.context.params = options.params ?? {};
  return event;
}

describe("Task 6 — Social Account Linking & Unlinking (BR-SLK-01..10, BR-SIB-10, D-IM)", () => {
  const db = getOwnerDb();
  let prevGoogleId: string | undefined;
  let prevGoogleSecret: string | undefined;

  beforeEach(() => {
    prevGoogleId = process.env.GOOGLE_CLIENT_ID;
    prevGoogleSecret = process.env.GOOGLE_CLIENT_SECRET;
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = prevGoogleId;
    process.env.GOOGLE_CLIENT_SECRET = prevGoogleSecret;
    resetBetterAuthInstancesForTests();
  });

  describe("GET /api/users/social-identities (BR-SLK-09)", () => {
    it("BR-SLK-09: returns masked email and linked_at from user_accounts, NEVER returns accountId", async () => {
      const [testUser] = await db
        .insert(users)
        .values({
          email: `parent_linked_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Parent Linked",
          status: USER_STATUS.ACTIVE,
        })
        .returning();
      if (!testUser) {
        throw new Error("Expected test user");
      }

      await db.insert(userAccounts).values({
        userId: testUser.id,
        providerId: "google",
        accountId: `google_sub_${Date.now()}_${Math.random()}`,
        emailAtProvider: "google_parent@gmail.com",
        emailVerifiedAtProvider: true,
      });

      const event = createUserH3Event("GET", testUser.id);
      const res = await getSocialIdentitiesHandler(event);

      expect(res.items).toHaveLength(1);
      const firstItem = res.items[0];
      expect(firstItem?.provider).toBe("google");
      expect(firstItem?.masked_email).toBe("go***@gmail.com");
      expect(firstItem?.linked_at).toBeDefined();

      const serialized = JSON.stringify(firstItem);
      expect(serialized).not.toContain("google_sub_");
      expect(serialized).not.toContain("accountId");
    });
  });

  describe("Better Auth /link-social & DELETE /api/users/social-identities/:provider", () => {
    it("links Google account to authenticated user via Better Auth link-social and strips provider tokens (BR-SLK-02, BR-SIB-10)", async () => {
      const ctx = await getUserAuth().$context;
      const password = "LinkPassword123!";
      const passwordHash = await ctx.password.hash(password);
      const email = `link_ba_${Date.now()}_${Math.random()}@example.com`;

      const [linkUser] = await db
        .insert(users)
        .values({
          email,
          displayName: "Link BA User",
          passwordHash,
          status: USER_STATUS.ACTIVE,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        })
        .returning();
      if (!linkUser) {
        throw new Error("Expected linkUser");
      }

      await ctx.internalAdapter.linkAccount({
        userId: String(linkUser.id),
        providerId: "credential",
        accountId: String(linkUser.id),
        password: passwordHash,
      });

      const loginRes = await getUserAuth().handler(
        new Request("http://localhost:3000/api/auth/users/sign-in/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({ email, password }),
        })
      );
      const sessionCookie = collectCookie(loginRes);

      const googleProvider = ctx.socialProviders.find((p) => p.id === "google");
      if (!googleProvider) {
        throw new Error("Expected google provider");
      }

      const sub = `google_linked_${Date.now()}`;
      const validateSpy = vi
        .spyOn(googleProvider, "validateAuthorizationCode")
        .mockResolvedValue({
          accessToken: "ya29.secret_link_access",
          refreshToken: "1//secret_link_refresh",
          idToken: buildUnsignedGoogleIdToken(sub, "linked_other@gmail.com"),
          scopes: ["openid", "email", "profile"],
        });

      try {
        const initLink = await getUserAuth().handler(
          new Request("http://localhost:3000/api/auth/users/link-social", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: "http://localhost:3000",
              cookie: sessionCookie,
            },
            body: JSON.stringify({
              provider: "google",
              callbackURL: "/me/settings",
              disableRedirect: true,
            }),
          })
        );
        expect(initLink.status).toBe(200);
        const initBody = (await initLink.json()) as LinkSocialInitResponse;
        const state =
          new URL(initBody.url ?? "").searchParams.get("state") ?? "";
        const linkCookies = [sessionCookie, collectCookie(initLink)]
          .filter(Boolean)
          .join("; ");

        const cbRes = await getUserAuth().handler(
          new Request(
            `http://localhost:3000/api/auth/users/callback/google?code=link_code&state=${encodeURIComponent(state)}`,
            {
              method: "GET",
              headers: {
                origin: "http://localhost:3000",
                cookie: linkCookies,
              },
            }
          )
        );
        expect(cbRes.status).toBe(302);
        expect(cbRes.headers.get("location")).toContain("/me/settings");

        const [linkedAccount] = await db
          .select()
          .from(userAccounts)
          .where(
            and(
              eq(userAccounts.userId, linkUser.id),
              eq(userAccounts.providerId, "google")
            )
          );
        expect(linkedAccount).toBeDefined();
        expect(linkedAccount?.accountId).toBe(sub);
        expect(linkedAccount?.accessToken).toBeNull();
        expect(linkedAccount?.refreshToken).toBeNull();
        expect(linkedAccount?.idToken).toBeNull();
      } finally {
        validateSpy.mockRestore();
      }
    });

    it("BR-SLK-01: unlinking requires reauth within 5 minutes (428 REAUTH_REQUIRED if null)", async () => {
      const [testUser] = await db
        .insert(users)
        .values({
          email: `reauth_test_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Reauth Test",
          status: USER_STATUS.ACTIVE,
        })
        .returning();

      const event = createUserH3Event("DELETE", testUser?.id ?? 0, {
        reauthAt: null,
        params: { provider: "google" },
      });

      await expect(deleteSocialIdentityHandler(event)).rejects.toSatisfy(
        (err: HttpErrorShape) => (err.statusCode ?? err.status) === 428
      );
    });

    it("BR-SLK-04: rejects unlinking when user has NO password and only 1 social account", async () => {
      const [passwordlessUser] = await db
        .insert(users)
        .values({
          email: `passwordless_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Passwordless User",
          passwordHash: null,
          status: USER_STATUS.ACTIVE,
        })
        .returning();

      await db.insert(userAccounts).values({
        userId: passwordlessUser?.id ?? 0,
        providerId: "google",
        accountId: `google_sub_${Date.now()}_${Math.random()}`,
        emailAtProvider: "passwordless@gmail.com",
      });

      const event = createUserH3Event("DELETE", passwordlessUser?.id ?? 0, {
        params: { provider: "google" },
      });

      await expect(deleteSocialIdentityHandler(event)).rejects.toSatisfy(
        (err: HttpErrorShape) => {
          const status = err.statusCode ?? err.status ?? 0;
          const code = err.data?.code ?? err.code;
          expect(status).toBeGreaterThanOrEqual(400);
          expect(code).toBe("LAST_LOGIN_METHOD");
          return true;
        }
      );

      const rows = await db
        .select()
        .from(userAccounts)
        .where(eq(userAccounts.userId, passwordlessUser?.id ?? 0));
      expect(rows).toHaveLength(1);
    });

    it("BR-SLK-04 & BR-SLK-10 & BR-SLK-05: permits unlinking last SNS when password exists, audits, and dispatches email", async () => {
      const [userWithPassword] = await db
        .insert(users)
        .values({
          email: `has_password_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Has Password",
          passwordHash: "$argon2id$v=19$m=19456,p=1,t=2$dummyhash",
          status: USER_STATUS.ACTIVE,
        })
        .returning();

      await db.insert(userAccounts).values([
        {
          userId: userWithPassword?.id ?? 0,
          providerId: "credential",
          accountId: String(userWithPassword?.id ?? 0),
          password: "$argon2id$v=19$m=19456,p=1,t=2$dummyhash",
        },
        {
          userId: userWithPassword?.id ?? 0,
          providerId: "google",
          accountId: `google_sub_${Date.now()}_${Math.random()}`,
          emailAtProvider: "has_pwd@gmail.com",
        },
      ]);

      const event = createUserH3Event("DELETE", userWithPassword?.id ?? 0, {
        params: { provider: "google" },
      });

      const res = await deleteSocialIdentityHandler(event);
      expect(res.ok).toBe(true);
      expect(res.login_methods_left).toBe(1);

      const googleRows = await db
        .select()
        .from(userAccounts)
        .where(
          and(
            eq(userAccounts.userId, userWithPassword?.id ?? 0),
            eq(userAccounts.providerId, "google")
          )
        );
      expect(googleRows).toHaveLength(0);

      const logs = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.actorId, userWithPassword?.id ?? 0),
            eq(auditLogs.action, "social_identity.unlinked")
          )
        );
      expect(logs).toHaveLength(1);
      expect(logs[0]?.afterData).toEqual({ provider: "google" });

      const [notif] = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientId, userWithPassword?.id ?? 0),
            eq(notifications.templateCode, "social_identity_unlinked")
          )
        );
      expect(notif).toBeDefined();
      expect(notif?.payload).toEqual({ provider: "google" });

      if (notif) {
        const deliveries = await db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.notificationId, notif.id));
        expect(deliveries).toHaveLength(1);
        expect(deliveries[0]?.channel).toBe(NOTIFICATION_CHANNEL.EMAIL);
      }
    });

    it("D-IM & BR-SLK-04 Concurrency Test: two parallel DELETE requests on passwordless 2-SNS user -> ONE succeeds, ONE fails", async () => {
      const [multiIdentityUser] = await db
        .insert(users)
        .values({
          email: `multi_identity_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Multi Identity User",
          passwordHash: null,
          status: USER_STATUS.ACTIVE,
        })
        .returning();

      await db.insert(userAccounts).values([
        {
          userId: multiIdentityUser?.id ?? 0,
          providerId: "google",
          accountId: `google_sub_race_${Date.now()}_${Math.random()}`,
          emailAtProvider: "multi@gmail.com",
        },
        {
          userId: multiIdentityUser?.id ?? 0,
          providerId: "facebook",
          accountId: `fb_id_race_${Date.now()}_${Math.random()}`,
          emailAtProvider: "multi@facebook.com",
        },
      ]);

      const eventGoogle = createUserH3Event(
        "DELETE",
        multiIdentityUser?.id ?? 0,
        { params: { provider: "google" } }
      );
      const eventFacebook = createUserH3Event(
        "DELETE",
        multiIdentityUser?.id ?? 0,
        { params: { provider: "facebook" } }
      );

      const results = await Promise.allSettled([
        deleteSocialIdentityHandler(eventGoogle),
        deleteSocialIdentityHandler(eventFacebook),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const rejectedReason = (rejected[0] as PromiseRejectedResult)
        .reason as HttpErrorShape;
      expect(
        rejectedReason.statusCode ?? rejectedReason.status ?? 0
      ).toBeGreaterThanOrEqual(400);

      const remainingIdentities = await db
        .select()
        .from(userAccounts)
        .where(eq(userAccounts.userId, multiIdentityUser?.id ?? 0));
      expect(remainingIdentities).toHaveLength(1);
    });
  });
});
