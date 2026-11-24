import { verifyPassword } from "@mindkid/auth";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/client";
import { USER_STATUS } from "#src/constants/identity-enums";
import { entitlementKeys, entitlements, packages } from "#src/schema/billing";
import { childProfiles } from "#src/schema/child";
import {
  consentLogs,
  managerAccounts,
  managers,
  userAccounts,
  users,
} from "#src/schema/identity";
import {
  SEED_MANAGERS,
  SEED_USERS,
  seedInitialAccounts,
} from "#src/seed-accounts";
import { SEED_ENTITLEMENT_KEYS, SEED_PACKAGES } from "#src/seed-catalog";

const PRODUCTION_SEED_REFUSAL_REGEX =
  /Refusing to seed default test accounts in production/;

describe("Seed Initial Accounts Integration Tests", () => {
  beforeAll(async () => {
    const db = getOwnerDb();
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }
    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }
  });

  it("BR-SIB-05 & BR-SIB-13: seeds managers and users with Argon2id hashed passwords, child profiles, entitlements and consent logs", async () => {
    const db = getOwnerDb();

    // 1. Run seeder
    const stats = await seedInitialAccounts(db);

    expect(stats.managerCount).toBe(1);
    expect(stats.userCount).toBe(3);
    expect(stats.childProfileCount).toBeGreaterThanOrEqual(5);

    // 2. Verify Managers in DB
    for (const mgr of SEED_MANAGERS) {
      const [record] = await db
        .select()
        .from(managers)
        .where(eq(managers.email, mgr.email));

      expect(record).toBeDefined();
      if (!record) {
        throw new Error(`Manager ${mgr.email} not found`);
      }

      expect(record.role).toBe(mgr.role);
      expect(record.mfaEnabled).toBe(false);
      expect(record.isActive).toBe(true);
      expect(record.passwordHash.startsWith("pbkdf2$")).toBe(true);

      const isValidPassword = await verifyPassword(
        mgr.passwordRaw,
        record.passwordHash
      );
      expect(isValidPassword).toBe(true);

      const [mgrAcc] = await db
        .select()
        .from(managerAccounts)
        .where(eq(managerAccounts.userId, record.id));
      expect(mgrAcc?.providerId).toBe("credential");
      expect(mgrAcc?.password?.startsWith("pbkdf2$")).toBe(true);
    }

    // 3. Verify Users in DB
    for (const usr of SEED_USERS) {
      const [record] = await db
        .select()
        .from(users)
        .where(eq(users.email, usr.email));

      expect(record).toBeDefined();
      if (!record) {
        throw new Error(`User ${usr.email} not found`);
      }

      expect(record.status).toBe(USER_STATUS.ACTIVE);
      expect(record.emailVerifiedAt).not.toBeNull();

      const userPasswordHash = record.passwordHash;
      expect(userPasswordHash).not.toBeNull();
      if (!userPasswordHash) {
        throw new Error(`User ${usr.email} passwordHash is missing`);
      }

      const isValidPassword = await verifyPassword(
        usr.passwordRaw,
        userPasswordHash
      );
      expect(isValidPassword).toBe(true);

      const [usrAcc] = await db
        .select()
        .from(userAccounts)
        .where(eq(userAccounts.userId, record.id));
      expect(usrAcc?.providerId).toBe("credential");
      expect(usrAcc?.password?.startsWith("pbkdf2$")).toBe(true);

      // Verify consent logs for this user
      const userConsents = await db
        .select()
        .from(consentLogs)
        .where(eq(consentLogs.userId, record.id));
      expect(userConsents.length).toBeGreaterThanOrEqual(3);

      // Verify child profiles for this user
      const children = await db
        .select()
        .from(childProfiles)
        .where(eq(childProfiles.userId, record.id));
      expect(children.length).toBeGreaterThanOrEqual(usr.children.length);

      // Verify entitlements if user has package
      if (usr.packageCode) {
        const userEntitlements = await db
          .select()
          .from(entitlements)
          .where(eq(entitlements.userId, record.id));
        expect(userEntitlements.length).toBeGreaterThan(0);
      }
    }

    // 4. Idempotency test — running seed again should not error or duplicate
    const secondRunStats = await seedInitialAccounts(db);
    expect(secondRunStats.managerCount).toBe(1);
    expect(secondRunStats.userCount).toBe(3);
  });

  it("refuses to seed default test accounts when NODE_ENV === 'production' (fail-closed)", async () => {
    const db = getOwnerDb();
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      await expect(seedInitialAccounts(db)).rejects.toThrow(
        PRODUCTION_SEED_REFUSAL_REGEX
      );
    } finally {
      if (prevNodeEnv === undefined) {
        Reflect.deleteProperty(process.env, "NODE_ENV");
      } else {
        process.env.NODE_ENV = prevNodeEnv;
      }
    }
  });
});
