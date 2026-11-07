import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it } from "vitest";
import { pickContrast } from "#src/generators/contrast";
import { ALL_LEVEL_GENERATORS } from "#src/generators/index";
import type { ThemeVocabulary } from "#src/generators/types";
import { createRng } from "#src/rng/mulberry32";
import { GT006Session } from "#src/templates/GT-006/session";
import { GT006ContentSchema } from "#src/templates/GT-006/template";

/**
 * Bộ sinh thoái hoá (Task #313 Phase 4): mỗi ca chứng minh một cách bài không
 * còn đòi suy nghĩ — xáo ra đúng sẵn, mọi seed cùng một bài, tham số độ khó
 * không đổi. Đo trên vốn từ chủ đề thật, nhiều seed.
 */

const SEEDS = Array.from({ length: 40 }, (_, i) => 100 + i * 7919);

const ALL_VOCAB = CONTENT_THEMES.map((theme) => ({
  theme: theme.code,
  label_vi: theme.label_vi,
  icon_emoji_ref: theme.icon_emoji_ref,
  nouns: theme.nouns.map((n) => ({
    emoji_ref: n.emoji_ref,
    label_vi: n.text_vi,
  })),
}));

function vocabularyFor(code: string): ThemeVocabulary {
  const base = ALL_VOCAB.find((v) => v.theme === code) ?? ALL_VOCAB[0];
  if (!base) {
    throw new Error("Không có vốn từ");
  }
  return { ...base, contrast: pickContrast(base, ALL_VOCAB) };
}

function gen(engine: string, seed: number, band: "3-4" | "4-5" | "5-6") {
  const generator = ALL_LEVEL_GENERATORS[engine];
  if (!generator) {
    throw new Error(`Không có generator ${engine}`);
  }
  return generator.generate({
    rng: createRng(seed),
    age_band: band,
    theme: "school",
    vocabulary: vocabularyFor("school"),
  });
}

describe("GT-006 — thứ tự có nội dung, xáo không ra đúng sẵn (BR-E006-02, BR-E006-04)", () => {
  it("phiên không bao giờ bắt đầu ở thứ tự đã đúng khi shuffle_initial bật", () => {
    const content = GT006ContentSchema.parse(
      gen("GT-006", 1, "5-6").content_pack
    );
    for (let layoutSeed = 1; layoutSeed <= 300; layoutSeed++) {
      const session = new GT006Session(
        content,
        { hint_after_ms: 15_000, allow_retry: true, shuffle_initial: true },
        layoutSeed
      );
      session.setupEntities();
      const target = content.sequence
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((s) => s.step_id);
      expect(
        session.getCurrentSequence(),
        `layoutSeed=${layoutSeed}`
      ).not.toEqual(target);
    }
  });

  it("bộ sinh dùng trục số đếm tăng dần liên tiếp, thứ tự duy nhất không tranh cãi", () => {
    for (const seed of SEEDS) {
      const content = GT006ContentSchema.parse(
        gen("GT-006", seed, "5-6").content_pack
      );
      const refs = content.sequence
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((s) => (s.asset.kind === "emoji" ? s.asset.ref : ""));
      const digits = refs.map((r) => Number.parseInt(r, 10));
      expect(
        digits.every((d) => Number.isInteger(d)),
        `seed=${seed}`
      ).toBe(true);
      digits.forEach((d, i) => {
        if (i > 0) {
          expect(d).toBe((digits[i - 1] ?? 0) + 1);
        }
      });
    }
  });

  it("độ dài chuỗi và số bắt đầu thay đổi giữa các seed", () => {
    const lengths = new Set<number>();
    const starts = new Set<string>();
    for (const seed of SEEDS) {
      const content = GT006ContentSchema.parse(
        gen("GT-006", seed, "5-6").content_pack
      );
      lengths.add(content.sequence.length);
      const first = content.sequence.find((s) => s.order_index === 0);
      starts.add(first?.asset.kind === "emoji" ? first.asset.ref : "");
    }
    expect(lengths.size).toBeGreaterThan(1);
    expect(starts.size).toBeGreaterThan(1);
  });
});
