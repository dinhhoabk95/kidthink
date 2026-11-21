import { describe, expect, it } from "vitest";
import {
  consumeSocialSignupConsentTicket,
  createRedisSecondaryStorage,
  createSocialSignupConsentTicket,
  InMemoryRedisClient,
  REAUTH_FRESH_AGE_SECONDS,
  REMEMBER_MAX_TTL_SECONDS,
  SESSION_DEFAULT_TTL_SECONDS,
} from "#src/index";

describe("Better Auth Valkey SecondaryStorage Foundation (BR-AUT-27, BR-AUT-28, BR-AUT-31, BR-AUT-39)", () => {
  it("defines exact 1-hour default, 365-day remember cap, and 5-minute fresh window constants", () => {
    expect(SESSION_DEFAULT_TTL_SECONDS).toBe(3600);
    expect(REMEMBER_MAX_TTL_SECONDS).toBe(365 * 24 * 60 * 60);
    expect(REAUTH_FRESH_AGE_SECONDS).toBe(300);
  });

  it("isolates user and manager namespaces in secondaryStorage and respects delete", async () => {
    const redis = new InMemoryRedisClient();
    const userStore = createRedisSecondaryStorage(redis, "user");
    const managerStore = createRedisSecondaryStorage(redis, "manager");

    await userStore.set("active:1", '{"id":1}', 3600);
    await managerStore.set("active:1", '{"id":99}', 3600);

    expect(await userStore.get("active:1")).toBe('{"id":1}');
    expect(await managerStore.get("active:1")).toBe('{"id":99}');

    await userStore.delete("active:1");
    expect(await userStore.get("active:1")).toBeNull();
    expect(await managerStore.get("active:1")).toBe('{"id":99}');
  });

  it("BR-AUT-31: fails closed with 503 SERVICE_UNAVAILABLE on Redis outage", async () => {
    const redis = new InMemoryRedisClient();
    const userStore = createRedisSecondaryStorage(redis, "user");
    redis.setFailMode(true);

    await expect(userStore.get("any-key")).rejects.toThrowError(
      expect.objectContaining({ code: "SERVICE_UNAVAILABLE", status: 503 })
    );
    await expect(userStore.set("any-key", "val", 60)).rejects.toThrowError(
      expect.objectContaining({ code: "SERVICE_UNAVAILABLE", status: 503 })
    );
    await expect(userStore.delete("any-key")).rejects.toThrowError(
      expect.objectContaining({ code: "SERVICE_UNAVAILABLE", status: 503 })
    );
  });

  it("BR-SCL-01 & BR-SCL-12: issues one-time social signup consent ticket in Valkey", async () => {
    const redis = new InMemoryRedisClient();
    const token = await createSocialSignupConsentTicket(redis, {
      termsRequirementAt: "2026-08-01T00:00:00.000Z",
      privacyRequirementAt: null,
      ipAddress: "127.0.0.1",
      userAgent: "TestBrowser",
    });

    const first = await consumeSocialSignupConsentTicket(redis, token);
    expect(first?.termsRequirementAt).toBe("2026-08-01T00:00:00.000Z");
    expect(first?.ipAddress).toBe("127.0.0.1");

    const replay = await consumeSocialSignupConsentTicket(redis, token);
    expect(replay).toBeNull();
  });
});
