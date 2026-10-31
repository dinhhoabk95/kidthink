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

  it("Scenario: contains password and mfa states without forced otpauth enrollment on login", () => {
    expect(loginSource).toContain("authState === 'password'");
    expect(loginSource).toContain("authState === 'mfa'");
    expect(loginSource).not.toContain("otpauthUri");
    expect(loginSource).not.toContain('"/api/guest/auth/managers/mfa-setup"');
  });

  it("Scenario: calls guest auth endpoints via useApiClient", () => {
    expect(loginSource).toContain('"/api/guest/auth/managers/login"');
    expect(loginSource).toContain('"/api/guest/auth/managers/mfa"');
    expect(loginSource).toContain("useApiClient()");
  });

  it("Scenario: redirects directly to dashboard when login returns status ok", () => {
    expect(loginSource).toContain('res.status === "ok"');
    expect(loginSource).toContain("finishLoginAndRedirect");
  });

  it("Scenario: strictly uses token colors without hex literals", () => {
    const hexMatches = loginSource.match(/#[0-9a-fA-F]{3,6}/g);
    expect(hexMatches).toBeNull();
  });
});
