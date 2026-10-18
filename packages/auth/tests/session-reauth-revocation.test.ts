import { SessionRevokedError } from "@mindkid/errors/auth";
import { describe, expect, it } from "vitest";
import {
  CurrentSessionReauthService,
  InMemoryRedisClient,
  REAUTH_MAX_AGE_SECONDS,
  RedisSessionStore,
} from "#src/index";

const T0 = new Date("2026-10-14T08:00:00Z");

function makeStore(): { redis: InMemoryRedisClient; store: RedisSessionStore } {
  const redis = new InMemoryRedisClient();
  return { redis, store: new RedisSessionStore(redis) };
}

describe("UC-004 BR-022 reauth bền trong phiên Redis", () => {
  it("phiên mới chưa có reauth_at", async () => {
    const { store } = makeStore();
    const created = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      now: T0,
    });
    const ctx = await store.resolveSession("user", created.sessionToken, T0);
    expect(ctx?.user?.reauth_at).toBeUndefined();
  });

  it("markReauthenticated lưu vào Redis và request sau đọc lại được", async () => {
    const { store } = makeStore();
    const created = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      now: T0,
    });
    const at = new Date(T0.getTime() + 60_000);
    await store.markReauthenticated(
      created.sessionId,
      { account_type: "user", account_id: 1 },
      at,
      at
    );
    // "Request sau": resolve lại từ Redis, không dùng đối tượng cũ.
    const ctx = await store.resolveSession("user", created.sessionToken, at);
    expect(ctx?.user?.reauth_at?.toISOString()).toBe(at.toISOString());
  });

  it("giữ nguyên hạn phiên khi ghi reauth_at", async () => {
    const { store } = makeStore();
    const created = await store.createSession({
      namespace: "manager",
      accountId: 7,
      displayName: "M",
      role: "super_admin",
      now: T0,
    });
    const at = new Date(T0.getTime() + 600_000);
    await store.markReauthenticated(
      created.sessionId,
      { account_type: "manager", account_id: 7 },
      at,
      at
    );
    const late = new Date(created.expiresAt.getTime() + 1000);
    expect(
      await store.resolveSession("manager", created.sessionToken, late)
    ).toBeNull();
  });

  it("không ghi reauth_at cho phiên của tài khoản khác", async () => {
    const { store } = makeStore();
    const created = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      now: T0,
    });
    await expect(
      store.markReauthenticated(
        created.sessionId,
        { account_type: "user", account_id: 2 },
        T0,
        T0
      )
    ).rejects.toBeInstanceOf(SessionRevokedError);
    const ctx = await store.resolveSession("user", created.sessionToken, T0);
    expect(ctx?.user?.reauth_at).toBeUndefined();
  });

  it("CurrentSessionReauthService dùng chung kho Redis và hết hạn sau 5 phút", async () => {
    const { store } = makeStore();
    const created = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      now: T0,
    });
    const service = new CurrentSessionReauthService(store, {
      getAvailableMethods: () => Promise.resolve(["password"]),
    });
    const event = {
      context: {
        user: {
          user_id: 1,
          display_name: "A",
          session_id: created.sessionId,
        },
      },
    };
    await expect(service.requireRecent(event, T0)).rejects.toThrow();
    await service.markCurrentSessionReauthenticated(event, T0);
    await expect(
      service.requireRecent(
        event,
        new Date(T0.getTime() + (REAUTH_MAX_AGE_SECONDS - 1) * 1000)
      )
    ).resolves.toBeUndefined();
    await expect(
      service.requireRecent(
        event,
        new Date(T0.getTime() + (REAUTH_MAX_AGE_SECONDS + 1) * 1000)
      )
    ).rejects.toThrow();
  });

  it("khôi phục từ remember token không mang reauth_at cũ (UC-004 BR-022)", async () => {
    const { store } = makeStore();
    const created = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      rememberMe: true,
      now: T0,
    });
    await store.markReauthenticated(
      created.sessionId,
      { account_type: "user", account_id: 1 },
      T0,
      T0
    );
    const restored = await store.restoreRemember({
      namespace: "user",
      rememberToken: created.rememberToken ?? "",
      now: T0,
    });
    const ctx = await store.resolveSession("user", restored.sessionToken, T0);
    expect(ctx?.user?.reauth_at).toBeUndefined();
  });
});

describe("UC-004 BR-021 / UC-005 BR-003 thu hồi phiên và remember token", () => {
  it("revokeAll làm phiên và remember token cũ mất hiệu lực", async () => {
    const { store } = makeStore();
    const created = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      rememberMe: true,
      now: T0,
    });
    await store.revokeAll({ account_type: "user", account_id: 1 });
    expect(
      await store.resolveSession("user", created.sessionToken, T0)
    ).toBeNull();
    await expect(
      store.restoreRemember({
        namespace: "user",
        rememberToken: created.rememberToken ?? "",
        now: T0,
      })
    ).rejects.toBeInstanceOf(SessionRevokedError);
  });

  it("phiên cấp trước revokeAll bị loại theo phiên bản tài khoản dù mất khỏi danh sách thiết bị", async () => {
    const { redis, store } = makeStore();
    const created = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      rememberMe: true,
      now: T0,
    });
    // Mô phỏng danh sách thiết bị bị hụt (hết hạn/ghi lỗi): revokeAll không đi tới phiên này.
    await redis.del("auth:v1:user:account_devices:1");
    await store.revokeAll({ account_type: "user", account_id: 1 });
    expect(
      await store.resolveSession("user", created.sessionToken, T0)
    ).toBeNull();
    await expect(
      store.restoreRemember({
        namespace: "user",
        rememberToken: created.rememberToken ?? "",
        now: T0,
      })
    ).rejects.toBeInstanceOf(SessionRevokedError);
  });

  it("phiên cấp sau revokeAll vẫn dùng được", async () => {
    const { store } = makeStore();
    await store.revokeAll({ account_type: "user", account_id: 1 });
    const created = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      now: T0,
    });
    expect(
      (await store.resolveSession("user", created.sessionToken, T0))?.user
        ?.user_id
    ).toBe(1);
  });

  it("revokeOtherDevices giữ thiết bị hiện tại, thu hồi phiên và remember token của thiết bị khác", async () => {
    const { store } = makeStore();
    const current = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      rememberMe: true,
      now: T0,
    });
    const other = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      rememberMe: true,
      now: T0,
    });
    await store.revokeOtherDevices("user", 1, current.deviceId);

    expect(
      (await store.resolveSession("user", current.sessionToken, T0))?.user
        ?.user_id
    ).toBe(1);
    expect(
      await store.resolveSession("user", other.sessionToken, T0)
    ).toBeNull();
    await expect(
      store.restoreRemember({
        namespace: "user",
        rememberToken: other.rememberToken ?? "",
        now: T0,
      })
    ).rejects.toBeInstanceOf(SessionRevokedError);
    await expect(
      store.restoreRemember({
        namespace: "user",
        rememberToken: current.rememberToken ?? "",
        now: T0,
      })
    ).resolves.toBeDefined();
  });

  it("getDeviceId trả thiết bị của phiên", async () => {
    const { store } = makeStore();
    const created = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "A",
      now: T0,
    });
    expect(await store.getDeviceId("user", created.sessionId)).toBe(
      created.deviceId
    );
  });
});
