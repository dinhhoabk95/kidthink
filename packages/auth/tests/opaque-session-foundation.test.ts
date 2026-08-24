import { describe, expect, it } from "vitest";
import {
  InMemoryRedisClient,
  MfaChallengeService,
  RedisSessionStore,
  sha256,
} from "#src/index";

describe("T1 Opaque Redis Session Foundation (BR-AUT-25 .. BR-AUT-38)", () => {
  it("creates a 1-hour opaque session without rememberMe by default (BR-AUT-25, BR-AUT-26, BR-AUT-27)", async () => {
    const redis = new InMemoryRedisClient();
    const store = new RedisSessionStore(redis);

    const now = new Date("2026-08-13T12:00:00Z");
    const created = await store.createSession({
      namespace: "user",
      accountId: 101,
      displayName: "Người dùng A",
      rememberMe: false,
      now,
    });

    expect(created.sessionToken).toHaveLength(64); // 256-bit hex
    expect(created.rememberToken).toBeUndefined();
    expect(created.expiresAt.toISOString()).toBe("2026-08-13T13:00:00.000Z");

    const resolved = await store.resolveSession(
      "user",
      created.sessionToken,
      now
    );
    expect(resolved).toEqual({
      user: {
        user_id: 101,
        display_name: "Người dùng A",
        session_id: sha256(created.sessionToken),
        active_child_id: undefined,
      },
    });
  });

  it("rotates verifier on remember restore and maintains absolute 365-day cutoff (BR-AUT-28)", async () => {
    const redis = new InMemoryRedisClient();
    const store = new RedisSessionStore(redis);

    const now1 = new Date("2026-01-01T00:00:00Z");
    const created = await store.createSession({
      namespace: "user",
      accountId: 102,
      displayName: "Người dùng B",
      rememberMe: true,
      now: now1,
    });

    const initialRememberToken = created.rememberToken ?? "";
    expect(initialRememberToken).not.toBe("");

    const restored1 = await store.restoreRemember({
      namespace: "user",
      rememberToken: initialRememberToken,
      now: new Date("2026-01-02T00:00:00Z"),
    });

    expect(restored1.rememberToken).not.toBe(initialRememberToken);
    expect(restored1.sessionToken).toBeDefined();

    // Replay of old rememberToken must fail and trigger reuse detection (BR-AUT-29)
    await expect(
      store.restoreRemember({
        namespace: "user",
        rememberToken: initialRememberToken,
        now: new Date("2026-01-02T00:01:00Z"),
      })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
    );

    // After reuse detection, all sessions for account are revoked!
    await expect(
      store.restoreRemember({
        namespace: "user",
        rememberToken: restored1.rememberToken,
        now: new Date("2026-01-02T00:02:00Z"),
      })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
    );
  });

  it("returns 401 on unknown remember selector miss without revoking account (BR-AUT-29)", async () => {
    const redis = new InMemoryRedisClient();
    const store = new RedisSessionStore(redis);

    const fakeToken = `${"a".repeat(64)}:${"b".repeat(64)}`;
    await expect(
      store.restoreRemember({
        namespace: "user",
        rememberToken: fakeToken,
      })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
    );
  });

  it("revokes device session cleanly (BR-AUT-30)", async () => {
    const redis = new InMemoryRedisClient();
    const store = new RedisSessionStore(redis);

    const created = await store.createSession({
      namespace: "user",
      accountId: 103,
      displayName: "Người dùng C",
      rememberMe: true,
      deviceId: "dev_phone_1",
    });

    await store.revokeDevice("user", 103, "dev_phone_1");

    const resolved = await store.resolveSession("user", created.sessionToken);
    expect(resolved).toBeNull();

    await expect(
      store.restoreRemember({
        namespace: "user",
        rememberToken: created.rememberToken ?? "",
      })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
    );
  });

  it("fails closed with 503 on Redis outage (BR-AUT-32)", async () => {
    const brokenRedis = {
      get: () => Promise.reject(new Error("Redis connection refused")),
      set: () => Promise.reject(new Error("Redis connection refused")),
      del: () => Promise.reject(new Error("Redis connection refused")),
      sadd: () => Promise.reject(new Error("Redis connection refused")),
      srem: () => Promise.reject(new Error("Redis connection revoked")),
      smembers: () => Promise.reject(new Error("Redis connection refused")),
      incr: () => Promise.reject(new Error("Redis connection refused")),
    };

    const store = new RedisSessionStore(brokenRedis);

    await expect(
      store.resolveSession("user", "some_token")
    ).rejects.toThrowError(
      expect.objectContaining({ code: "SERVICE_UNAVAILABLE", status: 503 })
    );
  });

  it("issues opaque MFA challenge with 5-min TTL and atomic consume (BR-AUT-35)", async () => {
    const redis = new InMemoryRedisClient();
    const mfaService = new MfaChallengeService(redis);

    const created = await mfaService.createChallenge({
      namespace: "manager",
      accountId: 201,
      displayName: "Admin X",
      role: "super_admin",
      rememberMe: true,
    });

    expect(created.challengeToken).toHaveLength(64);

    const payload = await mfaService.consumeChallenge(
      "manager",
      created.challengeToken
    );
    expect(payload.accountId).toBe(201);
    expect(payload.displayName).toBe("Admin X");
    expect(payload.rememberMe).toBe(true);

    // One-time consume: second consume must fail with TOKEN_EXPIRED (410)
    await expect(
      mfaService.consumeChallenge("manager", created.challengeToken)
    ).rejects.toThrowError(
      expect.objectContaining({ code: "TOKEN_EXPIRED", status: 410 })
    );
  });
});
