import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it } from "vitest";
import { ALL_TEMPLATES } from "#src/generated/template-registry";
import { pickContrast } from "#src/generators/contrast";
import { ALL_LEVEL_GENERATORS } from "#src/generators/index";
import type { ThemeVocabulary } from "#src/generators/types";
import { createRng } from "#src/rng/mulberry32";
import { isSudokuCompleteAndValid } from "#src/systems/constraint-system";
import {
  countDeadEnds,
  countSimpleRoutes,
  type MazeGrid,
} from "#src/systems/maze-system";
import { GT006Session } from "#src/templates/GT-006/session";
import { GT006ContentSchema } from "#src/templates/GT-006/template";
import {
  GT008ContentSchema,
  GT008DifficultySchema,
} from "#src/templates/GT-008/template";
import {
  GT011ContentSchema,
  GT011DifficultySchema,
} from "#src/templates/GT-011/template";
import {
  FLASH_ITEM_CAP_BY_BAND,
  GT012ContentSchema,
  GT012DifficultySchema,
} from "#src/templates/GT-012/template";
import {
  GT015ContentSchema,
  GT015DifficultySchema,
} from "#src/templates/GT-015/template";
import {
  GT016ContentSchema,
  GT016DifficultySchema,
} from "#src/templates/GT-016/template";
import {
  type SolverFixture,
  solveWithWebGestures,
} from "./gates/web-gesture-solver";

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

describe("GT-008 — ô có gợi ý, khay không xếp sẵn, số ô theo band (BR-E008-04)", () => {
  const BANDS = ["3-4", "4-5", "5-6"] as const;

  it('mỗi ô mang nhãn đúng tên vật nó nhận — không còn ô vô danh "Ô n"', () => {
    for (const band of BANDS) {
      for (const seed of SEEDS) {
        const content = GT008ContentSchema.parse(
          gen("GT-008", seed, band).content_pack
        );
        for (const slot of content.slots) {
          const item = content.items.find(
            (i) => i.item_id === slot.expected_item_id
          );
          expect(item, `band=${band} seed=${seed}`).toBeDefined();
          expect(slot.label).toBe(item?.label);
        }
        const labels = content.slots.map((s) => s.label);
        expect(new Set(labels).size).toBe(labels.length);
      }
    }
  });

  it("thứ tự vật ở khay không trùng thứ tự các ô (không xếp sẵn)", () => {
    for (const band of BANDS) {
      for (const seed of SEEDS) {
        const content = GT008ContentSchema.parse(
          gen("GT-008", seed, band).content_pack
        );
        const trayOrder = content.items.map((i) => i.item_id);
        const slotOrder = content.slots.map((s) => s.expected_item_id);
        expect(trayOrder, `band=${band} seed=${seed}`).not.toEqual(slotOrder);
      }
    }
  });

  it("số ô và hint_after_ms tăng theo band, slot_count khớp content, 3-4 không quá 4 ô", () => {
    const maxSlots: number[] = [];
    const hints: number[] = [];
    for (const band of BANDS) {
      let max = 0;
      let min = 99;
      let hint = 0;
      for (const seed of SEEDS) {
        const { content_pack, difficulty_params } = gen("GT-008", seed, band);
        const content = GT008ContentSchema.parse(content_pack);
        const diff = GT008DifficultySchema.parse(difficulty_params);
        expect(diff.slot_count).toBe(content.slots.length);
        max = Math.max(max, content.slots.length);
        min = Math.min(min, content.slots.length);
        hint = diff.hint_after_ms;
      }
      expect(max).toBeGreaterThan(min);
      maxSlots.push(max);
      hints.push(hint);
    }
    expect(maxSlots[0]).toBeLessThanOrEqual(4);
    expect(maxSlots[0]).toBeLessThan(maxSlots[2] ?? 0);
    expect(hints[0]).toBeLessThan(hints[2] ?? 0);
  });
});

interface Cell {
  row: number;
  col: number;
  asset: { kind: string; ref?: string } | null;
}

