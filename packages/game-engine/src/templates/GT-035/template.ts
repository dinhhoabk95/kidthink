import { z } from "zod";
import { assetSchema } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";
import {
  absoluteFacing,
  findShortestSolution,
  MAX_CODE_COMMANDS,
} from "#src/systems/command-queue-system";

export const GT035CommandSchema = z.enum([
  "forward",
  "turn_left",
  "turn_right",
  "loop",
  "go_up",
  "go_right",
  "go_down",
  "go_left",
]);

const RELATIVE_COMMANDS: ReadonlySet<string> = new Set([
  "forward",
  "turn_left",
  "turn_right",
]);

export const GT035FacingSchema = z.enum(["up", "right", "down", "left"]);

export const GT035GridCoordSchema = z.object({
  col: z.number().int().min(0).max(5),
  row: z.number().int().min(0).max(5),
});

export const GT035StartSchema = GT035GridCoordSchema.extend({
  facing: GT035FacingSchema,
});

export const GT035GoalSchema = GT035GridCoordSchema.extend({
  asset: assetSchema().optional(),
});

export const GT035CollectibleSchema = GT035GridCoordSchema.extend({
  id: z.string().min(1).max(32),
  asset: assetSchema(),
});

function validatePositionsInBounds(
  grid: { rows: number; cols: number },
  start: { col: number; row: number },
  goal: { col: number; row: number }
): boolean {
  return (
    start.col < grid.cols &&
    start.row < grid.rows &&
    goal.col < grid.cols &&
    goal.row < grid.rows
  );
}

function validateObstaclesAndCollectibles(
  grid: { rows: number; cols: number },
  startKey: string,
  goalKey: string,
  obstacles: readonly { col: number; row: number }[],
  collectibles: readonly { col: number; row: number }[]
): boolean {
  for (const obs of obstacles) {
    if (obs.col >= grid.cols || obs.row >= grid.rows) {
      return false;
    }
    const key = `${obs.col},${obs.row}`;
    if (key === startKey || key === goalKey) {
      return false;
    }
  }

  for (const colItem of collectibles) {
    if (colItem.col >= grid.cols || colItem.row >= grid.rows) {
      return false;
    }
    const key = `${colItem.col},${colItem.row}`;
    if (key === goalKey) {
      return false;
    }
  }
  return true;
}

/**
 * Trần số hàng lưới robot (`BR-E035-17`): ở khung nhỏ nhất 360x640 và sàn chạm
 * 64 px, lưới 4 hàng cộng hàng lệnh và khay lệnh tràn xuống đè nút chạy khi
 * `max_commands` từ 5 trở lên (`BR-LAY-04` cấm co ô); lưới 3 hàng vừa đến 8 lệnh.
 */
export const GT035_MAX_GRID_ROWS = 3;

export const GT035ContentSchema = z
  .object({
    prompt: z.string().min(1),
    grid: z.object({
      rows: z.number().int().min(3).max(GT035_MAX_GRID_ROWS),
      cols: z.number().int().min(3).max(6),
    }),
    start: GT035StartSchema,
    goal: GT035GoalSchema,
    obstacles: z.array(GT035GridCoordSchema).max(8).default([]),
    collectibles: z.array(GT035CollectibleSchema).max(4).default([]),
    allowed_commands: z
      .array(GT035CommandSchema)
      .min(1)
      .default(["forward", "turn_left", "turn_right", "loop"]),
  })
  .refine(
    (content) => {
      const hasAbsolute = content.allowed_commands.some(
        (c) => absoluteFacing(c) !== null
      );
      // Hệ tuyệt đối là bậc dễ: không trộn lệnh tương đối, không có `loop`
      // (khay 5 thẻ chưa đo vừa sân khấu portrait, `BR-E035-07`).
      return !(
        hasAbsolute &&
        content.allowed_commands.some(
          (c) => c === "loop" || RELATIVE_COMMANDS.has(c)
        )
      );
    },
    {
      message:
        "BR-E035-15: Lệnh tuyệt đối (go_*) không đi cùng lệnh tương đối (forward, turn_left, turn_right) hay loop.",
    }
  )
  .refine(
    (content) => {
      if (
        !validatePositionsInBounds(content.grid, content.start, content.goal)
      ) {
        return false;
      }

      const startKey = `${content.start.col},${content.start.row}`;
      const goalKey = `${content.goal.col},${content.goal.row}`;
      if (startKey === goalKey) {
        return false;
      }

      if (
        !validateObstaclesAndCollectibles(
          content.grid,
          startKey,
          goalKey,
          content.obstacles,
          content.collectibles
        )
      ) {
        return false;
      }

      const solution = findShortestSolution(
        {
          rows: content.grid.rows,
          cols: content.grid.cols,
          start: content.start,
          goal: content.goal,
          obstacles: content.obstacles,
          collectibles: content.collectibles,
          maxCommands: MAX_CODE_COMMANDS,
        },
        content.allowed_commands
      );

      return solution !== null;
    },
    {
      message:
        "BR-E035-02: Mê cung lệnh phải có đường đi hợp lệ tới đích không đâm vật cản trong tối đa 8 lệnh.",
    }
  );

/**
 * Đường đi ngắn nhất có nằm trong `max_commands` của độ khó không.
 * Contract content chỉ kiểm tới trần cứng 8 lệnh; hàng lệnh thật chỉ có
 * `max_commands` ô, nên level có thể vô nghiệm dù qua schema.
 */
export function isSolvableWithinMaxCommands(
  content: GT035Content,
  maxCommands: number
): boolean {
  return (
    findShortestSolution(
      {
        rows: content.grid.rows,
        cols: content.grid.cols,
        start: content.start,
        goal: content.goal,
        obstacles: content.obstacles,
        collectibles: content.collectibles,
        maxCommands,
      },
      content.allowed_commands
    ) !== null
  );
}

export const GT035DifficultySchema = z.object({
  item_count: z.number().int().min(1).max(8),
  max_commands: z.number().int().min(1).max(MAX_CODE_COMMANDS).default(8),
  obstacle_count: z.number().int().min(0).max(8).default(0),
  collectible_count: z.number().int().min(0).max(4).default(0),
  allow_loop: z.boolean().default(true),
  allow_retry: z.boolean().default(true),
  hint_after_ms: z.number().int().min(1000).max(60_000).default(10_000),
});

export type GT035GridCoord = z.infer<typeof GT035GridCoordSchema>;
export type GT035Collectible = z.infer<typeof GT035CollectibleSchema>;
export type GT035Content = z.infer<typeof GT035ContentSchema>;
export type GT035Difficulty = z.infer<typeof GT035DifficultySchema>;

const GT035Template = defineTemplate({
  code: "GT-035",
  name: "Xếp hàng lệnh",
  mechanic: "command-sequence",
  status: "published",
  version: 1,
  engine_session: "GT035Session",
  layouts: ["matrix-slot-grid", "step-ladder"],
  content_contract: GT035ContentSchema,
  difficulty_contract: GT035DifficultySchema,
  age_min: 5,
  age_max: 6,
  banned_age_bands: ["3-4", "4-5"],
  requires_tap_fallback: true,
  limits: {
    item_count: [1, 8],
    distractor_count: [0, 0],
    target_count: [1, 1],
  },
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  input: {
    family: "drag",
    verbs: ["drop", "tap", "commit"],
    tolerance_px: 24,
  },
  events: [
    "game_started",
    "command_added",
    "command_removed",
    "program_run",
    "program_failed",
    "game_completed",
  ],
});

export default GT035Template;
