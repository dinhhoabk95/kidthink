import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import {
  CANONICAL_THEME_CODES,
  CONTENT_THEMES,
  type SkillDataset,
} from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { buildConceptIntroPrompt } from "#src/builders/gt-000";
import { projectGT002 } from "#src/builders/gt-002";
import { projectGT004 } from "#src/builders/gt-004";
import { projectGT007 } from "#src/builders/gt-007";
import { projectGT012 } from "#src/builders/gt-012";
import { projectGT020 } from "#src/builders/gt-020";
import { buildLevelsForSkill } from "#src/builders/index";
import { resolveThemeChildhoodSetting } from "#src/builders/title-resolver";
import {
  C1_MEASURE_DIMENSION_INVENTORY,
  C1_PATTERN_UNIT_INVENTORY,
  C1_QUANTITY_REP_INVENTORY,
  countPromptWords,
  getKogumaScaffoldingHint,
  getMoetTopicForTheme,
  isChildSafePrompt,
  KOGUMA_CONCRETE_DOMAINS,
  resolveThemeContainers,
  sanitizeChildPrompt,
  VN_MOET_PRESCHOOL_TOPICS,
} from "#src/inventories/index";
import { ALL_SKILL_SEEDS } from "#src/skills/index";

const EMOJI_SPRITE_FILES = [
  "sprites.ts",
  "sprites-batch2.ts",
  "sprites-batch3a.ts",
  "sprites-batch3b.ts",
] as const;

const ROTE_EQUATION_RE = /[+=]/;

function loadVerifiedEmojiCatalogSource(): string {
  return EMOJI_SPRITE_FILES.map((file) =>
    readFileSync(repoPath(`packages/emoji/src/${file}`), "utf8")
  ).join("\n");
}

const SAMPLE_DATASET: SkillDataset = {
  skill_code: "C1.CNT.01",
  concept_label: "Đếm quả ngọt vườn quê",
  surface: "game",
  ladder: [{ rung: 1, dimension: "count", description: "1..3 vật" }],
  phrasing: { prompt_template: "Bé chạm chọn {label} nhé!" },
  items: [
    {
      id: "mango",
      label: "quả xoài",
      value: 1,
      image: { kind: "emoji", ref: "🥭" },
      contrast_group: "yellow",
    },
    {
      id: "banana",
      label: "quả chuối",
      value: 2,
      image: { kind: "emoji", ref: "🍌" },
      contrast_group: "long",
    },
    {
      id: "orange",
      label: "quả cam",
      value: 3,
      image: { kind: "emoji", ref: "🍊" },
      contrast_group: "round",
    },
    {
      id: "watermelon",
      label: "quả dưa hấu",
      value: 4,
      image: { kind: "emoji", ref: "🍉" },
      contrast_group: "green",
    },
  ],
};

