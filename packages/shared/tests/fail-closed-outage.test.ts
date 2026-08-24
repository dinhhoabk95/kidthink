import { checkRateLimit, clearInMemoryBuckets } from "@mindkid/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { enforceTwoAxisRateLimit } from "#src/rate-limit-middleware";

vi.mock("@mindkid/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/cache")>();
  return {
    ...actual,
    checkRateLimit: vi.fn((key: string, limit: number, windowSeconds: number) =>
      actual.checkRateLimit(key, limit, windowSeconds)
    ),
  };
});

describe("Rate Limiter Fail-Closed / Fail-Open Outage (Task 10 / BR-RTL-02 & BR-RTL-06)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Ca âm BR-RTL-02: Valkey outage on auth:login returns 503 SERVICE_UNAVAILABLE (fail closed)", async () => {
    vi.mocked(checkRateLimit).mockImplementationOnce(() => {
      throw new Error("Valkey connection refused");
    });

    const res = await enforceTwoAxisRateLimit({
      routeClass: "auth:login",
      remoteIp: "127.0.0.1",
      accountIdentifier: "test@example.com",
    });

    expect(res.statusCode).toBe(503);
    expect(res.body?.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("Valkey outage on play:events returns 200 (fail open)", async () => {
    vi.mocked(checkRateLimit).mockImplementationOnce(() => {
      throw new Error("Valkey connection refused");
    });

    const res = await enforceTwoAxisRateLimit({
      routeClass: "play:events",
      remoteIp: "127.0.0.1",
      accountIdentifier: "child_session_1",
    });

    expect(res.statusCode).toBe(200);
  });

  it("BR-RTL-06: 30-minute play session sending regular telemetry events is not rate limited", async () => {
    clearInMemoryBuckets();
    const sessionId = "session_play_30min";

    // 100 events every 10 min window (limit is 300) -> total 300 events
    for (let i = 1; i <= 250; i++) {
      const res = await enforceTwoAxisRateLimit({
        routeClass: "play:events",
        remoteIp: "127.0.0.1",
        accountIdentifier: sessionId,
      });
      expect(res.statusCode).toBe(200);
    }
  });
});
