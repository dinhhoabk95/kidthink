import { registerAuthCoordinatorPort } from "@mindkid/auth";
import { registerCloudflareCachePort } from "@mindkid/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeD1, createFakeDoSql } from "./__tests__/cloudflare-fakes.js";
import {
  CloudflareJobQueueController,
  type CloudflareWorkerEnv,
  type WorkerAuthCoordinatorStub,
} from "./cloudflare-runtime.js";

vi.mock("@mindkid/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/auth")>();
  return {
    ...actual,
    registerAuthCoordinatorPort: vi.fn(),
  };
});

vi.mock("@mindkid/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/cache")>();
  return {
    ...actual,
    registerCloudflareCachePort: vi.fn(),
  };
});

vi.mock("#src/consumers/index", () => ({
  CONSUMERS: {
    "sweep:abandoned": vi.fn(() => Promise.resolve()),
  },
}));

describe("CloudflareJobQueueController (#31-CF DO bindings)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("binds AUTH_COORDINATOR to registerAuthCoordinatorPort and registerCloudflareCachePort before running consumer", async () => {
    const stub: WorkerAuthCoordinatorStub = {
      kvGet: vi.fn(() => Promise.resolve("val")),
      kvGetDel: vi.fn(() => Promise.resolve(null)),
      kvSet: vi.fn(() => Promise.resolve("OK")),
      kvDel: vi.fn(() => Promise.resolve(2)),
      kvIncr: vi.fn(() => Promise.resolve(1)),
      kvExpire: vi.fn(() => Promise.resolve(1)),
      kvDeleteByPrefix: vi.fn(() => Promise.resolve(5)),
      consumeRateLimit: vi.fn(() =>
        Promise.resolve({ allowed: true, remaining: 1, resetSeconds: 60 })
      ),
    };

    const idObj = { name: "global-auth-v1" };
    const idFromName = vi.fn(() => idObj);
    const getStub = vi.fn(() => stub);
    const fakeD1 = createFakeD1();

    const env: CloudflareWorkerEnv = {
      DB_CORE: fakeD1,
      DB_LOGS: fakeD1,
      DB_BLOBS: fakeD1,
      MINDKID_RUNTIME: "cloudflare",
      AUTH_COORDINATOR: {
        idFromName,
        get: getStub,
      },
    };

    let alarmTime: number | null = null;
    const controller = new CloudflareJobQueueController(
      {
        storage: {
          sql: createFakeDoSql(),
          getAlarm: () => Promise.resolve(alarmTime),
          setAlarm: (ms: number) => {
            alarmTime = ms;
            return Promise.resolve();
          },
        },
      },
      env
    );

    await controller.enqueueBatch([
      {
        jobId: "sweep:test:1",
        name: "sweep:abandoned",
        payloadJson: JSON.stringify({ windowStart: "2026-11-22T00:00:00Z" }),
        delayMs: 0,
        maxAttempts: 1,
        backoffType: "fixed",
        backoffDelayMs: 1000,
        timeoutSeconds: 30,
        alertOnFailImmediately: false,
      },
    ]);

    const drained = await controller.alarm();
    expect(drained.processed).toBe(1);
    expect(drained.failed).toBe(0);
    expect(registerAuthCoordinatorPort).toHaveBeenCalledTimes(1);
    // G9: port giữ namespace, lấy stub mới ở mỗi lần gọi (không giữ stub qua lần gọi).
    expect(getStub).not.toHaveBeenCalled();
    const authPort = vi.mocked(registerAuthCoordinatorPort).mock.calls[0]?.[0];
    expect(await authPort?.kvGet("auth-k")).toBe("val");
    expect(idFromName).toHaveBeenCalledWith("global-auth-v1");
    expect(getStub).toHaveBeenCalledWith(idObj);
    expect(stub.kvGet).toHaveBeenCalledWith("auth-k");
    expect(registerCloudflareCachePort).toHaveBeenCalledTimes(1);

    const cachePort = vi.mocked(registerCloudflareCachePort).mock.calls[0]?.[0];
    expect(cachePort).toBeDefined();
    if (cachePort) {
      expect(await cachePort.get("k1")).toBe("val");
      await cachePort.set("k1", "v1", 60);
      expect(stub.kvSet).toHaveBeenCalledWith("k1", "v1", 60);
      expect(await cachePort.del("k1", "k2")).toBe(2);
      expect(stub.kvDel).toHaveBeenCalledWith(["k1", "k2"]);
      expect(await cachePort.deleteByPrefix?.("ba:v1:user:")).toBe(5);
      expect(stub.kvDeleteByPrefix).toHaveBeenCalledWith("ba:v1:user:");
    }
  });
});
