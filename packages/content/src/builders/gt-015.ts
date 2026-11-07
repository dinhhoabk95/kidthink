import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import {
  createRng,
  resolveItemAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

const DEFAULT_GLYPHS = ["🍎", "🍌", "🍇", "🍊"];

function buildCells2x2(sym0: string, sym1: string) {
  return [
    { row: 0, col: 0, symbol_id: sym0 },
    { row: 0, col: 1, symbol_id: sym1 },
    { row: 1, col: 0, symbol_id: sym1 },
    { row: 1, col: 1, symbol_id: null },
  ];
}

/** Ô trống của lưới 3×3: mỗi hàng và mỗi cột tối đa một ô để lời giải duy nhất (BR-E015-04). */
const BLANKS_3X3: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 2],
  [2, 1],
];

/** Ô trống của lưới 4×4 (regions = row_col_box): mỗi hàng, mỗi cột và mỗi ô 2×2 đúng 1 ô trống. */
const BLANKS_4X4: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

function buildCells3x3(
  sym0: string,
  sym1: string,
  sym2: string,
  blankCount: number
) {
  const latin = [
    [sym0, sym1, sym2],
    [sym1, sym2, sym0],
    [sym2, sym0, sym1],
  ];
  const blanks = BLANKS_3X3.slice(0, blankCount);
  return latin.flatMap((row, r) =>
    row.map((val, c) => ({
      row: r,
      col: c,
      symbol_id: blanks.some(([br, bc]) => br === r && bc === c) ? null : val,
    }))
  );
}

function buildCells4x4(
  sym0: string,
  sym1: string,
  sym2: string,
  sym3: string,
  blankCount: number
) {
  const latin4x4 = [
    [sym0, sym1, sym2, sym3],
    [sym2, sym3, sym0, sym1],
    [sym1, sym0, sym3, sym2],
    [sym3, sym2, sym1, sym0],
  ];
  const blanks = BLANKS_4X4.slice(0, Math.min(blankCount, BLANKS_4X4.length));
  return latin4x4.flatMap((row, r) =>
    row.map((val, c) => ({
      row: r,
      col: c,
      symbol_id: blanks.some(([br, bc]) => br === r && bc === c) ? null : val,
    }))
  );
}

function resolveGridCells(
  gridSize: 2 | 3 | 4,
  symbols: { symbol_id: string }[],
  blankCount: number
) {
  const sym0 = safeGetItem(symbols, 0).symbol_id;
  const sym1 = safeGetItem(symbols, 1).symbol_id;
  if (gridSize === 2) {
    return buildCells2x2(sym0, sym1);
  }
  if (gridSize === 4) {
    return buildCells4x4(
      sym0,
      sym1,
      safeGetItem(symbols, 2).symbol_id,
      safeGetItem(symbols, 3).symbol_id,
      blankCount
    );
  }
  return buildCells3x3(
    sym0,
    sym1,
    safeGetItem(symbols, 2).symbol_id,
    blankCount
  );
}

export const projectGT015: Projection<"GT-015"> = {
  template: "GT-015",
  requires: { min_items: 2, max_items: 4 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-015 đòi hỏi tối thiểu 2 vật`
      );
    }

    const params = getEngineDifficultyParams("GT-015", opts.difficulty);
    const use4x4 =
      (dataset.skill_code === "C3.MTX.02" ||
        dataset.skill_code === "C3.MTX.03") &&
      opts.difficulty >= 3 &&
      dataset.items.length >= 4;
    const gridSize: 2 | 3 | 4 = use4x4 ? 4 : (params.item_count as 2 | 3);
    const regions = use4x4 ? ("row_col_box" as const) : ("row_col" as const);

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);

    const symbols = Array.from({ length: gridSize }, (_, i) => {
      const it = shuffled[i] ?? {
        id: `sym_${i + 1}`,
        label: `Vật ${i + 1}`,
        glyph: DEFAULT_GLYPHS[i] ?? "⭐",
      };
      return {
        symbol_id: it.id,
        asset: resolveItemAsset(it, true),
      };
    });

    let blankCount = 1;
    if (use4x4) {
      blankCount = 4;
    } else if (typeof params.blank_count === "number") {
      blankCount = params.blank_count;
    }
    const cells = resolveGridCells(gridSize, symbols, blankCount);

    return {
      content_pack: {
        prompt: use4x4
          ? "Bé điền đủ bốn hình vào hàng, cột và ô nhé!"
          : "Bé tìm hình còn thiếu vào ô trống nhé!",
        grid_size: gridSize,
        symbols,
        cells,
        regions,
      },
      difficulty_params: {
        item_count: use4x4 ? 4 : params.item_count,
        grid_size: gridSize,
        blank_count: blankCount,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
