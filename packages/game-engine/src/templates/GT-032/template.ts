import { z } from "zod";
import { promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT032CupShapeSchema = z.enum([
  "standard",
  "narrow_tall",
  "wide_short",
  "fluted",
]);

export const GT032QuestionTypeSchema = z.enum([
  "more",
  "less",
  "same",
  "pour_to_mark",
]);

export const GT032CupSchema = z.object({
  cup_id: z.string().min(1),
  shape: GT032CupShapeSchema,
  capacity_units: z.number().int().min(1).max(20),
  fill_units: z.number().int().min(0).max(20),
  color: z.string().default("sky"),
});

export const GT032ContentSchema = z
  .object({
    ...promptFields(),
    cups: z.array(GT032CupSchema).min(2).max(4),
    question_type: GT032QuestionTypeSchema,
    conservation_trap: z.boolean().default(false),
  })
  .refine((c) => c.cups.every((cup) => cup.fill_units <= cup.capacity_units), {
    message:
      "Mức nước fill_units phải nhỏ hơn hoặc bằng dung tích capacity_units của cốc (BR-E032-01)",
    path: ["cups"],
  })
  .refine(
    (c) => {
      if (!c.conservation_trap) {
        return true;
      }
      for (let i = 0; i < c.cups.length; i++) {
        for (let j = i + 1; j < c.cups.length; j++) {
          const c1 = c.cups[i];
          const c2 = c.cups[j];
          if (
            c1 &&
            c2 &&
            c1.fill_units === c2.fill_units &&
            c1.shape !== c2.shape
          ) {
            return true;
          }
        }
      }
      return false;
    },
    {
      message:
        "Khi conservation_trap bật, phải có ít nhất 2 cốc cùng fill_units mà khác shape (BR-E032-02)",
      path: ["conservation_trap"],
    }
  );

export const GT032DifficultySchema = z.object({
  cup_count: z.number().int().min(2).max(4).default(2),
  level_steps: z.number().int().min(1).max(10).default(5),
  conservation_trap: z.boolean().default(false),
  allow_retry: z.boolean().default(true),
  hint_after_ms: z.number().int().min(1000).default(8000),
});

export type GT032CupShape = z.infer<typeof GT032CupShapeSchema>;
export type GT032QuestionType = z.infer<typeof GT032QuestionTypeSchema>;
export type GT032Cup = z.infer<typeof GT032CupSchema>;
export type GT032Content = z.infer<typeof GT032ContentSchema>;
export type GT032Difficulty = z.infer<typeof GT032DifficultySchema>;

export default defineTemplate({
  code: "GT-032",
  name: "So lượng chất lỏng",
  mechanic: "pour-quantity",
  status: "published",
  version: 1,
  engine_session: "GT032Session",
  layouts: ["horizontal-row", "split-columns"],
  content_contract: GT032ContentSchema,
  difficulty_contract: GT032DifficultySchema,
  limits: {
    item_count: [2, 4],
    distractor_count: [0, 0],
    target_count: [1, 1],
  },
  banned_age_bands: ["3-4", "4-5"],
  age_min: 5,
  age_max: 6,
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: ["game_started", "cup_selected", "liquid_poured", "game_completed"],
});
