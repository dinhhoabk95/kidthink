import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { scanAllEnvNames, scanContentForEnvNames } from "../lint-env-names.ts";

const FIXTURES = resolve(import.meta.dirname, "fixtures/env-names");
// vitest runs this project with `scripts/` as the working directory.
const REPO_ROOT = resolve(import.meta.dirname, "../..");

function scanFixture(dir: "bad" | "good") {
  // The gate walks <root>/apps and <root>/packages, so each fixture root
  // mirrors that shape; this exercises the walker, not just the line matcher.
  return scanAllEnvNames(resolve(FIXTURES, dir));
}

describe("Gate lint:env-names (BR-ENV-02, BR-ENV-03)", () => {
  it("rejects a deprecated alias read through property access", () => {
    const violations = scanContentForEnvNames(
      "apps/web/server/x.ts",
      "const s = process.env.SESSION_SECRET;"
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe("deprecated-alias");
    expect(violations[0]?.advice).toContain("NUXT_SESSION_PASSWORD");
  });

  it("rejects a deprecated alias read through bracket access", () => {
    const violations = scanContentForEnvNames(
      "apps/web/server/x.ts",
      'const s = process.env["JWT_SECRET"];'
    );
    expect(violations.map((v) => v.name)).toContain("JWT_SECRET");
  });

  it("rejects a deprecated alias read by destructuring", () => {
    const violations = scanContentForEnvNames(
      "packages/cache/src/x.ts",
      "const { REDIS_URL } = process.env;"
    );
    expect(violations.map((v) => v.name)).toContain("REDIS_URL");
  });

  it("rejects a hardcoded fallback for a contract variable", () => {
    const violations = scanContentForEnvNames(
      "apps/web/server/x.ts",
      'const url = process.env.SITE_URL || "https://mindkid.vn";'
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe("hardcoded-default");
  });

  it("rejects a hardcoded fallback wrapped around requireEnv", () => {
    const violations = scanContentForEnvNames(
      "apps/web/server/x.ts",
      'const url = requireEnv("SITE_URL") || "https://mindkid.vn";'
    );
    expect(violations[0]?.kind).toBe("hardcoded-default");
  });

  it("accepts devFallbackEnv, which throws in production", () => {
    const violations = scanContentForEnvNames(
      "packages/cache/src/client.ts",
      'const url = devFallbackEnv("VALKEY_URL", "redis://localhost:6380");'
    );
    expect(violations).toEqual([]);
  });

  it("accepts a chain that falls back to another contract variable", () => {
    const violations = scanContentForEnvNames(
      "packages/storage/src/index.ts",
      "const base = process.env.STORAGE_BASE_URL || process.env.SITE_URL;"
    );
    expect(violations).toEqual([]);
  });

  it("allows a pinned value in a test file", () => {
    const violations = scanContentForEnvNames(
      "apps/web/tests/setup.ts",
      'process.env.WEB_JWT_SECRET ||= "deterministic-test-secret";'
    );
    expect(violations).toEqual([]);
  });

  it("goes red on the bad fixture directory", () => {
    const violations = scanFixture("bad");
    expect(violations.length).toBeGreaterThan(0);
    expect(new Set(violations.map((v) => v.kind))).toEqual(
      new Set(["deprecated-alias", "hardcoded-default"])
    );
  });

  it("stays green on the good fixture directory", () => {
    expect(scanFixture("good")).toEqual([]);
  });

  it("is green on the real source tree", () => {
    expect(scanAllEnvNames(REPO_ROOT)).toEqual([]);
  });
});
