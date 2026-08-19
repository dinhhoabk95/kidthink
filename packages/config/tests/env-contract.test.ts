import { describe, expect, it } from "vitest";
import {
  type AppType,
  ENV_REGISTRY,
  validateEnvFile,
} from "../src/env-contract.ts";
import { parseEnvFile } from "../src/env-file.ts";

const APPS: readonly AppType[] = ["web", "admin", "worker"];
const LONG_SECRET = "0123456789abcdef0123456789abcdef01";
const UPPER_SNAKE_CASE = /^[A-Z][A-Z0-9_]*$/;

const SAMPLE_BY_KIND: Record<string, string> = {
  url: "https://example.test/x",
  secret: LONG_SECRET,
  email: "ops@example.test",
  port: "3000",
  enum: "production",
  text: "value",
};

/** A file that satisfies the contract for one app, minus anything named. */
function envFor(
  app: AppType,
  omit: readonly string[] = []
): Map<string, string> {
  const map = new Map<string, string>();
  for (const def of ENV_REGISTRY) {
    if (!def.apps.includes(app) || def.required === "optional") {
      continue;
    }
    if (omit.includes(def.name)) {
      continue;
    }
    map.set(def.name, SAMPLE_BY_KIND[def.kind] ?? "value");
  }
  return map;
}

describe("Environment registry", () => {
  it("declares every entry completely", () => {
    for (const def of ENV_REGISTRY) {
      expect(def.name).toMatch(UPPER_SNAKE_CASE);
      expect(def.apps.length).toBeGreaterThan(0);
      expect(def.note.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate names", () => {
    const names = ENV_REGISTRY.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("marks every secret-kind variable as secret", () => {
    for (const def of ENV_REGISTRY) {
      if (def.kind === "secret") {
        expect(def.secret).toBe(true);
      }
    }
  });

  it("only uses when-enabled together with an enabling flag", () => {
    for (const def of ENV_REGISTRY) {
      if (def.required === "when-enabled") {
        expect(def.enabledBy).toBeDefined();
      }
    }
  });
});

describe("validateEnvFile", () => {
  it("accepts a complete file for each app", () => {
    for (const app of APPS) {
      const result = validateEnvFile(app, envFor(app), true);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    }
  });

  it("names a missing required variable", () => {
    const result = validateEnvFile(
      "web",
      envFor("web", ["WEB_JWT_SECRET"]),
      true
    );
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.varName)).toContain("WEB_JWT_SECRET");
  });

  it("treats an empty value as missing", () => {
    const parsed = envFor("web");
    parsed.set("WEB_JWT_SECRET", "   ");
    const result = validateEnvFile("web", parsed, true);
    expect(result.errors.map((e) => e.varName)).toContain("WEB_JWT_SECRET");
  });

  it("BR-ENV-11: rejects a secret under 32 bytes", () => {
    const parsed = envFor("web");
    parsed.set("WEB_JWT_SECRET", "too-short");
    const result = validateEnvFile("web", parsed, true);
    expect(result.errors[0]?.issue).toContain("32 bytes");
  });

  it("rejects a malformed URL and a malformed port", () => {
    const parsed = envFor("web");
    parsed.set("SITE_URL", "not-a-url");
    parsed.set("PORT", "70000");
    const issues = validateEnvFile("web", parsed, true).errors;
    expect(issues.map((e) => e.varName)).toEqual(
      expect.arrayContaining(["SITE_URL", "PORT"])
    );
  });

  it("only requires production-scoped variables in production", () => {
    const productionOnly = ENV_REGISTRY.filter(
      (d) => d.apps.includes("web") && d.required === "production"
    ).map((d) => d.name);
    expect(productionOnly.length).toBeGreaterThan(0);

    const parsed = envFor("web", productionOnly);
    expect(validateEnvFile("web", parsed, false).valid).toBe(true);
    expect(validateEnvFile("web", parsed, true).valid).toBe(false);
  });

  it("warns about a name no process reads, without failing", () => {
    const parsed = envFor("worker");
    parsed.set("LEFTOVER_FROM_A_RENAME", "x");
    const result = validateEnvFile("worker", parsed, true);
    expect(result.valid).toBe(true);
    expect(result.warnings.map((w) => w.varName)).toContain(
      "LEFTOVER_FROM_A_RENAME"
    );
  });

  it("BR-ENV-04: does not require a variable belonging to another process", () => {
    // BACKUP_ENCRYPTION_KEY is the worker's; web must not be asked for it.
    const webNames = ENV_REGISTRY.filter((d) => d.apps.includes("web")).map(
      (d) => d.name
    );
    expect(webNames).not.toContain("BACKUP_ENCRYPTION_KEY");
  });

  it("BR-ENV-06: ignores the environment of the process running it", () => {
    // The shell has the value; the file does not. The file is what counts.
    process.env.WEB_JWT_SECRET = LONG_SECRET;
    try {
      const result = validateEnvFile(
        "web",
        envFor("web", ["WEB_JWT_SECRET"]),
        true
      );
      expect(result.errors.map((e) => e.varName)).toContain("WEB_JWT_SECRET");
    } finally {
      process.env.WEB_JWT_SECRET = undefined;
    }
  });
});

describe("parseEnvFile", () => {
  it("reads plain assignments and skips comments and blanks", () => {
    const parsed = parseEnvFile("# note\n\nA=1\nB=2\n");
    expect([...parsed]).toEqual([
      ["A", "1"],
      ["B", "2"],
    ]);
  });

  it("strips surrounding quotes and an export prefix", () => {
    const parsed = parseEnvFile(`export A="one"\nB='two'\n`);
    expect(parsed.get("A")).toBe("one");
    expect(parsed.get("B")).toBe("two");
  });

  it("keeps a # that is part of the value", () => {
    const parsed = parseEnvFile('A="pa#ssword"\nB=plain # trailing note\n');
    expect(parsed.get("A")).toBe("pa#ssword");
    expect(parsed.get("B")).toBe("plain");
  });

  it("keeps an = that is part of the value", () => {
    expect(parseEnvFile("A=base64==\n").get("A")).toBe("base64==");
  });

  it("lets a later declaration win, as a shell would", () => {
    expect(parseEnvFile("A=1\nA=2\n").get("A")).toBe("2");
  });
});
