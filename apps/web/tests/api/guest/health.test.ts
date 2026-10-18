import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import type { H3Event } from "h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRedisSet = vi.fn();
const mockRedisGet = vi.fn();
const mockRedisDel = vi.fn();

vi.mock("h3", () => ({
  defineEventHandler: <T>(fn: T): T => fn,
  setHeader: vi.fn(),
  setResponseStatus: vi.fn(),
}));

vi.mock("@mindkid/auth", () => ({
  buildAuthSentinelKey: (namespace: string, token: string) =>
    `auth:v1:${namespace}:sentinel:${token}`,
  generateTokenHex: () => "deadbeefcafebabe",
  getAuthRedisClient: () => ({
    set: mockRedisSet,
    get: mockRedisGet,
    del: mockRedisDel,
  }),
}));

vi.mock("@mindkid/db", () => ({
  getOwnerDb: vi.fn(),
}));

vi.mock("@mindkid/cache", () => ({
  ping: vi.fn(),
}));

vi.mock("@mindkid/queue", () => ({
  getWaitingCount: vi.fn(),
  alert: vi.fn(),
}));

import { ping } from "@mindkid/cache";
import { getOwnerDb } from "@mindkid/db";
import { alert, getWaitingCount } from "@mindkid/queue";
import { setHeader, setResponseStatus } from "h3";
import handler from "#server/api/guest/health.get";

const mockedGetOwnerDb = vi.mocked(getOwnerDb);
const mockedPing = vi.mocked(ping);
const mockedGetWaitingCount = vi.mocked(getWaitingCount);

function setupHealthyDependencies(): void {
  mockedGetOwnerDb.mockReturnValue({
    execute: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  } as never);
  mockedPing.mockResolvedValue(true);
  mockedGetWaitingCount.mockResolvedValue(0);
  mockRedisSet.mockResolvedValue("OK");
  mockRedisGet.mockResolvedValue("deadbeefcafebabe");
  mockRedisDel.mockResolvedValue(1);
}

describe("Health Check API (BR-HLT-01..06)", () => {
  let mockEvent: H3Event;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = {} as H3Event;
    setupHealthyDependencies();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("BR-HLT-02 & BR-HLT-04: kiểm dịch vụ thật (DB, Cache, Queue, Auth sentinel write/read/delete) và không lộ version/hostname/chuỗi kết nối", async () => {
    const response = await handler(mockEvent);

    expect(response).toEqual({ status: "ok" });
    expect(response).not.toHaveProperty("version");
    expect(response).not.toHaveProperty("hostname");
    expect(response).not.toHaveProperty("dbUrl");

    expect(setHeader).toHaveBeenCalledWith(
      mockEvent,
      "Cache-Control",
      "no-store"
    );

    const expectedKey = "auth:v1:user:sentinel:deadbeefcafebabe";
    expect(mockRedisSet).toHaveBeenCalledWith(
      expectedKey,
      "deadbeefcafebabe",
      "EX",
      5
    );
    expect(mockRedisGet).toHaveBeenCalledWith(expectedKey);
    expect(mockRedisDel).toHaveBeenCalledWith(expectedKey);
  });

  it("Ca âm BR-HLT-01 & BR-HLT-03: tắt PostgreSQL → 503, không phải 200, phát alert", async () => {
    mockedGetOwnerDb.mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error("Connection refused")),
    } as never);

    const response = await handler(mockEvent);

    expect(response).toEqual({ status: "error" });
    expect(setResponseStatus).toHaveBeenCalledWith(mockEvent, 503);

    expect(alert).toHaveBeenCalledWith(
      "error",
      "Health check failed",
      expect.objectContaining({
        error: expect.stringContaining("Connection refused"),
      })
    );
  });

  it("Ca âm BR-HLT-02 & BR-HLT-03: Redis auth ghi được nhưng đọc lại sentinel sai giá trị → 503 + alert và vẫn xoá sentinel", async () => {
    mockRedisGet.mockResolvedValue("corrupted-value");

    const response = await handler(mockEvent);

    expect(response).toEqual({ status: "error" });
    expect(setResponseStatus).toHaveBeenCalledWith(mockEvent, 503);
    expect(mockRedisDel).toHaveBeenCalledWith(
      "auth:v1:user:sentinel:deadbeefcafebabe"
    );
    expect(alert).toHaveBeenCalledWith(
      "error",
      "Health check failed",
      expect.objectContaining({
        error: expect.stringContaining("sentinel read-back mismatch"),
      })
    );
  });

  it("Ca âm BR-HLT-05 & BR-HLT-03: dịch vụ vượt ngân sách timeout 2s → 503 + alert", async () => {
    vi.useFakeTimers();

    mockedGetOwnerDb.mockReturnValue({
      execute: vi.fn().mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      ),
    } as never);

    const handlerPromise = handler(mockEvent);

    vi.advanceTimersByTime(2100);

    const response = await handlerPromise;

    expect(response).toEqual({ status: "error" });
    expect(setResponseStatus).toHaveBeenCalledWith(mockEvent, 503);
    expect(alert).toHaveBeenCalledWith(
      "error",
      "Health check failed",
      expect.objectContaining({
        error: expect.stringContaining("Database timed out after 2000ms"),
      })
    );
  });

  it("BR-HLT-06: khi smoke nhận non-200 (503) từ health check, quy trình release abort và rollback", async () => {
    mockRedisSet.mockRejectedValue(new Error("READONLY You can't write"));

    const response = await handler(mockEvent);
    expect(response).toEqual({ status: "error" });
    expect(setResponseStatus).toHaveBeenCalledWith(mockEvent, 503);

    const smokeSh = fs.readFileSync(
      repoPath("infra/scripts/lib/smoke.sh"),
      "utf-8"
    );
    const releaseSh = fs.readFileSync(
      repoPath("infra/scripts/lib/cmd-release.sh"),
      "utf-8"
    );

    expect(smokeSh).toContain('= "200" ]; then');
    expect(releaseSh).toContain("if ! run_release_smoke 10 3; then");
    expect(releaseSh).toContain("mk_release_rollback_to");
  });
});
