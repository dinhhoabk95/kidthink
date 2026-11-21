import { ConsentRequirementChangedError } from "@mindkid/errors/account";
import {
  RateLimitedError,
  ServiceUnavailableError,
} from "@mindkid/errors/common";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import { describe, expect, it } from "vitest";
import {
  createMindKidManagerAuth,
  createMindKidUserAuth,
  generateTotpCode,
  InMemoryRedisClient,
  REAUTH_FRESH_AGE_SECONDS,
  verifyBetterAuthTotp,
} from "#src/index";

const userSchema = {
  users: pgTable("users", {
    id: serial("id").primaryKey(),
    uuid: text("uuid"),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    emailVerified: boolean("email_verified").default(false),
    image: text("image"),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    status: text("status").default("pending_verification"),
    emailVerifiedAt: timestamp("email_verified_at"),
    sessionVersion: integer("session_version").default(0),
    purgeAt: timestamp("purge_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
  userAccounts: pgTable("user_accounts", {
    id: serial("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: integer("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password_hash"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
  userSessions: pgTable("user_sessions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    authMethod: text("auth_method").default("password"),
    reauthAt: timestamp("reauth_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
  userVerifications: pgTable("user_verifications", {
    id: serial("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
  userTwoFactors: pgTable("user_two_factors", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: boolean("verified").default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestamp("locked_until"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
  userPasskeys: pgTable("user_passkeys", {
    id: serial("id").primaryKey(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: integer("user_id").notNull(),
    credentialID: text("credential_id").notNull(),
    counter: integer("counter").default(0),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").default(false),
    transports: text("transports"),
    aaguid: text("aaguid"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
};

const managerSchema = {
  managers: pgTable("managers", {
    id: serial("id").primaryKey(),
    uuid: text("uuid"),
    email: text("email").notNull(),
    passwordHash: text("password_hash").default(""),
    displayName: text("display_name").notNull(),
    emailVerified: boolean("email_verified").default(true),
    image: text("image"),
    role: text("role").default("super_admin"),
    mfaEnabled: boolean("mfa_enabled").default(false),
    sessionVersion: integer("session_version").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
  managerAccounts: pgTable("manager_accounts", {
    id: serial("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: integer("manager_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password_hash"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
  managerSessions: pgTable("manager_sessions", {
    id: serial("id").primaryKey(),
    userId: integer("manager_id").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    authMethod: text("auth_method").default("password"),
    reauthAt: timestamp("reauth_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
  managerVerifications: pgTable("manager_verifications", {
    id: serial("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
  managerTwoFactors: pgTable("manager_two_factors", {
    id: serial("id").primaryKey(),
    userId: integer("manager_id").notNull(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: boolean("verified").default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestamp("locked_until"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
  managerPasskeys: pgTable("manager_passkeys", {
    id: serial("id").primaryKey(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: integer("manager_id").notNull(),
    credentialID: text("credential_id").notNull(),
    counter: integer("counter").default(0),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").default(false),
    transports: text("transports"),
    aaguid: text("aaguid"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),
};

const ROOT_SECRET = "0123456789abcdef0123456789abcdef";
const SIX_DIGIT_PATTERN = /^\d{6}$/;

describe("Task #319 P0/P1 Better Auth Hardening (#10 items 1-10)", () => {
  it("P0 #1: maps AppError (429 RATE_LIMITED, 409 CONSENT_REQUIREMENT_CHANGED, 503 SERVICE_UNAVAILABLE) to HTTP status + JSON instead of 500", async () => {
    const mockDb = drizzle.mock();
    const redis = new InMemoryRedisClient();

    const rateLimitedAuth = createMindKidUserAuth({
      db: mockDb,
      schema: userSchema,
      redis,
      rootSecret: ROOT_SECRET,
      siteUrl: "http://localhost:3000",
      trustedOrigins: ["http://localhost:3000"],
      isProduction: false,
      callbacks: {
        enforceRateLimit: () =>
          Promise.reject(new RateLimitedError({ retry_after_s: 60 })),
      },
    });

    const rlRes = await rateLimitedAuth.handler(
      new Request("http://localhost:3000/api/auth/users/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email: "a@b.com", password: "Password123!" }),
      })
    );
    expect(rlRes.status).toBe(429);
    const rlBody = (await rlRes.json()) as { code?: string };
    expect(rlBody.code).toBe("RATE_LIMITED");

    const consentConflictAuth = createMindKidUserAuth({
      db: mockDb,
      schema: userSchema,
      redis,
      rootSecret: ROOT_SECRET,
      siteUrl: "http://localhost:3000",
      trustedOrigins: ["http://localhost:3000"],
      isProduction: false,
      callbacks: {
        validateConsentMarkers: () =>
          Promise.reject(
            new ConsentRequirementChangedError({
              consent_type: "terms",
              requirement_at: "2026-11-01T00:00:00.000Z",
            })
          ),
      },
    });

    const consentRes = await consentConflictAuth.handler(
      new Request("http://localhost:3000/api/auth/users/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "Parent",
          email: "parent@b.com",
          password: "Password123!",
          accept_terms: true,
          accept_privacy: true,
        }),
      })
    );
    expect(consentRes.status).toBe(409);
    const consentBody = (await consentRes.json()) as { code?: string };
    expect(consentBody.code).toBe("CONSENT_REQUIREMENT_CHANGED");

    const outageAuth = createMindKidManagerAuth({
      db: mockDb,
      schema: managerSchema,
      redis,
      rootSecret: ROOT_SECRET,
      siteUrl: "http://localhost:3000",
      trustedOrigins: ["http://localhost:3000"],
      isProduction: false,
      callbacks: {
        enforceRateLimit: () => Promise.reject(new ServiceUnavailableError()),
      },
    });

    const outageRes = await outageAuth.handler(
      new Request("http://localhost:3000/api/auth/managers/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: "admin@b.com",
          password: "Password123!",
        }),
      })
    );
    expect(outageRes.status).toBe(503);
    const outageBody = (await outageRes.json()) as { code?: string };
    expect(outageBody.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("P0 #2: blocks suspended/deleted user and inactive manager in session.create.before across all auth flows", async () => {
    const mockDb = drizzle.mock();
    const redis = new InMemoryRedisClient();

    const userAuth = createMindKidUserAuth({
      db: mockDb,
      schema: userSchema,
      redis,
      rootSecret: ROOT_SECRET,
      siteUrl: "http://localhost:3000",
      trustedOrigins: ["http://localhost:3000"],
      isProduction: false,
      callbacks: {
        getUserStatusById: (id) =>
          Promise.resolve({
            id,
            status: id === 7 ? "suspended" : "deleted",
            purgeAt: null,
            hasPassword: false,
          }),
      },
    });

    const userSessionBefore =
      userAuth.options.databaseHooks?.session?.create?.before;
    expect(userSessionBefore).toBeDefined();

    await expect(
      userSessionBefore?.(
        {
          id: "1",
          userId: "7",
          token: "tok-suspended",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        null
      )
    ).rejects.toMatchObject({ status: "FORBIDDEN" });

    await expect(
      userSessionBefore?.(
        {
          id: "2",
          userId: "8",
          token: "tok-deleted",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        null
      )
    ).rejects.toMatchObject({ status: "FORBIDDEN" });

    const managerAuth = createMindKidManagerAuth({
      db: mockDb,
      schema: managerSchema,
      redis,
      rootSecret: ROOT_SECRET,
      siteUrl: "http://localhost:3000",
      trustedOrigins: ["http://localhost:3000"],
      isProduction: false,
      callbacks: {
        getManagerStatusById: (id) =>
          Promise.resolve({ id, isActive: false, role: "super_admin" }),
      },
    });

    const mgrSessionBefore =
      managerAuth.options.databaseHooks?.session?.create?.before;
    await expect(
      mgrSessionBefore?.(
        {
          id: "1",
          userId: "99",
          token: "tok-inactive-mgr",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        null
      )
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
  });

  it("P1 #3 & P2 #8: sets freshAge=0, disables Better Auth changeEmail, strips OAuth tokens to null, and round-trips generateTotpCode", async () => {
    const mockDb = drizzle.mock();
    const redis = new InMemoryRedisClient();
    let tokenAssertCalls = 0;

    const userAuth = createMindKidUserAuth({
      db: mockDb,
      schema: userSchema,
      redis,
      rootSecret: ROOT_SECRET,
      siteUrl: "http://localhost:3000",
      trustedOrigins: ["http://localhost:3000"],
      isProduction: false,
      callbacks: {
        assertNoOAuthTokens: (tokens) => {
          tokenAssertCalls++;
          expect(tokens.accessToken).toBeNull();
          expect(tokens.refreshToken).toBeNull();
          expect(tokens.idToken).toBeNull();
        },
      },
    });

    expect(REAUTH_FRESH_AGE_SECONDS).toBe(300);
    expect(userAuth.options.session?.freshAge).toBe(0);
    expect(userAuth.options.user?.changeEmail?.enabled).toBe(false);

    const accBefore = userAuth.options.databaseHooks?.account?.create?.before;
    const result = await accBefore?.({
      id: "1",
      userId: "1",
      providerId: "google",
      accountId: "g-123",
      accessToken: "secret-access",
      refreshToken: "secret-refresh",
      idToken: "secret-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(tokenAssertCalls).toBe(1);
    expect(
      result && typeof result === "object" && "data" in result
        ? result.data.accessToken
        : "unexpected"
    ).toBeNull();

    const nowMs = 1_760_000_000_000;
    const base32Secret = "JBSWY3DPEHPK3PXP";
    const code = generateTotpCode(base32Secret, nowMs);
    expect(code).toMatch(SIX_DIGIT_PATTERN);
    await expect(
      verifyBetterAuthTotp({
        storedSecret: base32Secret,
        rootSecret: ROOT_SECRET,
        namespace: "manager",
        code,
        nowMs,
      })
    ).resolves.toBe(true);
  });
});
