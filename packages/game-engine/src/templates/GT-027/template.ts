import { z } from "zod";
import { assetSchema, promptFields } from "../../contracts/shared-fields.js";
import { defineTemplate, STANDARD_SCORING } from "../../contracts/types.js";

export const GT027ContentSchema = z.object({
  ...promptFields(),
  rules: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        dimension: z.enum(["color", "shape", "size"]),
        target_value: z.string(),
        signal_text: z.string(),
        signal_audio_text: z.string().optional(),
      })
    )
    .min(2)
    .max(4),
  items: z
    .array(
      z.object({
        id: z.string(),
        asset: assetSchema(),
        color: z.string(),
        shape: z.string(),
        size: z.string().optional(),
      })
    )
    .min(4)
    .max(12),
  switch_after_trials: z.number().int().min(2).max(4).default(2),
});

export const GT027DifficultySchema = z.object({
  signal_duration_ms: z.number().int().min(1000).max(4000).default(2000),
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  allow_retry: z.boolean().default(true),
});

export type GT027Content = z.infer<typeof GT027ContentSchema>;
export type GT027Difficulty = z.infer<typeof GT027DifficultySchema>;

export default defineTemplate({
  code: "GT-027",
  name: "Đổi luật giữa chừng",
  mechanic: "rule-switch",
  layouts: ["grid", "flex-wrap"],
  content_contract: GT027ContentSchema,
  difficulty_contract: GT027DifficultySchema,
  limits: {
    item_count: [4, 12],
    distractor_count: [1, 6],
    target_count: [2, 6],
  },
  age_min: 5,
  age_max: 6,
  banned_age_bands: ["3-4"],
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
  engine_session: "GT027Session",
  status: "published",
  version: 1,
});
