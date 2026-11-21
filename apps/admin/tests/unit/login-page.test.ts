import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Admin Login Page — Better Auth Manager Instance (BR-ADA-01..03, BR-AUT-39..45)", () => {
  const loginSource = readFileSync(
    join(import.meta.dirname, "../../app/pages/login.vue"),
    "utf-8"
  );

  it("Scenario: layout is auth and not manager", () => {
    expect(loginSource).toContain('layout: "auth"');
    expect(loginSource).not.toContain('layout: "manager"');
  });

  it("Scenario: contains password, passkey, and mfa states without forced otpauth enrollment on login", () => {
    expect(loginSource).toContain("authState === 'password'");
    expect(loginSource).toContain("authState === 'mfa'");
    expect(loginSource).toContain("authClient.signIn.passkey()");
    expect(loginSource).not.toContain("otpauthUri");
  });

  it("Scenario: authenticates via useManagerAuthClient (signIn.email, twoFactor.verifyTotp, twoFactor.verifyBackupCode)", () => {
    expect(loginSource).toContain("useManagerAuthClient()");
    expect(loginSource).toContain("authClient.signIn.email(");
    expect(loginSource).toContain("authClient.twoFactor.verifyTotp(");
    expect(loginSource).toContain("authClient.twoFactor.verifyBackupCode(");
  });

  it("Scenario: transitions to mfa state on twoFactorRedirect or redirects to dashboard", () => {
    expect(loginSource).toContain("twoFactorRedirect");
    expect(loginSource).toContain("finishLoginAndRedirect");
  });

  it("Scenario: strictly uses token colors without hex literals", () => {
    const hexMatches = loginSource.match(/#[0-9a-fA-F]{3,6}/g);
    expect(hexMatches).toBeNull();
  });
});
