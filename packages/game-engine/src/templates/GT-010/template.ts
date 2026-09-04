import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";
import { evaluateQuestionAnswer, solveEquationSystem } from "./solver.js";

const symbolDefSchema = () =>
  z.object({
    symbol_id: z.string().min(1).max(32),
    asset: assetSchema(),
  });

const equationSchema = () =>
  z.object({
    equation_id: z.string().min(1).max(32),
    left: z.array(z.string().min(1).max(32)).min(1).max(3),
    right_value: z.number().int().min(1).max(30),
  });

const questionSchema = z.union([
  z.object({
    kind: z.literal("value"),
    symbol_id: z.string().min(1).max(32),
  }),
  z.object({
    kind: z.literal("sum"),
    symbol_ids: z.array(z.string().min(1).max(32)).min(2).max(3),
  }),
]);

const optionSchema = () =>
  z.object({
    value: z.number().int().min(1).max(30),
    is_correct: z.boolean(),
  });

export const GT010BaseSchema = z.object({
  ...promptFields(),
  symbols: z.array(symbolDefSchema()).min(2).max(3),
  equations: z.array(equationSchema()).min(2).max(3),
  question: questionSchema,
  options: z.array(optionSchema()).min(2).max(6),
});

export const GT010ContentSchema = GT010BaseSchema.refine(
  (content) => {
    const symbolIds = new Set(content.symbols.map((s) => s.symbol_id));
    for (const eq of content.equations) {
      if (!eq.left.every((sym) => symbolIds.has(sym))) {
        return false;
      }
    }
    if (content.question.kind === "value") {
      if (!symbolIds.has(content.question.symbol_id)) {
        return false;
      }
    } else if (
      !content.question.symbol_ids.every((sym) => symbolIds.has(sym))
    ) {
      return false;
    }
    return true;
  },
  {
    message:
      "Mọi biểu tượng trong phương trình và câu hỏi phải được khai báo trong symbols.",
    path: ["equations"],
  }
).refine(
  (content) => {
    const symbolIds = content.symbols.map((s) => s.symbol_id);
    const solutions = solveEquationSystem(symbolIds, content.equations);
    if (solutions.length !== 1) {
      return false;
    }

    const firstSol = solutions[0];
    if (!firstSol) {
      return false;
    }

    const correctValue = evaluateQuestionAnswer(firstSol, content.question);
    const correctOptions = content.options.filter((o) => o.is_correct);
    const firstOpt = correctOptions[0];
    if (correctOptions.length !== 1 || !firstOpt) {
      return false;
    }

    return firstOpt.value === correctValue;
  },
  {
    message:
      "Hệ phương trình phải có đúng 1 nghiệm nguyên dương duy nhất, và đúng 1 phương án khớp với kết quả câu hỏi.",
    path: ["options"],
  }
);

export const GT010DifficultySchema = z.object({
  equation_count: z.number().int().min(2).max(3),
  step_count: z.number().int().min(1).max(3),
  distractor_count: z.number().int().min(1).max(5),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT010Content = z.infer<typeof GT010ContentSchema>;
export type GT010Difficulty = z.infer<typeof GT010DifficultySchema>;

export default defineTemplate({
  code: "GT-010",
  name: "Thay thế biểu tượng",
  mechanic: "substitution",
  input: {
    family: "tap",
    verbs: ["tap"],
    tolerance_px: 24,
  },
  layouts: ["equation-rows", "grid"],
  content_contract: GT010ContentSchema,
  difficulty_contract: GT010DifficultySchema,
  limits: {
    item_count: [2, 6],
    distractor_count: [1, 5],
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
    "equation_solved",
    "value_selected",
    "game_completed",
  ],
  engine_session: "SubstitutionSession",
  status: "published",
  version: 1,
});
