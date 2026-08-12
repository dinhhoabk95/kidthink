import { describe, expect, it } from "vitest";
import { calculateProgressiveLockoutSeconds } from "../src/rate-limiting.js";

describe("Progressive Login Lockout (Task 9 / BR-RTL-05)", () => {
  it("computes 0 seconds lock for 1 to 4 failed attempts", () => {
    for (let attempts = 0; attempts <= 4; attempts++) {
      expect(calculateProgressiveLockoutSeconds(attempts)).toBe(0);
    }
  });

  it("computes 60 seconds (1 min) lock for 5 to 9 failed attempts", () => {
    for (let attempts = 5; attempts <= 9; attempts++) {
      expect(calculateProgressiveLockoutSeconds(attempts)).toBe(60);
    }
  });

  it("computes 300 seconds (5 min) lock for 10 to 14 failed attempts", () => {
    for (let attempts = 10; attempts <= 14; attempts++) {
      expect(calculateProgressiveLockoutSeconds(attempts)).toBe(300);
    }
  });

  it("computes 1800 seconds (30 min) lock for 15+ failed attempts", () => {
    for (let attempts = 15; attempts <= 30; attempts += 5) {
      expect(calculateProgressiveLockoutSeconds(attempts)).toBe(1800);
    }
  });

  it("BR-RTL-05: never returns Infinity or permanent lock", () => {
    const lock = calculateProgressiveLockoutSeconds(100);
    expect(Number.isFinite(lock)).toBe(true);
    expect(lock).toBe(1800);
  });
});
