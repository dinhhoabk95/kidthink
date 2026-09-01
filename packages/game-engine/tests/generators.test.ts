import { describe, expect, it } from "vitest";
import { EMOJI_REF_PATTERN, EmojiRef } from "#src/contracts/shared-fields";
import { GT001Generator } from "#src/generators/gt001";
import { GT010Generator } from "#src/generators/gt010";
import { GT028Generator } from "#src/generators/gt028";
import { GT029Generator } from "#src/generators/gt029";
import { GT030Generator } from "#src/generators/gt030";
import { GT031Generator } from "#src/generators/gt031";
import { GT032Generator } from "#src/generators/gt032";
import { GT033Generator } from "#src/generators/gt033";
import { GT034Generator } from "#src/generators/gt034";
import { GT035Generator } from "#src/generators/gt035";
import { getNouns } from "#src/generators/helpers";
import type { ThemeVocabulary } from "#src/generators/types";
import { createRng } from "#src/rng/mulberry32";
import type {
  GT028Content,
  GT028Difficulty,
} from "#src/templates/GT-028/template";
import {
  type GT029Content,
  GT029ContentSchema,
  type GT029Difficulty,
  GT029DifficultySchema,
} from "#src/templates/GT-029/template";
import {
  type GT030Content,
  GT030ContentSchema,
  type GT030Difficulty,
  GT030DifficultySchema,
} from "#src/templates/GT-030/template";
import {
  canFormTargetAmount,
  type GT031Content,
  GT031ContentSchema,
  type GT031Difficulty,
  GT031DifficultySchema,
} from "#src/templates/GT-031/template";
import {
  type GT032Content,
  GT032ContentSchema,
  type GT032Difficulty,
  GT032DifficultySchema,
} from "#src/templates/GT-032/template";
import {
  type GT033Content,
  GT033ContentSchema,
  type GT033Difficulty,
  GT033DifficultySchema,
} from "#src/templates/GT-033/template";
import {
  type GT034Content,
  GT034ContentSchema,
  type GT034Difficulty,
  GT034DifficultySchema,
} from "#src/templates/GT-034/template";
import {
  type GT035Content,
  GT035ContentSchema,
  type GT035Difficulty,
  GT035DifficultySchema,
} from "#src/templates/GT-035/template";

const SHORT_POOL_RE = /thiếu danh từ/;
const THEME_RE = /school/;
const HAVE_RE = /5/;
const NEED_RE = /10/;

function vocab(count: number): ThemeVocabulary {
  return {
    theme: "school",
    nouns: Array.from({ length: count }, (_, i) => ({
      emoji_ref: `EMJ-noun-${i}`,
      label_vi: `Danh từ ${i}`,
    })),
  };
}

describe("getNouns — kho từ thiếu là lỗi dữ liệu, không phải điều kiện runtime", () => {
  it("trả đúng kho khi đủ số lượng", () => {
    expect(getNouns(vocab(10), 6)).toHaveLength(10);
  });

  it("ca âm: kho ngắn hơn yêu cầu thì NÉM, Cấm — NEVER độn thêm từ ngoài chủ đề", () => {
    // Bản cũ độn từ `FALLBACK_NOUNS` (toàn hoa quả). Vì mọi chủ đề chỉ có 5
    // danh từ còn generator xin 6–10, nhánh độn là đường đi MẶC ĐỊNH: cả 21
    // file sinh ra đều dính emoji lạc chủ đề, trong khi header vẫn đóng dấu
    // `theme_tag` của chủ đề gốc.
    expect(() => getNouns(vocab(5), 10)).toThrow(SHORT_POOL_RE);
  });

  it("thông điệp lỗi nêu đủ chủ đề, số có và số cần", () => {
    expect(() => getNouns(vocab(5), 10)).toThrow(THEME_RE);
    expect(() => getNouns(vocab(5), 10)).toThrow(HAVE_RE);
    expect(() => getNouns(vocab(5), 10)).toThrow(NEED_RE);
  });
});