describe("GT-011 — mỗi seed một bài khác, band khớp age_min (BR-E011-04)", () => {
  function parsed(seed: number) {
    const { content_pack, difficulty_params } = gen("GT-011", seed, "5-6");
    return {
      content: GT011ContentSchema.parse(content_pack),
      diff: GT011DifficultySchema.parse(difficulty_params),
    };
  }

  /** Dạng ma trận không phụ thuộc ký hiệu: đánh số ký hiệu theo thứ tự xuất hiện. */
  function shapeOf(cells: readonly Cell[]): string {
    const ids = new Map<string, number>();
    return cells
      .slice()
      .sort((a, b) => a.row - b.row || a.col - b.col)
      .map((c) => {
        if (!c.asset) {
          return "_";
        }
        const key = c.asset.ref ?? "";
        if (!ids.has(key)) {
          ids.set(key, ids.size);
        }
        return String(ids.get(key));
      })
      .join("");
  }

  it("generator chỉ khai band 5-6 (age_min của engine là 5)", () => {
    expect(ALL_LEVEL_GENERATORS["GT-011"]?.axes.age_band).toEqual(["5-6"]);
  });

  it("ô trống không cố định một vị trí và dạng ma trận đổi giữa các seed", () => {
    const blanks = new Set<string>();
    const shapes = new Set<string>();
    for (const seed of SEEDS) {
      const { content } = parsed(seed);
      const blank = content.matrix.cells.find((c) => c.asset === null);
      blanks.add(`${blank?.row},${blank?.col}`);
      shapes.add(shapeOf(content.matrix.cells));
    }
    expect(blanks.size).toBeGreaterThan(2);
    expect(shapes.size).toBeGreaterThan(3);
  });

  it("đáp án đúng không luôn là ký hiệu thứ hai và kích thước lưới có cả 2x2 lẫn 3x3", () => {
    const sizes = new Set<number>();
    const answerRank = new Set<number>();
    for (const seed of SEEDS) {
      const { content, diff } = parsed(seed);
      sizes.add(diff.grid_size);
      expect(content.matrix.rows).toBe(diff.grid_size);
      const order: string[] = [];
      for (const c of content.matrix.cells
        .slice()
        .sort((a, b) => a.row - b.row || a.col - b.col)) {
        const ref = c.asset && "ref" in c.asset ? c.asset.ref : undefined;
        if (ref && !order.includes(ref)) {
          order.push(ref);
        }
      }
      const answer = content.options.find((o) => o.is_correct);
      const ref = answer && "ref" in answer.asset ? answer.asset.ref : "";
      answerRank.add(order.indexOf(ref ?? ""));
    }
    expect([...sizes].sort()).toEqual([2, 3]);
    expect(answerRank.size).toBeGreaterThan(1);
  });

  it("nhiễu gồm cả ký hiệu có trong ma trận lẫn ký hiệu lạ; distractor_count và item_count khớp options", () => {
    const counts = new Set<number>();
    for (const seed of SEEDS) {
      const { content, diff } = parsed(seed);
      expect(content.options.length).toBe(diff.item_count);
      expect(diff.distractor_count).toBe(content.options.length - 1);
      counts.add(content.options.length);
      const inMatrix = new Set(
        content.matrix.cells.flatMap((c) =>
          c.asset && "ref" in c.asset ? [c.asset.ref] : []
        )
      );
      const outside = content.options.filter(
        (o) => "ref" in o.asset && !inMatrix.has(o.asset.ref)
      );
      expect(outside.length).toBeGreaterThan(0);
      expect(outside.length).toBeLessThan(content.options.length - 1);
    }
    expect(counts.size).toBeGreaterThan(1);
  });
});

