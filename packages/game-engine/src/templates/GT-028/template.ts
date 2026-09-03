import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT028ContentSchema = z
  .object({
    ...promptFields(),
    step: z.union([z.literal(2), z.literal(5), z.literal(10)]),
    items: z
      .array(
        z.object({
          item_id: z.string().min(1).max(32),
          asset: assetSchema(),
        })
      )
      .min(4)
      .max(20),
    target_total: z.number().int().min(2),
  })
  .refine((d) => d.target_total % d.step === 0, {
    message: "target_total phải chia hết cho step (BR-E028-01)",
  })
  .refine((d) => d.items.length * d.step >= d.target_total, {
    message: "items.length * step phải >= target_total (BR-E028-02)",
  });

export const GT028DifficultySchema = z.object({
  step: z.union([z.literal(2), z.literal(5), z.literal(10)]),
  item_count: z.number().int().min(4).max(20),
  allow_undo: z.boolean().default(true),
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  shuffle_items: z.boolean().default(true),
});

export type GT028Content = z.infer<typeof GT028ContentSchema>;
export type GT028Difficulty = z.infer<typeof GT028DifficultySchema>;

export default defineTemplate({
  code: "GT-028",
  name: "Chạm đếm tích luỹ",
  mechanic: "tap-count",
  layouts: ["grid", "flex-wrap"],
  content_contract: GT028ContentSchema,
  difficulty_contract: GT028DifficultySchema,
  limits: {
    item_count: [4, 20],
    distractor_count: [0, 0],
    target_count: [1, 1],
  },
  age_min: 4,
  age_max: 6,
  banned_age_bands: ["3-4"],
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "item_tapped",
    "count_undone",
    "count_submitted",
    "game_completed",
  ],
  engine_session: "GT028Session",
  status: "published",
  version: 1,
});
