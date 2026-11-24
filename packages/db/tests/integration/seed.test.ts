import { verifyPassword } from "@mindkid/auth";
import { ENTITLEMENT_KEYS, PACKAGE_CATALOG } from "@mindkid/shared";
import { count, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DB, getOwnerDb, MANAGER_ROLE } from "#src/index";
import { entitlementKeys, packages } from "#src/schema/billing";
import { managerAccounts, managers, users } from "#src/schema/identity";
import { seed } from "#src/seed";
import { SEED_USERS } from "#src/seed-accounts";
import { truncateAllTestTables } from "#tests/global-setup";

describe("BR-ENT-03 & BR-PKG-04 & BR-PKG-05: Seed Integration & Two-way Matching", () => {
  /**
   * Chỉ gieo master data ở nhóm phép thử này.
   *
   * `seed()` giờ gieo cả nội dung (490 hạt, mỗi hạt nhiều truy vấn) — chạy hai
   * lần để đo tính bất biến sẽ vượt `testTimeout`. Phần nội dung có phép thử
   * riêng ở `seed-content-step.test.ts`.
   */
  const previous = process.env.MINDKID_SEED_MASTER_ONLY;
  beforeAll(() => {
    process.env.MINDKID_SEED_MASTER_ONLY = "1";
  });
  afterAll(() => {
    if (previous === undefined) {
      process.env.MINDKID_SEED_MASTER_ONLY = undefined;
      delete process.env.MINDKID_SEED_MASTER_ONLY;
    } else {
      process.env.MINDKID_SEED_MASTER_ONLY = previous;
    }
  });

  it("seed() is idempotent and matches registry exactly (BR-ENT-03)", async () => {
    const db = getOwnerDb();

    // 1. Run seed first time
    await seed();

    // Two-way comparison for entitlement_keys
    const dbKeys = await db
      .select({ key: entitlementKeys.key })
      .from(entitlementKeys);
    const dbKeySet = new Set(dbKeys.map((r) => r.key));
    const registryKeySet = new Set(ENTITLEMENT_KEYS.map((k) => k.key));

    for (const key of registryKeySet) {
      expect(dbKeySet.has(key)).toBe(true);
    }

    // Two-way comparison for packages catalog
    const dbPkgs = await db.select({ code: packages.code }).from(packages);
    const dbPkgSet = new Set(dbPkgs.map((r) => r.code));
    const catalogPkgSet = new Set(Object.keys(PACKAGE_CATALOG));

    for (const code of catalogPkgSet) {
      expect(dbPkgSet.has(code)).toBe(true);
    }

    // 2. Run seed second time -> counts MUST remain unchanged and match catalog
    await seed();

    const [keyCount2] = await db
      .select({ value: count() })
      .from(entitlementKeys)
      .where(
        inArray(
          entitlementKeys.key,
          ENTITLEMENT_KEYS.map((k) => k.key)
        )
      );
    const [pkgCount2] = await db
      .select({ value: count() })
      .from(packages)
      .where(inArray(packages.code, Object.keys(PACKAGE_CATALOG)));

    expect(keyCount2?.value).toBe(ENTITLEMENT_KEYS.length);
    expect(pkgCount2?.value).toBe(Object.keys(PACKAGE_CATALOG).length);
  }, 60_000);

  it("seed() in production skips default test accounts (admin@mindkid.test & SEED_USERS) while seeding INITIAL_ADMIN_EMAIL into managers and managerAccounts", async () => {
    const db = getOwnerDb();
    const prevNodeEnv = process.env.NODE_ENV;
    const prevAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const prevAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;

    const prodAdminEmail = `prod-admin-${Date.now()}@mindkid.test`;
    const prodAdminPassword = "ProdAdminStrongPass!2026#9";

    await DB.getSqliteDriver().disconnect();
    await truncateAllTestTables();

    process.env.NODE_ENV = "production";
    process.env.INITIAL_ADMIN_EMAIL = prodAdminEmail;
    process.env.INITIAL_ADMIN_PASSWORD = prodAdminPassword;

    try {
      await seed();

      const freshDb = getOwnerDb();

      const defaultAdminRows = await freshDb
        .select()
        .from(managers)
        .where(eq(managers.email, "admin@mindkid.test"));
      expect(defaultAdminRows).toHaveLength(0);

      const seededTestUsers = await freshDb
        .select()
        .from(users)
        .where(
          inArray(
            users.email,
            SEED_USERS.map((u) => u.email)
          )
        );
      expect(seededTestUsers).toHaveLength(0);

      const [prodAdmin] = await freshDb
        .select()
        .from(managers)
        .where(eq(managers.email, prodAdminEmail));
      expect(prodAdmin).toBeDefined();
      if (!prodAdmin) {
        throw new Error(`Expected production manager ${prodAdminEmail}`);
      }
      expect(prodAdmin.role).toBe(MANAGER_ROLE.SUPER_ADMIN);
      expect(prodAdmin.isActive).toBe(true);
      expect(prodAdmin.passwordHash.startsWith("pbkdf2$")).toBe(true);
      expect(
        await verifyPassword(prodAdminPassword, prodAdmin.passwordHash)
      ).toBe(true);

      const [prodAdminAccount] = await freshDb
        .select()
        .from(managerAccounts)
        .where(eq(managerAccounts.userId, prodAdmin.id));
      expect(prodAdminAccount).toBeDefined();
      expect(prodAdminAccount?.providerId).toBe("credential");
      expect(prodAdminAccount?.accountId).toBe(String(prodAdmin.id));
      expect(prodAdminAccount?.password?.startsWith("pbkdf2$")).toBe(true);
      if (!prodAdminAccount?.password) {
        throw new Error("Expected credential password on managerAccounts");
      }
      expect(
        await verifyPassword(prodAdminPassword, prodAdminAccount.password)
      ).toBe(true);

      await freshDb.delete(managers).where(eq(managers.email, prodAdminEmail));
    } finally {
      if (prevNodeEnv === undefined) {
        Reflect.deleteProperty(process.env, "NODE_ENV");
      } else {
        process.env.NODE_ENV = prevNodeEnv;
      }
      if (prevAdminEmail === undefined) {
        Reflect.deleteProperty(process.env, "INITIAL_ADMIN_EMAIL");
      } else {
        process.env.INITIAL_ADMIN_EMAIL = prevAdminEmail;
      }
      if (prevAdminPassword === undefined) {
        Reflect.deleteProperty(process.env, "INITIAL_ADMIN_PASSWORD");
      } else {
        process.env.INITIAL_ADMIN_PASSWORD = prevAdminPassword;
      }
    }
    expect(db).toBeDefined();
  }, 60_000);
});
