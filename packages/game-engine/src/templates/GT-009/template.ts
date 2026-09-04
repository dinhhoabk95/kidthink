import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";
import { cluesNarrowToExactlyOne } from "./deduction.js";

/**
 * Vị ngữ của một manh mối — union phân biệt theo `kind`.
 * Mỗi manh mối thu hẹp tập ứng viên; không manh mối nào tự nó chỉ ra đáp án.
 */
export const GT009PredicateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("greater_than"), value: z.number().int() }),
  z.object({ kind: z.literal("less_than"), value: z.number().int() }),
  z.object({ kind: z.literal("not_equal"), value: z.number().int() }),
  z.object({
    kind: z.literal("between"),
    min: z.number().int(),
    max: z.number().int(),
  }),
]);

export const GT009BaseSchema = z.object({
  ...promptFields(),
  candidates: z
    .array(
      z.object({
        candidate_id: z.string().min(1).max(32),
        value: z.number().int().min(1).max(20),
        asset: assetSchema().optional(),
      })
    )
    .min(4)
    .max(10),
  clues: z
    .array(
      z.object({
        clue_id: z.string().min(1).max(32),
        text: z.string().min(1).max(40),
        predicate: GT009PredicateSchema,
      })
    )
    .min(1)
    .max(3),
  answer_candidate_id: z.string().min(1).max(32),
});

export const GT009ContentSchema = GT009BaseSchema.refine(
  (content) => cluesNarrowToExactlyOne(content).length === 1,
  {
    message:
      "Bộ manh mối phải thu hẹp về đúng một ứng viên (BR-MTB-14): trẻ tự đi tới đáp án bằng loại trừ.",
    path: ["clues"],
  }
).refine(
  (content) =>
    cluesNarrowToExactlyOne(content)[0]?.candidate_id ===
    content.answer_candidate_id,
  {
    message: "answer_candidate_id phải là ứng viên duy nhất thoả mọi manh mối.",
    path: ["answer_candidate_id"],
  }
);

export const GT009DifficultySchema = z.object({
  clue_count: z.number().int().min(1).max(3),
  candidate_count: z.number().int().min(4).max(10),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type { GT009ContentShape } from "./deduction.js";

export type GT009Content = z.infer<typeof GT009ContentSchema>;
export type GT009Difficulty = z.infer<typeof GT009DifficultySchema>;

export default defineTemplate({
  code: "GT-009",
  name: "Loại trừ theo manh mối",
  mechanic: "clue-deduction",
  input: {
    family: "tap",
    verbs: ["tap"],
    tolerance_px: 24,
  },
  layouts: ["clue-board"],
  content_contract: GT009ContentSchema,
  difficulty_contract: GT009DifficultySchema,
  limits: {
    item_count: [4, 10],
    distractor_count: [3, 9],
    target_count: [1, 1],
  },
  age_min: 4,
  age_max: 6,
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: [
    "game_started",
    "clue_revealed",
    "candidate_eliminated",
    "game_completed",
  ],
  engine_session: "ClueDeductionSession",
  status: "published",
  version: 1,
});
