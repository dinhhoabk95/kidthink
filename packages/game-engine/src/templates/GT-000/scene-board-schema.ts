import { z } from "zod";

export const GT000_QUANTITY_REP_KINDS = [
  "discrete-object",
  "finger",
  "number-rod",
  "dot-pattern",
  "ten-frame",
  "rekenrek",
  "tally",
  "number-line",
  "numeral",
] as const;

export const GT000QuantityRepKindSchema = z.enum(GT000_QUANTITY_REP_KINDS);
export type GT000QuantityRepKind = z.infer<typeof GT000QuantityRepKindSchema>;

export const GT000AssetRepresentationSchema = z.object({
  kind: GT000QuantityRepKindSchema,
  count: z.number().int().min(0).max(100),
  max: z.number().int().min(1).max(100).optional(),
});
export type GT000AssetRepresentation = z.infer<
  typeof GT000AssetRepresentationSchema
>;

export const GT000StoryContextSchema = z.object({
  theme_code: z.string().min(1),
  guide_character: z.string().min(1),
  hook_line: z.string().min(1).optional(),
  resolution_line: z.string().min(1).optional(),
});
export type GT000StoryContext = z.infer<typeof GT000StoryContextSchema>;

export const GT000InteractionHintSchema = z.enum([
  "tap_to_explore",
  "tap_to_count",
  "tap_to_split",
]);
export type GT000InteractionHint = z.infer<typeof GT000InteractionHintSchema>;

export const GT000SpatialAnchorPropSchema = z.enum([
  "wood_table",
  "bamboo_box",
  "sedge_fence",
  "balance_scale",
  "measure_baseline",
  "mirror_axis",
  "slope_ramp",
]);
export type GT000SpatialAnchorProp = z.infer<
  typeof GT000SpatialAnchorPropSchema
>;

export const GT000SpatialRelationSchema = z.enum([
  "on",
  "under",
  "inside",
  "outside",
  "left_of",
  "right_of",
  "in_front",
  "behind",
  "between",
  "taller_than",
  "longer_than",
  "heavier_than",
  "mirror_x",
  "rotate_90",
  "rolls_vs_stands",
]);
export type GT000SpatialRelation = z.infer<typeof GT000SpatialRelationSchema>;

export const GT000PartWholeOperationSchema = z.enum([
  "split",
  "combine",
  "take_away",
  "equal_share",
]);
export type GT000PartWholeOperation = z.infer<
  typeof GT000PartWholeOperationSchema
>;

export const GT000ShapeBadgeSchema = z.enum([
  "circle",
  "square",
  "triangle",
  "diamond",
]);
export type GT000ShapeBadge = z.infer<typeof GT000ShapeBadgeSchema>;

export const GT000ToneMarkSchema = z.enum([
  "ngang",
  "huyen",
  "sac",
  "hoi",
  "nga",
  "nang",
]);
export type GT000ToneMark = z.infer<typeof GT000ToneMarkSchema>;

export const GT000RuleMemoryVariantSchema = z.enum([
  "peekaboo_cover",
  "rule_signal",
]);
export type GT000RuleMemoryVariant = z.infer<
  typeof GT000RuleMemoryVariantSchema
>;

export const GT000SortingBasketSchema = z.object({
  basket_id: z.string().min(1),
  label: z.string().min(1),
  shape_badge: GT000ShapeBadgeSchema,
  sample_asset_ids: z.array(z.string().min(1)).max(4),
});
export type GT000SortingBasket = z.infer<typeof GT000SortingBasketSchema>;

export const GT000SceneBoardSingleCardSchema = z.object({
  mode: z.literal("single_card"),
});

export const GT000SceneBoardCpaBridgeSchema = z.object({
  mode: z.literal("cpa_bridge"),
  count: z.number().int().min(0).max(100),
  rep_kind: GT000QuantityRepKindSchema,
  concrete_glyph: z.string().min(1).optional(),
  interactive_count: z.boolean().optional(),
});

