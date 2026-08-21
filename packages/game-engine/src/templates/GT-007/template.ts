import { z } from "zod";
import { assetSchema, promptFields } from "../../contracts/shared-fields.js";
import { defineTemplate } from "../../contracts/types.js";

export const GT007ContentSchema = z.object({
  ...promptFields(),
  whole: z.object({
    id: z.string(),
    value: z.number().int().min(1).max(20),
    label: z.string().max(20).optional(),
    asset: assetSchema().optional(),
  }),
  parts: z
    .array(
      z.object({
        id: z.string(),
        value: z.number().int().min(0).max(20),
        is_target: z.boolean(), // true nếu ô này cần điền/kéo vào
        label: z.string().max(20).optional(),
        asset: assetSchema().optional(),
      })
    )
    .min(2)
    .max(3),
  options: z
    .array(
      z.object({
        id: z.string(),
        value: z.number().int().min(0).max(20),
        asset: assetSchema().optional(),
        is_correct: z.boolean(),
      })
    )
    .min(2)
    .max(6),
});

export const GT007DifficultySchema = z.object({
  part_count: z.number().int().min(2).max(3),
  distractor_count: z.number().int().min(0).max(4),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT007Content = z.infer<typeof GT007ContentSchema>;
export type GT007Difficulty = z.infer<typeof GT007DifficultySchema>;

export default defineTemplate({
  code: "GT-007",
  name: "Tách gộp số",
  mechanic: "number-bond",
  layouts: ["number-bond-tree", "ten-frame-split"],
  content_contract: GT007ContentSchema,
  difficulty_contract: GT007DifficultySchema,
  limits: {
    item_count: [2, 6],
    distractor_count: [0, 4],
    target_count: [1, 3],
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
  events: ["game_started", "bond_selected", "part_filled", "game_completed"],
  engine_session: "NumberBondSession",
  status: "published",
  version: 1,
});
