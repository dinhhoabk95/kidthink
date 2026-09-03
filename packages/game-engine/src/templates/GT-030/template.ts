import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT030ObjectSchema = z.object({
  object_id: z.string().min(1),
  asset: assetSchema(),
  length_in_units: z.number().int().min(2).max(10),
});

export const GT030UnitSchema = z.object({
  unit_id: z.string().min(1),
  asset: assetSchema(),
});

export const GT030AnswerOptionSchema = z.object({
  option_id: z.string().min(1),
  value: z.number().int().min(1).max(20),
  is_correct: z.boolean(),
});

export const GT030ContentSchema = z
  .object({
    ...promptFields(),
    object: GT030ObjectSchema,
    unit: GT030UnitSchema,
    answer_options: z.array(GT030AnswerOptionSchema).min(2).max(5),
  })
  .refine(
    (c) => {
      const correctOpts = c.answer_options.filter((o) => o.is_correct);
      return (
        correctOpts.length === 1 &&
        correctOpts[0]?.value === c.object.length_in_units
      );
    },
    {
      message:
        "Phải có đúng 1 đáp án đúng và giá trị của nó phải bằng object.length_in_units (BR-E030-01)",
      path: ["answer_options"],
    }
  );

export const GT030DifficultySchema = z.object({
  length_in_units: z.number().int().min(2).max(10),
  gap_tolerance_pct: z.number().min(5).max(20).default(10),
  allow_retry: z.boolean().default(true),
  hint_after_ms: z.number().int().min(1000).default(8000),
});

export type GT030Content = z.infer<typeof GT030ContentSchema>;
export type GT030Difficulty = z.infer<typeof GT030DifficultySchema>;

export default defineTemplate({
  code: "GT-030",
  name: "Đo bằng đơn vị lặp",
  mechanic: "measure-with-unit",
  status: "published",
  version: 1,
  engine_session: "GT030Session",
  layouts: ["measure-strip", "horizontal-track"],
  content_contract: GT030ContentSchema,
  difficulty_contract: GT030DifficultySchema,
  limits: {
    item_count: [2, 5],
    distractor_count: [1, 4],
    target_count: [2, 10],
  },
  banned_age_bands: ["3-4", "4-5"],
  age_min: 5,
  age_max: 6,
  requires_tap_fallback: true,
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "unit_placed",
    "unit_removed",
    "answer_selected",
    "game_completed",
  ],
});
