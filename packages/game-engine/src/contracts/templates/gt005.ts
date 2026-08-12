import { z } from "zod";
import type { GameTemplate } from "../types";

export const EmojiRef = z.string().min(1);

export const GT005ContentSchema = z.object({
  prompt_vi: z.string().min(4).max(80),
  prompt_audio_ref: z.string().optional(),
  pairs: z
    .array(
      z.object({
        pair_id: z.string(),
        left: z.object({
          item_id: z.string(),
          asset: z.discriminatedUnion("kind", [
            z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
            z.object({ kind: z.literal("image"), path: z.string() }),
          ]),
        }),
        right: z.object({
          item_id: z.string(),
          asset: z.discriminatedUnion("kind", [
            z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
            z.object({ kind: z.literal("image"), path: z.string() }),
          ]),
        }),
      })
    )
    .min(2)
    .max(6),
});

export const GT005DifficultySchema = z.object({
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
  shuffle_sides: z.boolean(),
});

export type GT005Content = z.infer<typeof GT005ContentSchema>;
export type GT005Difficulty = z.infer<typeof GT005DifficultySchema>;

export const GT005Template: GameTemplate<
  typeof GT005ContentSchema,
  typeof GT005DifficultySchema
> = {
  code: "GT-005",
  name_vi: "Ghép cặp",
  mechanic: "pair-match",
  layouts: ["two-column-matching", "card-flip-grid"],
  content_contract: GT005ContentSchema,
  difficulty_contract: GT005DifficultySchema,
  limits: {
    item_count: [4, 12],
    distractor_count: [0, 0],
    target_count: [2, 6],
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
  events: ["game_started", "pair_selected", "pair_matched", "game_completed"],
  engine_session: "PairMatchSession",
  status: "published",
  version: 1,
};
