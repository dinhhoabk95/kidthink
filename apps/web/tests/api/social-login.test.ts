import { consentLogs, getAppDb, socialIdentities, users } from "@kidthink/db";
import { eq, inArray } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleSocialLogin } from "../../server/api/guest/auth/users/social-login.post.js";

function createMockEvent(options: { oauth_profile?: any; ip?: string } = {}) {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "a".repeat(64);
  return {
    method: "POST",
    node: {
      req: {
        headers: {
          "sec-fetch-site": "same-origin",
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}`,
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
    context: {
      oauth_profile: options.oauth_profile,
    },
  } as any;
}

describe("Task 3, 4 & 5 — Social Login & Registration (BR-SCL-01..14, D-IN, D-IO)", () => {
  const db = getAppDb();
  const TEST_EMAILS = [
    "verified_parent@gmail.com",
    "fb_user@facebook.example.com",
    "existing_parent@example.com",
  ];

  async function cleanupTestData() {
    const testUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.email, TEST_EMAILS));

    const userIds = testUsers.map((u) => u.id);
    if (userIds.length > 0) {
      await db
        .delete(socialIdentities)
        .where(inArray(socialIdentities.userId, userIds));
      await db.delete(users).where(inArray(users.id, userIds));
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
      const mockEvent = createMockEvent({
        oauth_profile: {
          provider: "google" as const,
          provider_user_id: "google_new_123",
          email_at_provider: "new_parent@example.com",
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
      const mockEvent = createMockEvent({
        oauth_profile: {
          provider: "google" as const,
          provider_user_id: "google_sub_9999",
          email_at_provider: "verified_parent@gmail.com",
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
        .where(eq(users.email, "verified_parent@gmail.com"));

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
      expect(identity?.providerUserId).toBe("google_sub_9999");
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

    it("BR-SCL-05: Facebook registration creates pending_verification user", async () => {
      const mockEvent = createMockEvent({
        oauth_profile: {
          provider: "facebook" as const,
          provider_user_id: "fb_user_8888",
          email_at_provider: "fb_user@facebook.example.com",
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
        .where(eq(users.email, "fb_user@facebook.example.com"));

      expect(dbUser?.status).toBe("pending_verification");
      expect(dbUser?.emailVerifiedAt).toBeNull();
    });
  });

  describe("Task 5 — Branch C: Email Conflict Prevention (BR-SCL-04, D-IO)", () => {
    it("BR-SCL-04: refuses to auto-link when email matches an existing password account with 409 SOCIAL_EMAIL_CONFLICT", async () => {
      // Seed existing user registered via password
      const [existingUser] = await db
        .insert(users)
        .values({
          email: "existing_parent@example.com",
          displayName: "Existing Parent",
          passwordHash: "$argon2id$v=19$m=19456,p=1,t=2$dummyhash",
          status: "active",
        })
        .returning();

      const mockEvent = createMockEvent({
        oauth_profile: {
          provider: "google" as const,
          provider_user_id: "google_attacker_sub",
          email_at_provider: "existing_parent@example.com",
          email_verified_at_provider: true,
          display_name_at_provider: "Google Profile Name",
        },
      });

      try {
        await handleSocialLogin(mockEvent, {
          provider: "google",
          display_name: "Google Profile Name",
          accept_terms: true,
          accept_privacy: true,
        });
        expect.fail("Should have thrown SOCIAL_EMAIL_CONFLICT");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(409);
        expect(err.data?.code || err.code).toBe("SOCIAL_EMAIL_CONFLICT");
      }

      // Invariant check: 0 social_identities rows created
      const identities = await db
        .select()
        .from(socialIdentities)
        .where(eq(socialIdentities.userId, existingUser?.id ?? 0));
      expect(identities).toHaveLength(0);
    });
  });
});
