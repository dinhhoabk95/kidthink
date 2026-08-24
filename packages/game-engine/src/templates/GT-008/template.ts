import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";

export const GT008ContentSchema = z.object({
  ...promptFields(),
  slots: z
    .array(
      z.object({
        slot_id: z.string(),
        label: z.string().max(30).optional(),
        expected_item_id: z.string(),
      })
    )
    .min(2)
    .max(9),
  items: z
    .array(
      z.object({
        item_id: z.string(),
        label: z.string().max(30).optional(),
        asset: assetSchema(),
      })
    )
    .min(2)
    .max(9),
});

export const GT008DifficultySchema = z.object({
  slot_count: z.number().int().min(2).max(9),
  distractor_count: z.number().int().min(0).max(4),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT008Content = z.infer<typeof GT008ContentSchema>;
export type GT008Difficulty = z.infer<typeof GT008DifficultySchema>;

export default defineTemplate({
  code: "GT-008",
  name: "Kéo vào ô chứa",
  mechanic: "drag-to-slot",
  layouts: ["horizontal-slot-track", "matrix-slot-grid"],
  content_contract: GT008ContentSchema,
  difficulty_contract: GT008DifficultySchema,
  limits: {
    item_count: [2, 9],
    distractor_count: [0, 4],
    target_count: [2, 9],
  },
  age_min: 3,
  age_max: 6,
  requires_tap_fallback: true,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: ["game_started", "item_dragged", "item_placed", "game_completed"],
  engine_session: "DragToSlotSession",
  status: "published",
  version: 1,
});
