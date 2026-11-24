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
});
