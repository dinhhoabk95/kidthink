import { describe, expect, it } from "vitest";
import { scanContentForEnvNames } from "../lint-env-names.js";

describe("Gate lint:env-names (BR-ENV-02)", () => {
  it("detects deprecated SESSION_SECRET alias", () => {
    const code = "const secret = process.env.SESSION_SECRET;";
    const violations = scanContentForEnvNames("apps/web/server/test.ts", code);
    expect(violations.length).toBe(1);
    expect(violations[0]?.name).toBe("SESSION_SECRET");
    expect(violations[0]?.advice).toContain("NUXT_SESSION_PASSWORD");
  });

  it("detects deprecated REDIS_URL and VALKEY_HOST aliases", () => {
    const code = `
      const url = process.env.REDIS_URL;
      const host = process.env.VALKEY_HOST;
    `;
    const violations = scanContentForEnvNames(
      "packages/cache/src/test.ts",
      code
    );
    expect(violations.length).toBe(2);
    expect(violations.map((v) => v.name)).toContain("REDIS_URL");
    expect(violations.map((v) => v.name)).toContain("VALKEY_HOST");
  });

  it("passes clean for canonical names", () => {
    const code = `
      const valkey = process.env.VALKEY_URL;
      const site = process.env.SITE_URL;
      const jwt = process.env.WEB_JWT_SECRET;
      const pass = process.env.NUXT_SESSION_PASSWORD;
    `;
    const violations = scanContentForEnvNames("apps/web/server/good.ts", code);
    expect(violations.length).toBe(0);
  });
});