describe("GT-012 — flash_ms co giãn theo band và số vật, đủ dải độ khó (BR-E012-05)", () => {
  const BANDS = ["3-4", "4-5", "5-6"] as const;

  function parsed(seed: number, band: (typeof BANDS)[number]) {
    const { content_pack, difficulty_params } = gen("GT-012", seed, band);
    return {
      content: GT012ContentSchema.parse(content_pack),
      diff: GT012DifficultySchema.parse(difficulty_params),
    };
  }

  it("flash_ms không cố định 1500, nằm trong 800–3000 và tăng theo số vật trong cùng band", () => {
    const all = new Set<number>();
    for (const band of BANDS) {
      const byCount = new Map<number, number>();
      for (const seed of SEEDS) {
        const { content, diff } = parsed(seed, band);
        expect(diff.flash_ms).toBeGreaterThanOrEqual(800);
        expect(diff.flash_ms).toBeLessThanOrEqual(3000);
        all.add(diff.flash_ms);
        const count = content.flash_items.length;
        const seen = byCount.get(count);
        if (seen !== undefined) {
          expect(diff.flash_ms, `band=${band} count=${count}`).toBe(seen);
        }
        byCount.set(count, diff.flash_ms);
      }
      const counts = [...byCount.keys()].sort((a, b) => a - b);
      expect(counts.length, `band=${band}`).toBeGreaterThan(1);
      for (let i = 1; i < counts.length; i++) {
        expect(byCount.get(counts[i] ?? 0) ?? 0).toBeGreaterThan(
          byCount.get(counts[i - 1] ?? 0) ?? 0
        );
      }
    }
    expect(all.size).toBeGreaterThan(3);
    expect(all.has(1500) && all.size === 1).toBe(false);
  });

  it("band nhỏ tuổi được xem lâu hơn ở cùng số vật", () => {
    const flashAt = (band: (typeof BANDS)[number], count: number) => {
      for (const seed of SEEDS) {
        const { content, diff } = parsed(seed, band);
        if (content.flash_items.length === count) {
          return diff.flash_ms;
        }
      }
      return null;
    };
    const a = flashAt("3-4", 2);
    const b = flashAt("4-5", 2);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a ?? 0).toBeGreaterThan(b ?? 0);
  });

  it("số vật không kẹt ở một giá trị: mỗi band có ít nhất hai mức và không vượt trần", () => {
    for (const band of BANDS) {
      const counts = new Set<number>();
      for (const seed of SEEDS) {
        const { content, diff } = parsed(seed, band);
        const n = content.flash_items.length;
        counts.add(n);
        expect(n).toBeLessThanOrEqual(FLASH_ITEM_CAP_BY_BAND[band]);
        expect(diff.item_count).toBe(n);
        expect(diff.distractor_count).toBe(content.options.length - 1);
      }
      expect(counts.size, `band=${band}`).toBeGreaterThan(1);
    }
  });

  it("cách bày đổi theo seed và số phương án tăng theo band", () => {
    const arrangements = new Set<string>();
    const optionCounts: number[] = [];
    for (const band of BANDS) {
      const sizes = new Set<number>();
      for (const seed of SEEDS) {
        const { content } = parsed(seed, band);
        arrangements.add(content.arrangement);
        sizes.add(content.options.length);
      }
      optionCounts.push(Math.max(...sizes));
    }
    expect(arrangements.size).toBeGreaterThan(1);
    expect(optionCounts[0]).toBeLessThan(optionCounts[2] ?? 0);
  });
});

describe("GT-015 — đề cần suy luận, nghiệm duy nhất, khác nhau giữa các seed (BR-E015-06)", () => {
  function parsed(seed: number) {
    const { content_pack, difficulty_params } = gen("GT-015", seed, "5-6");
    return {
      content: GT015ContentSchema.parse(content_pack),
      diff: GT015DifficultySchema.parse(difficulty_params),
    };
  }

  /** Mọi cách điền ô trống thành lưới đầy hợp lệ — dùng để đo đáp án. */
  function solutions(
    content: ReturnType<typeof parsed>["content"]
  ): string[][] {
    const ids = content.symbols.map((s) => s.symbol_id);
    const blanks = content.cells.filter((c) => c.symbol_id === null);
    const found: string[][] = [];
    const assign = (i: number, chosen: string[]) => {
      if (i === blanks.length) {
        const grid = {
          size: content.grid_size,
          regions: content.regions,
          cells: content.cells.map((c) => {
            const bi = blanks.findIndex(
              (b) => b.row === c.row && b.col === c.col
            );
            return {
              row: c.row,
              col: c.col,
              value: bi >= 0 ? (chosen[bi] ?? null) : c.symbol_id,
            };
          }),
        };
        if (isSudokuCompleteAndValid(grid)) {
          found.push([...chosen]);
        }
        return;
      }
      for (const id of ids) {
        assign(i + 1, [...chosen, id]);
      }
    };
    assign(0, []);
    return found;
  }

  it("chỉ khai band 5-6 (age_min của engine là 5)", () => {
    expect(ALL_LEVEL_GENERATORS["GT-015"]?.axes.age_band).toEqual(["5-6"]);
  });

  it("nghiệm duy nhất, các ô trống không cùng một đáp án, blank_count khớp lưới", () => {
    for (const seed of SEEDS) {
      const { content, diff } = parsed(seed);
      const blanks = content.cells.filter((c) => c.symbol_id === null);
      expect(diff.blank_count, `seed=${seed}`).toBe(blanks.length);
      expect(diff.item_count).toBe(content.grid_size);
      const sols = solutions(content);
      expect(sols, `seed=${seed}`).toHaveLength(1);
      expect(new Set(sols[0]).size, `seed=${seed}`).toBeGreaterThan(1);
    }
  });

  it("ít nhất một ô trống phải đọc cả hàng lẫn cột: có ô trống khác cùng hàng hoặc cột", () => {
    for (const seed of SEEDS) {
      const { content } = parsed(seed);
      const blanks = content.cells.filter((c) => c.symbol_id === null);
      const linked = blanks.some((a) =>
        blanks.some((b) => b !== a && (a.row === b.row || a.col === b.col))
      );
      expect(linked, `seed=${seed}`).toBe(true);
    }
  });

  it("vị trí ô trống, số ô trống và ký hiệu đổi giữa các seed", () => {
    const layouts = new Set<string>();
    const blankCounts = new Set<number>();
    const hints = new Set<number>();
    for (const seed of SEEDS) {
      const { content, diff } = parsed(seed);
      layouts.add(
        content.cells
          .filter((c) => c.symbol_id === null)
          .map((c) => `${c.row}${c.col}`)
          .join(",")
      );
      blankCounts.add(diff.blank_count);
      hints.add(diff.hint_after_ms);
    }
    expect(layouts.size).toBeGreaterThan(4);
    expect([...blankCounts].sort()).toEqual([2, 3]);
    expect(hints.size).toBe(2);
  });
});

