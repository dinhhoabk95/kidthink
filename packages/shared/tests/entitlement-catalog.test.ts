import { describe, expect, it } from "vitest";
import {
  assertEntitlementKey,
  ENTITLEMENT_KEYS,
  PACKAGE_CATALOG,
  PENDING_PRICE_VND,
  QUOTA_KEYS,
} from "../src/entitlement-catalog.js";

describe("Task 2 & 4: Entitlement and Catalog Registry (BR-ENT-01, BR-ENT-03, BR-PKG-04, BR-PKG-05, BR-PKG-08)", () => {
  it("BR-ENT-01 & BR-ENT-03: ENTITLEMENT_KEYS has exactly 16 keys, 8 MVP and 8 pre-declared", () => {
    expect(ENTITLEMENT_KEYS).toHaveLength(16);
    const mvpKeys = ENTITLEMENT_KEYS.filter((k) => k.is_mvp);
    expect(mvpKeys).toHaveLength(8);
    const nonMvpKeys = ENTITLEMENT_KEYS.filter((k) => !k.is_mvp);
    expect(nonMvpKeys).toHaveLength(8);
  });

  it("QUOTA_KEYS has exactly 8 keys with units and cycles", () => {
    expect(QUOTA_KEYS).toHaveLength(8);
  });

  it("assertEntitlementKey throws UNKNOWN_ENTITLEMENT_KEY for invalid keys", () => {
    expect(() => assertEntitlementKey("fake_key")).toThrowError(
      "UNKNOWN_ENTITLEMENT_KEY"
    );
  });

  it("BR-PKG-04: PACKAGE_CATALOG has 2 public packages and 4 hidden add-ons", () => {
    const packages = Object.values(PACKAGE_CATALOG);
    const publicPkgs = packages.filter((p) => p.is_public);
    const addOnPkgs = packages.filter((p) => !p.is_public);

    expect(publicPkgs).toHaveLength(2);
    expect(addOnPkgs).toHaveLength(4);
  });

  it("BR-PKG-08: premium package contains all entitlements of standard package", () => {
    const std = PACKAGE_CATALOG["PKG-standard"];
    const prem = PACKAGE_CATALOG["PKG-premium"];

    expect(std).toBeDefined();
    expect(prem).toBeDefined();

    for (const key of std.entitlements) {
      expect(prem.entitlements).toContain(key);
    }
  });

  it("All prices are PENDING_PRICE_VND (0)", () => {
    expect(PENDING_PRICE_VND).toBe(0);
    for (const pkg of Object.values(PACKAGE_CATALOG)) {
      for (const offer of pkg.offers) {
        expect(offer.price_vnd).toBe(PENDING_PRICE_VND);
      }
    }
  });
});
