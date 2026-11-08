import type { z } from "zod";
import type { Rng } from "#src/rng/types";
import {
  findShortestSolution,
  MAX_CODE_COMMANDS,
} from "#src/systems/command-queue-system";
import {
  GT035_MAX_GRID_ROWS,
  type GT035CollectibleSchema,
  type GT035Content,
  type GT035Difficulty,
  type GT035FacingSchema,
  type GT035GridCoordSchema,
} from "#src/templates/GT-035/template";
import { VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

type Facing = z.infer<typeof GT035FacingSchema>;
type GridCoord = z.infer<typeof GT035GridCoordSchema>;
type Collectible = z.infer<typeof GT035CollectibleSchema>;

const THEME_GOALS: Record<string, { ref: string; name_vi: string }> = {
  space: { ref: "🛰️", name_vi: "Trạm vũ trụ" },
  school: { ref: "🎒", name_vi: "Lớp học" },
  home: { ref: "🏠", name_vi: "Nhà ở" },
  farm: { ref: "🏚️", name_vi: "Chuồng trại" },
  nature: { ref: "🌳", name_vi: "Cây cổ thụ" },
  ocean: { ref: "⚓", name_vi: "Mỏ neo" },
  festival: { ref: "🏆", name_vi: "Sân khấu nhận cúp" },
  art: { ref: "🔋", name_vi: "Trạm sạc pin" },
};

const THEME_COLLECTIBLES: Record<string, { ref: string; name_vi: string }> = {
  space: { ref: "⭐", name_vi: "Ngôi sao" },
  school: { ref: "📖", name_vi: "Quyển sách" },
  home: { ref: "🪙", name_vi: "Đồng xu" },
  farm: { ref: "🍎", name_vi: "Quả táo" },
  nature: { ref: "🌸", name_vi: "Bông hoa" },
  ocean: { ref: "💎", name_vi: "Ngọc trai" },
  festival: { ref: "🎈", name_vi: "Bóng bay" },
  art: { ref: "⚙️", name_vi: "Bánh răng" },
};

function pickObstacles(
  rng: Rng,
  cols: number,
  rows: number,
  start: GridCoord,
  goal: GridCoord
): GridCoord[] {
  const obstacles: GridCoord[] = [];
  if (rng.nextInt(2) === 1) {
    const obsCol = rng.nextInt(cols);
    const obsRow = rng.nextInt(rows);
    const isStart = obsCol === start.col && obsRow === start.row;
    const isGoal = obsCol === goal.col && obsRow === goal.row;
    if (!(isStart || isGoal)) {
      obstacles.push({ col: obsCol, row: obsRow });
    }
  }
  return obstacles;
}

function pickCollectibles(
  rng: Rng,
  cols: number,
  rows: number,
  goal: GridCoord,
  obstacles: readonly GridCoord[],
  colRef: string
): Collectible[] {
  const collectibles: Collectible[] = [];
  if (rng.nextInt(3) === 1) {
    const cCol = rng.nextInt(cols);
    const cRow = rng.nextInt(rows);
    const isGoal = cCol === goal.col && cRow === goal.row;
    const isObs = obstacles.some((o) => o.col === cCol && o.row === cRow);
    if (!(isGoal || isObs)) {
      collectibles.push({
        col: cCol,
        row: cRow,
        id: "item_1",
        asset: { kind: "emoji" as const, ref: colRef },
      });
    }
  }
  return collectibles;
}

function tryGenerateCandidate(
  rng: Rng,
  goalInfo: { ref: string; name_vi: string },
  colInfo: { ref: string; name_vi: string },
  absolute: boolean
): { content_pack: GT035Content; difficulty_params: GT035Difficulty } | null {
  // Lưới đúng 3 hàng (`BR-E035-17`): 4 hàng không vừa khung 360x640.
  const rows = GT035_MAX_GRID_ROWS;
  const cols = 3 + rng.nextInt(2);

  const facings: Facing[] = ["up", "right", "down", "left"];
  const startFacing = facings[rng.nextInt(4)] ?? "right";

  const start = {
    col: rng.nextInt(cols),
    row: rng.nextInt(rows),
    facing: startFacing,
  };

  let goalCol = rng.nextInt(cols);
  let goalRow = rng.nextInt(rows);
  while (goalCol === start.col && goalRow === start.row) {
    goalCol = rng.nextInt(cols);
    goalRow = rng.nextInt(rows);
  }

  const goal = {
    col: goalCol,
    row: goalRow,
    asset: { kind: "emoji" as const, ref: goalInfo.ref },
  };

  const obstacles = pickObstacles(rng, cols, rows, start, goal);
  const collectibles = pickCollectibles(
    rng,
    cols,
    rows,
    goal,
    obstacles,
    colInfo.ref
  );

  const allowLoop = !absolute && rng.nextInt(2) === 1;
  let allowedCommands: GT035Content["allowed_commands"] = [
    "forward",
    "turn_left",
    "turn_right",
  ];
  if (absolute) {
    allowedCommands = ["go_up", "go_right", "go_down", "go_left"];
  } else if (allowLoop) {
    allowedCommands = ["forward", "turn_left", "turn_right", "loop"];
  }

  const config = {
    rows,
    cols,
    start,
    goal,
    obstacles,
    collectibles,
    maxCommands: MAX_CODE_COMMANDS,
  };

  const solution = findShortestSolution(config, allowedCommands);
  if (!solution || solution.length > 8) {
    return null;
  }
  // Mục 14 của phiếu: level tuyệt đối phải đòi ít nhất hai hướng khác nhau.
  if (absolute && new Set(solution.map((c) => c.type)).size < 2) {
    return null;
  }

  const content: GT035Content = {
    prompt: `Bé lập trình mũi tên để đưa robot về ${goalInfo.name_vi} nhé!`,
    grid: { rows, cols },
    start,
    goal,
    obstacles,
    collectibles,
    allowed_commands: allowedCommands,
  };

  const difficulty: GT035Difficulty = {
    item_count: Math.max(2, obstacles.length + collectibles.length + 1),
    max_commands: Math.min(8, Math.max(solution.length + 1, 4)),
    obstacle_count: obstacles.length,
    collectible_count: collectibles.length,
    allow_loop: allowLoop,
    allow_retry: true,
    hint_after_ms: 10_000,
  };

  return { content_pack: content, difficulty_params: difficulty };
}

export const GT035Generator: LevelGenerator = {
  engine: "GT-035",
  axes: {
    age_band: ["5-6"],
    what: ["space", "rule", "pattern"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band: _age_band, theme, escalation_step = 0 }) {
    const activeTheme = theme && THEME_GOALS[theme] ? theme : "space";
    const goalInfo = THEME_GOALS[activeTheme] ??
      THEME_GOALS.space ?? {
        ref: "🛰️",
        name_vi: "Trạm pin",
      };
    const colInfo = THEME_COLLECTIBLES[activeTheme] ??
      THEME_COLLECTIBLES.space ?? {
        ref: "⭐",
        name_vi: "Ngôi sao",
      };

    // Hệ lệnh theo bậc, không ngẫu nhiên (`BR-E035-15`): vòng đầu (bậc dễ) dùng
    // mũi tên tuyệt đối theo màn hình; vòng leo thang mới sang lệnh tương đối.
    const absolute = escalation_step === 0;
    for (let attempt = 0; attempt < 50; attempt++) {
      const candidate = tryGenerateCandidate(rng, goalInfo, colInfo, absolute);
      if (candidate) {
        return candidate;
      }
    }

    // Fallback nếu ngẫu nhiên không ra (luôn hợp lệ)
    const fallbackContent: GT035Content = {
      prompt: `Bé lập trình mũi tên để đưa robot về ${goalInfo.name_vi} nhé!`,
      grid: { rows: 3, cols: 3 },
      start: { col: 0, row: 0, facing: "right" },
      // Hệ tuyệt đối: đích lệch một hàng để lời giải phải đổi hướng (mục 14).
      goal: {
        col: 2,
        row: absolute ? 1 : 0,
        asset: { kind: "emoji", ref: goalInfo.ref },
      },
      obstacles: [],
      collectibles: [],
      allowed_commands: absolute
        ? ["go_up", "go_right", "go_down", "go_left"]
        : ["forward", "turn_left", "turn_right"],
    };

    const fallbackDifficulty: GT035Difficulty = {
      item_count: 2,
      max_commands: 4,
      obstacle_count: 0,
      collectible_count: 0,
      allow_loop: false,
      allow_retry: true,
      hint_after_ms: 10_000,
    };

    return {
      content_pack: fallbackContent,
      difficulty_params: fallbackDifficulty,
    };
  },
};