describe("GT-016 — nhiễu không theo khuôn, giờ chẵn và giờ rưỡi là hai bậc (BR-E016-04)", () => {
  function parsed(seed: number) {
    const { content_pack, difficulty_params } = gen("GT-016", seed, "5-6");
    return {
      content: GT016ContentSchema.parse(content_pack),
      diff: GT016DifficultySchema.parse(difficulty_params),
    };
  }

  it("phương án khác nhau từng đôi, đúng một đáp án, item_count và distractor_count khớp options", () => {
    for (const seed of SEEDS) {
      const { content, diff } = parsed(seed);
      const keys = content.options.map((o) => `${o.hour}:${o.minute}`);
      expect(new Set(keys).size, `seed=${seed}`).toBe(keys.length);
      expect(content.options.filter((o) => o.is_correct)).toHaveLength(1);
      expect(diff.item_count).toBe(content.options.length);
      expect(diff.distractor_count).toBe(content.options.length - 1);
    }
  });

  it("minute_step có cả 60 (giờ chẵn) lẫn 30 (có giờ rưỡi); bước 60 chỉ ra phút 0", () => {
    const steps = new Set<number>();
    const minutesAt30 = new Set<number>();
    for (const seed of SEEDS) {
      const { content, diff } = parsed(seed);
      steps.add(diff.minute_step);
      if (diff.minute_step === 60) {
        expect(content.target_time.minute).toBe(0);
        expect(content.options.every((o) => o.minute === 0)).toBe(true);
      } else {
        minutesAt30.add(content.target_time.minute);
      }
    }
    expect([...steps].sort()).toEqual([30, 60]);
    expect([...minutesAt30].sort()).toEqual([0, 30]);
  });

  it("hint_after_ms phụ thuộc bậc: bước 60 sớm hơn bước 30", () => {
    const hint = new Map<number, number>();
    for (const seed of SEEDS) {
      const { diff } = parsed(seed);
      hint.set(diff.minute_step, diff.hint_after_ms);
    }
    expect(hint.get(60) ?? 0).toBeLessThan(hint.get(30) ?? 0);
  });

  it("khoảng cách giờ của nhiễu so với đáp án đổi theo seed (không còn +1, +3 cố định)", () => {
    const offsets = new Set<number>();
    for (const seed of SEEDS) {
      const { content } = parsed(seed);
      const target = content.target_time.hour;
      for (const o of content.options) {
        if (!o.is_correct) {
          offsets.add((((o.hour - target) % 12) + 12) % 12);
        }
      }
    }
    expect(offsets.size).toBeGreaterThan(4);
  });

  it("bậc có giờ rưỡi luôn có bẫy lẫn kim: cùng giờ khác phút", () => {
    for (const seed of SEEDS) {
      const { content, diff } = parsed(seed);
      if (diff.minute_step !== 30) {
        continue;
      }
      const trap = content.options.some(
        (o) =>
          !o.is_correct &&
          o.hour === content.target_time.hour &&
          o.minute !== content.target_time.minute
      );
      expect(trap, `seed=${seed}`).toBe(true);
    }
  });

  it("giờ đích có đủ mười hai giờ qua nhiều seed", () => {
    const hours = new Set<number>();
    for (const seed of SEEDS) {
      hours.add(parsed(seed).content.target_time.hour);
    }
    expect(hours.size).toBeGreaterThan(6);
  });
});

