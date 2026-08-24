import { describe, expect, it } from "vitest";
import {
  checkBundleBudget,
  checkWebpImageBudget,
  K6_HEALTH_CONFIG,
  PERFORMANCE_BUDGETS,
} from "#src/lint-perf-budget";

const ERR_PRF_01 = /BR-PRF-01 Error/;
const ERR_PRF_08 = /BR-PRF-08 Error/;

describe("Task 6: Performance Budgets & Gate Checks (BR-PRF-01, BR-PRF-02, BR-PRF-08, D-FB, D-FC)", () => {
  it("defines §7.1 performance budgets dataset correctly", () => {
    expect(PERFORMANCE_BUDGETS.appShellGzipMaxKb).toBe(180);
    expect(PERFORMANCE_BUDGETS.gameTemplateGzipMaxKb).toBe(80);
    expect(PERFORMANCE_BUDGETS.levelConfigPayloadMaxKb).toBe(200);
    expect(PERFORMANCE_BUDGETS.assetImageWebpMaxKb).toBe(120);
    expect(PERFORMANCE_BUDGETS.publicPageTotalGzipMaxKb).toBe(500);
  });

  it("BR-PRF-01: valid bundle sizes pass cleanly", () => {
    expect(checkBundleBudget(150, "appShell")).toBe(true);
    expect(checkBundleBudget(75, "gameTemplate")).toBe(true);
    expect(checkBundleBudget(190, "levelConfig")).toBe(true);
    expect(checkBundleBudget(450, "publicPage")).toBe(true);
  });

  it("D-FC Negative Test: dependency pushing app shell to 195KB throws BR-PRF-01 error and blocks merge", () => {
    expect(() => checkBundleBudget(195, "appShell")).toThrow(ERR_PRF_01);
  });

  it("BR-PRF-02: target device and 4G throttle configuration", () => {
    expect(PERFORMANCE_BUDGETS.deviceTarget).toContain("Lenovo Tab M8");
    expect(PERFORMANCE_BUDGETS.deviceTarget).toContain("4G Throttle");
    expect(PERFORMANCE_BUDGETS.lcpMaxSeconds).toBe(2.5);
    expect(PERFORMANCE_BUDGETS.clsMaxScore).toBe(0.1);
  });

  it("BR-PRF-08: validates WebP image format, size <= 120KB, and <= 960x960 dimensions", () => {
    const validImage = {
      name: "hero.webp",
      format: "webp",
      sizeKb: 85,
      dimensions: { width: 800, height: 600 },
    };
    expect(checkWebpImageBudget(validImage)).toBe(true);

    // Negative tests: wrong format, oversized byte size, or oversized dimensions
    expect(() =>
      checkWebpImageBudget({ ...validImage, format: "png" })
    ).toThrow(ERR_PRF_08);

    expect(() => checkWebpImageBudget({ ...validImage, sizeKb: 140 })).toThrow(
      ERR_PRF_08
    );

    expect(() =>
      checkWebpImageBudget({
        ...validImage,
        dimensions: { width: 1200, height: 800 },
      })
    ).toThrow(ERR_PRF_08);
  });

  it("k6 configuration for API P95 < 800ms on /health endpoint", () => {
    expect(K6_HEALTH_CONFIG.endpoint).toBe("/health");
    expect(K6_HEALTH_CONFIG.options.thresholds.http_req_duration).toEqual([
      "p(95)<800",
    ]);
  });
});
