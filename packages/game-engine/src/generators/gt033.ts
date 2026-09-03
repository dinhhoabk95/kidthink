import type {
  GT033Content,
  GT033Difficulty,
  GT033PaletteItem,
} from "#src/templates/GT-033/template";
import { VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const COLOR_NAMES: Record<string, string> = {
  red: "Đỏ",
  blue: "Xanh dương",
  yellow: "Vàng",
  green: "Xanh lá",
  purple: "Tím",
  orange: "Cam",
};

export const GT033Generator: LevelGenerator = {
  engine: "GT-033",
  axes: {
    age_band: ["5-6"],
    what: ["pattern", "colour", "space", "sequence"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band: _age_band }) {
    const size = 2 + rng.nextInt(2); // 2 or 3 (2x2 or 3x3)
    const colorPool = ["red", "blue", "yellow", "green"];
    const chosenColors = colorPool.slice(0, size);

    const palette: GT033PaletteItem[] = chosenColors.map((c) => ({
      color_id: c,
      asset: { kind: "emoji", ref: "🧶" },
      name_vi: COLOR_NAMES[c] ?? c,
    }));

    // Generate shift pattern: cell[r][c] = chosenColors[(r + c) % size]
    const solution: string[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const colorIdx = (r + c) % size;
        const col = chosenColors[colorIdx];
        solution.push(col ?? "red");
      }
    }

    // Pick 1 to (size - 1) blank positions
    const totalCells = size * size;
    const blankCount = 1 + rng.nextInt(Math.min(3, size));
    const blankIndices = new Set<number>();

    while (blankIndices.size < blankCount) {
      blankIndices.add(rng.nextInt(totalCells));
    }

    const cells: (string | null)[] = solution.map((col, idx) =>
      blankIndices.has(idx) ? null : col
    );

    const content_pack: GT033Content = {
      prompt: "Bé hãy chọn sợi len màu đúng để dệt tiếp vào ô trống nhé!",
      grid: { rows: size, cols: size },
      palette,
      cells,
      solution,
      row_rule: "Quy luật màu tuần hoàn",
      col_rule: "Quy luật màu tuần hoàn",
    };

    const difficulty_params: GT033Difficulty = {
      grid_size: size,
      color_count: chosenColors.length,
      blank_count: blankCount,
      allow_retry: true,
      hint_after_ms: 8000,
    };

    return { content_pack, difficulty_params };
  },
};
