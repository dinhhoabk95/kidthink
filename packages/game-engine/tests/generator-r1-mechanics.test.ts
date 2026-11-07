import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import {
  type LabelledVocabulary,
  pickContrast,
} from "#src/generators/contrast";
import { ALL_LEVEL_GENERATORS } from "#src/generators/index";
import type { ThemeVocabulary } from "#src/generators/types";
import { createRng } from "#src/rng/mulberry32";
import { GT007ContentSchema } from "#src/templates/GT-007/template";
import { GT022ContentSchema } from "#src/templates/GT-022/template";

/**
 * Cơ chế mới của Task #313 (kéo kẹo GT-007, lớp che GT-022) phải tới được nội
 * dung sinh máy — không thì chỉ fixture chơi được, corpus thật vẫn là bài cũ.
 */

const SEEDS = Array.from({ length: 16 }, (_, i) => 2000 + i * 7919);

const ALL_VOCAB: LabelledVocabulary[] = CONTENT_THEMES.map((t) => ({
  theme: t.code,
  label_vi: t.label_vi,
  icon_emoji_ref: t.icon_emoji_ref,
  nouns: t.nouns.map((n) => ({ emoji_ref: n.emoji_ref, label_vi: n.text_vi })),
}));

function vocabulary(): ThemeVocabulary {
  const base = ALL_VOCAB[0];
  if (!base) {
    throw new Error("Thiếu vốn từ chủ đề");
  }
  return { ...base, contrast: pickContrast(base, ALL_VOCAB) };
}

function generate(engine: string, seed: number, ageBand: AgeBand): object {
  const gen = ALL_LEVEL_GENERATORS[engine];
  const vocab = vocabulary();
  if (!gen) {
    throw new Error(`Không có generator ${engine}`);
  }
  return gen.generate({
    rng: createRng(seed),
    age_band: ageBand,
    theme: vocab.theme,
    vocabulary: vocab,
  }).content_pack;
}

describe("generator GT-007: band 4-5 chơi bằng vật thật (BR-E007-06, BR-EBD-12)", () => {
  it("band 4-5 sinh representation discrete-object, band 5-6 giữ numeral", () => {
    for (const seed of SEEDS) {
      const young = GT007ContentSchema.parse(generate("GT-007", seed, "4-5"));
      const old = GT007ContentSchema.parse(generate("GT-007", seed, "5-6"));
      expect(young.representation).toBe("discrete-object");
      expect(old.representation).toBe("numeral");
    }
  });

  it("đề của level vật thật nói việc chia vật, không nói tìm số", () => {
    const content = GT007ContentSchema.parse(
      generate("GT-007", SEEDS[0] ?? 1, "4-5")
    );
    expect(content.prompt).not.toContain("số");
  });
});

describe("generator GT-022: đích nấp sau một vật che (BR-E022-08)", () => {
  it("đích có occluded_by trỏ tới một vật không phải đích, vật che không bị che", () => {
    for (const seed of SEEDS) {
      const content = GT022ContentSchema.parse(generate("GT-022", seed, "5-6"));
      const target = content.scene_objects.find((o) => o.is_target);
      const cover = content.scene_objects.find(
        (o) => o.id === target?.occluded_by
      );
      expect(cover).toBeDefined();
      expect(cover?.is_target).toBe(false);
      expect(cover?.occluded_by).toBeUndefined();
    }
  });
});
