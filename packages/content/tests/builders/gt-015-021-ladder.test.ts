import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { projectGT015 } from "../../src/builders/gt-015.js";
import { projectGT021 } from "../../src/builders/gt-021.js";
import { ALL_SKILL_SEEDS } from "../../src/skills/index.js";

const ITEMS = Array.from({ length: 10 }, (_, i) => ({
  id: `item_${i}`,
  label: `Vật ${i}`,
  glyph: "🍎",
}));

const DATASET = {
  skill_code: "TEST.SKILL",
  items: ITEMS,
} as unknown as SkillDataset;

interface Cell {
  readonly row: number;
  readonly col: number;
  readonly symbol_id: string | null;
}

interface SudokuPack {
  readonly grid_size: number;
  readonly symbols: readonly { symbol_id: string }[];
  readonly cells: readonly Cell[];
}

function isSudokuPack(
  pack: Record<string, unknown>
): pack is Record<string, unknown> & SudokuPack {
  return (
    typeof pack.grid_size === "number" &&
    Array.isArray(pack.symbols) &&
    Array.isArray(pack.cells)
  );
}

function sudokuOf(difficulty: number): SudokuPack {
  const { content_pack: pack } = projectGT015.project(DATASET, {
    band: "5-6",
    difficulty,
    theme: "default",
    seed: 11,
  });
  if (!isSudokuPack(pack)) {
    throw new Error("content_pack GT-015 sai hình dạng");
  }
  return pack;
}

/** Đếm lời giải: mỗi ô trống thử mọi ký hiệu, loại trùng hàng và cột. */
function countSolutions(pack: SudokuPack): number {
  const size = pack.grid_size;
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
  for (const c of pack.cells) {
    const row = grid[c.row];
    if (row) {
      row[c.col] = c.symbol_id;
    }
  }
  const blanks = pack.cells.filter((c) => c.symbol_id === null);
  const conflicts = (r: number, c: number, sym: string): boolean =>
    grid.some((row, rr) => rr !== r && row[c] === sym) ||
    (grid[r] ?? []).some((v, cc) => cc !== c && v === sym);
  const solve = (index: number): number => {
    const blank = blanks[index];
    if (!blank) {
      return 1;
    }
    let total = 0;
    for (const { symbol_id } of pack.symbols) {
      if (conflicts(blank.row, blank.col, symbol_id)) {
        continue;
      }
      const row = grid[blank.row];
      if (!row) {
        continue;
      }
      row[blank.col] = symbol_id;
      total += solve(index + 1);
      row[blank.col] = null;
    }
    return total;
  };
  return solve(0);
}

describe("GT-015 band 5-6: bậc khó tăng bằng số ô trống (BR-E015-04)", () => {
  it("bậc 4 có lưới 3×3 với 2 ô trống", () => {
    const pack = sudokuOf(4);
    expect(pack.grid_size).toBe(3);
    expect(pack.cells.filter((c) => c.symbol_id === null)).toHaveLength(2);
  });

  it("bậc 5 có lưới 3×3, khay 3 ký hiệu và đúng 3 ô trống", () => {
    const pack = sudokuOf(5);
    expect(pack.grid_size).toBe(3);
    expect(pack.symbols).toHaveLength(3);
    expect(pack.cells.filter((c) => c.symbol_id === null)).toHaveLength(3);
  });

  it("bậc 5: mỗi hàng và mỗi cột tối đa một ô trống", () => {
    const blanks = sudokuOf(5).cells.filter((c) => c.symbol_id === null);
    expect(new Set(blanks.map((c) => c.row)).size).toBe(blanks.length);
    expect(new Set(blanks.map((c) => c.col)).size).toBe(blanks.length);
  });

  it("bậc 4 và bậc 5 đều có đúng một lời giải (BR-E015-01)", () => {
    expect(countSolutions(sudokuOf(4))).toBe(1);
    expect(countSolutions(sudokuOf(5))).toBe(1);
  });
});

interface MirrorPack {
  readonly axis: string;
  readonly options: readonly unknown[];
}

interface MirrorOut {
  readonly pack: MirrorPack;
  readonly showAxisGuide: unknown;
}

function mirrorOf(band: "4-5" | "5-6", difficulty: number): MirrorOut {
  const projected = projectGT021.project(DATASET, {
    band,
    difficulty,
    theme: "default",
    seed: 5,
  });
  const { content_pack: pack } = projected;
  if (typeof pack.axis !== "string" || !Array.isArray(pack.options)) {
    throw new Error("content_pack GT-021 sai hình dạng");
  }
  return {
    pack: { axis: pack.axis, options: pack.options },
    showAxisGuide: projected.difficulty_params.show_axis_guide,
  };
}

describe("GT-021 band 4-5: bậc 3 tắt đường trục, giữ 3 mảnh (BR-E021-04)", () => {
  it("bậc 2 bật đường trục, 3 mảnh", () => {
    const out = mirrorOf("4-5", 2);
    expect(out.pack.options).toHaveLength(3);
    expect(out.showAxisGuide).toBe(true);
  });

  it("bậc 3 tắt đường trục, vẫn 3 mảnh và trục dọc", () => {
    const out = mirrorOf("4-5", 3);
    expect(out.pack.options).toHaveLength(3);
    expect(out.pack.axis).toBe("vertical");
    expect(out.showAxisGuide).toBe(false);
  });

  it("band 5-6 bậc 3 giữ 4 mảnh", () => {
    expect(mirrorOf("5-6", 3).pack.options).toHaveLength(4);
  });
});

interface PlannedLevel {
  readonly template: string;
  readonly band: string;
  readonly difficulty: number;
}

function plannedLevels(template: string, band: string): PlannedLevel[] {
  return ALL_SKILL_SEEDS.flatMap((seed) => seed.levels).filter(
    (level) => level.template === template && level.band === band
  );
}

function countByDifficulty(levels: readonly PlannedLevel[]): number[] {
  return [1, 2, 3, 4, 5].map(
    (d) => levels.filter((l) => l.difficulty === d).length
  );
}

describe("Thang level theo bậc sau khi bù độ khó (#283)", () => {
  it("GT-021 band 4-5 có bậc 1, 2 và 3, không bậc 4-5", () => {
    const counts = countByDifficulty(plannedLevels("GT-021", "4-5"));
    expect(counts[0]).toBeGreaterThan(0);
    expect(counts[1]).toBeGreaterThan(0);
    expect(counts[2]).toBeGreaterThan(0);
    expect(counts[3]).toBe(0);
    expect(counts[4]).toBe(0);
  });

  it("GT-021 band 4-5: 4 level bậc 1 · 11 level bậc 2 · 7 level bậc 3 (khôi phục 7 level bậc 3 cũ)", () => {
    expect(
      countByDifficulty(plannedLevels("GT-021", "4-5")).slice(0, 3)
    ).toEqual([4, 11, 7]);
  });

  it("GT-015 band 5-6 có level bậc 5 (6 level được trả về)", () => {
    expect(countByDifficulty(plannedLevels("GT-015", "5-6"))[4]).toBe(6);
  });
});
