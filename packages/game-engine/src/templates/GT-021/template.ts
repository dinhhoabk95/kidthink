import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT021ContentSchema = z.object({
  ...promptFields(),
  axis: z.enum(["vertical", "horizontal"]).default("vertical"),
  reference_pattern: z
    .array(
      z.object({
        slot_id: z.string(),
        asset: assetSchema(),
      })
    )
    .min(1)
    .max(6),
  target_slots: z
    .array(
      z.object({
        slot_id: z.string(),
        expected_asset_ref: z.string(),
      })
    )
    .min(1)
    .max(6),
  options: z
    .array(
      z.object({
        item_id: z.string(),
        asset: assetSchema(),
        asset_ref: z.string(),
      })
    )
    .min(2)
    .max(8),
});

export const GT021DifficultySchema = z.object({
  show_axis_guide: z.boolean().default(true),
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  allow_retry: z.boolean().default(true),
});

export type GT021Content = z.infer<typeof GT021ContentSchema>;
export type GT021Difficulty = z.infer<typeof GT021DifficultySchema>;

export default defineTemplate({
  code: "GT-021",
  name: "Hoàn thiện đối xứng",
  mechanic: "mirror-complete",
  layouts: ["mirror-axis-split"],
  content_contract: GT021ContentSchema,
  difficulty_contract: GT021DifficultySchema,
  limits: {
    item_count: [2, 8],
    distractor_count: [1, 4],
    target_count: [1, 6],
  },
  age_min: 4,
  age_max: 6,
  requires_tap_fallback: true,
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "round_started",
    "item_placed",
    "round_completed",
    "game_completed",
  ],
  engine_session: "GT021Session",
  status: "published",
  version: 1,
});
