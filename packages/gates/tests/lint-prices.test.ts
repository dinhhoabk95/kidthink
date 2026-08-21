import { describe, expect, it } from "vitest";
import { runPriceGate, scanSourceForPrices } from "../src/lint-prices.ts";

describe("Task 5: lint-prices gate (BR-PKG-02)", () => {
  it("allows price defined in entitlement-catalog.ts", () => {
    const source = "export const PENDING_PRICE_VND = 0; const price = 990000;";
    const findings = scanSourceForPrices(
      source,
      "packages/shared/src/entitlement-catalog.ts"
    );
    expect(findings).toEqual([]);
  });

  it("detects hardcoded price 990000 in normal application source file (RED ca âm)", () => {
    const source = "const buyPrice = 990000;";
    const findings = scanSourceForPrices(source, "apps/web/pages/checkout.vue");
    expect(findings).toHaveLength(1);
    expect(findings[0].value).toBe("990000");
  });

  it("detects price_vnd = 490000 in API handler", () => {
    const source = "const payload = { price_vnd: 490000 };";
    const findings = scanSourceForPrices(source, "apps/web/server/api/pay.ts");
    expect(findings).toHaveLength(1);
  });
});

describe("Cổng lint:prices trên repo thật (BR-PKG-02)", () => {
  it("không có giá viết cứng ngoài catalog", () => {
    expect(runPriceGate()).toEqual([]);
  });
});
