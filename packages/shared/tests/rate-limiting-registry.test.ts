import { describe, expect, it } from "vitest";
import {
  calculateProgressiveLockoutSeconds,
  getRouteClassConfig,
  RATE_LIMIT_CONFIGS,
} from "../src/rate-limiting.js";

describe("Rate Limiting Registry (Task 6 / BR-RTL-01..05)", () => {
  it("defines exactly 12 route classes matching spec §7", () => {
    const keys = Object.keys(RATE_LIMIT_CONFIGS);
    expect(keys).toHaveLength(12);
  });

  it("auth and payment route classes failMode is 'closed'", () => {
    expect(RATE_LIMIT_CONFIGS["auth:login"].failMode).toBe("closed");
    expect(RATE_LIMIT_CONFIGS["auth:register"].failMode).toBe("closed");
    expect(RATE_LIMIT_CONFIGS["auth:forgot-password"].failMode).toBe("closed");
    expect(RATE_LIMIT_CONFIGS["auth:refresh"].failMode).toBe("closed");
    expect(RATE_LIMIT_CONFIGS["payment:create"].failMode).toBe("closed");
    expect(RATE_LIMIT_CONFIGS["payment:proof"].failMode).toBe("closed");
  });

  it("non-auth/payment route classes failMode is 'open'", () => {
    expect(RATE_LIMIT_CONFIGS["upload:image"].failMode).toBe("open");
    expect(RATE_LIMIT_CONFIGS["export:data"].failMode).toBe("open");
    expect(RATE_LIMIT_CONFIGS["play:events"].failMode).toBe("open");
    expect(RATE_LIMIT_CONFIGS.search.failMode).toBe("open");
    expect(RATE_LIMIT_CONFIGS["read:public"].failMode).toBe("open");
    expect(RATE_LIMIT_CONFIGS["managers:*"].failMode).toBe("open");
  });

  it("getRouteClassConfig throws error for unregistered route class (no unlimited fallback)", () => {
    expect(() => getRouteClassConfig("unknown:route")).toThrow(
      "BR-RTL-01 error: Route class 'unknown:route' is not defined"
    );
  });

  it("calculateProgressiveLockoutSeconds increases correctly (BR-RTL-05)", () => {
    expect(calculateProgressiveLockoutSeconds(4)).toBe(0);
    expect(calculateProgressiveLockoutSeconds(5)).toBe(60); // 1 min
    expect(calculateProgressiveLockoutSeconds(9)).toBe(60);
    expect(calculateProgressiveLockoutSeconds(10)).toBe(300); // 5 min
    expect(calculateProgressiveLockoutSeconds(14)).toBe(300);
    expect(calculateProgressiveLockoutSeconds(15)).toBe(1800); // 30 min
    expect(calculateProgressiveLockoutSeconds(20)).toBe(1800);
  });
});
