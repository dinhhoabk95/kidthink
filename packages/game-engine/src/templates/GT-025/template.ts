import { z } from "zod";
import { assetSchema, promptFields } from "../../contracts/shared-fields.js";
import { defineTemplate, STANDARD_SCORING } from "../../contracts/types.js";

export const GT025ContentSchema = z.object({
  ...promptFields(),
  target_count: z.number().int().min(1).max(5),
  left_objects: z
    .array(
      z.object({
        id: z.string(),
        asset: assetSchema(),
        x: z.number().int().min(0).max(480).optional(),
        y: z.number().int().min(0).max(540).optional(),
      })
    )
    .min(2)
    .max(10),
  right_objects: z
    .array(
      z.object({
        id: z.string(),
        asset: assetSchema(),
        x: z.number().int().min(0).max(480).optional(),
        y: z.number().int().min(0).max(540).optional(),
      })
    )
    .min(2)
    .max(10),
  differences: z
    .array(
      z.object({
        id: z.string(),
        left_id: z.string(),
        right_id: z.string(),
        description: z.string().optional(),
      })
    )
    .min(1)
    .max(5),
});

export const GT025DifficultySchema = z.object({
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  allow_retry: z.boolean().default(true),
  show_counter: z.boolean().default(true),
});

export type GT025Content = z.infer<typeof GT025ContentSchema>;
export type GT025Difficulty = z.infer<typeof GT025DifficultySchema>;

export default defineTemplate({
  code: "GT-025",
  name: "Tìm điểm khác biệt",
  mechanic: "spot-difference",
  layouts: ["split-columns"],
  content_contract: GT025ContentSchema,
  difficulty_contract: GT025DifficultySchema,
  limits: {
    item_count: [2, 4],
    distractor_count: [0, 2],
    target_count: [1, 2],
  },
  age_min: 4,
  age_max: 6,
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "round_started",
    "item_selected",
    "round_completed",
    "game_completed",
  ],
  engine_session: "GT025Session",
  status: "published",
  version: 1,
});
