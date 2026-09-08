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

    // Các tham số cấu hình độ khó chi tiết cho 37 engine (Task #263)
    allow_flip: z.boolean().optional(),
    allow_loop: z.boolean().optional(),
    blank_count: z.number().int().optional(),
    candidate_count: z.number().int().optional(),
    category_count: z.number().int().optional(),
    checkpoint_count: z.number().int().optional(),
    clue_count: z.number().int().optional(),
    coin_kind_count: z.number().int().optional(),
    collectible_count: z.number().int().optional(),
    color_count: z.number().int().optional(),
    connection_count: z.number().int().optional(),
    conservation_trap: z.boolean().optional(),
    cup_count: z.number().int().optional(),
    dead_end_count: z.number().int().optional(),
    difference_count: z.number().int().optional(),
    equation_count: z.number().int().optional(),
    exact_change: z.boolean().optional(),
    flash_ms: z.number().int().optional(),
    gap_tolerance_pct: z.number().optional(),
    go_ratio: z.number().optional(),
    grid_size: z.number().int().optional(),
    hidden_cube_count: z.number().int().optional(),
    initial_count: z.number().int().optional(),
    instrument_count: z.number().int().optional(),
    isi_ms: z.number().int().optional(),
    length_in_units: z.number().int().optional(),
    level_steps: z.number().int().optional(),
    max_commands: z.number().int().optional(),
    min_repetitions: z.number().int().optional(),
    minute_step: z
      .union([z.literal(60), z.literal(30), z.literal(15)])
      .optional(),
    obstacle_count: z.number().int().optional(),
    palette_size: z.number().int().optional(),
    part_count: z.number().int().optional(),
    parts_count: z.number().int().optional(),
    pattern_length: z.number().int().optional(),
    peek_all_initial_ms: z.number().int().optional(),
    pour_count: z.number().int().optional(),
    remove_count: z.number().int().optional(),
    required_cell_count: z.number().int().optional(),
    rotation_step: z.number().int().optional(),
    rule_count: z.number().int().optional(),
    show_anchor_outline: z.boolean().optional(),
    show_axis_guide: z.boolean().optional(),
    show_numbered_dots: z.boolean().optional(),
    signal_duration_ms: z.number().int().optional(),
    slot_count: z.number().int().optional(),
    snap_radius_px: z.number().optional(),
    step: z.number().int().optional(),
    step_count: z.number().int().optional(),
    stimulus_window_ms: z.number().int().optional(),
    switch_interval_trials: z.number().int().optional(),
    target_amount: z.number().int().optional(),
    target_length_units: z.number().int().optional(),
    target_speed_px_per_sec: z.number().optional(),
    tempo_bpm: z.number().int().optional(),
    tolerance_px: z.number().optional(),
    track_length: z.number().int().optional(),
    tray_count: z.number().int().optional(),
    turn_count: z.number().int().optional(),
    weight_span: z.number().int().optional(),
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
