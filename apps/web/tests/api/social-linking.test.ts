import {
  encodeOAuthStatePayload,
  getOAuthRegistry,
  OAUTH_COOKIE_NAME,
} from "@mindkid/auth";
import {
  auditLogs,
  getAppDb,
  notificationDeliveries,
  notifications,
  socialIdentities,
  users,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { describe, expect, it, vi } from "vitest";
import oauthCallbackHandler from "#server/api/guest/auth/oauth/[provider]/callback.get";
import deleteSocialIdentityHandler from "#server/api/users/social-identities/[provider].delete";
import getSocialIdentitiesHandler from "#server/api/users/social-identities/index.get";

function mockEvent(
  method: string,
  userId = 501,
  body: Record<string, string | number | boolean | null | undefined> = {},
  options: {
    reauthAt?: Date | null;
    sessionId?: string;
    params?: Record<string, string>;
    url?: string;
    extraCookies?: string;
  } = {}
): H3Event {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "a".repeat(64);
  const reqUrl = options.url || "/";
  return {
    method,
    node: {
      req: {
        headers: {
          host: "localhost:3000",
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}${options.extraCookies ?? ""}`,
          "sec-fetch-site": "same-origin",
        },
        socket: {
          remoteAddress: "127.0.0.1",
        },
        url: reqUrl,
        originalUrl: reqUrl,
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        removeHeader: (name: string) => {
          delete responseHeaders[name.toLowerCase()];
        },
        end: () => undefined,
        statusCode: 200,
      },
    },
    context: {
      user: {
        user_id: userId,
        display_name: "Test User",
        session_id: options.sessionId || `sess_${userId}`,
        reauth_at:
          options.reauthAt === undefined ? new Date() : options.reauthAt,
      },
      reauth_at: options.reauthAt === undefined ? new Date() : options.reauthAt,
      params: options.params || {},
      body,
    },
  } as Partial<H3Event> as H3Event;
}

describe("Task 6 — Social Account Linking & Unlinking (BR-SLK-01..10, D-IM)", () => {
  const db = getAppDb();

  describe("GET /api/users/social-identities (BR-SLK-09)", () => {
    it("BR-SLK-09: returns masked email and linked_at, NEVER returns provider_user_id", async () => {
      const [testUser] = await db
        .insert(users)
        .values({
          email: `parent_linked_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Parent Linked",
          status: "active",
        })
        .returning();

      await db.insert(socialIdentities).values({
        userId: testUser?.id ?? 0,
        provider: "google",
        providerUserId: `google_sub_${Date.now()}_${Math.random()}`,
        emailAtProvider: "google_parent@gmail.com",
        emailVerifiedAtProvider: true,
      });

      const event = mockEvent("GET", testUser?.id ?? 0);
      const res = await getSocialIdentitiesHandler(event);

      expect(res.items).toHaveLength(1);
      const firstItem = res.items[0];
      expect(firstItem?.provider).toBe("google");
      expect(firstItem?.masked_email).toBe("g***@gmail.com");
      expect(firstItem?.linked_at).toBeDefined();

      // Invariant: provider_user_id is NEVER in response
      const rawItem = firstItem as Record<string, string | undefined>;
      expect(rawItem?.provider_user_id).toBeUndefined();
      expect(rawItem?.providerUserId).toBeUndefined();
    });
  });

  describe("OAuth Link Callback & DELETE /api/users/social-identities/:provider (BR-SLK-01, BR-SLK-04, BR-SLK-05, BR-SLK-10, D-IM)", () => {
    it("BR-SLK-05 (#289 S4): OAuth callback with intent=link records audit_log and dispatches social_identity_linked email", async () => {
      const [linkUser] = await db
        .insert(users)
        .values({
          email: `link_notify_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Link Notify User",
          passwordHash: "$argon2id$v=19$m=19456,p=1,t=2$dummyhash",
          status: "active",
        })
        .returning();

      const stateToken = `state_${Date.now()}`;
      const encodedState = encodeOAuthStatePayload(
        {
          state: stateToken,
          code_verifier: "verifier_1234567890",
          provider: "google",
          intent: "link",
          return_to: "/me/settings",
          user_id: linkUser?.id ?? 0,
          created_at: Date.now(),
        },
        process.env.NUXT_SESSION_PASSWORD ?? ""
      );

      const registry = getOAuthRegistry();
      const enabledSpy = vi
        .spyOn(registry, "isProviderEnabled")
        .mockReturnValue(true);
      const callbackSpy = vi
        .spyOn(registry, "handleCallback")
        .mockResolvedValue({
          provider: "google",
          provider_user_id: `google_linked_${Date.now()}_${Math.random()}`,
          email_at_provider: "linked@gmail.com",
          email_verified_at_provider: true,
          display_name_at_provider: "Linked Google",
        });

      try {
        const event = mockEvent(
          "GET",
          linkUser?.id ?? 0,
          {},
          {
            params: { provider: "google" },
            url: `/api/guest/auth/oauth/google/callback?state=${stateToken}&code=code_123`,
            extraCookies: `; ${OAUTH_COOKIE_NAME}=${encodedState}`,
          }
        );

        await oauthCallbackHandler(event);

        const [notif] = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.recipientId, linkUser?.id ?? 0),
              eq(notifications.templateCode, "social_identity_linked")
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
          expect(deliveries[0]?.channel).toBe("email");
        }
      } finally {
        enabledSpy.mockRestore();
        callbackSpy.mockRestore();
      }
    });

    it("BR-SLK-01: unlinking requires reauth within 5 minutes (428 REAUTH_REQUIRED if null)", async () => {
      const [testUser] = await db
        .insert(users)
        .values({
          email: `reauth_test_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Reauth Test",
          status: "active",
        })
        .returning();

      const event = mockEvent(
        "DELETE",
        testUser?.id ?? 0,
        {},
        {
          reauthAt: null,
          params: { provider: "google" },
        }
      );

      await expect(deleteSocialIdentityHandler(event)).rejects.toSatisfy(
        (err: { statusCode?: number; status?: number }) => {
          expect(err.statusCode || err.status).toBe(428);
          return true;
        }
      );
    });

    it("BR-SLK-04: rejects unlinking when user has NO password and only 1 social identity with 409 LAST_LOGIN_METHOD", async () => {
      const [passwordlessUser] = await db
        .insert(users)
        .values({
          email: `passwordless_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Passwordless User",
          passwordHash: null, // NO password!
          status: "active",
        })
        .returning();

      await db.insert(socialIdentities).values({
        userId: passwordlessUser?.id ?? 0,
        provider: "google",
        providerUserId: `google_sub_${Date.now()}_${Math.random()}`,
        emailAtProvider: "passwordless@gmail.com",
      });

      const event = mockEvent(
        "DELETE",
        passwordlessUser?.id ?? 0,
        {},
        {
          params: { provider: "google" },
        }
      );

      await expect(deleteSocialIdentityHandler(event)).rejects.toSatisfy(
        (err: {
          statusCode?: number;
          status?: number;
          data?: { code?: string; details?: { set_password_url?: string } };
          code?: string;
        }) => {
          expect(err.statusCode || err.status).toBe(409);
          expect(err.data?.code || err.code).toBe("LAST_LOGIN_METHOD");
          expect(err.data?.details?.set_password_url).toBe("/me/settings");
          return true;
        }
      );

      // Verify row was NOT deleted
      const rows = await db
        .select()
        .from(socialIdentities)
        .where(eq(socialIdentities.userId, passwordlessUser?.id ?? 0));
      expect(rows).toHaveLength(1);
    });

    it("BR-SLK-04 & BR-SLK-10 & BR-SLK-05: permits unlinking last SNS when password exists, records audit log and dispatches social_identity_unlinked email", async () => {
      const [userWithPassword] = await db
        .insert(users)
        .values({
          email: `has_password_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Has Password",
          passwordHash: "$argon2id$v=19$m=19456,p=1,t=2$dummyhash",
          status: "active",
        })
        .returning();

      await db.insert(socialIdentities).values({
        userId: userWithPassword?.id ?? 0,
        provider: "google",
        providerUserId: `google_sub_${Date.now()}_${Math.random()}`,
        emailAtProvider: "has_pwd@gmail.com",
      });

      const event = mockEvent(
        "DELETE",
        userWithPassword?.id ?? 0,
        {},
        {
          params: { provider: "google" },
        }
      );

      const res = await deleteSocialIdentityHandler(event);
      expect(res.ok).toBe(true);
      expect(res.login_methods_left).toBe(1); // Password remains

      // Verify row was hard-deleted (BR-SLK-10)
      const rows = await db
        .select()
        .from(socialIdentities)
        .where(eq(socialIdentities.userId, userWithPassword?.id ?? 0));
      expect(rows).toHaveLength(0);

      // Verify audit log (BR-SLK-05: with provider, WITHOUT provider_user_id)
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

      // Verify notification & delivery (#289 S4)
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
        expect(deliveries[0]?.channel).toBe("email");
      }
    });

    it("D-IM & BR-SLK-04 Concurrency Test: Two parallel DELETE requests on account with 2 identities and NO password -> exactly ONE succeeds, ONE fails with 409", async () => {
      const [multiIdentityUser] = await db
        .insert(users)
        .values({
          email: `multi_identity_${Date.now()}_${Math.random()}@example.com`,
          displayName: "Multi Identity User",
          passwordHash: null, // NO password!
          status: "active",
        })
        .returning();

      await db.insert(socialIdentities).values([
        {
          userId: multiIdentityUser?.id ?? 0,
          provider: "google",
          providerUserId: `google_sub_race_${Date.now()}_${Math.random()}`,
          emailAtProvider: "multi@gmail.com",
        },
        {
          userId: multiIdentityUser?.id ?? 0,
          provider: "facebook",
          providerUserId: `fb_id_race_${Date.now()}_${Math.random()}`,
          emailAtProvider: "multi@facebook.com",
        },
      ]);

      const eventGoogle = mockEvent(
        "DELETE",
        multiIdentityUser?.id ?? 0,
        {},
        {
          params: { provider: "google" },
        }
      );
      const eventFacebook = mockEvent(
        "DELETE",
        multiIdentityUser?.id ?? 0,
        {},
        {
          params: { provider: "facebook" },
        }
      );

      // Execute concurrently
      const results = await Promise.allSettled([
        deleteSocialIdentityHandler(eventGoogle),
        deleteSocialIdentityHandler(eventFacebook),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const rejectedError = (rejected[0] as PromiseRejectedResult).reason as {
        statusCode?: number;
        status?: number;
      };
      expect(rejectedError.statusCode || rejectedError.status).toBe(409);

      // Verify invariant: Exactly 1 identity remains in DB
      const remainingIdentities = await db
        .select()
        .from(socialIdentities)
        .where(eq(socialIdentities.userId, multiIdentityUser?.id ?? 0));
      expect(remainingIdentities).toHaveLength(1);
    });
  });
});
