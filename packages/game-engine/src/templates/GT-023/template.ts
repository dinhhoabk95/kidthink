import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT023ContentSchema = z.object({
  ...promptFields(),
  target_model: z.object({
    name: z.string(),
    asset: assetSchema(),
  }),
  anchors: z
    .array(
      z.object({
        anchor_id: z.string(),
        x: z.number().int().min(0).max(960),
        y: z.number().int().min(0).max(540),
        accepted_part_id: z.string(),
        label: z.string().optional(),
      })
    )
    .min(2)
    .max(6),
  parts: z
    .array(
      z.object({
        part_id: z.string(),
        target_anchor_id: z.string(),
        asset: assetSchema(),
        name: z.string().optional(),
      })
    )
    .min(2)
    .max(8),
});

export const GT023DifficultySchema = z.object({
  snap_radius_px: z.number().int().min(30).max(100).default(60),
  show_anchor_outline: z.boolean().default(true),
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  allow_retry: z.boolean().default(true),
});

export type GT023Content = z.infer<typeof GT023ContentSchema>;
export type GT023Difficulty = z.infer<typeof GT023DifficultySchema>;

export default defineTemplate({
  code: "GT-023",
  name: "Lắp ghép hình thể",
  mechanic: "construct",
  layouts: ["top-source-bottom-target", "grid"],
  content_contract: GT023ContentSchema,
  difficulty_contract: GT023DifficultySchema,
  limits: {
    item_count: [2, 8],
    distractor_count: [0, 2],
    target_count: [2, 6],
  },
  age_min: 4,
  age_max: 6,
  requires_tap_fallback: true,
  input: {
    family: "drag",
    verbs: ["drop", "tap"],
    tolerance_px: 24,
  },
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "round_started",
    "item_placed",
    "round_completed",
    "game_completed",
  ],
  engine_session: "GT023Session",
  status: "published",
  version: 1,
});
