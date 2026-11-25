import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, shuffleDeterministic } from "./utils.js";

/**
 * Màu len thật của khung dệt (`BR-E033-09`): `color_id` là khoá màu engine vẽ
 * được, chấm màu cùng màu, tên đọc là tên màu. Cấm — NEVER lấy tên vật của
 * dataset làm tên cuộn len: "xe taxi vàng" dưới cuộn len đỏ là đề nói dối.
 */
export const GT033_YARN_COLORS = [
  { color_id: "red", ref: "🔴", name_vi: "len đỏ" },
  { color_id: "blue", ref: "🔵", name_vi: "len xanh dương" },
  { color_id: "yellow", ref: "🟡", name_vi: "len vàng" },
  { color_id: "green", ref: "🟢", name_vi: "len xanh lá" },
  { color_id: "purple", ref: "🟣", name_vi: "len tím" },
] as const;

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
    const palette = shuffleDeterministic(GT033_YARN_COLORS, rng)
      .slice(0, params.item_count)
      .map((c) => ({
        color_id: c.color_id,
        asset: { kind: "emoji" as const, ref: c.ref },
        name_vi: c.name_vi,
      }));

    const gridSize = params.grid_size ?? 3;
    const blankCount = params.blank_count ?? 1;
    const colorCount = params.color_count ?? params.item_count;

    const cells = buildWeaveCells(gridSize, palette, blankCount);

    return {
      content_pack: {
        prompt: "Bé đan tiếp sắc màu còn thiếu vào chiếu nhé!",
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
