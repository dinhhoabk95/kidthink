import {
  type GT033Content,
  type GT033Difficulty,
  type GT033PaletteItem,
  solveWeaveGrid,
} from "#src/templates/GT-033/template";
import { sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const COLOR_NAMES: Readonly<Record<string, string>> = {
  red: "Đỏ",
  blue: "Xanh dương",
  yellow: "Vàng",
  green: "Xanh lá",
  purple: "Tím",
  orange: "Cam",
};

interface EscalationTier {
  readonly size: number;
  readonly colorCount: number;
  readonly blankCount: number;
}

function resolveTier(
  escalationStep: number | undefined,
  rng: { nextInt(max: number): number }
): EscalationTier {
  if (escalationStep === undefined) {
    const size = 2 + rng.nextInt(2);
    const colorCount = size === 2 ? 2 : 2 + rng.nextInt(2);
    const blankCount = Math.max(2, size);
    return { size, colorCount, blankCount };
  }
  if (escalationStep <= 0) {
    return { size: 2, colorCount: 2, blankCount: 2 };
  }
  if (escalationStep === 1) {
    return { size: 3, colorCount: 2, blankCount: 3 };
  }
  if (escalationStep === 2) {
    return { size: 3, colorCount: 3, blankCount: 4 };
  }
  return { size: 4, colorCount: 4, blankCount: 5 };
}

function hasMultiRowAndColBlanks(
  blankIndices: ReadonlySet<number>,
  cols: number
): boolean {
  const rows = new Set<number>();
  const colSet = new Set<number>();
  for (const idx of blankIndices) {
    rows.add(Math.floor(idx / cols));
    colSet.add(idx % cols);
  }
  return rows.size >= 2 && colSet.size >= 2;
}

function pickValidBlankMask(
  size: number,
  colorCount: number,
  targetBlanks: number,
  paletteIds: readonly string[],
  solution: readonly string[],
  rng: { nextInt(max: number): number }
): (string | null)[] {
  const totalCells = size * size;
  const maxBlanks = Math.min(targetBlanks, totalCells - colorCount);

  for (let attempt = 0; attempt < 40; attempt++) {
    const blankIndices = new Set<number>();
    while (blankIndices.size < maxBlanks) {
      blankIndices.add(rng.nextInt(totalCells));
    }
    if (!hasMultiRowAndColBlanks(blankIndices, size)) {
      continue;
    }
    const cells = solution.map((col, idx) =>
      blankIndices.has(idx) ? null : col
    );
    if (solveWeaveGrid(size, size, paletteIds, cells, 2).length === 1) {
      return cells;
    }
  }

  // Fallback xác định: đường chéo chính (luôn rải >= 2 hàng và >= 2 cột).
  const fallbackIndices = new Set<number>();
  for (let i = 0; i < size && fallbackIndices.size < maxBlanks; i++) {
    fallbackIndices.add(i * size + i);
  }
  for (let i = 0; i < totalCells && fallbackIndices.size < maxBlanks; i++) {
    fallbackIndices.add(i);
  }
  return solution.map((col, idx) => (fallbackIndices.has(idx) ? null : col));
}

export const GT033Generator: LevelGenerator<GT033Content, GT033Difficulty> = {
  engine: "GT-033",
  axes: {
    age_band: ["5-6"],
    what: ["pattern", "colour", "space", "sequence"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, escalation_step }) {
    const { size, colorCount, blankCount } = resolveTier(escalation_step, rng);
    // Không đặt đỏ cạnh xanh lá: trẻ mù màu đỏ-lục không phân biệt được.
    const colorPool =
      rng.nextInt(2) === 0
        ? ["red", "blue", "yellow", "purple"]
        : ["green", "blue", "yellow", "purple"];
    const chosenColors = sampleUnique(rng, colorPool, colorCount);

    const palette: GT033PaletteItem[] = chosenColors.map((c) => ({
      color_id: c,
      asset: { kind: "emoji", ref: "🧶" },
      name_vi: COLOR_NAMES[c] ?? c,
    }));

    const solution: string[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const colorIdx = (r + c) % colorCount;
        solution.push(chosenColors[colorIdx] ?? "red");
      }
    }

    const cells = pickValidBlankMask(
      size,
      colorCount,
      blankCount,
      chosenColors,
      solution,
      rng
    );
    const actualBlankCount = cells.filter((c) => c === null).length;

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
      item_count: palette.length,
      grid_size: size,
      color_count: chosenColors.length,
      blank_count: actualBlankCount,
      allow_retry: true,
      hint_after_ms: 8000,
    };

    return { content_pack, difficulty_params };
  },
};
