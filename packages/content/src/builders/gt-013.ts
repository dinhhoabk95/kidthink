import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng } from "./utils.js";

interface MazeWall {
  row: number;
  col: number;
  side: "n" | "e" | "s" | "w";
}

function buildMazeWalls(size: number, variant: number): MazeWall[] {
  if (size === 4) {
    if (variant === 0) {
      return [
        { row: 0, col: 1, side: "s" },
        { row: 1, col: 1, side: "e" },
        { row: 2, col: 2, side: "s" },
        { row: 1, col: 3, side: "s" },
      ];
    }
    if (variant === 1) {
      return [
        { row: 0, col: 2, side: "s" },
        { row: 1, col: 1, side: "s" },
        { row: 2, col: 1, side: "e" },
        { row: 2, col: 3, side: "s" },
      ];
    }
    return [
      { row: 0, col: 1, side: "e" },
      { row: 1, col: 2, side: "s" },
      { row: 2, col: 0, side: "s" },
      { row: 1, col: 3, side: "s" },
    ];
  }
  if (variant === 0) {
    return [
      { row: 0, col: 1, side: "s" },
      { row: 1, col: 2, side: "e" },
      { row: 2, col: 2, side: "s" },
      { row: 3, col: 3, side: "s" },
      { row: 2, col: 4, side: "s" },
    ];
  }
  if (variant === 1) {
    return [
      { row: 0, col: 2, side: "s" },
      { row: 1, col: 1, side: "e" },
      { row: 2, col: 3, side: "s" },
      { row: 3, col: 2, side: "s" },
      { row: 1, col: 4, side: "s" },
    ];
  }
  return [
    { row: 0, col: 1, side: "e" },
    { row: 1, col: 3, side: "s" },
    { row: 2, col: 1, side: "s" },
    { row: 3, col: 3, side: "s" },
    { row: 2, col: 4, side: "s" },
  ];
}

export const projectGT013: Projection<"GT-013"> = {
  template: "GT-013",
  requires: { min_items: 0, max_items: 10 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    const params = getEngineDifficultyParams("GT-013", opts.difficulty);
    const roundIdx = opts.round_index ?? 0;
    const _rng = createRng(opts.seed + roundIdx);
    const size = opts.band === "5-6" ? 5 : 4;

    const variant = (opts.seed + roundIdx) % 3;
    const walls = buildMazeWalls(size, variant);

    const glyphItems = dataset.items.filter((i) => i.glyph);
    const item =
      glyphItems.length > 0
        ? glyphItems[roundIdx % glyphItems.length]
        : dataset.items[roundIdx % Math.max(1, dataset.items.length)];
    const prompt = item?.glyph
      ? `Bé hãy tìm đường qua mê cung đến ô ${item.glyph} nhé!`
      : "Bé hãy tìm đường đi qua mê cung đến đích nhé!";

    const deadEndCount =
      (params as { dead_end_count?: number }).dead_end_count ?? 0;
    const requiredCellCount =
      (params as { required_cell_count?: number }).required_cell_count ?? 0;

    return {
      content_pack: {
        prompt,
        grid: {
          rows: size,
          cols: size,
          walls,
          start: { row: 0, col: 0 },
          goal: { row: size - 1, col: size - 1 },
        },
        required_cells: [],
        input_mode: "arrows" as const,
      },
      difficulty_params: {
        item_count: params.item_count,
        dead_end_count: deadEndCount,
        required_cell_count: requiredCellCount,
        hint_after_ms: params.hint_after_ms ?? 8000,
        allow_retry: params.allow_retry ?? true,
      },
    };
  },
};
