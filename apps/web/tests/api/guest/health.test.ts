import { createEvent, type H3Event } from "h3";
import { describe, expect, it, vi } from "vitest";

vi.mock("@mindkid/db", () => ({ getOwnerDb: vi.fn() }));
vi.mock("@mindkid/cache", () => ({ ping: vi.fn() }));
vi.mock("@mindkid/queue", () => ({ getWaitingCount: vi.fn(), alert: vi.fn() }));
vi.mock("@mindkid/auth", () => ({ getAuthRedisClient: vi.fn() }));

import { getAuthRedisClient } from "@mindkid/auth";
import { ping } from "@mindkid/cache";
import { getOwnerDb } from "@mindkid/db";
import { getWaitingCount } from "@mindkid/queue";
import getHandler from "#server/api/guest/health.get";
import headHandler from "#server/api/guest/health.head";

function makeEvent(method: string): H3Event {
  const req = {
    method,
    url: "/api/guest/health",
    headers: { host: "mindkid.test" },
    socket: { remoteAddress: "127.0.0.1" },
  };
  const res = {
    headers: new Map<string, string>(),
    getHeader() {
      return undefined;
    },
    setHeader() {
      return undefined;
    },
    statusCode: 200,
  };
  return createEvent(req as never, res as never);
}

describe("BR-HLT-07 — health công khai chỉ là liveness nông", () => {
  it("GET trả 200 {status:ok} mà không chạm DB, cache, auth DO hay queue", async () => {
    const body = await getHandler(makeEvent("GET"));
    expect(body).toEqual({ status: "ok" });
    expect(getOwnerDb).not.toHaveBeenCalled();
    expect(ping).not.toHaveBeenCalled();
    expect(getAuthRedisClient).not.toHaveBeenCalled();
    expect(getWaitingCount).not.toHaveBeenCalled();
  });

  it("HEAD trả 200 không body và cũng không chạm dịch vụ nào", async () => {
    const result = await headHandler(makeEvent("HEAD"));
    expect(result).toBe("");
    expect(getOwnerDb).not.toHaveBeenCalled();
    expect(getAuthRedisClient).not.toHaveBeenCalled();
  });
});
