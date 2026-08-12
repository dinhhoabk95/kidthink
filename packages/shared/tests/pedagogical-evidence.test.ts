import { describe, expect, it } from "vitest";
import { validatePlaytestSession } from "../src/pedagogical-evidence.js";

describe("Pedagogical Evidence & Playtest Protocols (BR-PED-01, BR-PED-02, BR-PED-03)", () => {
  it("Scenario: BR-PED-01 — validates evidence claim boundaries", () => {
    const validConfig = {
      hasGuardianConsent: true,
      hasChildAssent: true,
      maxDurationMinutes: 15,
      ageBand: "3-4" as const,
      collectsPii: false,
    };
    expect(validatePlaytestSession(validConfig).valid).toBe(true);
  });

  it("Scenario: BR-PED-02 — enforces guardian consent & child assent", () => {
    const noConsent = {
      hasGuardianConsent: false,
      hasChildAssent: true,
      maxDurationMinutes: 15,
      ageBand: "3-4" as const,
      collectsPii: false,
    };
    expect(validatePlaytestSession(noConsent)).toEqual({
      valid: false,
      reason: "MISSING_GUARDIAN_CONSENT",
    });

    const noAssent = {
      hasGuardianConsent: true,
      hasChildAssent: false,
      maxDurationMinutes: 15,
      ageBand: "3-4" as const,
      collectsPii: false,
    };
    expect(validatePlaytestSession(noAssent)).toEqual({
      valid: false,
      reason: "MISSING_CHILD_ASSENT",
    });
  });

  it("Scenario: BR-PED-03 — forbids PII collection during playtest sessions", () => {
    const piiConfig = {
      hasGuardianConsent: true,
      hasChildAssent: true,
      maxDurationMinutes: 15,
      ageBand: "3-4" as const,
      collectsPii: true,
    };
    expect(validatePlaytestSession(piiConfig)).toEqual({
      valid: false,
      reason: "PII_COLLECTION_FORBIDDEN",
    });
  });
});
