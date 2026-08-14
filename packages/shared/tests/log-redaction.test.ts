import { describe, expect, it } from "vitest";
import {
  createStructuredLog,
  getClientErrorSamplingRate,
  getSentryDsn,
  isSentryConfigured,
  redactPii,
  shouldSampleClientError,
} from "../src/index.js";

describe("Task 3 — Structured Logging & PII Redactor (BR-MON-05, BR-MON-06, D-IS, D-IP)", () => {
  it("Scenario: BR-MON-05 & D-IS — negative test: redactor strictly strips all 7 mandatory PII fields", () => {
    const rawInput = {
      message: "Processing child play session",
      display_name: "Bé An",
      birth_year: 2021,
      child_uuid: "c9b1e7c0-1234-5678-90ab-cdef01234567",
      email: "parent@example.com",
      password: "SuperSecretPassword123!",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      authorization: "Bearer eyJhbGciOi...",
      valid_metric: 42,
      nested: {
        child_uuid: "nested-uuid",
        display_name: "Nested Child",
        score: 100,
      },
      array_data: [
        { email: "child1@test.vn", count: 1 },
        { email: "child2@test.vn", count: 2 },
      ],
    };

    const redacted = redactPii(rawInput);

    // Assert that NONE of the 7 fields exist on top level
    expect(redacted).not.toHaveProperty("display_name");
    expect(redacted).not.toHaveProperty("birth_year");
    expect(redacted).not.toHaveProperty("child_uuid");
    expect(redacted).not.toHaveProperty("email");
    expect(redacted).not.toHaveProperty("password");
    expect(redacted).not.toHaveProperty("token");
    expect(redacted).not.toHaveProperty("authorization");

    // Assert that valid non-PII fields are preserved
    expect(redacted.valid_metric).toBe(42);

    // Assert that nested structures are also stripped
    expect(redacted.nested).not.toHaveProperty("child_uuid");
    expect(redacted.nested).not.toHaveProperty("display_name");
    expect(redacted.nested.score).toBe(100);

    // Assert that arrays are also stripped
    expect(redacted.array_data[0]).not.toHaveProperty("email");
    expect(redacted.array_data[0].count).toBe(1);
  });

  it("Scenario: D-IP — negative test: provider access tokens and credentials do not leak into logs", () => {
    const socialAuthInput = {
      provider: "google",
      access_token: "ya29.a0AfH6SM...",
      refresh_token: "1//04...",
      provider_token: "prov_secret_xyz",
      id_token: "id_token_jwt",
      client_secret: "gocspx-...",
      mfa_secret: "JBSWY3DPEHPK3PXP",
      user_id: 123,
    };

    const redacted = redactPii(socialAuthInput);

    expect(redacted).not.toHaveProperty("access_token");
    expect(redacted).not.toHaveProperty("refresh_token");
    expect(redacted).not.toHaveProperty("provider_token");
    expect(redacted).not.toHaveProperty("id_token");
    expect(redacted).not.toHaveProperty("client_secret");
    expect(redacted).not.toHaveProperty("mfa_secret");
    expect(redacted.provider).toBe("google");
    expect(redacted.user_id).toBe(123);
  });

  it("createStructuredLog formats log entry according to §7.4", () => {
    const entry = createStructuredLog({
      level: "error",
      request_id: "req-12345-abc",
      actor_type: "user",
      actor_id: 42,
      route: "/api/users/levels/GL-001",
      code: "TIER_LOCKED",
      duration_ms: 35,
      message: "Access tier standard required",
      // Accidental PII
      email: "leak@test.vn",
      child_uuid: "child-leak-uuid",
    });

    expect(entry.level).toBe("error");
    expect(entry.request_id).toBe("req-12345-abc");
    expect(entry.actor_type).toBe("user");
    expect(entry.actor_id).toBe(42);
    expect(entry.route).toBe("/api/users/levels/GL-001");
    expect(entry.code).toBe("TIER_LOCKED");
    expect(entry.duration_ms).toBe(35);
    expect(entry.ts).toBeDefined();

    // PII stripped
    expect(entry).not.toHaveProperty("email");
    expect(entry).not.toHaveProperty("child_uuid");
  });

  it("Scenario: BR-MON-06 — client error logging uses configurable sampling rate", () => {
    const rate = getClientErrorSamplingRate();
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(1.0);

    // Deterministic RNG check
    expect(shouldSampleClientError(0.2, () => 0.1)).toBe(true);
    expect(shouldSampleClientError(0.2, () => 0.3)).toBe(false);
    expect(shouldSampleClientError(0.0, () => 0.0)).toBe(false);
    expect(shouldSampleClientError(1.0, () => 0.99)).toBe(true);
  });

  it("Sentry DSN configuration degrades gracefully when not set", () => {
    // When Sentry DSN is empty or missing, isSentryConfigured returns false and app does not crash
    expect(typeof isSentryConfigured()).toBe("boolean");
    const dsn = getSentryDsn();
    if (!dsn) {
      expect(isSentryConfigured()).toBe(false);
    }
  });
});