describe("EMOJI_REF_PATTERN — mã, không phải glyph (BR-CTR-08)", () => {
  it("nhận mã EMJ-*", () => {
    expect(EMOJI_REF_PATTERN.test("EMJ-red-apple")).toBe(true);
    expect(EMOJI_REF_PATTERN.test("EMJ-jack-o-lantern")).toBe(true);
  });

  it("ca âm: glyph thô và mã sai khuôn đều bị từ chối", () => {
    // `packages/emoji/src/query.ts` chỉ tra theo mã `EMJ-*`, nên một glyph thô
    // resolve ra `not_found` lúc render — quá muộn để ai đó nhìn thấy.
    expect(EMOJI_REF_PATTERN.test("🍎")).toBe(false);
    expect(EMOJI_REF_PATTERN.test("emj-red-apple")).toBe(false);
    expect(EMOJI_REF_PATTERN.test("EMJ-")).toBe(false);
  });

  it("contract ĐÃ siết: glyph thô bị `EmojiRef` từ chối", () => {
    // Trước 2026-08-30 trường này nhận chuỗi bất kỳ vì nợ quá lớn để chặn tại
    // contract: 57 trên 228 level seed dùng glyph, cộng fixture của 27 template
    // và các test engine. Nợ được đo bằng một bậc thang riêng ở
    // `packages/db/tests/gates/emoji-ref-debt.test.ts`.
    //
    // Task 162 dọn hết và bổ sung 23 emoji còn thiếu vào registry, nên chỗ
    // chặn đúng đắn quay lại đây: một glyph lọt qua contract sẽ `not_found`
    // lúc render, và trẻ thấy ô trống.
    expect(EmojiRef.safeParse("🍎").success).toBe(false);
    expect(EmojiRef.safeParse("EMJ-red-apple").success).toBe(true);
  });
});

describe("GT-010 — đáp án phải phân biệt được (BR-ECD-01)", () => {
  const themeVocab = vocab(10);

  it("ca âm: Cấm — NEVER có hai lựa chọn cùng giá trị", () => {
    // Bản cũ rút `valA` và `valB` từ hai khoảng chồng nhau mà không loại trừ,
    // nên 7 trên 9 level đã commit có hai ô hiện cùng một số và chỉ một ô được
    // chấm đúng. Trẻ chạm ô kia là sai, dù nhìn y hệt.
    for (let seed = 1; seed <= 200; seed++) {
      const { content_pack } = GT010Generator.generate({
        rng: createRng(seed),
        age_band: "4-5",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: { options: { value: number }[] } };

      const values = content_pack.options.map((o) => o.value);
      expect(
        new Set(values).size,
        `seed ${seed} sinh lựa chọn trùng: ${values.join(",")}`
      ).toBe(values.length);
    }
  });

  it("luôn có đúng một đáp án đúng", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { content_pack } = GT010Generator.generate({
        rng: createRng(seed),
        age_band: "4-5",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: { options: { is_correct: boolean }[] } };

      expect(content_pack.options.filter((o) => o.is_correct)).toHaveLength(1);
    }
  });
});

describe("GT-028 — generator contract conformity", () => {
  const themeVocab = vocab(10);

  it("generates valid levels for all supported age bands across seeds", () => {
    for (const age_band of ["4-5", "5-6"] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const { content_pack, difficulty_params } = GT028Generator.generate({
          rng: createRng(seed),
          age_band,
          theme: "school",
          vocabulary: themeVocab,
        }) as {
          content_pack: GT028Content;
          difficulty_params: GT028Difficulty;
        };

        expect(content_pack.target_total % content_pack.step).toBe(0);
        expect(
          content_pack.items.length * content_pack.step
        ).toBeGreaterThanOrEqual(content_pack.target_total);
        expect(difficulty_params.step).toBe(content_pack.step);
      }
    }
  });
});

