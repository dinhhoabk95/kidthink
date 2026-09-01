import { VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT013Generator: LevelGenerator = {
  engine: "GT-013",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["spatial", "path", "planning", "maze"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ age_band }) {
    const rows = age_band === "4-5" ? 4 : 5;
    const cols = age_band === "4-5" ? 4 : 5;

    const start = { row: 0, col: 0 };
    const goal = { row: rows - 1, col: cols - 1 };

    // Tường đơn giản không chặn đường chéo chính
    const walls = [
      { row: 0, col: 1, side: "s" as const },
      { row: 1, col: 2, side: "e" as const },
      { row: 2, col: 1, side: "w" as const },
    ].filter((w) => w.row < rows && w.col < cols);

    const inputMode =
      age_band === "5-6" ? ("arrows" as const) : ("draw" as const);

    return {
      content_pack: {
        prompt: "Bé hãy vẽ đường đi giúp bạn vượt qua mê cung nhé!",
        grid: {
          rows,
          cols,
          walls,
          start,
          goal,
        },
        required_cells: [],
        input_mode: inputMode,
      },
      difficulty_params: {
        dead_end_count: 1,
        required_cell_count: 0,
        hint_after_ms: age_band === "4-5" ? 10_000 : 15_000,
        allow_retry: true,
      },
    };
  },
};
