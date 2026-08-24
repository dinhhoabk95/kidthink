import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT026ContentSchema = z.object({
  ...promptFields(),
  go_stimulus: z.object({
    label: z.string(),
    asset: assetSchema(),
  }),
  nogo_stimulus: z.object({
    label: z.string(),
    asset: assetSchema(),
  }),
  trials: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(["go", "nogo"]),
      })
    )
    .min(4)
    .max(12),
});

export const GT026DifficultySchema = z.object({
  stimulus_window_ms: z.number().int().min(1000).max(3000).default(2000),
  isi_ms: z.number().int().min(200).max(1500).default(500),
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  allow_retry: z.boolean().default(true),
});

export type GT026Content = z.infer<typeof GT026ContentSchema>;
export type GT026Difficulty = z.infer<typeof GT026DifficultySchema>;

export default defineTemplate({
  code: "GT-026",
  name: "Chỉ chạm khi đúng dấu",
  mechanic: "go-nogo",
  layouts: ["grid"],
  content_contract: GT026ContentSchema,
  difficulty_contract: GT026DifficultySchema,
  limits: {
    item_count: [4, 12],
    distractor_count: [1, 6],
    target_count: [2, 8],
  },
  age_min: 4,
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
  engine_session: "GT026Session",
  status: "published",
  version: 1,
});
