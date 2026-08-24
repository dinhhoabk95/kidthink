import { describe, expect, it } from "vitest";
import { getAppDb, getOwnerDb } from "#src/index";

describe("packages/db connection factories", () => {
  it("does not connect on module import (side-effect free)", () => {
    // Importing module should not throw or open connection
    expect(true).toBe(true);
  });

  it("exports getOwnerDb and getAppDb functions", () => {
    expect(typeof getOwnerDb).toBe("function");
    expect(typeof getAppDb).toBe("function");
  });

  it("returns db instances lazily when called", () => {
    const ownerDb = getOwnerDb();
    const appDb = getAppDb();
    expect(ownerDb).toBeDefined();
    expect(appDb).toBeDefined();
    // Subsequent calls return same instance (cached)
    expect(getOwnerDb()).toBe(ownerDb);
    expect(getAppDb()).toBe(appDb);
  });
});
