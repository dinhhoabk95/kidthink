import { auditLogs, getAppDb, socialIdentities, users } from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import deleteSocialIdentityHandler from "../../server/api/users/social-identities/[provider].delete.js";
import getSocialIdentitiesHandler from "../../server/api/users/social-identities/index.get.js";

function mockEvent(
  method: string,
  userId = 501,
  body: any = {},
  options: {
    reauthAt?: Date | null;
    sessionId?: string;
    params?: Record<string, string>;
  } = {}
) {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "a".repeat(64);
  return {
    method,
    node: {
      req: {
        headers: {
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}`,
          "sec-fetch-site": "same-origin",
        },
        socket: {
          remoteAddress: "127.0.0.1",
        },
        url: "/",
        originalUrl: "/",
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      user: {
        user_id: userId,
        display_name: "Test User",
        session_id: options.sessionId || `sess_${userId}`,
        refresh_token_version: 0,
        reauth_at:
          options.reauthAt === undefined ? new Date() : options.reauthAt,
      },
      reauth_at: options.reauthAt === undefined ? new Date() : options.reauthAt,
      params: options.params || {},
      body,
    },
    _body: body,
  } as any;
}

describe("Task 6 — Social Account Linking & Unlinking (BR-SLK-01..10, D-IM)", () => {
  const db = getAppDb();

  beforeEach(async () => {
    await db.delete(socialIdentities);
    await db.delete(users);
  });

  describe("GET /api/users/social-identities (BR-SLK-09)", () => {
    it("BR-SLK-09: returns masked email and linked_at, NEVER returns provider_user_id", async () => {
      const [testUser] = await db
        .insert(users)
        .values({
          email: "parent_linked@example.com",
          displayName: "Parent Linked",
          status: "active",
        })
        .returning();

      await db.insert(socialIdentities).values({
        userId: testUser?.id ?? 0,
        provider: "google",
        providerUserId: "google_secret_sub_99999",
        emailAtProvider: "google_parent@gmail.com",
        emailVerifiedAtProvider: true,
      });

      const event = mockEvent("GET", testUser?.id ?? 0);
      const res = await getSocialIdentitiesHandler(event);

      expect(res.items).toHaveLength(1);
      expect(res.items[0].provider).toBe("google");
      expect(res.items[0].masked_email).toBe("g***@gmail.com");
      expect(res.items[0].linked_at).toBeDefined();

      // Invariant: provider_user_id is NEVER in response
      expect((res.items[0] as any).provider_user_id).toBeUndefined();
      expect((res.items[0] as any).providerUserId).toBeUndefined();
    });
  });

  describe("DELETE /api/users/social-identities/:provider (BR-SLK-01, BR-SLK-04, BR-SLK-05, BR-SLK-10, D-IM)", () => {
    it("BR-SLK-01: unlinking requires reauth within 5 minutes (428 REAUTH_REQUIRED if null)", async () => {
      const [testUser] = await db
        .insert(users)
        .values({
          email: "reauth_test@example.com",
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

      try {
        await deleteSocialIdentityHandler(event);
        expect.fail("Should have thrown 428 REAUTH_REQUIRED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(428);
      }
    });

    it("BR-SLK-04: rejects unlinking when user has NO password and only 1 social identity with 409 LAST_LOGIN_METHOD", async () => {
      const [passwordlessUser] = await db
        .insert(users)
        .values({
          email: "passwordless@example.com",
          displayName: "Passwordless User",
          passwordHash: null, // NO password!
          status: "active",
        })
        .returning();

      await db.insert(socialIdentities).values({
        userId: passwordlessUser?.id ?? 0,
        provider: "google",
        providerUserId: "google_sub_1111",
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

      try {
        await deleteSocialIdentityHandler(event);
        expect.fail("Should have thrown 409 LAST_LOGIN_METHOD");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(409);
        expect(err.data?.code || err.code).toBe("LAST_LOGIN_METHOD");
        expect(err.data?.details?.set_password_url).toBe("/me/settings");
      }

      // Verify row was NOT deleted
      const rows = await db
        .select()
        .from(socialIdentities)
        .where(eq(socialIdentities.userId, passwordlessUser?.id ?? 0));
      expect(rows).toHaveLength(1);
    });

    it("BR-SLK-04 & BR-SLK-10 & BR-SLK-05: permits unlinking last SNS when password exists, records audit log", async () => {
      const [userWithPassword] = await db
        .insert(users)
        .values({
          email: "has_password@example.com",
          displayName: "Has Password",
          passwordHash: "$argon2id$v=19$m=19456,p=1,t=2$dummyhash",
          status: "active",
        })
        .returning();

      await db.insert(socialIdentities).values({
        userId: userWithPassword?.id ?? 0,
        provider: "google",
        providerUserId: "google_sub_2222",
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
      expect(logs[0].afterData).toEqual({ provider: "google" });
    });

    it("D-IM & BR-SLK-04 Concurrency Test: Two parallel DELETE requests on account with 2 identities and NO password -> exactly ONE succeeds, ONE fails with 409", async () => {
      const [multiIdentityUser] = await db
        .insert(users)
        .values({
          email: "multi_identity@example.com",
          displayName: "Multi Identity User",
          passwordHash: null, // NO password!
          status: "active",
        })
        .returning();

      await db.insert(socialIdentities).values([
        {
          userId: multiIdentityUser?.id ?? 0,
          provider: "google",
          providerUserId: "google_sub_race_1",
          emailAtProvider: "multi@gmail.com",
        },
        {
          userId: multiIdentityUser?.id ?? 0,
          provider: "facebook",
          providerUserId: "fb_id_race_2",
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

      const rejectedError = (rejected[0] as PromiseRejectedResult).reason;
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
