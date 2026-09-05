import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT029ItemSchema = z.object({
  item_id: z.string().min(1).max(32),
  asset: assetSchema(),
});

export const GT029AnswerOptionSchema = z.object({
  option_id: z.string().min(1).max(32),
  value: z.number().int().nonnegative(),
  is_correct: z.boolean(),
});

export const GT029ContentSchema = z
  .object({
    ...promptFields(),
    initial_items: z.array(GT029ItemSchema).min(2).max(10),
    remove_count: z.number().int().min(1),
    answer_options: z.array(GT029AnswerOptionSchema).min(2).max(5),
  })
  .refine(
    (data) => {
      // BR-E029-02: remove_count >= 1 && remove_count < initial_items.length
      return data.remove_count < data.initial_items.length;
    },
    {
      message:
        "remove_count phải nhỏ hơn số vật ban đầu (initial_items.length) (BR-E029-02)",
      path: ["remove_count"],
    }
  )
  .refine(
    (data) => {
      // BR-E029-01: Exactly one option with is_correct = true and its value = initial_items.length - remove_count
      const correctOptions = data.answer_options.filter((o) => o.is_correct);
      if (correctOptions.length !== 1) {
        return false;
      }
      const expected = data.initial_items.length - data.remove_count;
      return correctOptions[0]?.value === expected;
    },
    {
      message:
        "Phải có đúng 1 đáp án đúng và giá trị của nó phải bằng initial_items.length - remove_count (BR-E029-01)",
      path: ["answer_options"],
    }
  );

export const GT029DifficultySchema = z.object({
  initial_count: z.number().int().min(2).max(10),
  remove_count: z.number().int().min(1),
  allow_retry: z.boolean().default(true),
  hint_after_ms: z.number().int().min(1000).default(8000),
  shuffle_items: z.boolean().default(true),
});

export type GT029Content = z.infer<typeof GT029ContentSchema>;
export type GT029Difficulty = z.infer<typeof GT029DifficultySchema>;

export default defineTemplate({
  code: "GT-029",
  name: "Bớt khỏi nhóm",
  mechanic: "remove-from-set",
  layouts: ["grid", "flex-wrap"],
  content_contract: GT029ContentSchema,
  difficulty_contract: GT029DifficultySchema,
  limits: {
    item_count: [2, 10],
    distractor_count: [1, 4],
    target_count: [1, 1],
  },
  age_min: 4,
  age_max: 6,
  banned_age_bands: ["3-4"],
  requires_tap_fallback: true,
  input: {
    family: "tap",
    verbs: ["tap"],
    tolerance_px: 24,
  },
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "item_removed",
    "item_restored",
    "answer_selected",
    "game_completed",
  ],
  engine_session: "GT029Session",
  status: "published",
  version: 1,
});
