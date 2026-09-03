import { verifyPassword } from "@mindkid/auth";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/client";
import { entitlementKeys, entitlements, packages } from "#src/schema/billing";
import { childProfiles } from "#src/schema/child";
import { consentLogs, managers, users } from "#src/schema/identity";
import { SEED_ENTITLEMENT_KEYS, SEED_PACKAGES } from "#src/seed-catalog";
import {
  SEED_MANAGERS,
  SEED_USERS,
  seedInitialAccounts,
} from "#src/seed-master/accounts";

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

  it("seeds managers and users with hashed passwords, child profiles, entitlements and consent logs", async () => {
    const db = getOwnerDb();

    // 1. Run seeder
    const stats = await seedInitialAccounts(db);

    expect(stats.managerCount).toBe(2);
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

      const isValidPassword = await verifyPassword(
        mgr.passwordRaw,
        record.passwordHash
      );
      expect(isValidPassword).toBe(true);
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

      expect(record.status).toBe("active");
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
    expect(secondRunStats.managerCount).toBe(2);
    expect(secondRunStats.userCount).toBe(3);
  });
});
