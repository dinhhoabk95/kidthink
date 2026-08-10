import { describe, expect, it } from "vitest";
import {
  allowedTiers,
  getEffectiveTier,
  TIER_ORDER,
} from "../src/access-ladder.js";

describe("Task 6: access_tier and allowedTiers (BR-LAD-01, BR-LAD-02, BR-LAD-05)", () => {
  it("TIER_ORDER has four tiers: free < login < standard < premium", () => {
    expect(TIER_ORDER).toEqual(["free", "login", "standard", "premium"]);
  });

  it("guest returns ['free']", async () => {
    const tiers = await allowedTiers({ kind: "guest" });
    expect(tiers).toEqual(["free"]);
  });

  it("user with active_child_id and no paid keys gets ['free', 'login']", async () => {
    const tiers = await allowedTiers(
      { kind: "user", user_id: "usr_1", active_child_id: "chd_1" },
      []
    );
    expect(tiers).toEqual(["free", "login"]);
  });

  it("user without active_child_id and no paid keys gets ['free']", async () => {
    const tiers = await allowedTiers(
      { kind: "user", user_id: "usr_1", active_child_id: null },
      []
    );
    expect(tiers).toEqual(["free"]);
  });

  it("user with play_standard_games gets ['free', 'login', 'standard']", async () => {
    const tiers = await allowedTiers(
      { kind: "user", user_id: "usr_1", active_child_id: "chd_1" },
      ["play_standard_games"]
    );
    expect(tiers).toEqual(["free", "login", "standard"]);
  });

  it("user with play_premium_games gets ['free', 'login', 'standard', 'premium']", async () => {
    const tiers = await allowedTiers(
      { kind: "user", user_id: "usr_1", active_child_id: "chd_1" },
      ["play_premium_games"]
    );
    expect(tiers).toEqual(["free", "login", "standard", "premium"]);
  });

  it("BR-LAD-02: content missing access_tier resolves to premium", () => {
    expect(getEffectiveTier(null, null)).toBe("premium");
    expect(getEffectiveTier(undefined, undefined)).toBe("premium");
  });

  it("BR-LAD-05: effective tier is max(level, curriculum)", () => {
    expect(getEffectiveTier("free", "standard")).toBe("standard");
    expect(getEffectiveTier("premium", "login")).toBe("premium");
    expect(getEffectiveTier("standard", "standard")).toBe("standard");
  });
});
