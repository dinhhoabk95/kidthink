import { z } from "zod";
import type { GameTemplate } from "../types";

export const EmojiRef = z.string().min(1);

export const GT001ContentSchema = z.object({
  prompt_vi: z.string().min(4).max(80),
  prompt_audio_ref: z.string().optional(),
  target_item: z.object({
    item_id: z.string(),
    asset: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
      z.object({ kind: z.literal("image"), path: z.string() }),
    ]),
  }),
  options: z
    .array(
      z.object({
        item_id: z.string(),
        asset: z.discriminatedUnion("kind", [
          z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
          z.object({ kind: z.literal("image"), path: z.string() }),
        ]),
        is_correct: z.boolean(),
      })
    )
    .min(2)
    .max(6),
});

export const GT001DifficultySchema = z.object({
  distractor_count: z.number().int().min(1).max(5),
  hint_after_ms: z.number().int().min(5000).max(30_000),
  allow_retry: z.boolean(),
  shuffle_items: z.boolean(),
});

export type GT001Content = z.infer<typeof GT001ContentSchema>;
export type GT001Difficulty = z.infer<typeof GT001DifficultySchema>;

export const GT001Template: GameTemplate<
  typeof GT001ContentSchema,
  typeof GT001DifficultySchema
> = {
  code: "GT-001",
  name_vi: "Chọn một đáp án",
  mechanic: "tap-select",
  layouts: ["grid", "horizontal-row"],
  content_contract: GT001ContentSchema,
  difficulty_contract: GT001DifficultySchema,
  limits: {
    item_count: [2, 6],
    distractor_count: [1, 5],
    target_count: [1, 1],
  },
  age_min: 3,
  age_max: 6,
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: ["game_started", "item_selected", "game_completed"],
  engine_session: "TapSelectSession",
  status: "published",
  version: 1,
};
