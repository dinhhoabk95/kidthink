import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";
import { optionsSatisfyingRule } from "./matrix-rule.js";

export const GT011ContentSchema = z
  .object({
    ...promptFields(),
    matrix: z.object({
      rows: z.union([z.literal(2), z.literal(3)]),
      cols: z.union([z.literal(2), z.literal(3)]),
      cells: z
        .array(
          z.object({
            row: z.number().int().min(0).max(2),
            col: z.number().int().min(0).max(2),
            asset: assetSchema().nullable(),
          })
        )
        .min(4)
        .max(9),
    }),
    options: z
      .array(
        z.object({
          option_id: z.string().min(1).max(32),
          asset: assetSchema(),
          is_correct: z.boolean(),
        })
      )
      .min(3)
      .max(6),
  })
  .refine(
    (content) =>
      content.matrix.cells.filter((cell) => cell.asset === null).length === 1,
    {
      message:
        "Ma trận phải có đúng một ô trống — trẻ đặt thử vào đó để thấy quy luật khớp hay không.",
      path: ["matrix", "cells"],
    }
  )
  .refine(
    (content) => content.options.filter((o) => o.is_correct).length === 1,
    {
      message: "Phải có đúng một option đúng.",
      path: ["options"],
    }
  )
  .refine(
    (content) =>
      content.matrix.cells.length === content.matrix.rows * content.matrix.cols,
    {
      message: "Số ô phải bằng rows × cols.",
      path: ["matrix", "cells"],
    }
  )
  .refine(
    (content) => {
      const satisfying = optionsSatisfyingRule(content);
      return satisfying.length === 1 && satisfying[0]?.is_correct === true;
    },
    {
      message:
        "Đúng một option được làm hàng và cột của ô trống khớp quy luật, và nó phải là option is_correct. Nhiễu phải thật sự sai theo dữ liệu, không chỉ sai theo nhãn.",
      path: ["options"],
    }
  );

export type { MatrixContentShape } from "./matrix-rule.js";

export const GT011DifficultySchema = z.object({
  grid_size: z.union([z.literal(2), z.literal(3)]),
  distractor_count: z.number().int().min(2).max(5),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT011Content = z.infer<typeof GT011ContentSchema>;
export type GT011Difficulty = z.infer<typeof GT011DifficultySchema>;

export default defineTemplate({
  code: "GT-011",
  name: "Ma trận chọn hình",
  mechanic: "matrix-choice",
  layouts: ["matrix-3x3", "matrix-slot-grid"],
  content_contract: GT011ContentSchema,
  difficulty_contract: GT011DifficultySchema,
  limits: {
    item_count: [3, 6],
    distractor_count: [2, 5],
    target_count: [1, 1],
  },
  age_min: 5,
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
    "option_previewed",
    "option_selected",
    "game_completed",
  ],
  input: {
    family: "tap",
    verbs: ["tap"],
    tolerance_px: 24,
  },
  engine_session: "MatrixChoiceSession",
  status: "published",
  version: 1,
});
