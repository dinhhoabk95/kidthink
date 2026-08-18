import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before importing the handler
vi.mock("h3", () => ({
  defineEventHandler: (handler: any) => handler,
  setHeader: vi.fn(),
  setResponseStatus: vi.fn(),
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
import handler from "../../../server/api/guest/health.get.ts";

describe("Health Check API", () => {
  let mockEvent: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Ca âm BR-HLT-04: body không có version, hostname, chuỗi kết nối", async () => {
    (getOwnerDb as any).mockReturnValue({
      execute: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
    });
    (ping as any).mockResolvedValue(true);
    (getWaitingCount as any).mockResolvedValue(0);

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
  });

  it("Ca âm BR-HLT-01: tắt PostgreSQL → 503, không phải 200, phát alert", async () => {
    (getOwnerDb as any).mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error("Connection refused")),
    });
    (ping as any).mockResolvedValue(true);
    (getWaitingCount as any).mockResolvedValue(0);

    const response = await handler(mockEvent);

    expect(response).toEqual({ status: "error" });
    expect(setResponseStatus).toHaveBeenCalledWith(mockEvent, 503);

    expect(alert).toHaveBeenCalledWith(
      "error",
      "Health check failed",
      expect.any(Object)
    );
  });

  it("Timeout if dependencies take more than 2s", async () => {
    vi.useFakeTimers();

    (getOwnerDb as any).mockReturnValue({
      execute: vi.fn().mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      ),
    });
    (ping as any).mockResolvedValue(true);
    (getWaitingCount as any).mockResolvedValue(0);

    const handlerPromise = handler(mockEvent);

    // Fast-forward 2 seconds to trigger timeout
    vi.advanceTimersByTime(2100);

    const response = await handlerPromise;

    expect(response).toEqual({ status: "error" });
    expect(setResponseStatus).toHaveBeenCalledWith(mockEvent, 503);
    expect(alert).toHaveBeenCalledWith(
      "error",
      "Health check failed",
      expect.objectContaining({
        error: expect.stringContaining("Database timed out"),
      })
    );
  });
});
