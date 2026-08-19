import { describe, expect, it } from "vitest";
import { ENV_REGISTRY, validateEnvFile } from "../src/env-contract.js";

const VAR_NAME_REGEX = /^[A-Z0-9_]+$/;

describe("Task #90 — WP90.1 Environment Contract & Validator (BR-ENV-01..12)", () => {
  it("BR-ENV-01: ENV_REGISTRY contains valid definitions for all apps", () => {
    expect(ENV_REGISTRY.length).toBeGreaterThanOrEqual(40);
    for (const def of ENV_REGISTRY) {
      expect(def.name).toMatch(VAR_NAME_REGEX);
      expect(def.apps.length).toBeGreaterThan(0);
      expect(["always", "production", "when-enabled"]).toContain(def.required);
      expect(["url", "secret", "email", "port", "enum", "text"]).toContain(
        def.kind
      );
      expect(typeof def.secret).toBe("boolean");
      expect(def.note.length).toBeGreaterThan(0);
    }
  });

  it("detects missing always-required variables for web app", () => {
    const parsed = new Map<string, string>();
    const result = validateEnvFile("web", parsed, false);
    expect(result.valid).toBe(false);
    const missingNames = result.errors.map((e) => e.varName);
    expect(missingNames).toContain("DATABASE_URL");
    expect(missingNames).toContain("VALKEY_URL");
    expect(missingNames).toContain("WEB_JWT_SECRET");
  });

  it("detects empty string values as missing", () => {
    const parsed = new Map<string, string>([
      ["DATABASE_URL", "   "],
      ["VALKEY_URL", ""],
    ]);
    const result = validateEnvFile("web", parsed, false);
    expect(result.valid).toBe(false);
    const missingNames = result.errors.map((e) => e.varName);
    expect(missingNames).toContain("DATABASE_URL");
    expect(missingNames).toContain("VALKEY_URL");
  });

  it("validates URL format for url kind variables", () => {
    const parsed = new Map<string, string>([
      ["NODE_ENV", "development"],
      ["PORT", "3000"],
      ["DATABASE_URL", "not-a-valid-url"],
      ["VALKEY_URL", "valkey://127.0.0.1:6379"],
      ["NUXT_SESSION_PASSWORD", "12345678901234567890123456789012"],
      ["WEB_JWT_SECRET", "12345678901234567890123456789012"],
      ["ADMIN_JWT_SECRET", "12345678901234567890123456789012"],
      ["PARENT_GATE_SECRET", "12345678901234567890123456789012"],
      ["MFA_ENCRYPTION_KEY", "12345678901234567890123456789012"],
      ["SITE_URL", "https://mindkid.vn"],
      ["ADMIN_SITE_URL", "https://admin.mindkid.vn"],
      ["STORAGE_DRIVER", "local"],
    ]);
    const result = validateEnvFile("web", parsed, false);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      varName: "DATABASE_URL",
      issue: "Invalid URL format",
    });
  });

  it("BR-ENV-11: rejects secret shorter than 32 bytes", () => {
    const parsed = new Map<string, string>([
      ["NODE_ENV", "development"],
      ["PORT", "3000"],
      ["DATABASE_URL", "postgres://user:pass@localhost:5432/db"],
      ["VALKEY_URL", "valkey://127.0.0.1:6379"],
      ["NUXT_SESSION_PASSWORD", "too-short-secret-16bytes"],
      ["WEB_JWT_SECRET", "12345678901234567890123456789012"],
      ["ADMIN_JWT_SECRET", "12345678901234567890123456789012"],
      ["PARENT_GATE_SECRET", "12345678901234567890123456789012"],
      ["MFA_ENCRYPTION_KEY", "12345678901234567890123456789012"],
      ["SITE_URL", "https://mindkid.vn"],
      ["ADMIN_SITE_URL", "https://admin.mindkid.vn"],
      ["STORAGE_DRIVER", "local"],
    ]);
    const result = validateEnvFile("web", parsed, false);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      varName: "NUXT_SESSION_PASSWORD",
      issue: "Secret value must be at least 32 bytes long (BR-ENV-11)",
    });
  });

  it("BR-ENV-06: does not read process.env (even if shell has variables, missing parsed fails)", () => {
    // Set a variable on process.env
    process.env.DATABASE_URL = "postgres://fake:5432/db";
    const emptyParsed = new Map<string, string>();

    const result = validateEnvFile("web", emptyParsed, false);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.varName)).toContain("DATABASE_URL");
  });

  it("BR-ENV-08: error messages never contain the secret value", () => {
    const secretValue = "super_confidential_secret_value_under_32";
    const parsed = new Map<string, string>([
      ["NUXT_SESSION_PASSWORD", secretValue],
    ]);
    const result = validateEnvFile("web", parsed, false);
    const jsonOutput = JSON.stringify(result.errors);
    expect(jsonOutput).not.toContain(secretValue);
  });

  it("produces warnings on unrecognized variables without failing if valid", () => {
    const validWebEnv = new Map<string, string>([
      ["NODE_ENV", "development"],
      ["PORT", "3000"],
      ["DATABASE_URL", "postgres://user:pass@localhost:5432/db"],
      ["VALKEY_URL", "valkey://127.0.0.1:6379"],
      ["NUXT_SESSION_PASSWORD", "12345678901234567890123456789012"],
      ["WEB_JWT_SECRET", "12345678901234567890123456789012"],
      ["ADMIN_JWT_SECRET", "12345678901234567890123456789012"],
      ["PARENT_GATE_SECRET", "12345678901234567890123456789012"],
      ["MFA_ENCRYPTION_KEY", "12345678901234567890123456789012"],
      ["SITE_URL", "https://mindkid.vn"],
      ["ADMIN_SITE_URL", "https://admin.mindkid.vn"],
      ["STORAGE_DRIVER", "local"],
      ["OLD_DEPRECATED_VAR", "some_value"],
    ]);

    const result = validateEnvFile("web", validWebEnv, false);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]?.varName).toBe("OLD_DEPRECATED_VAR");
  });
});
