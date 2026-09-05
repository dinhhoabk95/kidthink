import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT024ContentSchema = z.object({
  ...promptFields(),
  shape_name: z.string(),
  guide_asset: assetSchema().optional(),
  waypoints: z
    .array(
      z.object({
        id: z.string(),
        x: z.number().int().min(0).max(960),
        y: z.number().int().min(0).max(540),
        order: z.number().int().min(0),
        label: z.string().optional(),
      })
    )
    .min(3)
    .max(12),
});

export const GT024DifficultySchema = z.object({
  tolerance_px: z.number().int().min(20).max(80).default(40),
  show_numbered_dots: z.boolean().default(true),
  show_guide_lines: z.boolean().default(true),
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  allow_retry: z.boolean().default(true),
});

export type GT024Content = z.infer<typeof GT024ContentSchema>;
export type GT024Difficulty = z.infer<typeof GT024DifficultySchema>;

export default defineTemplate({
  code: "GT-024",
  name: "Vẽ theo nét",
  mechanic: "trace-path",
  layouts: ["grid", "flex-wrap"],
  content_contract: GT024ContentSchema,
  difficulty_contract: GT024DifficultySchema,
  limits: {
    item_count: [3, 12],
    distractor_count: [0, 0],
    target_count: [3, 12],
  },
  age_min: 5,
  age_max: 6,
  banned_age_bands: ["3-4"],
  requires_tap_fallback: false,
  input: {
    family: "stroke",
    verbs: ["stroke", "tap"],
    tolerance_px: 40,
  },
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "round_started",
    "checkpoint_reached",
    "trace_completed",
    "round_completed",
    "game_completed",
  ],
  engine_session: "GT024Session",
  status: "published",
  version: 1,
});
