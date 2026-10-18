import { encodeOAuthTicket, type NormalizedProfile } from "@mindkid/auth";
import {
  consentLogs,
  getAppDb,
  notificationDeliveries,
  notifications,
  socialIdentities,
  users,
  verificationTokens,
} from "@mindkid/db";
import { and, eq, inArray } from "drizzle-orm";
import type { H3Event } from "h3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleSocialLogin } from "#server/api/guest/auth/users/social-login.post";

function createMockEvent(
  options: { oauth_profile?: NormalizedProfile; ip?: string } = {}
): H3Event {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "a".repeat(64);
  // Vé đăng ký đi qua cookie đã ký như production, không nhét vào event.context.
  const ticketCookie = options.oauth_profile
    ? `; tm_oauth_ticket=${encodeOAuthTicket(
        { profile: options.oauth_profile, created_at: Date.now() },
        process.env.NUXT_SESSION_PASSWORD ?? ""
      )}`
    : "";
  return {
    method: "POST",
    node: {
      req: {
        headers: {
          "sec-fetch-site": "same-origin",
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}${ticketCookie}`,
        },
        socket: {
          remoteAddress: options.ip || "127.0.0.1",
        },
        url: "/",
        originalUrl: "/",
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        removeHeader: (name: string) => {
          delete responseHeaders[name.toLowerCase()];
        },
        statusCode: 200,
      },
    },
    context: {},
  } as Partial<H3Event> as H3Event;
}

describe("Task 3, 4 & 5 — Social Login & Registration (BR-SCL-01..14, D-IN, D-IO)", () => {
  const db = getAppDb();
  const createdUserIds: number[] = [];

  const genEmail = (prefix: string) =>
    `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;

  async function cleanupTestData() {
    if (createdUserIds.length > 0) {
      const ids = [...createdUserIds];
      createdUserIds.length = 0;
      await db
        .delete(socialIdentities)
        .where(inArray(socialIdentities.userId, ids))
        .catch(() => undefined);
      await db
        .delete(users)
        .where(inArray(users.id, ids))
        .catch(() => undefined);
    }
  }

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe("Task 4 — Branch B: First-Time Registration (BR-SCL-01, BR-SCL-02, BR-SCL-05, BR-SCL-08, BR-SCL-10, BR-SCL-12)", () => {
    it("BR-SCL-01: rejects registration when terms or privacy consent is missing with 422 VALIDATION_FAILED", async () => {
      const email = genEmail("new_parent");
      const mockEvent = createMockEvent({
        oauth_profile: {
          provider: "google" as const,
          provider_user_id: `google_new_${Date.now()}`,
          email_at_provider: email,
          email_verified_at_provider: true,
          display_name_at_provider: "Parent One",
        },
      });

      await expect(
        handleSocialLogin(mockEvent, {
          provider: "google",
          display_name: "Parent One",
          accept_terms: false, // Unchecked
          accept_privacy: true,
        })
      ).rejects.toThrow();
    });

    it("BR-SCL-02 & BR-SCL-05 & BR-SCL-08 & BR-SCL-12: Google registration with email_verified creates active user, null password, 2 consent logs in single transaction", async () => {
      const email = genEmail("verified_parent");
      const sub = `google_sub_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
      const mockEvent = createMockEvent({
        oauth_profile: {
          provider: "google" as const,
          provider_user_id: sub,
          email_at_provider: email,
          email_verified_at_provider: true,
          display_name_at_provider: "Verified Parent",
        },
      });

      const res = await handleSocialLogin(mockEvent, {
        provider: "google",
        display_name: "Verified Parent",
        accept_terms: true,
        accept_privacy: true,
      });

      expect(res.user.displayName).toBe("Verified Parent");
      expect(res.user.status).toBe("active"); // Google email_verified -> active (BR-SCL-05)

      // Verify DB row
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (dbUser?.id) {
        createdUserIds.push(dbUser.id);
      }

      expect(dbUser).toBeDefined();
      expect(dbUser?.passwordHash).toBeNull(); // BR-SCL-08: NULL password is valid
      expect(dbUser?.emailVerifiedAt).toBeDefined();

      // Verify social_identities row
      const [identity] = await db
        .select()
        .from(socialIdentities)
        .where(eq(socialIdentities.userId, dbUser?.id ?? 0));

      expect(identity).toBeDefined();
      expect(identity?.provider).toBe("google");
      expect(identity?.providerUserId).toBe(sub);
      expect(identity?.emailVerifiedAtProvider).toBe(true);

      // Verify BR-SCL-02: 2 rows in consent_logs
      const consents = await db
        .select()
        .from(consentLogs)
        .where(eq(consentLogs.userId, dbUser?.id ?? 0));

      expect(consents).toHaveLength(2);
      const consentTypes = consents.map((c) => c.consentType).sort();
      expect(consentTypes).toEqual(["privacy", "terms"]);
      for (const c of consents) {
        expect(c.action).toBe("accepted");
        expect(c.ipAddress).toBe("127.0.0.1");
      }
    });

    it("BR-SCL-05: Facebook registration creates pending_verification user and dispatches email_verification", async () => {
      const email = genEmail("fb_user");
      const sub = `fb_user_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
      const mockEvent = createMockEvent({
        oauth_profile: {
          provider: "facebook" as const,
          provider_user_id: sub,
          email_at_provider: email,
          email_verified_at_provider: false, // Facebook is ALWAYS false (BR-OAP-08)
          display_name_at_provider: "FB User",
        },
      });

      const res = await handleSocialLogin(mockEvent, {
        provider: "facebook",
        display_name: "FB User",
        accept_terms: true,
        accept_privacy: true,
      });

      expect(res.user.status).toBe("pending_verification"); // BR-SCL-05

      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (dbUser?.id) {
        createdUserIds.push(dbUser.id);
      }

      expect(dbUser?.status).toBe("pending_verification");
      expect(dbUser?.emailVerifiedAt).toBeNull();

      // Verify verification token & email_verification notification (#289 S4)
      const [tokenRow] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.accountType, "user"),
            eq(verificationTokens.accountId, dbUser?.id ?? 0),
            eq(verificationTokens.purpose, "email_verify")
          )
        );
      expect(tokenRow).toBeDefined();

      const [notif] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.recipientId, dbUser?.id ?? 0));
      expect(notif).toBeDefined();
      expect(notif?.templateCode).toBe("email_verification");
      const savedPayload = notif?.payload as Record<string, string> | undefined;
      expect(savedPayload?.token).toBeUndefined();
      expect(savedPayload?.url).toBeUndefined();

      if (notif) {
        const deliveries = await db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.notificationId, notif.id));
        expect(deliveries).toHaveLength(1);
        expect(deliveries[0]?.channel).toBe("email");
      }
    });
  });

  describe("Task 5 — Branch C: Email Conflict Prevention (BR-SCL-04, D-IO)", () => {
    it("BR-SCL-04: refuses to auto-link when email matches an existing password account with 409 SOCIAL_EMAIL_CONFLICT", async () => {
      const email = genEmail("existing_parent");
      // Seed existing user registered via password
      const [existingUser] = await db
        .insert(users)
        .values({
          email,
          displayName: "Existing Parent",
          passwordHash: "$argon2id$v=19$m=19456,p=1,t=2$dummyhash",
          status: "active",
        })
        .returning();

      if (existingUser?.id) {
        createdUserIds.push(existingUser.id);
      }

      const mockEvent = createMockEvent({
        oauth_profile: {
          provider: "google" as const,
          provider_user_id: `google_attacker_${Date.now()}`,
          email_at_provider: email,
          email_verified_at_provider: true,
          display_name_at_provider: "Google Profile Name",
        },
      });

      await expect(
        handleSocialLogin(mockEvent, {
          provider: "google",
          display_name: "Google Profile Name",
          accept_terms: true,
          accept_privacy: true,
        })
      ).rejects.toSatisfy(
        (err: {
          statusCode?: number;
          status?: number;
          data?: { code?: string };
          code?: string;
        }) => {
          expect(err.statusCode || err.status).toBe(409);
          expect(err.data?.code || err.code).toBe("SOCIAL_EMAIL_CONFLICT");
          return true;
        }
      );

      // Invariant check: 0 social_identities rows created
      const identities = await db
        .select()
        .from(socialIdentities)
        .where(eq(socialIdentities.userId, existingUser?.id ?? 0));
      expect(identities).toHaveLength(0);
    });
  });
});
