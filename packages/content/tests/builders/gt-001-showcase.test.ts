import { GT001ContentSchema } from "@mindkid/game-engine/contracts";
import { describe, expect, it } from "vitest";
import { buildLevelsForSkill } from "#src/builders/build-levels";
import { ALL_SKILL_SEEDS } from "#src/skills/index";

describe("GT-001 — Thẻ Ngữ Cảnh Thông Minh & CPA trên toàn bộ corpus (BR-E001-06..07)", () => {
  it("toàn bộ level GT-001 sinh từ kho kỹ năng đạt GT001ContentSchema và 0 vòng lộ trần đáp án ở L0", () => {
    let gt001LevelCount = 0;
    let gt001RoundCount = 0;
    const seenModes = new Set<string>();

    for (const seed of ALL_SKILL_SEEDS) {
      const hasGt001 = seed.levels.some((lvl) => lvl.template === "GT-001");
      if (!hasGt001) {
        continue;
      }
      const builtLevels = buildLevelsForSkill(seed).filter(
        (lvl) => lvl.header.template_code === "GT-001"
      );

      for (const level of builtLevels) {
        gt001LevelCount += 1;
        for (const round of level.rounds ?? []) {
          gt001RoundCount += 1;
          const parsed = GT001ContentSchema.safeParse(round.content_pack);
          expect(
            parsed.success,
            `Level ${level.header.code} parse lỗi: ${
              parsed.success ? "" : parsed.error.message
            }`
          ).toBe(true);
          if (!parsed.success) {
            continue;
          }
          expect(parsed.data.showcase).toBeDefined();
          if (parsed.data.showcase) {
            seenModes.add(parsed.data.showcase.mode);
          }
          expect(
            parsed.data.options.every((opt) => typeof opt.label === "string")
          ).toBe(true);
        }
      }
    }

    expect(gt001LevelCount).toBeGreaterThanOrEqual(550);
    expect(gt001RoundCount).toBeGreaterThanOrEqual(1500);
    expect(seenModes.has("cpa_bridge")).toBe(true);
    expect(seenModes.has("comparison_anchor")).toBe(true);
    expect(seenModes.has("silhouette_clue")).toBe(true);
    expect(seenModes.has("story_riddle")).toBe(true);
  });
});
