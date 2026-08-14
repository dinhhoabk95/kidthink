import { z } from "zod";
import { EmojiRef } from "../shared-fields";
import type { GameTemplate } from "../types";

export const GT006ContentSchema = z.object({
  prompt_vi: z.string().min(4).max(80),
  prompt_audio_ref: z.string().optional(),
  sequence: z
    .array(
      z.object({
        step_id: z.string(),
        order_index: z.number().int().min(0),
        asset: z.discriminatedUnion("kind", [
          z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
          z.object({ kind: z.literal("image"), path: z.string() }),
        ]),
        label_vi: z.string().optional(),
      })
    )
    .min(3)
    .max(5),
});

export const GT006DifficultySchema = z.object({
  hint_after_ms: z.number().int().min(10_000).max(40_000),
  allow_retry: z.boolean(),
  shuffle_initial: z.boolean(),
});

export type GT006Content = z.infer<typeof GT006ContentSchema>;
export type GT006Difficulty = z.infer<typeof GT006DifficultySchema>;

export const GT006Template: GameTemplate<
  typeof GT006ContentSchema,
  typeof GT006DifficultySchema
> = {
  code: "GT-006",
  name_vi: "Sắp xếp thứ tự",
  mechanic: "sequence-order",
  layouts: ["horizontal-track", "step-ladder"],
  content_contract: GT006ContentSchema,
  difficulty_contract: GT006DifficultySchema,
  limits: {
    item_count: [3, 5],
    distractor_count: [0, 0],
    target_count: [3, 5],
  },
  age_min: 5,
  age_max: 6,
  banned_age_bands: ["3-4", "4-5"],
  requires_tap_fallback: true,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: [
    "game_started",
    "step_reordered",
    "sequence_submitted",
    "game_completed",
  ],
  engine_session: "SequenceOrderSession",
  status: "published",
  version: 1,
};
