import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";

export const GT002ContentSchema = z.object({
  ...promptFields(),
  target_criterion: z.string().max(80),
  items: z
    .array(
      z.object({
        item_id: z.string(),
        asset: assetSchema(),
        is_correct: z.boolean(),
      })
    )
    .min(3)
    .max(8),
});

export const GT002DifficultySchema = z.object({
  distractor_count: z.number().int().min(1).max(5),
  target_count: z.number().int().min(2).max(5),
  hint_after_ms: z.number().int().min(8000).max(35_000),
  allow_retry: z.boolean(),
});

export type GT002Content = z.infer<typeof GT002ContentSchema>;
export type GT002Difficulty = z.infer<typeof GT002DifficultySchema>;

export default defineTemplate({
  code: "GT-002",
  name: "Chọn nhiều đáp án",
  mechanic: "tap-select-multi",
  layouts: ["grid-2x4", "flex-wrap"],
  content_contract: GT002ContentSchema,
  difficulty_contract: GT002DifficultySchema,
  limits: {
    item_count: [3, 8],
    distractor_count: [1, 5],
    target_count: [2, 5],
  },
  age_min: 4,
  age_max: 6,
  banned_age_bands: ["3-4"],
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: [
    "game_started",
    "item_selected",
    "selection_submitted",
    "game_completed",
  ],
  engine_session: "TapSelectMultiSession",
  status: "published",
  version: 1,
});
