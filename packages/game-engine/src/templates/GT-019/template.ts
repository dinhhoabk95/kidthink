import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT019ContentSchema = z.object({
  ...promptFields(),
  target_slots: z
    .array(
      z.object({
        slot_id: z.string(),
        target_rotation: z.union([
          z.literal(0),
          z.literal(90),
          z.literal(180),
          z.literal(270),
        ]),
        target_flip: z.enum(["none", "horizontal", "vertical"]).default("none"),
        asset: assetSchema(),
      })
    )
    .min(1)
    .max(4),
  pieces: z
    .array(
      z.object({
        piece_id: z.string(),
        initial_rotation: z
          .union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
          .default(0),
        initial_flip: z
          .enum(["none", "horizontal", "vertical"])
          .default("none"),
        target_slot_id: z.string(),
        asset: assetSchema(),
      })
    )
    .min(1)
    .max(4),
});

export const GT019DifficultySchema = z.object({
  allow_flip: z.boolean().default(false),
  rotation_step: z.literal(90).default(90),
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  allow_retry: z.boolean().default(true),
});

export type GT019Content = z.infer<typeof GT019ContentSchema>;
export type GT019Difficulty = z.infer<typeof GT019DifficultySchema>;

export default defineTemplate({
  code: "GT-019",
  name: "Xoay và lật mảnh",
  mechanic: "rotate-transform",
  layouts: [
    "grid",
    "flex-wrap",
    "top-source-bottom-target",
    "left-source-right-target",
  ],
  content_contract: GT019ContentSchema,
  difficulty_contract: GT019DifficultySchema,
  limits: {
    item_count: [1, 4],
    distractor_count: [0, 2],
    target_count: [1, 4],
  },
  age_min: 4,
  age_max: 6,
  requires_tap_fallback: true,
  input: {
    family: "drag",
    verbs: ["drop", "tap", "adjust"],
    tolerance_px: 24,
  },
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "round_started",
    "item_placed",
    "item_sorted",
    "round_completed",
    "game_completed",
  ],
  engine_session: "GT019Session",
  status: "published",
  version: 1,
});