export const GT000SceneBoardPartWholeSchema = z.object({
  mode: z.literal("part_whole"),
  whole_count: z.number().int().min(1).max(100),
  part_a_count: z.number().int().min(0).max(100),
  part_b_count: z.number().int().min(0).max(100),
  item_glyph: z.string().min(1),
  operation: GT000PartWholeOperationSchema,
});

export const GT000SceneBoardSpatialStageSchema = z.object({
  mode: z.literal("spatial_stage"),
  anchor_prop: GT000SpatialAnchorPropSchema,
  relation: GT000SpatialRelationSchema,
});

export const GT000SceneBoardSequenceStripSchema = z.object({
  mode: z.literal("sequence_strip"),
  strip_asset_ids: z.array(z.string().min(1)).min(3).max(6),
  focus_slot_index: z.number().int().min(0).max(5),
  rhythm_labels: z.array(z.string()).optional(),
});

export const GT000SceneBoardSortingBasketsSchema = z.object({
  mode: z.literal("sorting_baskets"),
  baskets: z.array(GT000SortingBasketSchema).length(2),
});

export const GT000SceneBoardCauseEffectSchema = z.object({
  mode: z.literal("cause_effect"),
  before_asset_id: z.string().min(1),
  trigger_glyph: z.string().min(1).optional(),
  after_asset_id: z.string().min(1),
});

export const GT000SceneBoardWordPhonicsBoxSchema = z.object({
  mode: z.literal("word_phonics_box"),
  meaning_asset_id: z.string().min(1).optional(),
  parts: z.array(z.string().min(1)).min(1).max(6),
  tone_mark: GT000ToneMarkSchema.optional(),
});

export const GT000SceneBoardRuleMemoryStageSchema = z.object({
  mode: z.literal("rule_memory_stage"),
  variant: GT000RuleMemoryVariantSchema,
  rule_badge_glyph: z.string().min(1).optional(),
  rule_label: z.string().min(1).optional(),
});

export const GT000SceneBoardSchema = z.discriminatedUnion("mode", [
  GT000SceneBoardSingleCardSchema,
  GT000SceneBoardCpaBridgeSchema,
  GT000SceneBoardPartWholeSchema,
  GT000SceneBoardSpatialStageSchema,
  GT000SceneBoardSequenceStripSchema,
  GT000SceneBoardSortingBasketsSchema,
  GT000SceneBoardCauseEffectSchema,
  GT000SceneBoardWordPhonicsBoxSchema,
  GT000SceneBoardRuleMemoryStageSchema,
]);

export type GT000SceneBoard = z.infer<typeof GT000SceneBoardSchema>;
export type GT000SceneBoardMode = GT000SceneBoard["mode"];

export const DEFAULT_SCENE_BOARD: GT000SceneBoard = Object.freeze({
  mode: "single_card",
});

/**
 * Đọc `scene_board` an toàn từ dữ liệu bước thô (chưa qua Zod `.parse()` lúc chạy).
 * Lệch định dạng hoặc thiếu trường đều rơi êm về `single_card` (`BR-E000-17`).
 */
export function resolveStepSceneBoard(
  step: { readonly scene_board?: GT000SceneBoard } | undefined
): GT000SceneBoard {
  const raw = step?.scene_board;
  if (!raw || typeof raw !== "object" || raw.mode === "single_card") {
    return DEFAULT_SCENE_BOARD;
  }
  const parsed = GT000SceneBoardSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_SCENE_BOARD;
}

/** Đọc `story_context` an toàn ở runtime mà không cần giả định dữ liệu đã qua Zod. */
export function resolveStoryContext(
  content: { readonly story_context?: GT000StoryContext } | undefined
): GT000StoryContext | null {
  const raw = content?.story_context;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const parsed = GT000StoryContextSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Đọc `interaction_hint` an toàn trên bước `present`. */
export function resolveStepInteractionHint(
  step: { readonly interaction_hint?: GT000InteractionHint } | undefined
): GT000InteractionHint | null {
  const raw = step?.interaction_hint;
  if (
    raw === "tap_to_explore" ||
    raw === "tap_to_count" ||
    raw === "tap_to_split"
  ) {
    return raw;
  }
  return null;
}
