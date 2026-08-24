import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Task #105 — Admin Login Page (BR-ADA-01..03, BR-MME-01..07)", () => {
  const loginSource = readFileSync(
    join(import.meta.dirname, "../../app/pages/login.vue"),
    "utf-8"
  );

  it("Scenario: layout is auth and not manager", () => {
    expect(loginSource).toContain('layout: "auth"');
    expect(loginSource).not.toContain('layout: "manager"');
  });

  it("Scenario: contains all 3 states (password, enroll/recovery, mfa)", () => {
    expect(loginSource).toContain("authState === 'password'");
    expect(loginSource).toContain("authState === 'enroll'");
    expect(loginSource).toContain("authState === 'recovery'");
    expect(loginSource).toContain("authState === 'mfa'");
  });

  it("Scenario: calls guest auth endpoints via useApiClient", () => {
    expect(loginSource).toContain('"/api/guest/auth/managers/login"');
    expect(loginSource).toContain('"/api/guest/auth/managers/mfa-setup"');
    expect(loginSource).toContain('"/api/guest/auth/managers/mfa"');
    expect(loginSource).toContain("useApiClient()");
  });

  it("Scenario: displays 10 recovery codes with confirmation before proceeding", () => {
    expect(loginSource).toContain("hasSavedRecoveryCodes");
    expect(loginSource).toContain("recoveryCodes");
    expect(loginSource).toContain(':disabled="!hasSavedRecoveryCodes"');
  });

  it("Scenario: strictly uses token colors without hex literals", () => {
    const hexMatches = loginSource.match(/#[0-9a-fA-F]{3,6}/g);
    expect(hexMatches).toBeNull();
  });
});
