import { GT002ContentSchema } from "@mindkid/game-engine/contracts";
import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { buildLevelsForSkill } from "#src/builders/build-levels";
import { projectGT002 } from "#src/builders/gt-002";
import { assetKey, countPromptWords } from "#src/builders/utils";
import { ALL_SKILL_SEEDS } from "#src/skills/index";

const REGEX_BR_E002_04 = /\[BR-E002-04\]/;

describe("GT-002 Builder — Đa cá thể cùng thuộc tính & Biểu diễn tư duy (Task #318)", () => {
  it("ca âm [BR-E002-04]: dataset toàn asset trùng lặp ném lỗi rõ ràng", () => {
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

  it("đa cá thể cùng thuộc tính: chọn các đáp án đúng khác asset (🍎, 🍓, 🍒) thay vì nhân bản vô tính", () => {
    const redFruitDataset: SkillDataset = {
      skill_code: "C3.CLS.01",
      concept_label: "Phân loại quả màu đỏ",
      surface: "game",
      ladder: [{ rung: 2, dimension: "color", description: "màu sắc" }],
      phrasing: { prompt_template: "Bé hãy chọn {label} nhé!" },
      items: [
        {
          id: "apple",
          label: "quả táo đỏ",
          image: { kind: "emoji", ref: "🍎" },
          category: { type: "quả màu đỏ", color: "đỏ" },
          contrast_group: "red",
        },
        {
          id: "strawberry",
          label: "quả dâu đỏ",
          image: { kind: "emoji", ref: "🍓" },
          category: { type: "quả màu đỏ", color: "đỏ" },
          contrast_group: "red",
        },
        {
          id: "cherry",
          label: "quả anh đào đỏ",
          image: { kind: "emoji", ref: "🍒" },
          category: { type: "quả màu đỏ", color: "đỏ" },
          contrast_group: "red",
        },
        {
          id: "banana",
          label: "quả chuối vàng",
          image: { kind: "emoji", ref: "🍌" },
          category: { type: "quả màu vàng", color: "vàng" },
          contrast_group: "yellow",
        },
        {
          id: "lemon",
          label: "quả chanh vàng",
          image: { kind: "emoji", ref: "🍋" },
          category: { type: "quả màu vàng", color: "vàng" },
          contrast_group: "yellow",
        },
        {
          id: "pear",
          label: "quả lê xanh",
          image: { kind: "emoji", ref: "🍐" },
          category: { type: "quả màu xanh", color: "xanh lá" },
          contrast_group: "green",
        },
      ],
    };

    const projected = projectGT002.project(redFruitDataset, {
      band: "4-5",
      difficulty: 3,
      theme: "food",
      seed: 101,
    });
    const cp = GT002ContentSchema.parse(projected.content_pack);
    const targets = cp.items.filter((i) => i.is_correct);
    const distractors = cp.items.filter((i) => !i.is_correct);

    const targetKeys = new Set(targets.map((t) => assetKey(t.asset)));
    expect(targets.length).toBe(3);
    expect(targetKeys.size).toBe(3);
    expect(targetKeys).toEqual(new Set(["emoji:🍎", "emoji:🍓", "emoji:🍒"]));
    expect(cp.prompt).toContain("quả màu đỏ");
    expect(distractors.every((d) => !targetKeys.has(assetKey(d.asset)))).toBe(
      true
    );
  });

  it("lọc đúng nhóm mục tiêu khớp tên skill (C1.CMP.11 'Nhẹ hơn' không bốc nhầm voi/xe tải nặng)", () => {
    const lightSkill = ALL_SKILL_SEEDS.find(
      (s) => s.identity?.code === "C1.CMP.11"
    );
    expect(lightSkill).toBeDefined();
    if (!lightSkill) {
      return;
    }

    for (let roundIdx = 0; roundIdx < 3; roundIdx++) {
      const projected = projectGT002.project(lightSkill.dataset, {
        band: "4-5",
        difficulty: 2,
        theme: "nature",
        seed: 77,
        round_index: roundIdx,
      });
      const cp = GT002ContentSchema.parse(projected.content_pack);
      expect(cp.prompt.toLowerCase()).toContain("nhẹ");
      expect(cp.criterion_anchor?.kind).toBe("size_compare");
      if (cp.criterion_anchor?.kind === "size_compare") {
        expect(cp.criterion_anchor.relation).toBe("lighter");
        expect(cp.criterion_anchor.reference_asset).toBeDefined();
      }
      const targets = cp.items.filter((i) => i.is_correct);
      expect(new Set(targets.map((t) => assetKey(t.asset))).size).toBe(
        targets.length
      );
      expect(targets.every((t) => Boolean(t.label))).toBe(true);
    }
  });

  it("bật preserve_order cho C2.ORI / C2.GRD và đặt đúng vị trí không gian (giữa vs góc)", () => {
    const middleSkill = ALL_SKILL_SEEDS.find(
      (s) => s.identity?.code === "C2.ORI.09"
    );
    const cornerSkill = ALL_SKILL_SEEDS.find(
      (s) => s.identity?.code === "C2.ORI.10"
    );
    const gridSkill = ALL_SKILL_SEEDS.find(
      (s) => s.identity?.code === "C2.GRD.01"
    );
    expect(middleSkill && cornerSkill && gridSkill).toBeDefined();
    if (!(middleSkill && cornerSkill && gridSkill)) {
      return;
    }

    const middlePack = projectGT002.project(middleSkill.dataset, {
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      seed: 12,
    }).content_pack;
    expect(middlePack.preserve_order).toBe(true);
    expect(middlePack.items[0]?.is_correct).toBe(false);
    expect(middlePack.items.at(-1)?.is_correct).toBe(false);

    const cornerPack = projectGT002.project(cornerSkill.dataset, {
      band: "4-5",
      difficulty: 2,
      theme: "home",
      seed: 12,
    }).content_pack;
    expect(cornerPack.preserve_order).toBe(true);
    expect(cornerPack.items[0]?.is_correct).toBe(true);
    expect(cornerPack.items.at(-1)?.is_correct).toBe(true);

    const gridPack = projectGT002.project(gridSkill.dataset, {
      band: "4-5",
      difficulty: 2,
      theme: "school",
      seed: 12,
    }).content_pack;
    expect(gridPack.preserve_order).toBe(true);
  });

  it("gắn mặt thẻ kép secondary_asset cho C5 (BR-EBD-12) và representation CPA cho C1", () => {
    const c5Skill = ALL_SKILL_SEEDS.find(
      (s) => s.identity?.code === "C5.LET.02"
    );
    expect(c5Skill).toBeDefined();
    if (c5Skill) {
      const c5Pack = projectGT002.project(c5Skill.dataset, {
        band: "4-5",
        difficulty: 2,
        theme: "school",
        seed: 25,
      }).content_pack;
      expect(c5Pack.criterion_anchor?.kind).toBe("phonics");
      expect(c5Pack.items.every((i) => i.asset.kind === "text")).toBe(true);
      expect(
        c5Pack.items.every((i) => i.secondary_asset?.kind === "emoji")
      ).toBe(true);
    }

    const c1AddSkill = ALL_SKILL_SEEDS.find(
      (s) => s.identity?.code === "C1.ADD.01"
    );
    expect(c1AddSkill).toBeDefined();
    if (c1AddSkill) {
      const c1Pack = projectGT002.project(c1AddSkill.dataset, {
        band: "4-5",
        difficulty: 3,
        theme: "food",
        seed: 33,
        representation: "ten-frame",
      }).content_pack;
      expect(
        c1Pack.items.some((i) => i.representation?.kind === "ten-frame")
      ).toBe(true);
    }

    const conjunctionSkill = ALL_SKILL_SEEDS.find(
      (s) => s.identity?.code === "C3.CLS.06"
    );
    expect(conjunctionSkill).toBeDefined();
    if (conjunctionSkill) {
      const conjPack = projectGT002.project(conjunctionSkill.dataset, {
        band: "5-6",
        difficulty: 2,
        theme: "art",
        seed: 19,
      }).content_pack;
      expect(conjPack.criterion_anchor?.kind).toBe("conjunction");
    }
  });

  it("quét toàn bộ corpus GT-002: BR-E002-03, BR-E002-04, Cổng 4, đa cá thể & criterion_anchor 100%", () => {
    let gt002LevelCount = 0;
    let gt002RoundCount = 0;
    let multiDistinctCorrectLevels = 0;
    let criterionAnchorLevels = 0;
    let secondaryAssetLevels = 0;
    let representationLevels = 0;
    let preserveOrderLevels = 0;

    let duplicateWithTargetRounds = 0;
    let duplicateAmongDistractorsRounds = 0;
    let promptMissingTatCaRounds = 0;
    let promptOverWordLimitRounds = 0;
    let band45OverWmRounds = 0;
    let band56OverWmRounds = 0;
    let band45NegatedAnchorRounds = 0;
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
        const topPack = GT002ContentSchema.parse(level.content_pack);
        const topTargets = topPack.items.filter((i) => i.is_correct);
        if (new Set(topTargets.map((t) => assetKey(t.asset))).size >= 2) {
          multiDistinctCorrectLevels++;
        }
        if (topPack.criterion_anchor) {
          criterionAnchorLevels++;
        }
        if (topPack.items.some((i) => Boolean(i.secondary_asset))) {
          secondaryAssetLevels++;
        }
        if (topPack.items.some((i) => Boolean(i.representation))) {
          representationLevels++;
        }
        if (topPack.preserve_order === true) {
          preserveOrderLevels++;
        }

        for (const round of level.rounds ?? []) {
          gt002RoundCount++;
          const cp = GT002ContentSchema.parse(round.content_pack);
          const dp = round.difficulty_params as { target_count: number };
          const targets = cp.items.filter((i) => i.is_correct);
          const distractors = cp.items.filter((i) => !i.is_correct);

          const targetKeys = new Set(targets.map((t) => assetKey(t.asset)));
          const distractorKeys = distractors.map((d) => assetKey(d.asset));
          if (distractorKeys.some((k) => targetKeys.has(k))) {
            duplicateWithTargetRounds++;
          }
          if (new Set(distractorKeys).size < distractorKeys.length) {
            duplicateAmongDistractorsRounds++;
          }
          if (!cp.prompt.includes("tất cả")) {
            promptMissingTatCaRounds++;
          }
          if (countPromptWords(cp.prompt) > 12) {
            promptOverWordLimitRounds++;
          }
          if (level.header.age_max <= 5 && dp.target_count > 3) {
            band45OverWmRounds++;
          }
          if (dp.target_count > 4 || targets.length !== dp.target_count) {
            band56OverWmRounds++;
          }
          if (
            level.header.age_max <= 5 &&
            cp.criterion_anchor?.negated === true
          ) {
            band45NegatedAnchorRounds++;
          }
          for (const item of cp.items) {
            if ("audio_path" in item.asset && item.asset.audio_path) {
              itemsWithAudioPath++;
            }
          }
        }
      }
    }

    expect(gt002LevelCount).toBe(196);
    expect(gt002RoundCount).toBe(gt002LevelCount * 3);
    expect(multiDistinctCorrectLevels).toBeGreaterThanOrEqual(180);
    expect(criterionAnchorLevels).toBe(gt002LevelCount);
    expect(secondaryAssetLevels).toBeGreaterThanOrEqual(30);
    expect(representationLevels).toBeGreaterThanOrEqual(3);
    expect(preserveOrderLevels).toBe(3);
    expect(itemsWithAudioPath).toBeGreaterThan(0);

    expect(duplicateWithTargetRounds).toBe(0);
    expect(duplicateAmongDistractorsRounds).toBe(0);
    expect(promptMissingTatCaRounds).toBe(0);
    expect(promptOverWordLimitRounds).toBe(0);
    expect(band45OverWmRounds).toBe(0);
    expect(band56OverWmRounds).toBe(0);
    expect(band45NegatedAnchorRounds).toBe(0);
  });
});
