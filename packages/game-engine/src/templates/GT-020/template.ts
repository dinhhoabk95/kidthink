import { z } from "zod";
import { assetSchema, promptFields } from "../../contracts/shared-fields.js";
import { defineTemplate, STANDARD_SCORING } from "../../contracts/types.js";

export const GT020ContentSchema = z.object({
  ...promptFields(),
  pairs: z
    .array(
      z.object({
        pair_key: z.string(),
        card_a: z.object({
          card_id: z.string(),
          asset: assetSchema(),
        }),
        card_b: z.object({
          card_id: z.string(),
          asset: assetSchema(),
        }),
      })
    )
    .min(2)
    .max(6),
});

export const GT020DifficultySchema = z.object({
  flip_back_delay_ms: z.number().int().min(500).max(3000).default(1200),
  peek_all_initial_ms: z.number().int().min(0).max(5000).default(0),
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  allow_retry: z.boolean().default(true),
});

export type GT020Content = z.infer<typeof GT020ContentSchema>;
export type GT020Difficulty = z.infer<typeof GT020DifficultySchema>;

export default defineTemplate({
  code: "GT-020",
  name: "Lật thẻ tìm cặp",
  mechanic: "memory-flip",
  layouts: ["card-flip-grid", "grid"],
  content_contract: GT020ContentSchema,
  difficulty_contract: GT020DifficultySchema,
  limits: {
    item_count: [4, 12],
    distractor_count: [0, 0],
    target_count: [2, 6],
  },
  age_min: 3,
  age_max: 6,
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "round_started",
    "pair_selected",
    "pair_matched",
    "round_completed",
    "game_completed",
  ],
  engine_session: "GT020Session",
  status: "published",
  version: 1,
});
