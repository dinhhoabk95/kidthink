import { z } from "zod";
import { assetSchema } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";
import {
  findShortestSolution,
  MAX_CODE_COMMANDS,
} from "#src/systems/command-queue-system";

export const GT035CommandSchema = z.enum([
  "forward",
  "turn_left",
  "turn_right",
  "loop",
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

export const GT035ContentSchema = z
  .object({
    prompt: z.string().min(1),
    prompt_audio_ref: z.string().optional(),
    grid: z.object({
      rows: z.number().int().min(3).max(6),
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

export const GT035DifficultySchema = z.object({
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
  status: "draft",
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