describe("Sư phạm Koguma-kai (Jibutsu/Taiwa) & Văn hoá Mầm non Việt Nam", () => {
  const emojiSource = loadVerifiedEmojiCatalogSource();

  it("10 chủ đề Bộ GD&ĐT phủ trọn 16 canonical themes và 100% emoji có trong @mindkid/emoji", () => {
    expect(VN_MOET_PRESCHOOL_TOPICS).toHaveLength(10);
    const orders = VN_MOET_PRESCHOOL_TOPICS.map((t) => t.order);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const coveredThemes = new Set<string>();
    for (const topic of VN_MOET_PRESCHOOL_TOPICS) {
      expect(topic.dong_dao_rhythm.length).toBeGreaterThan(8);
      expect(topic.koguma_concrete_materials.length).toBeGreaterThan(8);
      expect(topic.manipulative_items.length).toBeGreaterThanOrEqual(4);
      expect(topic.dong_dao_rhythm.toLowerCase()).not.toContain("không");

      for (const theme of topic.canonical_themes) {
        expect(CANONICAL_THEME_CODES.has(theme)).toBe(true);
        coveredThemes.add(theme);
        expect(getMoetTopicForTheme(theme)?.code).toBe(topic.code);
        expect(resolveThemeChildhoodSetting(theme).length).toBeGreaterThan(4);
      }

      for (const item of topic.manipulative_items) {
        expect(
          emojiSource.includes(`"${item.emoji_ref}"`),
          `Emoji "${item.emoji_ref}" (${item.id}) phải tồn tại trong @mindkid/emoji`
        ).toBe(true);
      }
    }

    expect(coveredThemes.size).toBe(CONTENT_THEMES.length);
  });

  it("5 trụ cột Kuno (K1..K5) và gợi ý bắc cầu Mầm/Chồi/Lá đạt chuẩn Cổng 4", () => {
    expect(KOGUMA_CONCRETE_DOMAINS).toHaveLength(5);
    expect(KOGUMA_CONCRETE_DOMAINS.map((d) => d.kuno_pillar)).toEqual([
      "K1",
      "K2",
      "K3",
      "K4",
      "K5",
    ]);

    for (const domain of KOGUMA_CONCRETE_DOMAINS) {
      for (const group of ["mam", "choi", "la"] as const) {
        const hints = domain.scaffolding_hints[group];
        expect(hints.length).toBeGreaterThanOrEqual(2);
        for (const hint of hints) {
          expect(
            isChildSafePrompt(hint),
            `${domain.code} (${group}): ${hint}`
          ).toBe(true);
        }
      }
      expect(
        isChildSafePrompt(getKogumaScaffoldingHint(domain.code, "3-4", 0))
      ).toBe(true);
      expect(
        isChildSafePrompt(getKogumaScaffoldingHint(domain.code, "5-6", 1))
      ).toBe(true);
    }
  });

  it("Kho C1 gắn chất liệu vật thật & nhịp đồng dao Việt mà giữ nguyên kích thước bất biến", () => {
    expect(C1_QUANTITY_REP_INVENTORY).toHaveLength(8);
    for (const item of C1_QUANTITY_REP_INVENTORY) {
      expect(item.vn_manipulative_cue?.length).toBeGreaterThan(10);
    }

    expect(C1_MEASURE_DIMENSION_INVENTORY).toHaveLength(6);
    for (const item of C1_MEASURE_DIMENSION_INVENTORY) {
      expect(item.vn_concrete_pair?.length).toBeGreaterThan(10);
    }

    expect(C1_PATTERN_UNIT_INVENTORY).toHaveLength(6);
    for (const item of C1_PATTERN_UNIT_INVENTORY) {
      expect(item.vn_rhythm_example?.length).toBeGreaterThan(10);
    }
  });

  it("GT-004 dùng giỏ tre / hộp quà Việt từ @mindkid/emoji thay cho icon thư mục văn phòng", () => {
    const textOnlyDataset: SkillDataset = {
      ...SAMPLE_DATASET,
      items: [
        { id: "a", label: "Nhóm một", glyph: "1" },
        { id: "b", label: "Nhóm hai", glyph: "2" },
        { id: "c", label: "Nhóm ba", glyph: "3" },
        { id: "d", label: "Nhóm bốn", glyph: "4" },
      ],
    };

    for (const theme of CONTENT_THEMES.map((t) => t.code)) {
      const pair = resolveThemeContainers(theme);
      expect(emojiSource.includes(`"${pair.primaryEmoji}"`)).toBe(true);
      expect(emojiSource.includes(`"${pair.secondaryEmoji}"`)).toBe(true);

      const projected = projectGT004.project(textOnlyDataset, {
        band: "4-5",
        difficulty: 2,
        theme,
        seed: 17,
      });
      const serialized = JSON.stringify(projected.content_pack);
      expect(serialized).not.toContain("📁");
      expect(serialized).not.toContain("📂");
    }
  });

  it("Lời dẫn phân hoá theo lứa tuổi Mầm (3-4), Chồi (4-5), Lá (5-6)", () => {
    const introMam = buildConceptIntroPrompt("Số 1 đến 5", "3-4");
    const introChoi = buildConceptIntroPrompt("Số 1 đến 5", "4-5");
    const introLa = buildConceptIntroPrompt("Số 1 đến 5", "5-6");
    expect(new Set([introMam, introChoi, introLa]).size).toBe(3);

    const probes = [
      projectGT002,
      projectGT004,
      projectGT007,
      projectGT012,
      projectGT020,
    ];
    for (const builder of probes) {
      const prompts = (["3-4", "4-5", "5-6"] as const).map((band) => {
        const res = builder.project(SAMPLE_DATASET, {
          band,
          difficulty: 2,
          theme: "food",
          seed: 99,
        });
        const pack = res.content_pack as { readonly prompt?: string };
        return pack.prompt ?? "";
      });
      expect(new Set(prompts).size).toBe(3);
      for (const p of prompts) {
        expect(isChildSafePrompt(p)).toBe(true);
      }
    }
  });

  it("Ca âm: sanitizeChildPrompt chặn câu > 12 từ, từ phủ định 'không'/'đừng', và liên từ 'và' ở GT-001", () => {
    expect(
      isChildSafePrompt(
        "Bé hãy chú ý quan sát thật kỹ rồi đếm xem có bao nhiêu quả xoài chín nhé"
      )
    ).toBe(false);
    expect(isChildSafePrompt("Bé đừng chạm vào quả bóng nhé")).toBe(false);
    expect(isChildSafePrompt("Chọn hình không giống mẫu nhé")).toBe(false);
    expect(
      isChildSafePrompt("Bé chạm quả xoài và quả cam nhé!", {
        forbidConjunctionVa: true,
      })
    ).toBe(false);

    const sanitized = sanitizeChildPrompt(
      "Bé hãy chọn số không nhé!",
      "Bé chạm chọn đáp án đúng nhé!"
    );
    expect(sanitized).toBe("Bé hãy chọn số 0 nhé!");
  });

  it("Toàn bộ ALL_SKILL_SEEDS sinh level qua 100% content_contract, Cổng 4 (≤ 12 từ, 0 phủ định) và 0 phép tính vẹt", () => {
    let totalLevels = 0;
    const mathStoryTemplates = new Set([
      "GT-007",
      "GT-010",
      "GT-014",
      "GT-029",
      "GT-031",
    ]);

    for (const skill of ALL_SKILL_SEEDS) {
      const levels = buildLevelsForSkill(skill);
      for (const level of levels) {
        totalLevels++;
        const template = ALL_TEMPLATES[level.header.template_code];
        expect(
          template,
          `Thiếu template ${level.header.template_code}`
        ).toBeDefined();

        template?.content_contract.parse(level.content_pack);
        template?.difficulty_contract.parse(level.difficulty_params);

        const instructions = [
          level.header.instruction,
          ...(level.rounds ?? []).map((r) => r.instruction),
        ];
        for (const inst of instructions) {
          expect(
            countPromptWords(inst),
            `${level.header.code} vượt 12 từ: "${inst}"`
          ).toBeLessThanOrEqual(12);
          const lower = inst.toLowerCase();
          expect(
            lower.includes("không") ||
              lower.includes("đừng") ||
              lower.includes("chớ"),
            `${level.header.code} chứa từ phủ định: "${inst}"`
          ).toBe(false);
          expect(lower).not.toContain("lập trình");

          if (mathStoryTemplates.has(level.header.template_code)) {
            expect(
              ROTE_EQUATION_RE.test(inst),
              `${level.header.code} chứa ký hiệu phép tính vẹt: "${inst}"`
            ).toBe(false);
          }
        }
      }
    }

    expect(totalLevels).toBeGreaterThan(1000);
  });
});
