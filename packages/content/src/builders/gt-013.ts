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

/**
 * Bàn mê cung 3×3 (`BR-E013-12`): bốn cột không vừa khung 360 px ở sàn chạm
 * 96 px của band `3-4`. Đầu (0,0), đích (2,2); mọi biến thể giữ đường đi qua
 * các ô bắt buộc `buildRequiredCells` (ô giữa và ô giữa-phải).
 */
const MAZE_SIZE = 3;

function buildMazeWalls(variant: number, difficulty: number): MazeWall[] {
  if (variant === 0) {
    return [
      { row: 0, col: 1, side: "s" },
      { row: 2, col: 0, side: "e" },
      ...(difficulty >= 3 ? [{ row: 0, col: 0, side: "e" as const }] : []),
    ];
  }
  if (variant === 1) {
    return [
      { row: 0, col: 0, side: "s" },
      { row: 2, col: 1, side: "e" },
      ...(difficulty >= 3 ? [{ row: 1, col: 0, side: "e" as const }] : []),
    ];
  }
  return [
    { row: 0, col: 0, side: "e" },
    { row: 1, col: 1, side: "s" },
    ...(difficulty >= 3 ? [{ row: 0, col: 1, side: "e" as const }] : []),
  ];
}

function buildRequiredCells(count: number): { row: number; col: number }[] {
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [{ row: 1, col: 1 }];
  }
  return [
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ];
}

/** Lời đề khi level không có con số nào để gọi tên đích. */
export const GT013_PROMPT = "Bé hãy tìm đường qua mê cung về tới lá cờ nhé!";

/** Chỉ con số mới được gọi "lá cờ số …" và vẽ lên cờ (`BR-E013-11`). */
const NUMERAL_GLYPH = /^\d{1,2}$/;

/** Lời đề khi đích mang con số `glyph`: số chỉ là tên đích, không chỉ đường. */
export function gt013NumberedPrompt(glyph: string): string {
  return `Bé hãy tìm đường về tới lá cờ số ${glyph} nhé!`;
}

/** Con số gọi tên đích của vòng `roundIdx`, hoặc `null` nếu dataset không có số. */
function pickGoalGlyph(dataset: SkillDataset, roundIdx: number): string | null {
  const numerals = dataset.items
    .map((item) => item.glyph)
    .filter((glyph): glyph is string =>
      typeof glyph === "string" ? NUMERAL_GLYPH.test(glyph) : false
    );
  return numerals[roundIdx % Math.max(1, numerals.length)] ?? null;
}

export const projectGT013: Projection<"GT-013"> = {
  template: "GT-013",
  requires: { min_items: 0, max_items: 10 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    const params = getEngineDifficultyParams("GT-013", opts.difficulty);
    const roundIdx = opts.round_index ?? 0;
    const _rng = createRng(opts.seed + roundIdx);
    const size = MAZE_SIZE;

    const variant = (opts.seed + roundIdx) % 3;
    const walls = buildMazeWalls(variant, opts.difficulty);

    // Đề gọi đích đúng như bàn vẽ (`BR-E013-10`, `BR-E013-11`): có con số thì
    // "lá cờ số N" và cờ mang số N; không thì lá cờ trung tính. Không bao giờ
    // nói "ô <glyph>" hay id của vật dữ liệu.
    const goalGlyph = pickGoalGlyph(dataset, roundIdx);
    const prompt = goalGlyph ? gt013NumberedPrompt(goalGlyph) : GT013_PROMPT;

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
        required_cells: buildRequiredCells(requiredCellCount),
        ...(goalGlyph ? { goal_glyph: goalGlyph } : {}),
        input_mode:
          opts.band === "5-6" ? ("arrows" as const) : ("draw" as const),
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