describe("GT-029 — generator contract conformity", () => {
  const themeVocab = vocab(10);

  it("generates valid levels for all supported age bands across seeds", () => {
    for (const age_band of ["4-5", "5-6"] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const { content_pack, difficulty_params } = GT029Generator.generate({
          rng: createRng(seed),
          age_band,
          theme: "school",
          vocabulary: themeVocab,
        }) as {
          content_pack: GT029Content;
          difficulty_params: GT029Difficulty;
        };

        const parsedContent = GT029ContentSchema.parse(content_pack);
        const parsedDiff = GT029DifficultySchema.parse(difficulty_params);
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();

        expect(content_pack.remove_count).toBeLessThan(
          content_pack.initial_items.length
        );
        const correctOpt = content_pack.answer_options.find(
          (o) => o.is_correct
        );
        expect(correctOpt).toBeDefined();
        expect(correctOpt?.value).toBe(
          content_pack.initial_items.length - content_pack.remove_count
        );
      }
    }
  });
});

describe("GT-030 — generator contract conformity", () => {
  const themeVocab = vocab(10);

  it("generates valid levels for age band 5-6 across seeds", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { content_pack, difficulty_params } = GT030Generator.generate({
        rng: createRng(seed),
        age_band: "5-6",
        theme: "school",
        vocabulary: themeVocab,
      }) as {
        content_pack: GT030Content;
        difficulty_params: GT030Difficulty;
      };

      const parsedContent = GT030ContentSchema.parse(content_pack);
      const parsedDiff = GT030DifficultySchema.parse(difficulty_params);
      expect(parsedContent).toBeDefined();
      expect(parsedDiff).toBeDefined();

      const correctOpt = content_pack.answer_options.find((o) => o.is_correct);
      expect(correctOpt).toBeDefined();
      expect(correctOpt?.value).toBe(content_pack.object.length_in_units);
    }
  });
});

describe("GT-031 — generator contract conformity", () => {
  const themeVocab = vocab(10);

  it("generates valid levels for age band 5-6 across seeds", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { content_pack, difficulty_params } = GT031Generator.generate({
        rng: createRng(seed),
        age_band: "5-6",
        theme: "school",
        vocabulary: themeVocab,
      }) as {
        content_pack: GT031Content;
        difficulty_params: GT031Difficulty;
      };

      const parsedContent = GT031ContentSchema.parse(content_pack);
      const parsedDiff = GT031DifficultySchema.parse(difficulty_params);
      expect(parsedContent).toBeDefined();
      expect(parsedDiff).toBeDefined();

      const coinValues = content_pack.coins.map((c) => c.value);
      expect(canFormTargetAmount(coinValues, content_pack.target_amount)).toBe(
        true
      );
    }
  });
});

describe("GT-032 — generator contract conformity", () => {
  const themeVocab = vocab(10);

  it("generates valid levels for age band 5-6 across seeds", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { content_pack, difficulty_params } = GT032Generator.generate({
        rng: createRng(seed),
        age_band: "5-6",
        theme: "school",
        vocabulary: themeVocab,
      }) as {
        content_pack: GT032Content;
        difficulty_params: GT032Difficulty;
      };

      const parsedContent = GT032ContentSchema.parse(content_pack);
      const parsedDiff = GT032DifficultySchema.parse(difficulty_params);
      expect(parsedContent).toBeDefined();
      expect(parsedDiff).toBeDefined();

      expect(
        content_pack.cups.every((cup) => cup.fill_units <= cup.capacity_units)
      ).toBe(true);

      if (content_pack.conservation_trap) {
        const hasValidTrap = content_pack.cups.some((c1, i) =>
          content_pack.cups
            .slice(i + 1)
            .some(
              (c2) => c1.fill_units === c2.fill_units && c1.shape !== c2.shape
            )
        );
        expect(hasValidTrap).toBe(true);
      }
    }
  });
});

