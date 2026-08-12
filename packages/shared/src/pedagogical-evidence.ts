export interface PlaytestSessionConfig {
  hasGuardianConsent: boolean;
  hasChildAssent: boolean;
  maxDurationMinutes: number;
  ageBand: "3-4" | "4-5" | "5-6";
  collectsPii: boolean;
}

export function validatePlaytestSession(config: PlaytestSessionConfig): {
  valid: boolean;
  reason?: string;
} {
  // BR-PED-02: 100% guardian consent & child assent required
  if (!config.hasGuardianConsent) {
    return { valid: false, reason: "MISSING_GUARDIAN_CONSENT" };
  }
  if (!config.hasChildAssent) {
    return { valid: false, reason: "MISSING_CHILD_ASSENT" };
  }

  // BR-PED-03: No PII collection allowed
  if (config.collectsPii) {
    return { valid: false, reason: "PII_COLLECTION_FORBIDDEN" };
  }

  // Max duration limits
  const maxAllowed = config.ageBand === "3-4" ? 15 : 20;
  if (config.maxDurationMinutes > maxAllowed) {
    return { valid: false, reason: "SESSION_DURATION_EXCEEDED" };
  }

  return { valid: true };
}
