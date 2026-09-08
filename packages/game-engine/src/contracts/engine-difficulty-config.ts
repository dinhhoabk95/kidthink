/**
 * Schema xác thực cấu hình bảng tra độ khó 37 engine (Task #263 T5).
 * Hợp đồng: docs/specs/05-content/level-difficulty-contract.md (BR-LDC-01..05)
 */
import { z } from "zod";

export const EngineDifficultyLevelParamsSchema = z
  .object({
    item_count: z.number().int().min(1),
    distractor_count: z.number().int().min(0).optional(),
    target_count: z.number().int().min(1).optional(),
    hint_after_ms: z.number().int().min(1000).optional(),
    allow_retry: z.boolean().optional(),
  })
  .passthrough();

export const EngineDifficultyRowSchema = z.object({
  difficulty_fixed: z.boolean().default(false),
  reason: z
    .string()
    .min(10, "Mỗi engine bắt buộc phải có reason giải thích lý do sư phạm"),
  levels: z.object({
    "1": EngineDifficultyLevelParamsSchema,
    "2": EngineDifficultyLevelParamsSchema,
    "3": EngineDifficultyLevelParamsSchema,
    "4": EngineDifficultyLevelParamsSchema,
    "5": EngineDifficultyLevelParamsSchema,
  }),
});

export const EngineDifficultyParamsConfigSchema = z.object({
  engines: z.record(z.string().regex(/^GT-\d{3}$/), EngineDifficultyRowSchema),
});

export type EngineDifficultyLevelParams = z.infer<
  typeof EngineDifficultyLevelParamsSchema
>;
export type EngineDifficultyRow = z.infer<typeof EngineDifficultyRowSchema>;
export type EngineDifficultyParamsConfig = z.infer<
  typeof EngineDifficultyParamsConfigSchema
>;

import ENGINE_DIFFICULTY_PARAMS_RAW from "../../config/engine-difficulty-params.json" with {
  type: "json",
};

export const ENGINE_DIFFICULTY_PARAMS =
  ENGINE_DIFFICULTY_PARAMS_RAW as EngineDifficultyParamsConfig;

export function getEngineDifficultyParams(
  engineCode: string,
  difficulty: number
): EngineDifficultyLevelParams {
  const diffKey = String(Math.max(1, Math.min(5, difficulty))) as
    | "1"
    | "2"
    | "3"
    | "4"
    | "5";
  const row = ENGINE_DIFFICULTY_PARAMS.engines[engineCode];
  if (!row) {
    throw new Error(
      `[BR-LDC-01] Không tìm thấy config độ khó cho engine ${engineCode}`
    );
  }
  return row.levels[diffKey];
}
