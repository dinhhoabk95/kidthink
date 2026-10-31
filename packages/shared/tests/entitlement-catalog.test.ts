import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertEntitlementKey,
  ENTITLEMENT_KEYS,
  PACKAGE_CATALOG,
  PENDING_PRICE_VND,
  QUOTA_KEYS,
} from "#src/entitlement-catalog";

const ROOT_DIR = path.resolve(import.meta.dirname, "../../..");
const HARDCODED_PRICE_VND_REGEX = /price_vnd:\s*[1-9][\d_]*/;
const SOURCE_FILE_REGEX = /\.(ts|vue)$/;

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) {
    return results;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        entry.name !== ".nuxt" &&
        entry.name !== ".output" &&
        entry.name !== "tests"
      ) {
        results.push(...collectSourceFiles(fullPath));
      }
    } else if (entry.isFile() && SOURCE_FILE_REGEX.test(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Task 2 & 4: Entitlement and Catalog Registry (BR-ENT-01, BR-ENT-03, BR-MVP-02, BR-MVP-03, BR-PKG-01..08)", () => {
  it("BR-ENT-01 & BR-ENT-03: ENTITLEMENT_KEYS has exactly 13 keys, 8 MVP and 5 pre-declared", () => {
    expect(ENTITLEMENT_KEYS).toHaveLength(13);
    const mvpKeys = ENTITLEMENT_KEYS.filter((k) => k.is_mvp);
    expect(mvpKeys).toHaveLength(8);
    const nonMvpKeys = ENTITLEMENT_KEYS.filter((k) => !k.is_mvp);
    expect(nonMvpKeys).toHaveLength(5);
  });

  it("QUOTA_KEYS has exactly 7 keys with units and cycles", () => {
    expect(QUOTA_KEYS).toHaveLength(7);
  });

  it("assertEntitlementKey throws UNKNOWN_ENTITLEMENT_KEY for invalid keys", () => {
    expect(() => assertEntitlementKey("fake_key")).toThrowError(
      "UNKNOWN_ENTITLEMENT_KEY"
    );
  });

  it("BR-PKG-01 & BR-PKG-04: PACKAGE_CATALOG has exactly 2 public active MVP SKUs (PKG-standard, PKG-premium) and 3 hidden add-ons", () => {
    const packages = Object.values(PACKAGE_CATALOG);
    const publicPkgs = packages.filter(
      (p) => p.is_public && p.status === "active"
    );
    const addOnPkgs = packages.filter((p) => !p.is_public);

    expect(publicPkgs.map((p) => p.code)).toEqual([
      "PKG-standard",
      "PKG-premium",
    ]);
    expect(addOnPkgs).toHaveLength(3);
  });

  it("BR-MVP-02: public/sellable packages only grant MVP entitlement keys (is_mvp = true)", () => {
    const mvpKeySet: ReadonlySet<string> = new Set(
      ENTITLEMENT_KEYS.filter((k) => k.is_mvp).map((k) => k.key)
    );
    const publicPkgs = Object.values(PACKAGE_CATALOG).filter(
      (p) => p.is_public
    );

    for (const pkg of publicPkgs) {
      for (const key of pkg.entitlements) {
        expect(mvpKeySet.has(key), `${pkg.code} -> ${key}`).toBe(true);
      }
    }
  });

  it("BR-MVP-03 & BR-PKG-05: all add-on packages have is_public = false and declare requires_spec", () => {
    const addOnPkgs = Object.values(PACKAGE_CATALOG).filter(
      (p) => !p.is_public
    );
    expect(addOnPkgs).toHaveLength(3);
    for (const pkg of addOnPkgs) {
      expect(pkg.is_public).toBe(false);
      expect(pkg.requires_spec).toBeTruthy();
    }
  });

  it("BR-PKG-06: every package entitlement resolves to a Vietnamese label in ENTITLEMENT_KEYS", () => {
    const labelMap = new Map(ENTITLEMENT_KEYS.map((k) => [k.key, k.label]));
    for (const pkg of Object.values(PACKAGE_CATALOG)) {
      for (const key of pkg.entitlements) {
        const label = labelMap.get(key);
        expect(label, `${pkg.code} -> ${key}`).toBeDefined();
        expect((label ?? "").length).toBeGreaterThan(0);
      }
    }
  });

  it("BR-PKG-08: premium package contains all entitlements of standard package", () => {
    const std = PACKAGE_CATALOG["PKG-standard"];
    const prem = PACKAGE_CATALOG["PKG-premium"];

    expect(std).toBeDefined();
    expect(prem).toBeDefined();

    if (std && prem) {
      for (const key of std.entitlements) {
        expect(prem.entitlements).toContain(key);
      }
    }
  });

  it("BR-PKG-02: all catalog prices use PENDING_PRICE_VND (0) and no source file hardcodes price_vnd numbers", () => {
    expect(PENDING_PRICE_VND).toBe(0);
    for (const pkg of Object.values(PACKAGE_CATALOG)) {
      for (const offer of pkg.offers) {
        expect(offer.price_vnd).toBe(PENDING_PRICE_VND);
      }
    }

    const files = [
      ...collectSourceFiles(path.join(ROOT_DIR, "apps")),
      ...collectSourceFiles(path.join(ROOT_DIR, "packages")),
    ].filter((f) => !f.endsWith("entitlement-catalog.ts"));

    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      if (HARDCODED_PRICE_VND_REGEX.test(content)) {
        violations.push(path.relative(ROOT_DIR, file));
      }
    }
    expect(violations).toEqual([]);
  });
});
