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

function buildCells3x3(sym0: string, sym1: string, sym2: string) {
  const latin = [
    [sym0, sym1, sym2],
    [sym1, sym2, sym0],
    [sym2, sym0, sym1],
  ];
  return latin.flatMap((row, r) =>
    row.map((val, c) => ({
      row: r,
      col: c,
      symbol_id: (r === 0 && c === 0) || (r === 1 && c === 2) ? null : val,
    }))
  );
}

function buildCells4x4(sym0: string, sym1: string, sym2: string, sym3: string) {
  const latin = [
    [sym0, sym1, sym2, sym3],
    [sym1, sym0, sym3, sym2],
    [sym2, sym3, sym0, sym1],
    [sym3, sym2, sym1, sym0],
  ];
  return latin.flatMap((row, r) =>
    row.map((val, c) => ({
      row: r,
      col: c,
      symbol_id:
        (r === 0 && c === 0) || (r === 1 && c === 1) || (r === 2 && c === 2)
          ? null
          : val,
    }))
  );
}

function resolveGridCells(
  gridSize: 2 | 3 | 4,
  symbols: { symbol_id: string }[]
) {
  const sym0 = safeGetItem(symbols, 0).symbol_id;
  const sym1 = safeGetItem(symbols, 1).symbol_id;
  if (gridSize === 2) {
    return buildCells2x2(sym0, sym1);
  }
  if (gridSize === 3) {
    return buildCells3x3(sym0, sym1, safeGetItem(symbols, 2).symbol_id);
  }
  return buildCells4x4(
    sym0,
    sym1,
    safeGetItem(symbols, 2).symbol_id,
    safeGetItem(symbols, 3).symbol_id
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
    const gridSize = params.item_count as 2 | 3 | 4;

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

    const cells = resolveGridCells(gridSize, symbols);

    const blankCount =
      typeof params.blank_count === "number" ? params.blank_count : 1;

    return {
      content_pack: {
        prompt: "Bé tìm hình còn thiếu vào ô trống nhé!",
        grid_size: gridSize,
        symbols,
        cells,
        regions: "row_col" as const,
      },
      difficulty_params: {
        item_count: params.item_count,
        grid_size: gridSize,
        blank_count: blankCount,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
