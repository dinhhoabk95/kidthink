import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";
import { isSameTime } from "#src/systems/rotation-system";

const clockTimeSchema = () =>
  z.object({
    hour: z.number().int().min(1).max(12),
    minute: z.union([z.literal(0), z.literal(30)]),
  });

const readOptionSchema = () =>
  z.object({
    hour: z.number().int().min(1).max(12),
    minute: z.union([z.literal(0), z.literal(30)]),
    is_correct: z.boolean(),
  });

const activityCardSchema = () =>
  z.object({
    card_id: z.string().min(1).max(32),
    asset: assetSchema(),
    hour: z.number().int().min(1).max(12),
    minute: z.union([z.literal(0), z.literal(30)]),
  });

export const GT016BaseSchema = z.object({
  ...promptFields(),
  mode: z.enum(["read", "set", "match"]).default("read"),
  target_time: clockTimeSchema(),
  initial_time: clockTimeSchema().optional(),
  options: z.array(readOptionSchema()).min(0).max(4).default([]),
  activity_cards: z.array(activityCardSchema()).min(0).max(3).default([]),
});

export const GT016ContentSchema = GT016BaseSchema.refine(
  (content) => {
    if (content.mode === "read") {
      if (content.options.length < 2) {
        return false;
      }
      const correct = content.options.filter((o) => o.is_correct);
      if (correct.length !== 1) {
        return false;
      }
      return isSameTime(correct[0], content.target_time);
    }
    if (content.mode === "match") {
      return content.activity_cards.length >= 2;
    }
    return true;
  },
  {
    message:
      "Chế độ 'read' yêu cầu ít nhất 2 options và đúng 1 option khớp với target_time. Chế độ 'match' yêu cầu ít nhất 2 activity_cards.",
    path: ["options"],
  }
);

export const GT016DifficultySchema = z.object({
  minute_step: z.union([z.literal(30), z.literal(60)]).default(30),
  distractor_count: z.number().int().min(1).max(3),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT016Content = z.infer<typeof GT016ContentSchema>;
export type GT016Difficulty = z.infer<typeof GT016DifficultySchema>;

export default defineTemplate({
  code: "GT-016",
  name: "Xoay kim đồng hồ",
  mechanic: "clock-hands",
  layouts: ["grid"],
  content_contract: GT016ContentSchema,
  difficulty_contract: GT016DifficultySchema,
  limits: {
    item_count: [2, 4],
    distractor_count: [1, 3],
    target_count: [1, 1],
  },
  age_min: 5,
  age_max: 6,
  requires_tap_fallback: true,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: ["game_started", "hand_rotated", "time_submitted", "game_completed"],
  engine_session: "ClockHandsSession",
  status: "published",
  version: 1,
});
