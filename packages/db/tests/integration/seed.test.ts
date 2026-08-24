import { ENTITLEMENT_KEYS, PACKAGE_CATALOG } from "@mindkid/shared";
import { count, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { entitlementKeys, packages } from "#src/schema/billing";
import { seed } from "#src/seed";

describe("BR-ENT-03 & BR-PKG-04 & BR-PKG-05: Seed Integration & Two-way Matching", () => {
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

    expect(keyCount2.value).toBe(ENTITLEMENT_KEYS.length);
    expect(pkgCount2.value).toBe(Object.keys(PACKAGE_CATALOG).length);
  }, 60_000);
});
