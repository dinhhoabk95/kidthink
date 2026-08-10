import { TIER_ORDER } from "@kidthink/shared";
import { describe, expect, it } from "vitest";
import { accessTierEnum } from "../../src/schema/game";

describe("BR-LAD-01: access_tier enum and TIER_ORDER match contract", () => {
  it("DB accessTierEnum has four tiers in exact order: free < login < standard < premium", () => {
    expect(accessTierEnum.enumValues).toEqual([
      "free",
      "login",
      "standard",
      "premium",
    ]);
  });

  it("TIER_ORDER from shared matches DB accessTierEnum enumValues", () => {
    expect(TIER_ORDER).toEqual(accessTierEnum.enumValues);
  });
});
