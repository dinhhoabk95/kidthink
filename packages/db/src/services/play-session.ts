import {
  computeUpdate,
  evaluateBadges,
  type MasteryState,
  selectNext,
} from "@mindkid/adaptive";
import { AppError } from "@mindkid/auth";
import { enqueue } from "@mindkid/queue";
import {
  computeSessionResult,
  computeStars,
  formatKidSurfaceResponse,
} from "@mindkid/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getOwnerDb } from "#src/client";
import { childBadges, masteryState } from "#src/schema/adaptive";
import { childProfiles } from "#src/schema/child";
import { gameTemplates } from "#src/schema/game";
import {
  childDailyStats,
  playSessions,
  telemetryEvents,
} from "#src/schema/play";
import { contentSkillMap } from "#src/schema/tagging";

export const ALLOWED_EVENT_NAMES = new Set([
  "game_started",
  "instructionewed",
  "game_paused",
  "game_resumed",
  "game_completed",
  "game_abandoned",
  "intro_period_started",
  "intro_item_presented",
  "intro_item_deferred",
  "intro_recall_answered",
  "tts_unavailable",
  "round_started",
  "question_shown",
  "answer_selected",
  "answer_correct",
  "answer_incorrect",
  "round_completed",
  "round_retried",
  "round_skipped",
  "hint_requested",
  "scaffold_escalated",
  "demo_shown",
  "asset_load_failed",
  "fps_sample",
  "parent_gate_shown",
  "parent_gate_passed",
  "parent_gate_failed",
  // Tương tác trong khuôn — catalog §7.2 (T99 WP99.0)
  "item_selected",
  "selection_submitted",
  "item_dragged",
  "item_dropped",
  "item_sorted",
  "item_placed",
  "pair_selected",
  "pair_matched",
  "step_reordered",
  "sequence_submitted",
  "bond_selected",
  "part_filled",
  "clue_revealed",
  "candidate_eliminated",
  "option_previewed",
  "option_selected",
  "path_step",
  "path_blocked",
  "path_submitted",
  "equation_solved",
  "value_selected",
  "flash_shown",
  "flash_hidden",
  "flash_replayed",
  "balance_changed",
  "cell_filled",
  "constraint_violated",
  "hand_rotated",
  "time_submitted",
  "model_rotated",
  "item_revealed",
  "checkpoint_reached",
  "trace_completed",
  "item_tapped",
  "count_undone",
  "count_submitted",
  "item_removed",
  "item_restored",
  "unit_placed",
  "unit_removed",
  "coin_placed",
  "coin_removed",
  "cup_selected",
  "liquid_poured",
  "yarn_placed",
  "yarn_removed",
  "pattern_played",
  "beat_tapped",
  "command_added",
  "command_removed",
  "program_run",
  "program_failed",
  "element_placed",
  "element_removed",
  "creation_submitted",
  "rule_detected",
]);

const PII_FIELDS = new Set([
  "display_name",
  "birth_year",
  "user_id",
  "email",
  "ip",
  "score",
]);

