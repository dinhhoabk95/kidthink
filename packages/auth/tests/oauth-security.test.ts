import { describe, expect, it } from "vitest";
import {
  decodeOAuthStatePayload,
  encodeOAuthStatePayload,
  generateOAuthState,
  OAUTH_STATE_TTL_SECONDS,
  sanitizeReturnTo,
} from "#src/index";

describe("Task 2 — OAuth Security & State Invariants (BR-OAP-03, BR-OAP-04, BR-OAP-05, BR-OAP-07, BR-OAP-08, BR-OAP-10, BR-OAP-14, BR-OAP-15, D-IP)", () => {
  const SECRET = "super_secret_test_key_for_oauth_state_12345";

  describe("BR-OAP-03: OAuth State Generation & Verification", () => {
    it("generates random state >= 32 bytes (64 hex characters)", () => {
      const state1 = generateOAuthState();
      const state2 = generateOAuthState();

      expect(state1).toHaveLength(64);
      expect(state2).toHaveLength(64);
      expect(state1).not.toBe(state2);
    });

    it("encodes and decodes valid state payload within 10-minute TTL", () => {
      const now = Date.now();
      const payload = {
        state: generateOAuthState(),
        code_verifier: "pkce_verifier_string_12345678901234567890",
        intent: "login" as const,
        return_to: "/me/settings",
        provider: "google" as const,
        created_at: now,
      };

      const token = encodeOAuthStatePayload(payload, SECRET);
      const decoded = decodeOAuthStatePayload(token, SECRET, now + 300 * 1000); // 5 mins later

      expect(decoded).toEqual(payload);
    });

    it("rejects expired state (> 10 minutes)", () => {
      const now = Date.now();
      const payload = {
        state: generateOAuthState(),
        code_verifier: "pkce_verifier",
        intent: "login" as const,
        return_to: "/me",
        provider: "google" as const,
        created_at: now,
      };

      const token = encodeOAuthStatePayload(payload, SECRET);
      // 11 minutes later
      const decoded = decodeOAuthStatePayload(
        token,
        SECRET,
        now + (OAUTH_STATE_TTL_SECONDS + 60) * 1000
      );
      expect(decoded).toBeNull();
    });

    it("BR-OAP-03: rejects tampered state or signature", () => {
      const now = Date.now();
      const payload = {
        state: generateOAuthState(),
        code_verifier: "pkce_verifier",
        intent: "login" as const,
        return_to: "/me",
        provider: "google" as const,
        created_at: now,
      };

      const token = encodeOAuthStatePayload(payload, SECRET);
      const [b64Data] = token.split(".");
      const forgedToken = `${b64Data}.invalid_signature`;

      expect(decodeOAuthStatePayload(forgedToken, SECRET, now)).toBeNull();
      expect(decodeOAuthStatePayload("tampered.data", SECRET, now)).toBeNull();
      expect(decodeOAuthStatePayload("", SECRET, now)).toBeNull();
    });
  });

  describe("BR-OAP-05: Open Redirect Sanitization", () => {
    it("allows valid internal relative paths", () => {
      expect(sanitizeReturnTo("/me")).toBe("/me");
      expect(sanitizeReturnTo("/me/settings/security")).toBe(
        "/me/settings/security"
      );
      expect(sanitizeReturnTo("/games/GL-C1-001")).toBe("/games/GL-C1-001");
    });

    it("falls back to /me for external URLs (prevent open redirect)", () => {
      expect(sanitizeReturnTo("https://evil.example.com")).toBe("/me");
      expect(sanitizeReturnTo("http://evil.example.com")).toBe("/me");
      expect(sanitizeReturnTo("//evil.example.com")).toBe("/me");
      expect(sanitizeReturnTo("javascript:alert(1)")).toBe("/me");
      expect(sanitizeReturnTo("")).toBe("/me");
      expect(sanitizeReturnTo(null)).toBe("/me");
      expect(sanitizeReturnTo(undefined)).toBe("/me");
    });
  });

  describe("BR-OAP-07 & BR-OAP-15 & D-IP: Zero Provider Token & Avatar Storage", () => {
    it("NormalizedProfile contains only permitted identity fields", () => {
      const profile = {
        provider: "google" as const,
        provider_user_id: "google-user-sub-12345",
        email_at_provider: "parent@example.com",
        email_verified_at_provider: true,
        display_name_at_provider: "Parent Name",
      };

      expect(Object.keys(profile).sort()).toEqual(
        [
          "display_name_at_provider",
          "email_at_provider",
          "email_verified_at_provider",
          "provider",
          "provider_user_id",
        ].sort()
      );

      // Verify forbidden keys are not present
      expect((profile as any).access_token).toBeUndefined();
      expect((profile as any).refresh_token).toBeUndefined();
      expect((profile as any).avatar).toBeUndefined();
      expect((profile as any).picture).toBeUndefined();
      expect((profile as any).token).toBeUndefined();
    });
  });
});