describe("GT-033 — generator contract conformity", () => {
  const themeVocab = vocab(10);

  it("generates valid levels for age band 5-6 across seeds", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { content_pack, difficulty_params } = GT033Generator.generate({
        rng: createRng(seed),
        age_band: "5-6",
        theme: "school",
        vocabulary: themeVocab,
      }) as {
        content_pack: GT033Content;
        difficulty_params: GT033Difficulty;
      };

      const parsedContent = GT033ContentSchema.parse(content_pack);
      const parsedDiff = GT033DifficultySchema.parse(difficulty_params);
      expect(parsedContent).toBeDefined();
      expect(parsedDiff).toBeDefined();

      expect(content_pack.cells.length).toBe(
        content_pack.grid.rows * content_pack.grid.cols
      );
      expect(content_pack.cells.some((c) => c === null)).toBe(true);
      expect(content_pack.solution?.length).toBe(
        content_pack.grid.rows * content_pack.grid.cols
      );
    }
  });
});

describe("GT-034 — generator contract conformity", () => {
  const themeVocab = vocab(10);

  it("generates valid beat sequence levels with repeating motifs across seeds", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { content_pack, difficulty_params } = GT034Generator.generate({
        rng: createRng(seed),
        age_band: "5-6",
        theme: "art",
        vocabulary: themeVocab,
      }) as {
        content_pack: GT034Content;
        difficulty_params: GT034Difficulty;
      };

      const parsedContent = GT034ContentSchema.parse(content_pack);
      const parsedDiff = GT034DifficultySchema.parse(difficulty_params);
      expect(parsedContent).toBeDefined();
      expect(parsedDiff).toBeDefined();

      expect(content_pack.target_pattern.length).toBeGreaterThanOrEqual(4);
      expect(content_pack.instruments.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("generates valid command sequence levels with solvable paths across seeds", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { content_pack, difficulty_params } = GT035Generator.generate({
        rng: createRng(seed),
        age_band: "5-6",
        theme: "space",
        vocabulary: themeVocab,
      }) as {
        content_pack: GT035Content;
        difficulty_params: GT035Difficulty;
      };

      const parsedContent = GT035ContentSchema.parse(content_pack);
      const parsedDiff = GT035DifficultySchema.parse(difficulty_params);
      expect(parsedContent).toBeDefined();
      expect(parsedDiff).toBeDefined();

      expect(content_pack.grid.rows).toBeGreaterThanOrEqual(3);
      expect(content_pack.grid.cols).toBeGreaterThanOrEqual(3);
      expect(content_pack.allowed_commands.length).toBeGreaterThanOrEqual(3);
    }
  });

  describe("WP167.7: escalation_step support across rounds", () => {
    it("escalation_step = 0 yields identical output to undefined", () => {
      const rng1 = createRng(12_345);
      const rng2 = createRng(12_345);
      const resWithout = GT001Generator.generate({
        rng: rng1,
        age_band: "3-4",
        theme: "school",
        vocabulary: themeVocab,
      });
      const resWithZero = GT001Generator.generate({
        rng: rng2,
        age_band: "3-4",
        theme: "school",
        vocabulary: themeVocab,
        escalation_step: 0,
      });

      expect(resWithZero).toEqual(resWithout);
    });

    it("generates 4 rounds of GT-001 escalating monotonically within band limits", () => {
      const rounds = [0, 1, 2, 3].map((step) => {
        const rng = createRng(42);
        return GT001Generator.generate({
          rng,
          age_band: "3-4",
          theme: "school",
          vocabulary: themeVocab,
          escalation_step: step,
        });
      });

      const optionCounts = rounds.map(
        (r) => (r.content_pack as { options: unknown[] }).options.length
      );
      // For band 3-4, step 0 gives 3, step 1 gives 4, step 2 gives 4, step 3 gives 4 (capped at 4)
      expect(optionCounts[0]).toBe(3);
      expect(optionCounts[1]).toBe(4);
      expect(optionCounts[2]).toBe(4);
      expect(optionCounts[3]).toBe(4);

      for (const count of optionCounts) {
        expect(count).toBeLessThanOrEqual(4); // Band 3-4 cap is 4 items
      }
    });
  });
});
