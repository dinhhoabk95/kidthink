import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng } from "./utils.js";

export const projectGT013: Projection<"GT-013"> = {
  template: "GT-013",
  requires: { min_items: 0, max_items: 10 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    const _rng = createRng(opts.seed + (opts.round_index ?? 0));
    const size = opts.band === "5-6" ? 5 : 4;

    const walls: Array<{
      row: number;
      col: number;
      side: "n" | "e" | "s" | "w";
    }> = [];
    // Deterministic simple internal walls
    if (size === 4) {
      walls.push(
        { row: 0, col: 1, side: "s" },
        { row: 1, col: 1, side: "e" },
        { row: 2, col: 2, side: "s" },
        { row: 1, col: 3, side: "s" }
      );
    } else {
      walls.push(
        { row: 0, col: 1, side: "s" },
        { row: 1, col: 2, side: "e" },
        { row: 2, col: 2, side: "s" },
        { row: 3, col: 3, side: "s" },
        { row: 2, col: 4, side: "s" }
      );
    }

    const item = dataset.items.find((i) => i.glyph) ?? dataset.items[0];
    const prompt = item?.glyph
      ? `Bé hãy tìm đường qua mê cung đến ô ${item.glyph} nhé!`
      : "Bé hãy tìm đường đi qua mê cung đến đích nhé!";

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
        dead_end_count: 0,
        required_cell_count: 0,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
