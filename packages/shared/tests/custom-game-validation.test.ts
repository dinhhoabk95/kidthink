import { describe, expect, it } from "vitest";
import {
  type CustomGameValidationInput,
  extractEmojiRefsFromContentPack,
  validateCustomGameContent,
} from "#src/index";

describe("Custom Game Validation (BR-CGB-01..10, BR-GLM-01..10)", () => {
  const validGT001: CustomGameValidationInput = {
    template_code: "GT-001",
    title: "Tìm quả táo đỏ",
    instruction: "Bé hãy chọn quả táo màu đỏ nhé",
    theme_id: "farm",
    age_min: 3,
    age_max: 4,
    content_pack: {
      prompt: "Quả nào màu đỏ?",
      target_item: {
        item_id: "target_apple",
        asset: { kind: "emoji", ref: "EMJ-red-apple" },
      },
      options: [
        {
          item_id: "opt_apple",
          asset: { kind: "emoji", ref: "EMJ-red-apple" },
          is_correct: true,
        },
        {
          item_id: "opt_banana",
          asset: { kind: "emoji", ref: "EMJ-banana" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      hint_after_ms: 8000,
      allow_retry: true,
      shuffle_items: true,
    },
  };

  const validGT002: CustomGameValidationInput = {
    template_code: "GT-002",
    title: "Chọn các loại trái cây",
    instruction: "Bé hãy chọn tất cả các loại quả",
    theme_id: "farm",
    age_min: 4,
    age_max: 5,
    content_pack: {
      prompt: "Chọn các loại quả",
      target_criterion: "fruit",
      items: [
        {
          item_id: "i1",
          asset: { kind: "emoji", ref: "EMJ-red-apple" },
          is_correct: true,
        },
        {
          item_id: "i2",
          asset: { kind: "emoji", ref: "EMJ-banana" },
          is_correct: true,
        },
        {
          item_id: "i3",
          asset: { kind: "emoji", ref: "EMJ-orange" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  };

  const validGT003: CustomGameValidationInput = {
    template_code: "GT-003",
    title: "Kéo hoa vào giỏ",
    instruction: "Bé kéo bông hoa vào trong giỏ nhé",
    theme_id: "farm",
    age_min: 3,
    age_max: 4,
    content_pack: {
      prompt: "Bỏ hoa vào giỏ",
      container: {
        container_id: "c1",
        label: "Giỏ hoa",
        accepts_attribute: "flower",
      },
      items: [
        {
          item_id: "i1",
          attribute: "flower",
          asset: { kind: "emoji", ref: "EMJ-sunflower" },
          is_correct: true,
        },
        {
          item_id: "i2",
          attribute: "leaf",
          asset: { kind: "emoji", ref: "EMJ-rose" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 1,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  };

  const validGT004: CustomGameValidationInput = {
    template_code: "GT-004",
    title: "Phân loại động vật và thực vật",
    instruction: "Bé phân loại vào đúng hai nhóm",
    theme_id: "farm",
    age_min: 4,
    age_max: 6,
    content_pack: {
      prompt: "Phân loại động vật và cây",
      groups: [
        { group_id: "g1", label: "Động vật", label_emoji: "EMJ-cat" },
        { group_id: "g2", label: "Thực vật", label_emoji: "EMJ-red-apple" },
      ],
      items: [
        {
          item_id: "i1",
          asset: { kind: "emoji", ref: "EMJ-cat" },
          correct_group_id: "g1",
        },
        {
          item_id: "i2",
          asset: { kind: "emoji", ref: "EMJ-dog" },
          correct_group_id: "g1",
        },
        {
          item_id: "i3",
          asset: { kind: "emoji", ref: "EMJ-red-apple" },
          correct_group_id: "g2",
        },
        {
          item_id: "i4",
          asset: { kind: "emoji", ref: "EMJ-banana" },
          correct_group_id: "g2",
        },
      ],
    },
    difficulty_params: {
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  };

  const validGT005: CustomGameValidationInput = {
    template_code: "GT-005",
    title: "Ghép đôi con vật giống nhau",
    instruction: "Bé hãy tìm hai con vật giống nhau",
    theme_id: "farm",
    age_min: 3,
    age_max: 4,
    content_pack: {
      prompt: "Ghép cặp giống nhau",
      pairs: [
        {
          pair_id: "p1",
          left: {
            item_id: "l1",
            asset: { kind: "emoji", ref: "EMJ-cat" },
          },
          right: {
            item_id: "r1",
            asset: { kind: "emoji", ref: "EMJ-cat" },
          },
        },
        {
          pair_id: "p2",
          left: {
            item_id: "l2",
            asset: { kind: "emoji", ref: "EMJ-dog" },
          },
          right: {
            item_id: "r2",
            asset: { kind: "emoji", ref: "EMJ-dog" },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_sides: true,
    },
  };

  const validGT006: CustomGameValidationInput = {
    template_code: "GT-006",
    title: "Sắp xếp thứ tự các loài chim",
    instruction: "Bé xếp các bước theo thứ tự",
    theme_id: "farm",
    age_min: 5,
    age_max: 6,
    content_pack: {
      prompt: "Xếp thứ tự theo thứ tự đúng",
      sequence: [
        {
          step_id: "s1",
          order_index: 0,
          asset: { kind: "emoji", ref: "EMJ-bird" },
          label: "Chim nhỏ",
        },
        {
          step_id: "s2",
          order_index: 1,
          asset: { kind: "emoji", ref: "EMJ-dove" },
          label: "Bồ câu",
        },
        {
          step_id: "s3",
          order_index: 2,
          asset: { kind: "emoji", ref: "EMJ-penguin" },
          label: "Cánh cụt",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  };

  it("Scenario: BR-CGB-03 & BR-CGB-07 — all 6 MVP templates pass validation cleanly", () => {
    expect(validateCustomGameContent(validGT001).ok).toBe(true);
    expect(validateCustomGameContent(validGT002).ok).toBe(true);
    expect(validateCustomGameContent(validGT003).ok).toBe(true);
    expect(validateCustomGameContent(validGT004).ok).toBe(true);
    expect(validateCustomGameContent(validGT005).ok).toBe(true);
    expect(validateCustomGameContent(validGT006).ok).toBe(true);
  });

  it("Scenario: BR-CGB-07 — rejects non-MVP template codes", () => {
    const invalidTemplate: CustomGameValidationInput = {
      ...validGT001,
      template_code: "GT-099",
    };
    const res = validateCustomGameContent(invalidTemplate);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("template_not_supported");
  });

  it("Scenario: BR-CGB-05 — rejects when content_pack lacks correct answer", () => {
    const noCorrect: CustomGameValidationInput = {
      ...validGT001,
      content_pack: {
        ...validGT001.content_pack,
        options: [
          {
            item_id: "opt_apple",
            asset: { kind: "emoji", ref: "EMJ-apple" },
            is_correct: false,
          },
          {
            item_id: "opt_banana",
            asset: { kind: "emoji", ref: "EMJ-banana" },
            is_correct: false,
          },
        ],
      },
    };
    const res = validateCustomGameContent(noCorrect);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("no_correct_answer");
  });

  it("Scenario: BR-CGB-10 & BR-GLM-02 — rejects when item count exceeds age band limit", () => {
    // Age band 3-4 limit is max 4 items
    const tooManyItems: CustomGameValidationInput = {
      ...validGT001,
      age_min: 3,
      age_max: 4,
      content_pack: {
        ...validGT001.content_pack,
        options: [
          {
            item_id: "1",
            asset: { kind: "emoji", ref: "EMJ-apple" },
            is_correct: true,
          },
          {
            item_id: "2",
            asset: { kind: "emoji", ref: "EMJ-banana" },
            is_correct: false,
          },
          {
            item_id: "3",
            asset: { kind: "emoji", ref: "EMJ-orange" },
            is_correct: false,
          },
          {
            item_id: "4",
            asset: { kind: "emoji", ref: "EMJ-lemon" },
            is_correct: false,
          },
          {
            item_id: "5",
            asset: { kind: "emoji", ref: "EMJ-grapes" },
            is_correct: false,
          },
        ],
      },
    };
    const res = validateCustomGameContent(tooManyItems);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("item_count_exceeds_band_limit");
  });

  it("Scenario: BR-CGB-10 & BR-GLM-04 — rejects instruction exceeding 12 words", () => {
    const longInstruction: CustomGameValidationInput = {
      ...validGT001,
      instruction:
        "Bé hãy quan sát thật kỹ các hình ảnh dưới đây và nhanh tay chọn ra hình quả táo màu đỏ tươi nhé",
    };
    const res = validateCustomGameContent(longInstruction);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("instruction_too_long");
  });

  it("Scenario: BR-CGB-10 & BR-GLM-05 — rejects negative phrasing in instructions ('đừng', 'không')", () => {
    const negativeInstruction: CustomGameValidationInput = {
      ...validGT001,
      instruction: "Bé đừng chọn quả chuối màu vàng nhé",
    };
    const res = validateCustomGameContent(negativeInstruction);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("content_moderation_failed");
  });

  it("Scenario: BR-CGB-04 — rejects emojis not in emoji registry", () => {
    const fakeEmoji: CustomGameValidationInput = {
      ...validGT001,
      content_pack: {
        ...validGT001.content_pack,
        options: [
          {
            item_id: "opt_apple",
            asset: { kind: "emoji", ref: "EMJ-superman-fake-123" },
            is_correct: true,
          },
          {
            item_id: "opt_banana",
            asset: { kind: "emoji", ref: "EMJ-banana" },
            is_correct: false,
          },
        ],
      },
    };
    const res = validateCustomGameContent(fakeEmoji);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("invalid_emoji_ref");
  });

  it("Scenario: BR-CGB-09 — blocks violent or prohibited words in title/instruction", () => {
    const violentGame: CustomGameValidationInput = {
      ...validGT001,
      title: "Trò chơi bắn súng diệt ma",
    };
    const res = validateCustomGameContent(violentGame);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("content_moderation_failed");
  });

  it("extractEmojiRefsFromContentPack correctly finds nested emojis across structures", () => {
    const refs = extractEmojiRefsFromContentPack(validGT004.content_pack);
    expect(refs).toContain("EMJ-cat");
    expect(refs).toContain("EMJ-dog");
    expect(refs).toContain("EMJ-red-apple");
    expect(refs).toContain("EMJ-banana");
  });

  it("ensures exactly ONE definition of CUSTOM_GAME_TEMPLATE_CODES exists in monorepo (WP115.0)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { REPO_ROOT } = await import("@mindkid/config/paths");

    const pattern = /export\s+const\s+CUSTOM_GAME_TEMPLATE_CODES\s*=/g;
    const searchDirs = ["packages", "apps"];
    let matchCount = 0;
    const matches: string[] = [];

    function walk(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (
          entry.name === "node_modules" ||
          entry.name === "dist" ||
          entry.name === ".nuxt" ||
          entry.name === ".output"
        ) {
          continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".ts") ||
            entry.name.endsWith(".vue") ||
            entry.name.endsWith(".js"))
        ) {
          const content = fs.readFileSync(fullPath, "utf-8");
          if (pattern.test(content)) {
            matchCount++;
            matches.push(path.relative(REPO_ROOT, fullPath));
          }
        }
      }
    }

    for (const d of searchDirs) {
      walk(path.join(REPO_ROOT, d));
    }

    expect(
      matchCount,
      `Found multiple definitions in: ${matches.join(", ")}`
    ).toBe(1);
    expect(matches).toEqual(["packages/shared/src/custom-game.ts"]);
  });
});
