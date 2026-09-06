import { z } from "zod";

const NON_NEGATIVE_INT = z.number().int().nonnegative();
/** Mã nội dung trong payload event tương tác — không phải chuỗi tự do (BR-EVT-02). */
const CONTENT_ID = z.string().regex(/^[a-zA-Z0-9_.:-]{1,64}$/);
/** Khuôn một vòng không phát `round_index`; khuôn nhiều vòng thì có. */
const OPTIONAL_ROUND_INDEX = NON_NEGATIVE_INT.optional();

export const EVENT_PAYLOAD_SCHEMAS: Readonly<Record<string, z.AnyZodObject>> = {
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
  intro_period_started: z.object({
    period: z.string().max(32),
    step_index: NON_NEGATIVE_INT,
  }),
  intro_item_presented: z.object({
    item_id: CONTENT_ID,
    period: z.string().max(32),
    tts_used: z.boolean(),
  }),
  intro_item_deferred: z.object({
    item_id: CONTENT_ID,
    miss_count: NON_NEGATIVE_INT,
  }),
  intro_recall_answered: z.object({
    item_id: CONTENT_ID.optional(),
    step_id: z.string().max(64).optional(),
    target_asset_id: CONTENT_ID.optional(),
    answer_correct: z.boolean(),
  }),
  intro_step_started: z.object({
    step_id: z.string().max(64),
    action: z.string().max(32),
    target_asset_id: CONTENT_ID,
    asset_kind: z.string().max(32).optional(),
  }),
  intro_step_answered: z.object({
    step_id: z.string().max(64),
    action: z.string().max(32),
    answer_correct: z.boolean(),
    miss_count: NON_NEGATIVE_INT,
    tts_used: z.boolean().optional(),
  }),
  intro_step_deferred: z.object({
    step_id: z.string().max(64),
    reason: z.string().max(64),
  }),
  intro_segment_started: z.object({
    segment_id: z.string().max(64),
    segment_index: NON_NEGATIVE_INT,
    asset_count: NON_NEGATIVE_INT,
    is_review: z.boolean(),
  }),
  intro_segment_completed: z.object({
    segment_id: z.string().max(64),
    segment_index: NON_NEGATIVE_INT,
    miss_count: NON_NEGATIVE_INT,
  }),
  tts_unavailable: z.object({
    prompt_id: z.string().max(64).optional(),
    reason: z.string().max(64).optional(),
    lang: z.string().max(32).optional(),
    asset_id: CONTENT_ID.optional(),
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
    error_kind: z.enum([
      "wrong_target",
      "wrong_item",
      "incomplete",
      "timeout",
      "wrong_order",
      "wrong_selection",
      "not_a_match",
    ]),
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
  scaffold_resolved: z.object({
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
    asset_ref: z.string().max(256),
    retry_count: NON_NEGATIVE_INT,
  }),
  fps_sample: z.object({
    p50: z.number().nonnegative(),
    p95: z.number().nonnegative(),
    min: z.number().nonnegative(),
    sample_count: NON_NEGATIVE_INT,
  }),
  parent_gate_shown: z.object({
    trigger: z.enum(["exit", "settings"]),
  }),
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
    current_sequence: z.array(CONTENT_ID),
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
    row: NON_NEGATIVE_INT,
    col: NON_NEGATIVE_INT,
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
    step: z.number().int(),
    round_index: OPTIONAL_ROUND_INDEX,
  }),
  count_undone: z.object({
    item_id: CONTENT_ID,
    current_total: NON_NEGATIVE_INT,
    step: z.number().int(),
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