const EVENT_PAYLOAD_FIELDS: Readonly<Record<string, ReadonlySet<string>>> = {
  game_started: new Set([
    "template_code",
    "difficulty",
    "age_band",
    "device",
    "reduced_motion",
    "round_index",
  ]),
  instructionewed: new Set(["modality", "replay_count"]),
  game_paused: new Set(["reason"]),
  game_resumed: new Set(["paused_ms"]),
  game_completed: new Set(["duration_ms", "rounds_total", "rounds_correct"]),
  game_abandoned: new Set(["duration_ms", "last_round_index", "reason"]),
  intro_period_started: new Set(["period", "step_index"]),
  intro_item_presented: new Set(["item_id", "period", "tts_used"]),
  intro_item_deferred: new Set(["item_id", "miss_count"]),
  intro_recall_answered: new Set(["item_id", "answer_correct"]),
  tts_unavailable: new Set(["prompt_id", "reason"]),
  round_started: new Set(["round_index", "item_count", "distractor_count"]),
  question_shown: new Set(["round_index", "prompt_kind"]),
  answer_selected: new Set([
    "round_index",
    "attempt_index",
    "target_slot",
    "elapsed_ms",
    "option_id",
    "value",
    "is_correct",
  ]),
  answer_correct: new Set(["round_index", "attempt_index", "elapsed_ms"]),
  answer_incorrect: new Set([
    "round_index",
    "attempt_index",
    "elapsed_ms",
    "error_kind",
  ]),
  round_completed: new Set([
    "round_index",
    "attempts",
    "hints_used",
    "duration_ms",
  ]),
  round_retried: new Set(["round_index", "retry_index"]),
  round_skipped: new Set(["round_index", "reason"]),
  hint_requested: new Set(["round_index", "source"]),
  scaffold_escalated: new Set([
    "round_index",
    "level",
    "trigger",
    "elapsed_ms",
  ]),
  scaffold_resolved: new Set(["round_index", "level", "trigger", "elapsed_ms"]),
  demo_shown: new Set(["round_index", "speed"]),
  asset_load_failed: new Set(["asset_kind", "asset_ref", "retry_count"]),
  fps_sample: new Set(["p50", "p95", "min", "sample_count"]),
  parent_gate_shown: new Set(["trigger"]),
  parent_gate_passed: new Set(["attempts"]),
  parent_gate_failed: new Set(["attempts"]),
  item_selected: new Set(["item_id", "is_correct", "round_index"]),
  selection_submitted: new Set(["is_correct", "round_index"]),
  item_dragged: new Set(["item_id", "round_index"]),
  item_dropped: new Set([
    "item_id",
    "container_id",
    "is_correct",
    "round_index",
  ]),
  item_sorted: new Set(["item_id", "group_id", "is_correct", "round_index"]),
  item_placed: new Set(["item_id", "slot_id", "is_correct", "round_index"]),
  pair_selected: new Set(["item_id", "round_index"]),
  pair_matched: new Set([
    "pair_id",
    "left_item_id",
    "right_item_id",
    "round_index",
  ]),
  step_reordered: new Set([
    "from_index",
    "to_index",
    "current_sequence",
    "round_index",
  ]),
  sequence_submitted: new Set(["is_correct", "round_index"]),
  bond_selected: new Set(["option_id", "part_id", "is_correct", "round_index"]),
  part_filled: new Set(["part_id", "value", "round_index"]),
  clue_revealed: new Set([
    "clue_id",
    "revealed_count",
    "remaining_count",
    "round_index",
  ]),
  candidate_eliminated: new Set(["candidate_id", "clue_id", "round_index"]),
  option_previewed: new Set([
    "option_id",
    "row_matches",
    "col_matches",
    "round_index",
  ]),
  option_selected: new Set(["option_id", "is_correct", "round_index"]),
  path_step: new Set(["row", "col", "step_index", "round_index"]),
  path_blocked: new Set(["row", "col", "reason", "retreated", "round_index"]),
  path_submitted: new Set(["is_correct", "step_count", "round_index"]),
  equation_solved: new Set(["symbol_id", "value", "round_index"]),
  value_selected: new Set(["value", "is_correct", "round_index"]),
  flash_shown: new Set(["duration_ms", "round_index"]),
  flash_hidden: new Set(["elapsed_ms", "round_index"]),
  flash_replayed: new Set(["round_index"]),
  balance_changed: new Set(["tilt_angle", "state", "round_index"]),
  cell_filled: new Set(["row", "col", "symbol_id", "is_valid", "round_index"]),
  constraint_violated: new Set(["row", "col", "symbol_id", "round_index"]),
  hand_rotated: new Set(["hand", "time", "round_index"]),
  time_submitted: new Set(["time", "card_id", "is_correct", "round_index"]),
  model_rotated: new Set(["angle", "hidden_cubes_remaining", "round_index"]),
  item_revealed: new Set(["item_id", "round_index"]),
  checkpoint_reached: new Set([
    "waypoint_id",
    "checkpoint_index",
    "total_waypoints",
    "round_index",
  ]),
  trace_completed: new Set(["shape_name", "round_index"]),
  item_tapped: new Set(["item_id", "current_total", "step", "round_index"]),
  count_undone: new Set(["item_id", "current_total", "step", "round_index"]),
  count_submitted: new Set([
    "submitted_total",
    "target_total",
    "is_correct",
    "round_index",
  ]),
  item_removed: new Set([
    "item_id",
    "removed_count",
    "target_remove_count",
    "round_index",
  ]),
  item_restored: new Set([
    "item_id",
    "removed_count",
    "remaining_needed",
    "round_index",
  ]),
  unit_placed: new Set([
    "slot_index",
    "placed_count",
    "target_count",
    "round_index",
  ]),
  unit_removed: new Set(["slot_index", "placed_count", "round_index"]),
  coin_placed: new Set([
    "coin_id",
    "value",
    "current_total",
    "target_amount",
    "round_index",
  ]),
  coin_removed: new Set([
    "coin_id",
    "value",
    "current_total",
    "target_amount",
    "round_index",
  ]),
  cup_selected: new Set(["cup_id", "fill_units", "is_correct", "round_index"]),
  liquid_poured: new Set([
    "cup_id",
    "fill_units",
    "target_units",
    "round_index",
  ]),
  yarn_placed: new Set([
    "cell_index",
    "color_id",
    "is_correct",
    "row",
    "col",
    "round_index",
  ]),
  yarn_removed: new Set([
    "cell_index",
    "color_id",
    "row",
    "col",
    "round_index",
  ]),
  pattern_played: new Set([
    "tempo_bpm",
    "pattern_length",
    "is_replay",
    "round_index",
  ]),
  beat_tapped: new Set([
    "instrument_id",
    "step_index",
    "is_correct",
    "round_index",
  ]),
  command_added: new Set(["command", "command_index", "round_index"]),
  command_removed: new Set(["command", "command_index", "round_index"]),
  program_run: new Set(["command_count", "round_index"]),
  program_failed: new Set(["failed_step", "reason", "round_index"]),
  element_placed: new Set(["slot_index", "element_id", "round_index"]),
  element_removed: new Set(["slot_index", "removed_id", "round_index"]),
  creation_submitted: new Set(["placed_items", "round_index"]),
  rule_detected: new Set([
    "detected",
    "motif",
    "repetitions",
    "score",
    "is_win",
    "round_index",
  ]),
};

