import { describe, expect, it } from "vitest";
import {
  consumeSocialSignupConsentTicket,
  createSocialSignupConsentTicket,
  InMemoryRedisClient,
} from "#src/index";

describe("Social Signup Consent Ticket (BR-SCL-01, BR-SCL-02, BR-SCL-12)", () => {
  it("consumes valid ticket once and rejects missing/forged tokens", async () => {
    const redis = new InMemoryRedisClient();
    const token = await createSocialSignupConsentTicket(redis, {
      termsRequirementAt: "2026-10-01T00:00:00.000Z",
      privacyRequirementAt: "2026-10-01T00:00:00.000Z",
      ipAddress: "203.0.113.5",
      userAgent: "Safari iPadOS",
    });

    expect(
      await consumeSocialSignupConsentTicket(redis, "forged-token")
    ).toBeNull();
    expect(await consumeSocialSignupConsentTicket(redis, null)).toBeNull();

    const payload = await consumeSocialSignupConsentTicket(redis, token);
    expect(payload?.ipAddress).toBe("203.0.113.5");
    expect(payload?.userAgent).toBe("Safari iPadOS");

    expect(await consumeSocialSignupConsentTicket(redis, token)).toBeNull();
  });
});
