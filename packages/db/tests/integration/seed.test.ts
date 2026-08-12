import { ENTITLEMENT_KEYS, PACKAGE_CATALOG } from "@kidthink/shared";
import { count } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import {
  entitlementKeys,
  packageEntitlements,
  packages,
} from "../../src/schema/billing.ts";
import { seed } from "../../src/seed.ts";

import { truncateAllTestTables } from "../global-setup.ts";

describe("BR-ENT-03 & BR-PKG-04 & BR-PKG-05: Seed Integration & Two-way Matching", () => {
  it("seed() is idempotent and matches registry exactly (BR-ENT-03)", async () => {
    await truncateAllTestTables();
    const db = getOwnerDb();

    // 1. Run seed first time
    await seed();

    // Two-way comparison for entitlement_keys
    const dbKeys = await db
      .select({ key: entitlementKeys.key })
      .from(entitlementKeys);
    const dbKeySet = new Set(dbKeys.map((r) => r.key));
    const registryKeySet = new Set(ENTITLEMENT_KEYS.map((k) => k.key));

    expect(dbKeySet).toEqual(registryKeySet);

    // Two-way comparison for packages catalog
    const dbPkgs = await db.select({ code: packages.code }).from(packages);
    const dbPkgSet = new Set(dbPkgs.map((r) => r.code));
    const catalogPkgSet = new Set(Object.keys(PACKAGE_CATALOG));

    expect(dbPkgSet).toEqual(catalogPkgSet);

    const [keyCount1] = await db
      .select({ value: count() })
      .from(entitlementKeys);
    const [pkgCount1] = await db.select({ value: count() }).from(packages);
    const [mapCount1] = await db
      .select({ value: count() })
      .from(packageEntitlements);

    // 2. Run seed second time -> counts MUST remain unchanged
    await seed();

    const [keyCount2] = await db
      .select({ value: count() })
      .from(entitlementKeys);
    const [pkgCount2] = await db.select({ value: count() }).from(packages);
    const [mapCount2] = await db
      .select({ value: count() })
      .from(packageEntitlements);

    expect(keyCount2.value).toBe(keyCount1.value);
    expect(pkgCount2.value).toBe(pkgCount1.value);
    expect(mapCount2.value).toBe(mapCount1.value);
  }, 30_000);
});
