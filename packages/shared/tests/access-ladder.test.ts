import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  allowedTiers,
  GUEST_ALLOWLIST_LEVEL_CODES,
  getEffectiveTier,
  isGuestAllowedLevel,
  TIER_ORDER,
} from "#src/access-ladder";
import { FEATURED_GUEST_LEVELS } from "#src/public-seo";

const ROOT = resolve(import.meta.dirname, "../../..");
const DIFFICULTY_REGEX = /difficulty:\s*(\d+)/;

const ALLOWLIST_CORPUS_FILES: Readonly<Record<string, string>> = {
  "GL-C1-CNT-CARD-0001": "packages/content/src/skills/c1/cnt/C1.CNT.01.ts",
  "GL-C2-SHP-CARD-0001": "packages/content/src/skills/c2/geo/C2.GEO.01.ts",
  "GL-C3-PAT-CARD-0001": "packages/content/src/skills/c3/seq/C3.SEQ.01.ts",
  "GL-C4-OBS-CARD-0001": "packages/content/src/skills/c4/vis/C4.VIS.03.ts",
  "GL-C5-STO-CARD-0001": "packages/content/src/skills/c5/sto/C5.STO.01.ts",
  "GL-C6-MEM-CARD-0001": "packages/content/src/skills/c6/wm/C6.WM.03.ts",
};

describe("Task 6: access_tier and allowedTiers (BR-LAD-01, BR-LAD-02, BR-LAD-05, BR-LAD-07)", () => {
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

  it("BR-LAD-07: guest allow-list has exact 6 levels, 1 per competency C1-C6, difficulty <= 2, and exists in seeded corpus", () => {
    expect(GUEST_ALLOWLIST_LEVEL_CODES).toHaveLength(6);
    expect(FEATURED_GUEST_LEVELS).toHaveLength(6);

    const competencies = new Set(
      FEATURED_GUEST_LEVELS.map((item) => item.competency)
    );
    expect([...competencies].sort()).toEqual([
      "C1",
      "C2",
      "C3",
      "C4",
      "C5",
      "C6",
    ]);

    for (const code of GUEST_ALLOWLIST_LEVEL_CODES) {
      expect(isGuestAllowedLevel(code)).toBe(true);
      const relPath = ALLOWLIST_CORPUS_FILES[code];
      expect(relPath, `Missing corpus mapping for ${code}`).toBeDefined();
      const source = readFileSync(resolve(ROOT, relPath ?? ""), "utf8");
      expect(source).toContain(`code: "${code}"`);

      const idx = source.indexOf(`code: "${code}"`);
      const block = source.slice(idx, idx + 220);
      const diffMatch = block.match(DIFFICULTY_REGEX);
      const difficulty = Number(diffMatch?.[1] ?? 99);
      expect(difficulty).toBeLessThanOrEqual(2);
    }

    expect(isGuestAllowedLevel("GL-C1-CNT-CARD-0002")).toBe(false);
  });

  it("BR-LAD-07: getEffectiveTier keeps free for allow-listed level on guest, elevates non-allow-listed free level to login for guest", () => {
    expect(
      getEffectiveTier("free", null, {
        code: "GL-C1-CNT-CARD-0001",
        callerKind: "guest",
      })
    ).toBe("free");

    expect(
      getEffectiveTier("free", null, {
        code: "GL-C1-CNT-CARD-0002",
        callerKind: "guest",
      })
    ).toBe("login");

    expect(
      getEffectiveTier("free", null, {
        code: "GL-C1-CNT-CARD-0002",
        callerKind: "user",
      })
    ).toBe("free");
  });
});
