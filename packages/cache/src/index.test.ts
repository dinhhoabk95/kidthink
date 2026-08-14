import { afterAll, describe, expect, it } from "vitest";
import { disconnect, ping } from "./index.js";

describe("packages/cache", () => {
  afterAll(async () => {
    await disconnect();
  });

  it("ping() returns boolean when checked", async () => {
    const isUp = await ping();
    expect(typeof isUp).toBe("boolean");
  });

  it("ping() returns false in <= 2s when Valkey is down", async () => {
    const start = Date.now();
    const isUp = await ping("redis://localhost:9999");
    const end = Date.now();

    expect(isUp).toBe(false);
    expect(end - start).toBeLessThanOrEqual(2100);
  });
});
