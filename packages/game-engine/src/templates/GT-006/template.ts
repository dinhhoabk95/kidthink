import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";

export const GT006ContentSchema = z.object({
  ...promptFields(),
  sequence: z
    .array(
      z.object({
        step_id: z.string(),
        order_index: z.number().int().min(0),
        asset: assetSchema(),
        label: z.string().optional(),
      })
    )
    .min(3)
    .max(5),
});

export const GT006DifficultySchema = z.object({
  hint_after_ms: z.number().int().min(10_000).max(40_000),
  allow_retry: z.boolean(),
  shuffle_initial: z.boolean(),
});

export type GT006Content = z.infer<typeof GT006ContentSchema>;
export type GT006Difficulty = z.infer<typeof GT006DifficultySchema>;

export default defineTemplate({
  code: "GT-006",
  name: "Sắp xếp thứ tự",
  mechanic: "sequence-order",
  layouts: ["horizontal-track", "step-ladder"],
  content_contract: GT006ContentSchema,
  difficulty_contract: GT006DifficultySchema,
  limits: {
    item_count: [3, 5],
    distractor_count: [0, 0],
    target_count: [3, 5],
  },
  age_min: 5,
  age_max: 6,
  banned_age_bands: ["3-4", "4-5"],
  requires_tap_fallback: true,
  input: {
    family: "drag",
    verbs: ["drop", "tap", "commit"],
    tolerance_px: 24,
  },
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: [
    "game_started",
    "step_reordered",
    "sequence_submitted",
    "game_completed",
  ],
  engine_session: "SequenceOrderSession",
  status: "published",
  version: 1,
});
