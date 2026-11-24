import { getCachePort } from "@mindkid/cache";
import { describe, expect, it, vi } from "vitest";
import {
  type CloudflareWorkerEnv,
  wireCloudflareIsolatePorts,
} from "#src/cloudflare-runtime";

const AUTH_COORDINATOR_RE = /AUTH_COORDINATOR/;
const DB_BLOBS_RE = /DB_BLOBS/;
const d1 = { prepare: vi.fn(), batch: vi.fn(), exec: vi.fn() };

function baseEnv(): CloudflareWorkerEnv {
  return { DB_CORE: d1, DB_LOGS: d1, DB_BLOBS: d1 };
}

describe("wireCloudflareIsolatePorts fail-closed (BR-JOB-12)", () => {
  it("thiếu AUTH_COORDINATOR → ném lỗi, và lần gọi sau vẫn ném (env không bị đánh dấu đã nối)", () => {
    const env = baseEnv();
    expect(() => wireCloudflareIsolatePorts(env)).toThrow(AUTH_COORDINATOR_RE);
    expect(() => wireCloudflareIsolatePorts(env)).toThrow(AUTH_COORDINATOR_RE);
  });

  it("thiếu DB_BLOBS → ném lỗi", () => {
    const env: CloudflareWorkerEnv = {
      DB_CORE: d1,
      DB_LOGS: d1,
      AUTH_COORDINATOR: {
        idFromName: () => ({}),
        get: () => {
          throw new Error("không được gọi");
        },
      },
    };
    expect(() => wireCloudflareIsolatePorts(env)).toThrow(DB_BLOBS_RE);
  });

  it("G9: không giữ stub DO qua lần gọi — mỗi thao tác cache lấy stub mới từ namespace", async () => {
    const stub = {
      kvGet: vi.fn(() => Promise.resolve(null)),
      kvGetDel: vi.fn(),
      kvSet: vi.fn(),
      kvDel: vi.fn(),
      kvIncr: vi.fn(),
      kvExpire: vi.fn(),
      kvDeleteByPrefix: vi.fn(),
      consumeRateLimit: vi.fn(),
    };
    const get = vi.fn(() => stub);
    const env: CloudflareWorkerEnv = {
      ...baseEnv(),
      AUTH_COORDINATOR: { idFromName: () => ({}), get },
    };
    wireCloudflareIsolatePorts(env);
    expect(get).not.toHaveBeenCalled();
    const cache = getCachePort();
    await cache?.get("a");
    await cache?.get("b");
    expect(get).toHaveBeenCalledTimes(2);
  });
});
