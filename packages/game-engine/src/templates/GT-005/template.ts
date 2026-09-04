import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";

export const GT005ContentSchema = z.object({
  ...promptFields(),
  pairs: z
    .array(
      z.object({
        pair_id: z.string(),
        left: z.object({
          item_id: z.string(),
          asset: assetSchema(),
        }),
        right: z.object({
          item_id: z.string(),
          asset: assetSchema(),
        }),
      })
    )
    .min(2)
    .max(6),
});

export const GT005DifficultySchema = z.object({
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
  shuffle_sides: z.boolean(),
});

export type GT005Content = z.infer<typeof GT005ContentSchema>;
export type GT005Difficulty = z.infer<typeof GT005DifficultySchema>;

export default defineTemplate({
  code: "GT-005",
  name: "Ghép cặp",
  mechanic: "pair-match",
  layouts: ["two-column-matching", "card-flip-grid"],
  content_contract: GT005ContentSchema,
  difficulty_contract: GT005DifficultySchema,
  limits: {
    item_count: [4, 12],
    distractor_count: [0, 0],
    target_count: [2, 6],
  },
  age_min: 3,
  age_max: 6,
  requires_tap_fallback: true,
  input: {
    family: "drag",
    verbs: ["drop", "tap"],
    tolerance_px: 24,
  },
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: ["game_started", "pair_selected", "pair_matched", "game_completed"],
  engine_session: "PairMatchSession",
  status: "published",
  version: 1,
});
