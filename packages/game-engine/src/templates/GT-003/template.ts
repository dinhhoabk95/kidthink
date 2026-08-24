import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";

export const GT003ContentSchema = z.object({
  ...promptFields(),
  container: z.object({
    container_id: z.string(),
    label: z.string().max(40),
    accepts_attribute: z.string(),
  }),
  items: z
    .array(
      z.object({
        item_id: z.string(),
        attribute: z.string(),
        asset: assetSchema(),
        is_correct: z.boolean(),
      })
    )
    .min(2)
    .max(6),
});

export const GT003DifficultySchema = z.object({
  distractor_count: z.number().int().min(0).max(4),
  target_count: z.number().int().min(1).max(4),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT003Content = z.infer<typeof GT003ContentSchema>;
export type GT003Difficulty = z.infer<typeof GT003DifficultySchema>;

export default defineTemplate({
  code: "GT-003",
  name: "Kéo vào đích",
  mechanic: "drag-to-container",
  layouts: ["top-source-bottom-target", "left-source-right-target"],
  content_contract: GT003ContentSchema,
  difficulty_contract: GT003DifficultySchema,
  limits: {
    item_count: [2, 6],
    distractor_count: [0, 4],
    target_count: [1, 4],
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
  events: ["game_started", "item_dragged", "item_dropped", "game_completed"],
  engine_session: "DragToContainerSession",
  status: "published",
  version: 1,
});
