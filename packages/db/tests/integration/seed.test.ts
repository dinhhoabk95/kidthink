import { count, eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import {
  entitlementKeys,
  packageEntitlements,
  packages,
} from "../../src/schema/billing.ts";
import { seed } from "../../src/seed.ts";

describe("Seed Idempotency Integration Tests", () => {
  it("seed() is idempotent and seeds entitlement_keys, packages, and package_entitlements", async () => {
    const db = getOwnerDb();

    // 1. Run seed first time
    await seed();

    const [keyCount1] = await db
      .select({ value: count() })
      .from(entitlementKeys);
    const [pkgCount1] = await db
      .select({ value: count() })
      .from(packages)
      .where(inArray(packages.code, ["PKG-standard", "PKG-premium"]));
    const [mapCount1] = await db
      .select({ value: count() })
      .from(packageEntitlements);

    expect(keyCount1.value).toBe(16);
    expect(pkgCount1.value).toBeGreaterThanOrEqual(2);
    expect(mapCount1.value).toBe(12); // 5 for standard + 7 for premium

    // Check specific packages exist
    const [stdPkg] = await db
      .select()
      .from(packages)
      .where(eq(packages.code, "PKG-standard"));
    const [premPkg] = await db
      .select()
      .from(packages)
      .where(eq(packages.code, "PKG-premium"));
    expect(stdPkg).toBeDefined();
    expect(premPkg).toBeDefined();

    // 2. Run seed second time -> counts MUST remain unchanged
    await seed();

    const [keyCount2] = await db
      .select({ value: count() })
      .from(entitlementKeys);
    const [pkgCount2] = await db
      .select({ value: count() })
      .from(packages)
      .where(inArray(packages.code, ["PKG-standard", "PKG-premium"]));
    const [mapCount2] = await db
      .select({ value: count() })
      .from(packageEntitlements);

    expect(keyCount2.value).toBe(keyCount1.value);
    expect(pkgCount2.value).toBe(pkgCount1.value);
    expect(mapCount2.value).toBe(mapCount1.value);
  });
});
