import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT022ContentSchema = z.object({
  ...promptFields(),
  target_description: z.string(),
  scene_objects: z
    .array(
      z.object({
        id: z.string(),
        asset: assetSchema(),
        is_target: z.boolean(),
        is_hidden: z.boolean().default(false),
        x: z.number().int().min(0).max(960).optional(),
        y: z.number().int().min(0).max(540).optional(),
      })
    )
    .min(3)
    .max(12),
});

export const GT022DifficultySchema = z.object({
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  allow_retry: z.boolean().default(true),
  show_target_counter: z.boolean().default(true),
});

export type GT022Content = z.infer<typeof GT022ContentSchema>;
export type GT022Difficulty = z.infer<typeof GT022DifficultySchema>;

export default defineTemplate({
  code: "GT-022",
  name: "Tìm vật thể ẩn",
  mechanic: "hidden-object",
  layouts: ["free-scene", "grid"],
  content_contract: GT022ContentSchema,
  difficulty_contract: GT022DifficultySchema,
  limits: {
    item_count: [3, 12],
    distractor_count: [1, 8],
    target_count: [1, 5],
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
    "item_revealed",
    "round_completed",
    "game_completed",
  ],
  engine_session: "GT022Session",
  status: "published",
  version: 1,
});
