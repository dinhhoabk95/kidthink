import type { Rng } from "#src/rng/types";
import {
  countDeadEnds,
  countSimpleRoutes,
  findRouteThrough,
  type MazeCell,
  type MazeGrid,
  type MazeWall,
} from "#src/systems/maze-system";
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
    const grid: MazeGrid = { ...gridBase, walls: testWalls };
    if (findRouteThrough(grid, []) !== null) {
      walls.push(wall);
    }
  }
  return walls;
}

/** Ngưỡng đọc được của mê cung 4-5 tuổi (`BR-E013-05`). */
const YOUNG_GRID_SIZE = 3;
const YOUNG_WALL_COUNT = 3; // 3/12 cạnh trong = 25%
const YOUNG_MAX_ROUTES = 3;
const YOUNG_MAX_DEAD_ENDS = 2;
const YOUNG_MAX_ATTEMPTS = 500;
const MAX_DEAD_END_PARAM = 6;

interface MazeLayout {
  grid: MazeGrid;
}

/**
 * Band 4-5: lưới 3×3, đầu và đích ở hai góc đối, đúng 3 tường, và chỉ nhận
 * bố cục có tối đa 3 đường đơn, 2 ngõ cụt — bản cũ dựng 4×4 với 8–10 tường
 * (33–42% cạnh) tới 7 đường và 5 ngõ cụt, quá rối cho tuổi này.
 */
function buildYoungMaze(rng: Rng): MazeLayout {
  const last = YOUNG_GRID_SIZE - 1;
  const diagonal = rng.nextInt(2) === 0;
  const start: MazeCell = { row: 0, col: diagonal ? 0 : last };
  const goal: MazeCell = { row: last, col: diagonal ? last : 0 };
  const candidates = generateCandidateWalls(YOUNG_GRID_SIZE, YOUNG_GRID_SIZE);
  for (let attempt = 0; attempt < YOUNG_MAX_ATTEMPTS; attempt++) {
    const walls = sampleUnique(rng, candidates, YOUNG_WALL_COUNT);
    const grid: MazeGrid = {
      rows: YOUNG_GRID_SIZE,
      cols: YOUNG_GRID_SIZE,
      walls,
      start,
      goal,
    };
    if (
      findRouteThrough(grid, []) !== null &&
      countSimpleRoutes(grid, YOUNG_MAX_ROUTES + 1) <= YOUNG_MAX_ROUTES &&
      countDeadEnds(grid) <= YOUNG_MAX_DEAD_ENDS
    ) {
      return { grid };
    }
  }
  throw new Error(
    `GT-013: không dựng được mê cung 4-5 đạt BR-E013-05 sau ${YOUNG_MAX_ATTEMPTS} lần`
  );
}

/** Band 5-6: lưới 5×5 hoặc 6×6, tường rải ngẫu nhiên nhưng luôn còn đường tới đích. */
function buildOlderMaze(rng: Rng): MazeLayout {
  const rows = 5 + rng.nextInt(2);
  const cols = rows;

  const corners: MazeCell[] = [
    { row: 0, col: 0 },
    { row: 0, col: cols - 1 },
    { row: rows - 1, col: 0 },
    { row: rows - 1, col: cols - 1 },
  ];
  const start = corners[rng.nextInt(corners.length)] ?? { row: 0, col: 0 };
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
  const gridBase = { rows, cols, start, goal };
  const walls = buildMazeWalls(shuffledWalls, targetWallCount, gridBase);
  return { grid: { ...gridBase, walls } };
}

export const GT013Generator: LevelGenerator = {
  engine: "GT-013",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["spatial", "path", "planning", "maze"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const young = age_band === "4-5";
    const { grid } = young ? buildYoungMaze(rng) : buildOlderMaze(rng);
    const { rows, cols, walls, start, goal } = grid;

    // Bộ giải kiểm tra: tồn tại đường đi hợp lệ từ start đến goal
    const route = findRouteThrough(grid, []);
    if (!route || route.length < (young ? 4 : 5)) {
      throw new Error(
        `GT-013 solver verification failed: route missing or too short (length: ${route?.length ?? 0})`
      );
    }

    const inputMode = young ? ("draw" as const) : ("arrows" as const);

    const nouns = getNouns(vocabulary, 1);
    const noun = nouns[0]?.label_vi || "bạn nhỏ";
    const prompt =
      inputMode === "arrows"
        ? `Bé hãy chọn các mũi tên để dẫn ${noun} vượt qua mê cung nhé!`
        : `Bé hãy vẽ đường đi giúp ${noun} vượt qua mê cung nhé!`;

    return {
      content_pack: {
        prompt,
        grid: { rows, cols, walls, start, goal },
        required_cells: [],
        input_mode: inputMode,
      },
      difficulty_params: {
        item_count: 1,
        dead_end_count: Math.min(MAX_DEAD_END_PARAM, countDeadEnds(grid)),
        required_cell_count: 0,
        hint_after_ms: young ? 10_000 : 15_000,
        allow_retry: true,
      },
    };
  },
};
