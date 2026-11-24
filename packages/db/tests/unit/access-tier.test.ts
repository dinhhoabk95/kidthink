import { TIER_ORDER } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  ACCESS_TIER_CODEC,
  ACCESS_TIER_VALUES,
} from "#src/constants/learning-enums";

describe("BR-LAD-01: access_tier constants and TIER_ORDER match contract", () => {
  it("DB ACCESS_TIER_VALUES uses tinyint codes [1..4] and ACCESS_TIER_CODEC.labels matches exact tier order", () => {
    expect(ACCESS_TIER_VALUES).toEqual([1, 2, 3, 4]);
    expect(ACCESS_TIER_CODEC.labels).toEqual([
      "free",
      "login",
      "standard",
      "premium",
    ]);
  });

  it("TIER_ORDER from shared matches DB ACCESS_TIER_CODEC.labels and round-trips cleanly", () => {
    expect(TIER_ORDER).toEqual(ACCESS_TIER_CODEC.labels);
    for (const label of ACCESS_TIER_CODEC.labels) {
      const code = ACCESS_TIER_CODEC.toCode(label);
      expect(ACCESS_TIER_CODEC.toLabel(code)).toBe(label);
    }
  });
});
