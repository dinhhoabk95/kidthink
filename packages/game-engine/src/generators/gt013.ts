import {
  findRouteThrough,
  type MazeCell,
  type MazeWall,
} from "../systems/maze-system.js";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

function generateCandidateWalls(rows: number, cols: number): MazeWall[] {
  const candidateWalls: MazeWall[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r < rows - 1) {
        candidateWalls.push({ row: r, col: c, side: "s" });
      }
      if (c < cols - 1) {
        candidateWalls.push({ row: r, col: c, side: "e" });
      }
    }
  }
  return candidateWalls;
}

function buildMazeWalls(
  shuffledWalls: MazeWall[],
  targetWallCount: number,
  gridBase: { rows: number; cols: number; start: MazeCell; goal: MazeCell }
): MazeWall[] {
  const walls: MazeWall[] = [];
  for (const wall of shuffledWalls) {
    if (walls.length >= targetWallCount) {
      break;
    }
    const testWalls = [...walls, wall];
    const grid = { ...gridBase, walls: testWalls };
    if (findRouteThrough(grid, []) !== null) {
      walls.push(wall);
    }
  }
  return walls;
}

export const GT013Generator: LevelGenerator = {
  engine: "GT-013",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["spatial", "path", "planning", "maze"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const rows = age_band === "4-5" ? 4 : 5 + rng.nextInt(2); // 4 for 4-5, 5 or 6 for 5-6
    const cols = rows;

    const corners: MazeCell[] = [
      { row: 0, col: 0 },
      { row: 0, col: cols - 1 },
      { row: rows - 1, col: 0 },
      { row: rows - 1, col: cols - 1 },
    ];
    const startIdx = rng.nextInt(corners.length);
    const start = corners[startIdx] ?? { row: 0, col: 0 };

    const goalCandidates = corners.filter(
      (c) => c.row !== start.row || c.col !== start.col
    );
    const goal = goalCandidates[rng.nextInt(goalCandidates.length)] ?? {
      row: rows - 1,
      col: cols - 1,
    };

    const candidateWalls = generateCandidateWalls(rows, cols);
    const shuffledWalls = sampleUnique(
      rng,
      candidateWalls,
      candidateWalls.length
    );
    const targetWallCount = Math.min(
      Math.floor((rows * cols) / 2) + rng.nextInt(3),
      candidateWalls.length
    );

    const walls = buildMazeWalls(shuffledWalls, targetWallCount, {
      rows,
      cols,
      start,
      goal,
    });

    const inputMode =
      age_band === "5-6" ? ("arrows" as const) : ("draw" as const);

    const nouns = getNouns(vocabulary, 1);
    const noun = nouns[0]?.label_vi || "bạn nhỏ";
    const prompt =
      inputMode === "arrows"
        ? `Bé hãy chọn các mũi tên để dẫn ${noun} vượt qua mê cung nhé!`
        : `Bé hãy vẽ đường đi giúp ${noun} vượt qua mê cung nhé!`;

    return {
      content_pack: {
        prompt,
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
        dead_end_count: Math.min(6, Math.max(1, Math.floor(walls.length / 3))),
        required_cell_count: 0,
        hint_after_ms: age_band === "4-5" ? 10_000 : 15_000,
        allow_retry: true,
      },
    };
  },
};
