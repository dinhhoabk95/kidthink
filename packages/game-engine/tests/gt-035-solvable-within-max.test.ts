import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it } from "vitest";
import { pickContrast } from "#src/generators/contrast";
import { ALL_LEVEL_GENERATORS } from "#src/generators/index";
import { createRng } from "#src/rng/mulberry32";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import {
  type GT035Content,
  GT035ContentSchema,
  GT035DifficultySchema,
  isSolvableWithinMaxCommands,
} from "#src/templates/GT-035/template";

const SEEDS = Array.from({ length: 24 }, (_, i) => 1000 + i * 7919);

/** Robot ở (0,0) hướng phải, đích (3,0): cần ≥ 3 lệnh forward (hoặc loop). */
const STRAIGHT: GT035Content = GT035ContentSchema.parse({
  prompt: "Bé đưa robot về đích nhé!",
  grid: { rows: 3, cols: 4 },
  start: { col: 0, row: 0, facing: "right" },
  goal: { col: 3, row: 0, asset: { kind: "emoji", ref: "⭐" } },
  obstacles: [],
  collectibles: [],
  allowed_commands: ["forward", "turn_left", "turn_right"],
});

describe("GT-035: lời giải phải nằm trong max_commands của độ khó", () => {
  it("max_commands quá nhỏ cho đường đi ngắn nhất → không giải được", () => {
    expect(isSolvableWithinMaxCommands(STRAIGHT, 2)).toBe(false);
  });

  it("max_commands đủ cho đường đi ngắn nhất → giải được", () => {
    expect(isSolvableWithinMaxCommands(STRAIGHT, 3)).toBe(true);
  });

  it("mọi fixture giải được trong max_commands của chính nó", () => {
    for (const f of GT035_FIXTURES) {
      expect(
        isSolvableWithinMaxCommands(f.content, f.difficulty.max_commands),
        f.id
      ).toBe(true);
    }
  });

  it("level do generator sinh luôn giải được trong max_commands", () => {
    const gen = ALL_LEVEL_GENERATORS["GT-035"];
    if (!gen) {
      throw new Error("Không có generator GT-035");
    }
    const themes = CONTENT_THEMES.map((t) => ({
      theme: t.code,
      label_vi: t.label_vi,
      icon_emoji_ref: t.icon_emoji_ref,
      nouns: t.nouns.map((n) => ({
        emoji_ref: n.emoji_ref,
        label_vi: n.text_vi,
      })),
    }));
    const base = themes[0];
    if (!base) {
      throw new Error("Không có chủ đề");
    }
    for (const seed of SEEDS) {
      const level = gen.generate({
        rng: createRng(seed),
        age_band: gen.axes.age_band[0] ?? "5-6",
        theme: base.theme,
        vocabulary: { ...base, contrast: pickContrast(base, themes) },
      });
      const content = GT035ContentSchema.parse(level.content_pack);
      const difficulty = GT035DifficultySchema.parse(level.difficulty_params);
      expect(
        isSolvableWithinMaxCommands(content, difficulty.max_commands),
        `seed ${seed}`
      ).toBe(true);
    }
  });
});
