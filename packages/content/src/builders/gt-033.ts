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

function buildWeaveCells(
  gridSize: number,
  palette: Array<{ color_id: string }>,
  blankCount: number
) {
  const total = gridSize * gridSize;
  const cells: Array<string | null> = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const color = palette[(r + c) % palette.length]?.color_id ?? "red";
      cells.push(color);
    }
  }

  // Đặt blankCount ô null
  const nullCount = Math.min(blankCount, total - 1);
  for (let i = 0; i < nullCount; i++) {
    cells[total - 1 - i] = null;
  }

  return cells;
}

export const projectGT033: Projection<"GT-033"> = {
  template: "GT-033",
  requires: { min_items: 2, max_items: 4 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-033 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-033", opts.difficulty);
    const shuffled = shuffleDeterministic(dataset.items, rng);

    const palette = Array.from({ length: params.item_count }, (_, i) => {
      const item = safeGetItem(shuffled, i % shuffled.length);
      return {
        color_id: `col_${item.id}_${i + 1}`,
        asset: resolveItemAsset(item, true),
        name_vi: item.label,
      };
    });

    const gridSize = params.grid_size ?? 3;
    const blankCount = params.blank_count ?? 1;
    const colorCount = params.color_count ?? params.item_count;

    const cells = buildWeaveCells(gridSize, palette, blankCount);

    return {
      content_pack: {
        prompt: "Bé điền màu thích hợp vào ô trống nhé!",
        grid: { rows: gridSize, cols: gridSize },
        palette,
        cells,
      },
      difficulty_params: {
        item_count: params.item_count,
        grid_size: gridSize,
        color_count: colorCount,
        blank_count: blankCount,
        allow_retry: true,
        hint_after_ms: 8000,
      },
    };
  },
};