describe("band của bộ sinh khớp age_min của template (Task #313 Phase 4)", () => {
  /** Cận dưới tuổi của band: "4-5" → 4. */
  const lowerAge = (band: string): number => Number.parseInt(band, 10);

  for (const [code, generator] of Object.entries(ALL_LEVEL_GENERATORS)) {
    it(`${code}: mọi band khai ở axes đều từ age_min trở lên và không nằm trong banned_age_bands`, () => {
      const template = ALL_TEMPLATES[code];
      expect(template, code).toBeDefined();
      const banned: readonly string[] = template?.banned_age_bands ?? [];
      for (const band of generator.axes.age_band) {
        expect(lowerAge(band), `${code} band ${band}`).toBeGreaterThanOrEqual(
          template?.age_min ?? 0
        );
        expect(banned, `${code} band ${band}`).not.toContain(band);
      }
    });
  }
});

describe("GT-013 — mê cung 4-5 tuổi thưa tường, ít lối, đọc được (BR-E013-05)", () => {
  interface MazeLevel {
    content_pack: { grid: MazeGrid; input_mode: string };
    difficulty_params: { dead_end_count: number };
  }
  const level = (seed: number, band: "4-5" | "5-6") =>
    gen("GT-013", seed, band) as unknown as MazeLevel;
  const candidateEdges = (g: MazeGrid) => 2 * g.rows * (g.cols - 1);

  it("band 4-5: lưới 3x3, đầu và đích ở hai góc đối, tường chiếm tối đa 25% cạnh trong", () => {
    for (const seed of SEEDS) {
      const { grid } = level(seed, "4-5").content_pack;
      expect([grid.rows, grid.cols], `seed=${seed}`).toEqual([3, 3]);
      expect(Math.abs(grid.start.row - grid.goal.row)).toBe(2);
      expect(Math.abs(grid.start.col - grid.goal.col)).toBe(2);
      expect(grid.walls.length / candidateEdges(grid)).toBeLessThanOrEqual(
        0.25
      );
    }
  });

  it("band 4-5: tối đa 3 đường đơn và 2 ngõ cụt; dead_end_count là số đo thật", () => {
    for (const seed of SEEDS) {
      const { content_pack, difficulty_params } = level(seed, "4-5");
      expect(
        countSimpleRoutes(content_pack.grid, 50),
        `seed=${seed}`
      ).toBeLessThanOrEqual(3);
      const dead = countDeadEnds(content_pack.grid);
      expect(dead).toBeLessThanOrEqual(2);
      expect(difficulty_params.dead_end_count).toBe(dead);
    }
  });

  it("band 5-6: dead_end_count là số ngõ cụt đo được (kẹp ở 6 theo schema)", () => {
    for (const seed of SEEDS) {
      const { content_pack, difficulty_params } = level(seed, "5-6");
      expect(difficulty_params.dead_end_count).toBe(
        Math.min(6, countDeadEnds(content_pack.grid))
      );
    }
  });

  it("level 4-5 do bộ sinh dựng thắng được bằng cử chỉ web", async () => {
    for (const seed of SEEDS.slice(0, 12)) {
      const { content_pack, difficulty_params } = gen("GT-013", seed, "4-5");
      const outcome = await solveWithWebGestures(
        "GT-013",
        {
          content: content_pack as SolverFixture["content"],
          difficulty: difficulty_params as SolverFixture["difficulty"],
          band: "4-5",
        },
        seed
      );
      expect(outcome, `seed=${seed}`).toBe("won");
    }
  });
});