const NON_NEGATIVE_INT = z.number().int().nonnegative();
/** Mã nội dung trong payload event tương tác — không phải chuỗi tự do (BR-EVT-02). */
const CONTENT_ID = z.string().regex(/^[a-zA-Z0-9_.:-]{1,64}$/);
/** Khuôn một vòng không phát `round_index`; khuôn nhiều vòng thì có. */
const OPTIONAL_ROUND_INDEX = NON_NEGATIVE_INT.optional();
const EVENT_PAYLOAD_SCHEMAS: Readonly<Record<string, z.AnyZodObject>> = {
  game_started: z.object({
    template_code: z.string().max(64),
    difficulty: z.union([z.string().max(32), NON_NEGATIVE_INT]),
    age_band: z.string().regex(/^\d-\d$/),
    device: z.enum(["tablet", "desktop", "mobile"]),
    reduced_motion: z.boolean(),
    round_index: NON_NEGATIVE_INT,
  }),
  instructionewed: z.object({
    modality: z.enum(["audio", "visual", "both"]),
    replay_count: NON_NEGATIVE_INT,
  }),
  game_paused: z.object({
    reason: z.enum(["user", "visibility", "parent_gate"]),
  }),
  game_resumed: z.object({ paused_ms: NON_NEGATIVE_INT }),
  game_completed: z.object({
    duration_ms: NON_NEGATIVE_INT,
    rounds_total: NON_NEGATIVE_INT,
    rounds_correct: NON_NEGATIVE_INT,
  }),
  game_abandoned: z.object({
    duration_ms: NON_NEGATIVE_INT,
    last_round_index: NON_NEGATIVE_INT,
    reason: z.enum(["exit", "timeout", "cap_reached"]),
  }),
  round_started: z.object({
    round_index: NON_NEGATIVE_INT,
    item_count: NON_NEGATIVE_INT,
    distractor_count: NON_NEGATIVE_INT,
  }),
  question_shown: z.object({
    round_index: NON_NEGATIVE_INT,
    prompt_kind: z.enum([
      "count",
      "compare",
      "sort",
      "match",
      "sequence",
      "select",
    ]),
  }),
  answer_selected: z.object({
    round_index: OPTIONAL_ROUND_INDEX,
    attempt_index: NON_NEGATIVE_INT.optional(),
    target_slot: z.number().int().nullable().optional(),
    elapsed_ms: NON_NEGATIVE_INT.optional(),
    option_id: CONTENT_ID.optional(),
    value: z.number().int().optional(),
    is_correct: z.boolean().optional(),
  }),
  answer_correct: z.object({
    round_index: NON_NEGATIVE_INT,
    attempt_index: NON_NEGATIVE_INT,
    elapsed_ms: NON_NEGATIVE_INT,
  }),
  answer_incorrect: z.object({
    round_index: NON_NEGATIVE_INT,
    attempt_index: NON_NEGATIVE_INT,
    elapsed_ms: NON_NEGATIVE_INT,
    error_kind: z.enum(["wrong_target", "wrong_item", "incomplete", "timeout"]),
  }),
  round_completed: z.object({
    round_index: NON_NEGATIVE_INT,
    attempts: NON_NEGATIVE_INT,
    hints_used: NON_NEGATIVE_INT,
    duration_ms: NON_NEGATIVE_INT,
  }),
  round_retried: z.object({
    round_index: NON_NEGATIVE_INT,
    retry_index: NON_NEGATIVE_INT,
  }),
  round_skipped: z.object({
    round_index: NON_NEGATIVE_INT,
    reason: z.enum(["scaffold_exhausted", "user"]),
  }),
  hint_requested: z.object({
    round_index: NON_NEGATIVE_INT,
    source: z.enum(["auto_timer", "auto_miss"]),
  }),
  scaffold_escalated: z.object({
    round_index: NON_NEGATIVE_INT,
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    trigger: z.enum(["timer", "miss_streak"]),
    elapsed_ms: NON_NEGATIVE_INT,
  }),
  demo_shown: z.object({
    round_index: NON_NEGATIVE_INT,
    speed: z.union([z.literal(1), z.literal(0.5)]),
  }),
  asset_load_failed: z.object({
    asset_kind: z.enum(["emoji", "image", "audio"]),
    asset_ref: z.string().regex(/^[a-zA-Z0-9_./:-]{1,128}$/),
    retry_count: NON_NEGATIVE_INT,
  }),
  fps_sample: z.object({
    p50: NON_NEGATIVE_INT,
    p95: NON_NEGATIVE_INT,
    min: NON_NEGATIVE_INT,
    sample_count: NON_NEGATIVE_INT,
  }),
  parent_gate_shown: z.object({ trigger: z.enum(["exit", "settings"]) }),
  parent_gate_passed: z.object({ attempts: NON_NEGATIVE_INT }),
  parent_gate_failed: z.object({ attempts: NON_NEGATIVE_INT }),
  item_selected: z.object({
    item_id: CONTENT_ID,
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  selection_submitted: z.object({
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  item_dragged: z.object({
    item_id: CONTENT_ID,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  item_dropped: z.object({
    item_id: CONTENT_ID,
    container_id: CONTENT_ID,
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  item_sorted: z.object({
    item_id: CONTENT_ID,
    group_id: CONTENT_ID,
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  item_placed: z.object({
    item_id: CONTENT_ID,
    slot_id: CONTENT_ID,
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  pair_selected: z.object({
    item_id: CONTENT_ID,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  pair_matched: z.object({
    pair_id: CONTENT_ID,
    left_item_id: CONTENT_ID,
    right_item_id: CONTENT_ID,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  step_reordered: z.object({
    from_index: NON_NEGATIVE_INT,
    to_index: NON_NEGATIVE_INT,
    current_sequence: z.array(CONTENT_ID).max(16),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  sequence_submitted: z.object({
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  bond_selected: z.object({
    option_id: CONTENT_ID,
    part_id: CONTENT_ID,
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  part_filled: z.object({
    part_id: CONTENT_ID,
    value: z.number().int(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  clue_revealed: z.object({
    clue_id: CONTENT_ID,
    revealed_count: NON_NEGATIVE_INT,
    remaining_count: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  candidate_eliminated: z.object({
    candidate_id: CONTENT_ID,
    clue_id: CONTENT_ID,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  option_previewed: z.object({
    option_id: CONTENT_ID,
    row_matches: z.boolean(),
    col_matches: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  option_selected: z.object({
    option_id: CONTENT_ID,
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  path_step: z.object({
    row: NON_NEGATIVE_INT,
    col: NON_NEGATIVE_INT,
    step_index: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  path_blocked: z.object({
    row: z.number().int(),
    col: z.number().int(),
    reason: z.enum(["outside", "not_adjacent", "wall"]),
    retreated: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  path_submitted: z.object({
    is_correct: z.boolean(),
    step_count: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  equation_solved: z.object({
    symbol_id: CONTENT_ID,
    value: z.number().int(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  value_selected: z.object({
    value: z.number().int(),
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  flash_shown: z.object({
    duration_ms: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  flash_hidden: z.object({
    elapsed_ms: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  flash_replayed: z.object({
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  balance_changed: z.object({
    tilt_angle: z.number(),
    state: z.enum(["balanced", "left_heavy", "right_heavy"]),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  cell_filled: z.object({
    row: NON_NEGATIVE_INT,
    col: NON_NEGATIVE_INT,
    symbol_id: CONTENT_ID,
    is_valid: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  constraint_violated: z.object({
    row: NON_NEGATIVE_INT,
    col: NON_NEGATIVE_INT,
    symbol_id: CONTENT_ID,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  hand_rotated: z.object({
    hand: z.enum(["hour", "minute"]),
    time: z.string().max(16),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  time_submitted: z.object({
    time: z.string().max(16).optional(),
    card_id: CONTENT_ID.optional(),
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  model_rotated: z.object({
    angle: z.union([
      z.literal(0),
      z.literal(90),
      z.literal(180),
      z.literal(270),
    ]),
    hidden_cubes_remaining: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  item_revealed: z.object({
    item_id: CONTENT_ID,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  checkpoint_reached: z.object({
    waypoint_id: CONTENT_ID,
    checkpoint_index: NON_NEGATIVE_INT,
    total_waypoints: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  trace_completed: z.object({
    shape_name: z.string().max(64),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  item_tapped: z.object({
    item_id: CONTENT_ID,
    current_total: NON_NEGATIVE_INT,
    step: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  count_undone: z.object({
    item_id: CONTENT_ID,
    current_total: NON_NEGATIVE_INT,
    step: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  count_submitted: z.object({
    submitted_total: NON_NEGATIVE_INT,
    target_total: NON_NEGATIVE_INT,
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  item_removed: z.object({
    item_id: CONTENT_ID,
    removed_count: NON_NEGATIVE_INT,
    target_remove_count: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  item_restored: z.object({
    item_id: CONTENT_ID,
    removed_count: NON_NEGATIVE_INT,
    remaining_needed: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  unit_placed: z.object({
    slot_index: NON_NEGATIVE_INT,
    placed_count: NON_NEGATIVE_INT,
    target_count: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  unit_removed: z.object({
    slot_index: NON_NEGATIVE_INT,
    placed_count: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  coin_placed: z.object({
    coin_id: CONTENT_ID,
    value: NON_NEGATIVE_INT,
    current_total: NON_NEGATIVE_INT,
    target_amount: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  coin_removed: z.object({
    coin_id: CONTENT_ID,
    value: NON_NEGATIVE_INT,
    current_total: NON_NEGATIVE_INT,
    target_amount: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  cup_selected: z.object({
    cup_id: CONTENT_ID,
    fill_units: NON_NEGATIVE_INT,
    is_correct: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  liquid_poured: z.object({
    cup_id: CONTENT_ID,
    fill_units: NON_NEGATIVE_INT,
    target_units: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  yarn_placed: z.object({
    cell_index: NON_NEGATIVE_INT,
    color_id: CONTENT_ID,
    is_correct: z.boolean(),
    row: NON_NEGATIVE_INT,
    col: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  yarn_removed: z.object({
    cell_index: NON_NEGATIVE_INT,
    color_id: CONTENT_ID,
    row: NON_NEGATIVE_INT,
    col: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  pattern_played: z.object({
    tempo_bpm: NON_NEGATIVE_INT,
    pattern_length: NON_NEGATIVE_INT,
    is_replay: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  beat_tapped: z.object({
    instrument_id: CONTENT_ID,
    step_index: NON_NEGATIVE_INT,
    is_correct: z.boolean().optional(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  command_added: z.object({
    command: z.enum(["forward", "turn_left", "turn_right", "loop"]),
    command_index: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  command_removed: z.object({
    command: z.enum(["forward", "turn_left", "turn_right", "loop"]),
    command_index: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  program_run: z.object({
    command_count: NON_NEGATIVE_INT,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  program_failed: z.object({
    failed_step: z.number().int(),
    reason: z.string().max(64),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  element_placed: z.object({
    slot_index: NON_NEGATIVE_INT,
    element_id: CONTENT_ID,
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  element_removed: z.object({
    slot_index: NON_NEGATIVE_INT,
    removed_id: CONTENT_ID.nullable().optional(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  creation_submitted: z.object({
    placed_items: z.array(z.string().nullable()).optional(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  rule_detected: z.object({
    detected: z.boolean(),
    motif: z.array(z.string()),
    repetitions: NON_NEGATIVE_INT,
    score: NON_NEGATIVE_INT,
    is_win: z.boolean(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
};

export interface MasteryEligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function checkMasteryEligibility(params: {
  childProfileId: number | null | bigint;
  isPreview: boolean;
  completionStatus: string;
  levelHasSkills: boolean;
}): MasteryEligibilityResult {
  if (params.childProfileId === null || params.childProfileId === undefined) {
    return {
      eligible: false,
      reason: "BR-PSL-04: Guest session has no child profile",
    };
  }

  if (params.isPreview) {
    return {
      eligible: false,
      reason: "BR-PSL-05: Preview session does not update mastery",
    };
  }

  if (params.completionStatus !== "completed") {
    return { eligible: false, reason: "Session is not completed" };
  }

  if (!params.levelHasSkills) {
    return { eligible: false, reason: "Level has no skills attached" };
  }

  return { eligible: true };
}

export interface IngestEventItem {
  seq: number;
  event_name: string;
  occurred_at_ms?: number;
  payload?: Record<string, unknown>;
  client_timestamp?: string;
}

export interface IngestOptions {
  callerChildProfileId?: number | null;
  /** Authenticated user id; ownership is always resolved in the DB. */
  callerAccountId?: number;
  guestDeviceId?: string;
  isUserCall?: boolean;
}

function validateBatchPayload(events: IngestEventItem[]) {
  if (!Array.isArray(events) || events.length === 0) {
    return;
  }
  if (events.length > 100) {
    throw new AppError("BATCH_TOO_LARGE");
  }

  const payloadSize = JSON.stringify(events).length;
  if (payloadSize > 64 * 1024) {
    throw new AppError("PAYLOAD_TOO_LARGE");
  }

  for (const ev of events) {
    if (!ALLOWED_EVENT_NAMES.has(ev.event_name)) {
      throw new AppError("UNKNOWN_EVENT_NAME");
    }
  }
}

async function checkUserSessionOwnership(
  db: ReturnType<typeof getOwnerDb>,
  session: typeof playSessions.$inferSelect,
  options: IngestOptions
): Promise<void> {
  if (!session.childProfileId) {
    throw new AppError("NOT_FOUND");
  }
  const callerAccountId = options.callerAccountId;
  if (
    typeof callerAccountId !== "number" ||
    !Number.isInteger(callerAccountId) ||
    callerAccountId <= 0
  ) {
    throw new AppError("NOT_FOUND");
  }

  const [ownedChild] = await db
    .select({ id: childProfiles.id })
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.id, Number(session.childProfileId)),
        eq(childProfiles.userId, callerAccountId),
        eq(childProfiles.status, "active")
      )
    )
    .limit(1);

  if (!ownedChild) {
    throw new AppError("NOT_FOUND");
  }
}

async function checkSessionOwnership(
  db: ReturnType<typeof getOwnerDb>,
  session: typeof playSessions.$inferSelect,
  options: IngestOptions
): Promise<void> {
  if (options.isUserCall) {
    await checkUserSessionOwnership(db, session, options);
  } else if (
    session.childProfileId !== null &&
    session.childProfileId !== undefined
  ) {
    throw new AppError("NOT_FOUND");
  } else if (
    !(options.guestDeviceId && session.guestDeviceId) ||
    session.guestDeviceId !== options.guestDeviceId
  ) {
    // A guest session is bearer-bound to its device cookie. Omitting the
    // device id must never degrade into "any guest session" access.
    throw new AppError("NOT_FOUND");
  }
}

function cleanEventPayload(
  eventName: string,
  payload?: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  const allowed = EVENT_PAYLOAD_FIELDS[eventName] ?? new Set<string>();
  if (payload && typeof payload === "object") {
    for (const [key, value] of Object.entries(payload)) {
      if (allowed.has(key) && !PII_FIELDS.has(key.toLowerCase())) {
        cleaned[key] = value;
      }
    }
  }
  const schema = EVENT_PAYLOAD_SCHEMAS[eventName];
  if (!schema) {
    return {};
  }
  const parsed = schema.partial().safeParse(cleaned);
  return parsed.success ? parsed.data : {};
}

function validateSequenceNumbers(
  events: IngestEventItem[],
  currentMaxSeq: number,
  existingSeqs: Set<number>
) {
  for (const ev of events) {
    if (ev.seq < 1) {
      throw new AppError("INVALID_SEQUENCE");
    }
    if (ev.seq < currentMaxSeq && !existingSeqs.has(ev.seq)) {
      throw new AppError("EVENT_OUT_OF_ORDER");
    }
  }
}

async function insertIngestedEventsBatch(
  db: ReturnType<typeof getOwnerDb>,
  sessionUuid: string,
  session: typeof playSessions.$inferSelect,
  childUuid: string | null,
  events: IngestEventItem[],
  existingSeqs: Set<number>,
  initialMaxSeq: number
): Promise<{ accepted: number; skipped: number; newMaxSeq: number }> {
  let accepted = 0;
  let skipped = 0;
  let newMaxSeq = initialMaxSeq;

  for (const ev of events) {
    if (existingSeqs.has(ev.seq)) {
      skipped++;
      continue;
    }

    try {
      await db
        .insert(telemetryEvents)
        .values({
          sessionUuid,
          seq: ev.seq,
          childUuid,
          gameLevelId: session.gameLevelId,
          contentVersion: session.contentVersion,
          templateId: session.templateId,
          eventName: ev.event_name,
          occurredAtMs: ev.occurred_at_ms ?? null,
          payload: cleanEventPayload(ev.event_name, ev.payload),
          clientTimestamp: ev.client_timestamp
            ? new Date(ev.client_timestamp)
            : null,
        })
        .onConflictDoNothing();

      accepted++;
      existingSeqs.add(ev.seq);
      if (ev.seq > newMaxSeq) {
        newMaxSeq = ev.seq;
      }
    } catch {
      skipped++;
    }
  }

  return { accepted, skipped, newMaxSeq };
}

export async function ingestPlayEvents(
  sessionUuid: string,
  events: IngestEventItem[],
  options: IngestOptions = {}
) {
  validateBatchPayload(events);
  if (!Array.isArray(events) || events.length === 0) {
    return { accepted: 0, skipped: 0, last_seq: 0 };
  }

  const db = getOwnerDb();
  const sessionRows = await db
    .select()
    .from(playSessions)
    .where(eq(playSessions.sessionUuid, sessionUuid))
    .limit(1);

  const session = sessionRows[0];
  if (!session) {
    throw new AppError("NOT_FOUND");
  }

  await checkSessionOwnership(db, session, options);

  const existingEvents = await db
    .select({ seq: telemetryEvents.seq })
    .from(telemetryEvents)
    .where(eq(telemetryEvents.sessionUuid, sessionUuid))
    .orderBy(desc(telemetryEvents.seq));

  const existingSeqs = new Set(existingEvents.map((e) => e.seq));
  const currentMaxSeq = existingEvents[0]?.seq ?? 0;

  if (
    session.completionStatus === "completed" ||
    session.completionStatus === "abandoned"
  ) {
    return {
      accepted: 0,
      skipped: events.length,
      last_seq: currentMaxSeq,
    };
  }

  validateSequenceNumbers(events, currentMaxSeq, existingSeqs);

  let childUuid: string | null = null;
  if (session.childProfileId) {
    const cp = await db
      .select({ uuid: childProfiles.uuid })
      .from(childProfiles)
      .where(eq(childProfiles.id, session.childProfileId))
      .limit(1);
    if (cp[0]) {
      childUuid = cp[0].uuid;
    }
  }

  const batchResult = await insertIngestedEventsBatch(
    db,
    sessionUuid,
    session,
    childUuid,
    events,
    existingSeqs,
    currentMaxSeq
  );

  return {
    accepted: batchResult.accepted,
    skipped: batchResult.skipped,
    last_seq: batchResult.newMaxSeq,
  };
}

async function recordSkillMasteryUpdate(params: {
  db: ReturnType<typeof getOwnerDb>;
  childId: number;
  skillId: number;
  weight: number;
  correctRatio: number;
  hintRate: number;
  now: Date;
}): Promise<MasteryState> {
  const { db, childId, skillId, weight, correctRatio, hintRate, now } = params;
  const [existing] = await db
    .select()
    .from(masteryState)
    .where(
      and(
        eq(masteryState.childProfileId, childId),
        eq(masteryState.skillId, skillId)
      )
    )
    .limit(1);

  const prevState: MasteryState | null = existing
    ? {
        child_id: childId,
        skill_id: skillId,
        p_learn: Number(existing.pLearn),
        ema_correct: Number(existing.emaCorrect),
        hint_rate: Number(existing.hintRate),
        attempts_total: existing.attemptsTotal,
        best_p_learn: Number(existing.bestPLearn),
        last_seen_at: existing.lastSeenAt ? new Date(existing.lastSeenAt) : now,
        params_version: existing.paramsVersion,
      }
    : null;

  const update = computeUpdate({
    prev: prevState,
    result: {
      correct_ratio: correctRatio,
      hint_rate: hintRate,
    },
    weight,
    now,
  });

  await db
    .insert(masteryState)
    .values({
      childProfileId: childId,
      skillId,
      pLearn: update.p_learn.toFixed(4),
      emaCorrect: update.ema_correct.toFixed(4),
      hintRate: update.hint_rate.toFixed(4),
      attemptsTotal: update.attempts_total,
      bestPLearn: update.best_p_learn.toFixed(4),
      paramsVersion: update.params_version,
      lastSeenAt: update.last_seen_at,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [masteryState.childProfileId, masteryState.skillId],
      set: {
        pLearn: update.p_learn.toFixed(4),
        emaCorrect: update.ema_correct.toFixed(4),
        hintRate: update.hint_rate.toFixed(4),
        attemptsTotal: update.attempts_total,
        bestPLearn: update.best_p_learn.toFixed(4),
        paramsVersion: update.params_version,
        lastSeenAt: update.last_seen_at,
        updatedAt: now,
      },
    });

  return {
    child_id: childId,
    skill_id: skillId,
    ...update,
  };
}

async function awardChildBadges(params: {
  db: ReturnType<typeof getOwnerDb>;
  childId: number;
  sessionUuid: string;
  now: Date;
}) {
  const { db, childId, sessionUuid, now } = params;
  const existingBadgesRows = await db
    .select({ badgeCode: childBadges.badgeCode })
    .from(childBadges)
    .where(eq(childBadges.childProfileId, childId));
  const existingBadgeCodes = new Set(
    existingBadgesRows.map((b) => b.badgeCode)
  );

  const dailyStatsRows = await db
    .select({ dateIct: childDailyStats.dateIct })
    .from(childDailyStats)
    .where(eq(childDailyStats.childProfileId, childId));
  const distinctDays = new Set(dailyStatsRows.map((d) => d.dateIct)).size;

  const newBadges = evaluateBadges({
    distinctPlayDays: distinctDays,
    existingBadgeCodes,
  });

  for (const badgeCode of newBadges) {
    await db
      .insert(childBadges)
      .values({
        childProfileId: childId,
        badgeCode,
        awardedAt: now,
        sourceRef: sessionUuid,
      })
      .onConflictDoNothing();
  }
}

async function applySessionMasteryAndBadges(params: {
  db: ReturnType<typeof getOwnerDb>;
  childId: number;
  gameLevelId: number;
  sessionUuid: string;
  scoringResult: ReturnType<typeof computeSessionResult>;
  now: Date;
}): Promise<ReturnType<typeof selectNext> | null> {
  const { db, childId, gameLevelId, sessionUuid, scoringResult, now } = params;
  const mappedSkills = await db
    .select()
    .from(contentSkillMap)
    .where(
      and(
        eq(contentSkillMap.entityType, "game_level"),
        eq(contentSkillMap.entityId, gameLevelId)
      )
    );

  if (mappedSkills.length === 0) {
    console.warn(
      `[completePlaySession] Level ${gameLevelId} has no attached skills, skipping mastery update`
    );
    return null;
  }

  const roundsTotal = scoringResult.metrics.rounds_total;
  const correctRatio =
    roundsTotal > 0 ? scoringResult.metrics.rounds_correct / roundsTotal : 0;
  const hintRate =
    roundsTotal > 0 ? (scoringResult.metrics.hint_count ?? 0) / roundsTotal : 0;

  const masteryMap = new Map<number, MasteryState>();

  for (const ms of mappedSkills) {
    const skillId = Number(ms.skillId);
    const updatedState = await recordSkillMasteryUpdate({
      db,
      childId,
      skillId,
      weight: Number(ms.weight),
      correctRatio,
      hintRate,
      now,
    });
    masteryMap.set(skillId, updatedState);
  }

  await awardChildBadges({ db, childId, sessionUuid, now });

  return selectNext({
    mastery: masteryMap,
    step: {
      week_no: 1,
      session_no: 1,
      position: 1,
      skill_ids: mappedSkills.map((ms) => Number(ms.skillId)),
    },
    now,
  });
}

async function applyAbandonedSessionMastery(params: {
  db: ReturnType<typeof getOwnerDb>;
  childId: number;
  gameLevelId: number;
  now: Date;
}) {
  const { db, childId, gameLevelId, now } = params;
  const mappedSkills = await db
    .select()
    .from(contentSkillMap)
    .where(
      and(
        eq(contentSkillMap.entityType, "game_level"),
        eq(contentSkillMap.entityId, gameLevelId)
      )
    );

  for (const ms of mappedSkills) {
    const skillId = Number(ms.skillId);
    await recordSkillMasteryUpdate({
      db,
      childId,
      skillId,
      weight: Number(ms.weight),
      correctRatio: 0.0,
      hintRate: 0.0,
      now,
    });
  }
}

export async function completePlaySession(
  sessionUuid: string,
  _lastSeq?: number,
  options: IngestOptions = {}
) {
  const db = getOwnerDb();

  const sessionRows = await db
    .select()
    .from(playSessions)
    .where(eq(playSessions.sessionUuid, sessionUuid))
    .limit(1);

  const session = sessionRows[0];
  if (!session) {
    throw new AppError("NOT_FOUND");
  }

  await checkSessionOwnership(db, session, options);

  if (
    session.completionStatus === "completed" ||
    session.completionStatus === "abandoned"
  ) {
    throw new AppError("SESSION_ALREADY_COMPLETED");
  }

  const now = new Date();
  const elapsedMs = now.getTime() - new Date(session.startedAt).getTime();
  if (elapsedMs > 4 * 60 * 60 * 1000) {
    await db
      .update(playSessions)
      .set({ completionStatus: "abandoned", updatedAt: now })
      .where(eq(playSessions.id, session.id));

    throw new AppError("SESSION_EXPIRED");
  }

  const events = await db
    .select()
    .from(telemetryEvents)
    .where(eq(telemetryEvents.sessionUuid, sessionUuid))
    .orderBy(telemetryEvents.seq);

  const scoringResult = computeSessionResult(
    events.map((e) => ({
      sessionUuid: e.sessionUuid,
      seq: e.seq,
      eventName: e.eventName,
      occurredAtMs: e.occurredAtMs,
      payload: e.payload as Record<string, unknown> | null,
      clientTimestamp: e.clientTimestamp,
    }))
  );

  const durationSeconds = Math.round(scoringResult.metrics.duration_ms / 1000);
  const stars = computeStars(scoringResult.normalized_score, "completed");

  const [completed] = await db
    .update(playSessions)
    .set({
      completionStatus: "completed",
      completedAt: now,
      durationSeconds,
      score: scoringResult.raw_score,
      starsEarned: stars ?? 0,
      updatedAt: now,
    })
    .where(
      and(
        eq(playSessions.id, session.id),
        eq(playSessions.completionStatus, "in_progress")
      )
    )
    .returning({ id: playSessions.id });

  if (!completed) {
    throw new AppError("SESSION_ALREADY_COMPLETED");
  }

  let nextSuggestion: ReturnType<typeof selectNext> | null = null;
  const [templateRow] = await db
    .select({ kind: gameTemplates.kind })
    .from(gameTemplates)
    .where(eq(gameTemplates.id, session.templateId))
    .limit(1);

  const isTeachTemplate = templateRow?.kind === "teach";

  if (session.childProfileId && !session.isPreview && !isTeachTemplate) {
    nextSuggestion = await applySessionMasteryAndBadges({
      db,
      childId: Number(session.childProfileId),
      gameLevelId: session.gameLevelId,
      sessionUuid,
      scoringResult,
      now,
    });
  }

  try {
    await enqueue("rollup:session", { sessionUuid }, { jobId: sessionUuid });
  } catch (queueErr) {
    console.warn(
      "[completePlaySession] Failed to enqueue rollup job:",
      queueErr
    );
  }

  // Hình dạng response do mục 8 `scoring-and-result.md` sở hữu:
  // `stars` · `rounds_correct` · `rounds_total` · `celebration` · `next_suggestion`,
  // và Cấm — NEVER trả `normalized_score` hay `raw_score` xuống bề mặt trẻ.
  //
  // Bản trước trả `stars: null` dù đã tính `stars` ở trên và ghi nó vào
  // `starsEarned`, thiếu `celebration`, và trả thêm hai khoá spec cấm. Mục 7.3
  // nói mọi trẻ hoàn thành đều có **ít nhất một sao**, nên `null` ở đây là lỗi.
  //
  // `formatKidSurfaceResponse` đã dựng đúng hình dạng đó từ trước và cũng chưa
  // có caller production nào — dùng lại thay vì chép logic lần thứ hai.
  return {
    ...formatKidSurfaceResponse({
      normalized_score: scoringResult.normalized_score,
      completionStatus: "completed",
      metrics: scoringResult.metrics,
    }),
    next_suggestion: nextSuggestion ?? null,
  };
}

export async function sweepAbandonedSessions(now = new Date()) {
  const db = getOwnerDb();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const candidateSessions = await db
    .select()
    .from(playSessions)
    .where(
      and(
        eq(playSessions.completionStatus, "in_progress"),
        sql`${playSessions.startedAt} <= ${thirtyMinsAgo.toISOString()}::timestamptz`
      )
    );

  let sweptCount = 0;
  const dateIctStr = now.toISOString().slice(0, 10);

  for (const session of candidateSessions) {
    const [updatedRow] = await db
      .update(playSessions)
      .set({
        completionStatus: "abandoned",
        updatedAt: now,
      })
      .where(
        and(
          eq(playSessions.id, session.id),
          eq(playSessions.completionStatus, "in_progress")
        )
      )
      .returning({ id: playSessions.id });

    if (!updatedRow) {
      continue;
    }

    sweptCount++;

    if (session.childProfileId) {
      const playTimeSec = session.durationSeconds || 1800;
      await db
        .insert(childDailyStats)
        .values({
          childProfileId: Number(session.childProfileId),
          dateIct: dateIctStr,
          totalPlayTimeSeconds: playTimeSec,
          levelsAttempted: 1,
          levelsCompleted: 0,
          starsEarned: 0,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [childDailyStats.childProfileId, childDailyStats.dateIct],
          set: {
            totalPlayTimeSeconds: sql`${childDailyStats.totalPlayTimeSeconds} + ${playTimeSec}`,
            levelsAttempted: sql`${childDailyStats.levelsAttempted} + 1`,
            updatedAt: now,
          },
        });

      await applyAbandonedSessionMastery({
        db,
        childId: Number(session.childProfileId),
        gameLevelId: session.gameLevelId,
        now,
      });
    }
  }

  return sweptCount;
}
