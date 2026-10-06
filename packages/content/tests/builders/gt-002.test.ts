import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { buildLevelsForSkill } from "../../src/builders/build-levels.js";
import { projectGT002 } from "../../src/builders/gt-002.js";
import { assetKey } from "../../src/builders/utils.js";
import { ALL_SKILL_SEEDS } from "../../src/skills/index.js";

const REGEX_BR_E002_04 = /\[BR-E002-04\]/;

describe("GT-002 Builder Content & Parity (Task #275 S6)", () => {
  it("S6a ca âm: dataset fixture toàn 📝 (trùng asset) ⟹ builder ném lỗi [BR-E002-04]", () => {
    const identicalDataset: SkillDataset = {
      skill_code: "C1.TEST.SAME",
      concept_label: "Tập hợp toàn hình giống nhau",
      surface: "game",
      ladder: [{ rung: 1, dimension: "test", description: "test" }],
      phrasing: { prompt_template: "Bé hãy chọn {label} nhé!" },
      items: [
        { id: "i1", label: "Ghi chú 1", glyph: "📝" },
        { id: "i2", label: "Ghi chú 2", glyph: "📝" },
        { id: "i3", label: "Ghi chú 3", glyph: "📝" },
        { id: "i4", label: "Ghi chú 4", glyph: "📝" },
      ],
    };

    expect(() =>
      projectGT002.project(identicalDataset, {
        band: "4-5",
        difficulty: 1,
        theme: "default",
        seed: 42,
      })
    ).toThrow(REGEX_BR_E002_04);
  });

  it("S6a & S6b: quét toàn bộ level GT-002 trong corpus", () => {
    let gt002LevelCount = 0;
    let gt002RoundCount = 0;

    let duplicateWithTargetRounds = 0;
    let duplicateAmongDistractorsRounds = 0;
    let promptMissingTatCaRounds = 0;
    let band45OverWmRounds = 0;
    let itemsWithAudioPath = 0;

    for (const skill of ALL_SKILL_SEEDS) {
      if (!skill.levels.some((l) => l.template === "GT-002")) {
        continue;
      }
      const levels = buildLevelsForSkill(skill);
      for (const level of levels) {
        if (level.header.template_code !== "GT-002") {
          continue;
        }
        gt002LevelCount++;
        const rounds = level.rounds ?? [];
        for (const round of rounds) {
          gt002RoundCount++;
          const cp = round.content_pack as {
            prompt: string;
            items: Array<{
              item_id: string;
              asset: Parameters<typeof assetKey>[0] & { audio_path?: string };
              is_correct: boolean;
            }>;
          };
          const dp = round.difficulty_params as { target_count: number };
          const items = cp.items;
          const targets = items.filter((i) => i.is_correct);
          const distractors = items.filter((i) => !i.is_correct);

          // Kiểm tra S6a: distractor không trùng target
          const targetKeys = new Set(targets.map((t) => assetKey(t.asset)));
          const distractorKeys = distractors.map((d) => assetKey(d.asset));
          if (distractorKeys.some((k) => targetKeys.has(k))) {
            duplicateWithTargetRounds++;
          }

          // Kiểm tra S6a: distractor không trùng nhau từng đôi
          const uniqueDistractorKeys = new Set(distractorKeys);
          if (uniqueDistractorKeys.size < distractorKeys.length) {
            duplicateAmongDistractorsRounds++;
          }

          // Kiểm tra S6b: prompt chứa "tất cả"
          if (!cp.prompt.includes("tất cả")) {
            promptMissingTatCaRounds++;
          }

          // Kiểm tra S6b: band 4-5 target_count <= 3
          if (level.header.age_max <= 5 && dp.target_count > 3) {
            band45OverWmRounds++;
          }

          // Kiểm tra S6c: item có audio_path
          for (const item of items) {
            if (item.asset.audio_path) {
              itemsWithAudioPath++;
            }
          }
        }
      }
    }

    expect(gt002LevelCount).toBe(486);
    expect(gt002RoundCount).toBe(486 * 3);
    expect(itemsWithAudioPath).toBeGreaterThan(0);

    // Các điều kiện nghiệm thu:
    expect(duplicateWithTargetRounds, "M2: distractor trùng asset đáp án").toBe(
      0
    );
    expect(
      duplicateAmongDistractorsRounds,
      "M3: distractor trùng lặp nhau"
    ).toBe(0);
    expect(promptMissingTatCaRounds, "M4: câu dẫn không chứa 'tất cả'").toBe(0);
    expect(
      band45OverWmRounds,
      "M5: band 4-5 vượt quá working memory target_count > 3"
    ).toBe(0);
  });
});
