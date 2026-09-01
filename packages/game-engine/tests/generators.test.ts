import { describe, expect, it } from "vitest";
import { EMOJI_REF_PATTERN, EmojiRef } from "#src/contracts/shared-fields";
import { GT001Generator } from "#src/generators/gt001";
import { GT009Generator } from "#src/generators/gt009";
import { GT010Generator } from "#src/generators/gt010";
import { GT013Generator } from "#src/generators/gt013";
import { GT014Generator } from "#src/generators/gt014";
import { GT015Generator } from "#src/generators/gt015";
import { GT016Generator } from "#src/generators/gt016";
import { GT017Generator } from "#src/generators/gt017";
import { GT021Generator } from "#src/generators/gt021";
import { GT024Generator } from "#src/generators/gt024";
import { GT028Generator } from "#src/generators/gt028";
import { GT029Generator } from "#src/generators/gt029";
import { GT030Generator } from "#src/generators/gt030";
import { GT031Generator } from "#src/generators/gt031";
import { GT032Generator } from "#src/generators/gt032";
import { GT033Generator } from "#src/generators/gt033";
import { GT034Generator } from "#src/generators/gt034";
import { GT035Generator } from "#src/generators/gt035";
import { getNouns } from "#src/generators/helpers";
import { ALL_LEVEL_GENERATORS } from "#src/generators/index";
import type { ThemeVocabulary } from "#src/generators/types";
import { createRng } from "#src/rng/mulberry32";
import {
  type GT009Content,
  GT009ContentSchema,
  type GT009Difficulty,
  GT009DifficultySchema,
} from "#src/templates/GT-009/template";
import {
  type GT013Content,
  GT013ContentSchema,
  type GT013Difficulty,
  GT013DifficultySchema,
} from "#src/templates/GT-013/template";
import {
  type GT014Content,
  GT014ContentSchema,
  type GT014Difficulty,
  GT014DifficultySchema,
} from "#src/templates/GT-014/template";
import {
  type GT015Content,
  GT015ContentSchema,
  type GT015Difficulty,
  GT015DifficultySchema,
} from "#src/templates/GT-015/template";
import {
  type GT016Content,
  GT016ContentSchema,
  type GT016Difficulty,
  GT016DifficultySchema,
} from "#src/templates/GT-016/template";
import {
  type GT017Content,
  GT017ContentSchema,
  type GT017Difficulty,
  GT017DifficultySchema,
} from "#src/templates/GT-017/template";
import {
  type GT021Content,
  GT021ContentSchema,
  type GT021Difficulty,
  GT021DifficultySchema,
} from "#src/templates/GT-021/template";
import {
  type GT024Content,
  GT024ContentSchema,
  type GT024Difficulty,
  GT024DifficultySchema,
} from "#src/templates/GT-024/template";
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

  describe("ALL_LEVEL_GENERATORS registry", () => {
    it("chứa ít nhất 23 bộ sinh (mục tiêu Task #171: 23/27)", () => {
      const keys = Object.keys(ALL_LEVEL_GENERATORS);
      expect(keys.length).toBeGreaterThanOrEqual(23);
      expect(keys).toContain("GT-009");
      expect(keys).toContain("GT-013");
      expect(keys).toContain("GT-014");
      expect(keys).toContain("GT-015");
    });
  });

  describe("GT-009 — generator contract conformity & solver verification", () => {
    const themeVocab = vocab(10);

    it("generates valid clue deduction levels for age bands 4-5 and 5-6 across seeds", () => {
      for (const age_band of ["4-5", "5-6"] as const) {
        for (let seed = 1; seed <= 20; seed++) {
          const { content_pack, difficulty_params } = GT009Generator.generate({
            rng: createRng(seed),
            age_band,
            theme: "school",
            vocabulary: themeVocab,
          }) as {
            content_pack: GT009Content;
            difficulty_params: GT009Difficulty;
          };

          const parsedContent = GT009ContentSchema.parse(content_pack);
          const parsedDiff = GT009DifficultySchema.parse(difficulty_params);
          expect(parsedContent).toBeDefined();
          expect(parsedDiff).toBeDefined();

          if (age_band === "4-5") {
            expect(content_pack.candidates.length).toBeLessThanOrEqual(6);
          }
        }
      }
    });

    it("ca âm: manh mối dẫn tới 0 hoặc >1 ứng viên bị schema từ chối", () => {
      const { content_pack } = GT009Generator.generate({
        rng: createRng(1),
        age_band: "4-5",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: GT009Content };

      // Xoá hết manh mối -> tất cả ứng viên đều sống (đa nghiệm)
      const invalidPack = { ...content_pack, clues: [] };
      expect(() => GT009ContentSchema.parse(invalidPack)).toThrow();
    });
  });

  describe("GT-013 — generator contract conformity & solver verification", () => {
    const themeVocab = vocab(10);

    it("generates valid solvable maze levels for age bands 4-5 and 5-6 across seeds", () => {
      for (const age_band of ["4-5", "5-6"] as const) {
        for (let seed = 1; seed <= 20; seed++) {
          const { content_pack, difficulty_params } = GT013Generator.generate({
            rng: createRng(seed),
            age_band,
            theme: "school",
            vocabulary: themeVocab,
          }) as {
            content_pack: GT013Content;
            difficulty_params: GT013Difficulty;
          };

          const parsedContent = GT013ContentSchema.parse(content_pack);
          const parsedDiff = GT013DifficultySchema.parse(difficulty_params);
          expect(parsedContent).toBeDefined();
          expect(parsedDiff).toBeDefined();

          expect(content_pack.grid.start).not.toEqual(content_pack.grid.goal);
        }
      }
    });

    it("ca âm: lưới có start trùng goal bị schema từ chối", () => {
      const { content_pack } = GT013Generator.generate({
        rng: createRng(1),
        age_band: "4-5",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: GT013Content };

      const invalidPack = {
        ...content_pack,
        grid: { ...content_pack.grid, start: content_pack.grid.goal },
      };
      expect(() => GT013ContentSchema.parse(invalidPack)).toThrow();
    });
  });

  describe("GT-014 — generator contract conformity & solver verification", () => {
    const themeVocab = vocab(10);

    it("generates valid balance scale levels for age band 5-6 across seeds", () => {
      for (let seed = 1; seed <= 20; seed++) {
        const { content_pack, difficulty_params } = GT014Generator.generate({
          rng: createRng(seed),
          age_band: "5-6",
          theme: "school",
          vocabulary: themeVocab,
        }) as {
          content_pack: GT014Content;
          difficulty_params: GT014Difficulty;
        };

        const parsedContent = GT014ContentSchema.parse(content_pack);
        const parsedDiff = GT014DifficultySchema.parse(difficulty_params);
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();

        expect(content_pack.left_pan.length).toBeGreaterThan(0);
        expect(content_pack.right_pan.length).toBeGreaterThan(0);
        expect(content_pack.tray.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("ca âm: khay rỗng không thể làm cân bằng bị schema từ chối", () => {
      const { content_pack } = GT014Generator.generate({
        rng: createRng(1),
        age_band: "5-6",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: GT014Content };

      const invalidPack = { ...content_pack, tray: [] };
      expect(() => GT014ContentSchema.parse(invalidPack)).toThrow();
    });
  });

  describe("GT-015 — generator contract conformity & solver verification", () => {
    const themeVocab = vocab(10);

    it("generates valid mini sudoku levels with unique solution for age bands 4-5 and 5-6 across seeds", () => {
      for (const age_band of ["4-5", "5-6"] as const) {
        for (let seed = 1; seed <= 20; seed++) {
          const { content_pack, difficulty_params } = GT015Generator.generate({
            rng: createRng(seed),
            age_band,
            theme: "school",
            vocabulary: themeVocab,
          }) as {
            content_pack: GT015Content;
            difficulty_params: GT015Difficulty;
          };

          const parsedContent = GT015ContentSchema.parse(content_pack);
          const parsedDiff = GT015DifficultySchema.parse(difficulty_params);
          expect(parsedContent).toBeDefined();
          expect(parsedDiff).toBeDefined();

          expect(content_pack.symbols.length).toBe(content_pack.grid_size);
          expect(content_pack.cells.length).toBe(
            content_pack.grid_size * content_pack.grid_size
          );
        }
      }
    });

    it("ca âm: lưới không có ô trống bị schema từ chối", () => {
      const { content_pack } = GT015Generator.generate({
        rng: createRng(1),
        age_band: "4-5",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: GT015Content };

      // Thay ô trống bằng ký hiệu -> không còn ô trống
      const invalidPack = {
        ...content_pack,
        cells: content_pack.cells.map((c) => ({
          ...c,
          symbol_id: c.symbol_id ?? "sym_1",
        })),
      };
      expect(() => GT015ContentSchema.parse(invalidPack)).toThrow();
    });
  });

  describe("GT-016 — generator contract conformity & angle geometry verification", () => {
    const themeVocab = vocab(10);

    it("generates valid clock hand levels for age band 5-6 across seeds", () => {
      for (let seed = 1; seed <= 20; seed++) {
        const { content_pack, difficulty_params } = GT016Generator.generate({
          rng: createRng(seed),
          age_band: "5-6",
          theme: "school",
          vocabulary: themeVocab,
        }) as {
          content_pack: GT016Content;
          difficulty_params: GT016Difficulty;
        };

        const parsedContent = GT016ContentSchema.parse(content_pack);
        const parsedDiff = GT016DifficultySchema.parse(difficulty_params);
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();

        expect(content_pack.target_time.hour).toBeGreaterThanOrEqual(1);
        expect(content_pack.target_time.hour).toBeLessThanOrEqual(12);
        expect(content_pack.options.filter((o) => o.is_correct)).toHaveLength(
          1
        );
      }
    });

    it("ca âm: không có đáp án đúng bị schema từ chối", () => {
      const { content_pack } = GT016Generator.generate({
        rng: createRng(1),
        age_band: "5-6",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: GT016Content };

      const invalidPack = {
        ...content_pack,
        options: content_pack.options.map((o) => ({ ...o, is_correct: false })),
      };
      expect(() => GT016ContentSchema.parse(invalidPack)).toThrow();
    });
  });

  describe("GT-017 — generator contract conformity & isometric geometry verification", () => {
    const themeVocab = vocab(10);

    it("generates valid isometric block models for age bands 4-5 and 5-6 across seeds", () => {
      for (const age_band of ["4-5", "5-6"] as const) {
        for (let seed = 1; seed <= 20; seed++) {
          const { content_pack, difficulty_params } = GT017Generator.generate({
            rng: createRng(seed),
            age_band,
            theme: "school",
            vocabulary: themeVocab,
          }) as {
            content_pack: GT017Content;
            difficulty_params: GT017Difficulty;
          };

          const parsedContent = GT017ContentSchema.parse(content_pack);
          const parsedDiff = GT017DifficultySchema.parse(difficulty_params);
          expect(parsedContent).toBeDefined();
          expect(parsedDiff).toBeDefined();

          expect(content_pack.model.length).toBeGreaterThanOrEqual(
            age_band === "4-5" ? 3 : 4
          );
        }
      }
    });

    it("ca âm: mô hình có khối lơ lửng bị schema từ chối", () => {
      const { content_pack } = GT017Generator.generate({
        rng: createRng(1),
        age_band: "4-5",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: GT017Content };

      // Thêm 1 khối lơ lửng ở z=2 khi z=1 không có khối
      const invalidPack = {
        ...content_pack,
        model: [...content_pack.model, { x: 3, y: 3, z: 2 }],
      };
      expect(() => GT017ContentSchema.parse(invalidPack)).toThrow();
    });
  });

  describe("GT-021 — generator contract conformity & mirror symmetry verification", () => {
    const themeVocab = vocab(10);

    it("generates valid mirror symmetry levels for age bands 4-5 and 5-6 across seeds", () => {
      for (const age_band of ["4-5", "5-6"] as const) {
        for (let seed = 1; seed <= 20; seed++) {
          const { content_pack, difficulty_params } = GT021Generator.generate({
            rng: createRng(seed),
            age_band,
            theme: "school",
            vocabulary: themeVocab,
          }) as {
            content_pack: GT021Content;
            difficulty_params: GT021Difficulty;
          };

          const parsedContent = GT021ContentSchema.parse(content_pack);
          const parsedDiff = GT021DifficultySchema.parse(difficulty_params);
          expect(parsedContent).toBeDefined();
          expect(parsedDiff).toBeDefined();

          expect(content_pack.reference_pattern.length).toBe(
            content_pack.target_slots.length
          );
        }
      }
    });

    it("ca âm: reference_pattern rỗng bị schema từ chối", () => {
      const { content_pack } = GT021Generator.generate({
        rng: createRng(1),
        age_band: "4-5",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: GT021Content };

      const invalidPack = { ...content_pack, reference_pattern: [] };
      expect(() => GT021ContentSchema.parse(invalidPack)).toThrow();
    });
  });

  describe("GT-024 — generator contract conformity & safe area trace verification", () => {
    const themeVocab = vocab(10);

    it("generates valid trace path levels within safe area boundaries for age band 5-6 across seeds", () => {
      for (let seed = 1; seed <= 20; seed++) {
        const { content_pack, difficulty_params } = GT024Generator.generate({
          rng: createRng(seed),
          age_band: "5-6",
          theme: "school",
          vocabulary: themeVocab,
        }) as {
          content_pack: GT024Content;
          difficulty_params: GT024Difficulty;
        };

        const parsedContent = GT024ContentSchema.parse(content_pack);
        const parsedDiff = GT024DifficultySchema.parse(difficulty_params);
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();

        expect(content_pack.waypoints.length).toBeGreaterThanOrEqual(3);
        for (const wp of content_pack.waypoints) {
          expect(wp.x).toBeGreaterThanOrEqual(48);
          expect(wp.x).toBeLessThanOrEqual(912);
          expect(wp.y).toBeGreaterThanOrEqual(48);
          expect(wp.y).toBeLessThanOrEqual(492);
        }
      }
    });

    it("ca âm: waypoint vượt ra ngoài canvas 960x540 bị schema từ chối", () => {
      const { content_pack } = GT024Generator.generate({
        rng: createRng(1),
        age_band: "5-6",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: GT024Content };

      const invalidPack = {
        ...content_pack,
        waypoints: [
          { id: "p0", x: 1200, y: 300, order: 0 },
          ...content_pack.waypoints,
        ],
      };
      expect(() => GT024ContentSchema.parse(invalidPack)).toThrow();
    });
  });
});
