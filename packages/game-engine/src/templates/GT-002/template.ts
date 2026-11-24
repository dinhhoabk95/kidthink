import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import type { AgeBand } from "#src/contracts/types";
import { defineTemplate } from "#src/contracts/types";

export const GT002_COLOR_TOKENS = [
  "coral",
  "amber",
  "emerald",
  "indigo",
  "sky",
  "lotus",
  "terracotta",
  "wood",
] as const;

export const GT002ColorTokenSchema = z.enum(GT002_COLOR_TOKENS);

export const GT002_SHAPE_FORMS = [
  "circle",
  "square",
  "triangle",
  "rectangle",
  "rhombus",
  "oval",
  "pentagon",
  "hexagon",
  "star",
  "cube",
  "rectangular_prism",
  "sphere",
  "cylinder",
  "cone",
  "pyramid",
] as const;

export const GT002ShapeFormSchema = z.enum(GT002_SHAPE_FORMS);

export const GT002_SIZE_TIERS = ["small", "medium", "large"] as const;

export const GT002SizeTierSchema = z.enum(GT002_SIZE_TIERS);

export const GT002GeometricSpecSchema = z.object({
  form: GT002ShapeFormSchema,
  color_token: GT002ColorTokenSchema,
  size_tier: GT002SizeTierSchema.optional(),
  rotation_deg: z.number().min(-360).max(360).optional(),
  show_orientation_pin: z.boolean().optional(),
});

export const GT002QuantityRepSchema = z.object({
  kind: z.enum([
    "discrete-object",
    "finger",
    "number-rod",
    "rekenrek",
    "ten-frame",
    "dot-pattern",
    "tally",
    "number-line",
  ]),
  count: z.number().int().min(0).max(20),
  max: z.number().int().min(1).max(20).optional(),
  min: z.number().int().min(0).max(20).optional(),
});

export const GT002PlateVariantSchema = z.enum(["round_plate", "wood_tile"]);

export const GT002SelectionModeSchema = z.enum(["all_matching", "exact_count"]);

export const GT002CompareRelationSchema = z.enum([
  "larger",
  "smaller",
  "longer",
  "shorter",
  "taller",
  "heavier",
  "lighter",
  "fuller",
  "emptier",
  "equal",
]);

export const GT002PhonicsModeSchema = z.enum([
  "letter",
  "initial_sound",
  "rhyme",
  "tone",
  "syllable_count",
]);

function createLeafCriterionVariants() {
  return [
    z.object({
      kind: z.literal("color"),
      color_token: GT002ColorTokenSchema,
      label_vi: z.string().max(40).optional(),
      negated: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal("shape"),
      form: GT002ShapeFormSchema,
      color_token: GT002ColorTokenSchema.optional(),
      label_vi: z.string().max(40).optional(),
      negated: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal("size_compare"),
      size_tier: GT002SizeTierSchema.optional(),
      relation: GT002CompareRelationSchema.optional(),
      reference_asset: assetSchema().optional(),
      label_vi: z.string().max(40).optional(),
      negated: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal("quantity"),
      count: z.number().int().min(0).max(20),
      representation: GT002QuantityRepSchema.optional(),
      label_vi: z.string().max(40).optional(),
      negated: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal("category"),
      cue_asset: assetSchema().optional(),
      secondary_cue_asset: assetSchema().optional(),
      category_code: z.string().min(1).max(40).optional(),
      label_vi: z.string().max(40).optional(),
      negated: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal("phonics"),
      symbol_text: z.string().min(1).max(24),
      cue_asset: assetSchema().optional(),
      phonics_mode: GT002PhonicsModeSchema.optional(),
      label_vi: z.string().max(40).optional(),
      negated: z.boolean().optional(),
    }),
  ] as const;
}

export const GT002LeafCriterionAnchorSchema = z.discriminatedUnion(
  "kind",
  createLeafCriterionVariants()
);

export const GT002ConjunctionCriterionSchema = z.object({
  kind: z.literal("conjunction"),
  operator: z.enum(["and", "or"]).optional(),
  clauses: z
    .array(z.discriminatedUnion("kind", createLeafCriterionVariants()))
    .min(2)
    .max(2),
  label_vi: z.string().max(40).optional(),
  negated: z.boolean().optional(),
});

export const GT002CriterionAnchorSchema = z.discriminatedUnion("kind", [
  ...createLeafCriterionVariants(),
  GT002ConjunctionCriterionSchema,
]);

export const GT002ItemSchema = z.object({
  item_id: z.string(),
  asset: assetSchema(),
  is_correct: z.boolean(),
  label: z.string().max(40).optional(),
  secondary_asset: assetSchema().optional(),
  representation: GT002QuantityRepSchema.optional(),
  geometric_spec: GT002GeometricSpecSchema.optional(),
  plate_variant: GT002PlateVariantSchema.optional(),
});

export const GT002BaseContentSchema = z.object({
  ...promptFields(),
  target_criterion: z.string().max(80),
  criterion_anchor: GT002CriterionAnchorSchema.optional(),
  preserve_order: z.boolean().optional(),
  selection_mode: GT002SelectionModeSchema.optional(),
  required_select_count: z.number().int().min(1).max(6).optional(),
  preselected_item_ids: z.array(z.string().min(1).max(64)).max(8).optional(),
  items: z.array(GT002ItemSchema).min(3).max(8),
});

export const GT002ContentSchema = GT002BaseContentSchema.refine(
  (content) => {
    if (content.selection_mode !== "exact_count") {
      return true;
    }
    const correctCount = content.items.filter((i) => i.is_correct).length;
    const required = content.required_select_count ?? correctCount;
    return required >= 1 && required <= correctCount;
  },
  {
    message:
      "BR-E002-02: Chế độ exact_count yêu cầu required_select_count nằm trong khoảng [1, số vật is_correct].",
    path: ["required_select_count"],
  }
).refine(
  (content) => {
    if (!content.preselected_item_ids) {
      return true;
    }
    const validIds = new Set(content.items.map((i) => i.item_id));
    return content.preselected_item_ids.every((id) => validIds.has(id));
  },
  {
    message:
      "BR-E002-07: Mọi mã trong preselected_item_ids phải tồn tại trong danh sách items.",
    path: ["preselected_item_ids"],
  }
);

export const GT002DifficultySchema = z.object({
  item_count: z.number().int().min(3).max(8).optional(),
  distractor_count: z.number().int().min(1).max(6),
  target_count: z.number().int().min(2).max(6),
  hint_after_ms: z.number().int().min(8000).max(35_000),
  allow_retry: z.boolean(),
});

export type GT002ColorToken = z.infer<typeof GT002ColorTokenSchema>;
export type GT002ShapeForm = z.infer<typeof GT002ShapeFormSchema>;
export type GT002SizeTier = z.infer<typeof GT002SizeTierSchema>;
export type GT002GeometricSpec = z.infer<typeof GT002GeometricSpecSchema>;
export type GT002QuantityRep = z.infer<typeof GT002QuantityRepSchema>;
export type GT002PlateVariant = z.infer<typeof GT002PlateVariantSchema>;
export type GT002SelectionMode = z.infer<typeof GT002SelectionModeSchema>;
export type GT002CompareRelation = z.infer<typeof GT002CompareRelationSchema>;
export type GT002PhonicsMode = z.infer<typeof GT002PhonicsModeSchema>;
export type GT002LeafCriterionAnchor = z.infer<
  typeof GT002LeafCriterionAnchorSchema
>;
export type GT002CriterionAnchor = z.infer<typeof GT002CriterionAnchorSchema>;
export type GT002CriterionAnchorKind = GT002CriterionAnchor["kind"];
export type GT002Item = z.infer<typeof GT002ItemSchema>;
export type GT002Content = z.infer<typeof GT002ContentSchema>;
export type GT002Difficulty = z.infer<typeof GT002DifficultySchema>;

export const GT002_TARGET_CAP_BY_BAND: Readonly<Record<AgeBand, number>> = {
  "3-4": 0,
  "4-5": 3,
  "5-6": 4,
};

export default defineTemplate({
  code: "GT-002",
  name: "Chọn nhiều đáp án",
  mechanic: "tap-select-multi",
  layouts: ["grid-2x4", "flex-wrap"],
  content_contract: GT002ContentSchema,
  difficulty_contract: GT002DifficultySchema,
  limits: {
    item_count: [3, 8],
    distractor_count: [1, 6],
    target_count: [2, 6],
  },
  age_min: 4,
  age_max: 6,
  banned_age_bands: ["3-4"],
  requires_tap_fallback: false,
  input: {
    family: "tap",
    verbs: ["tap", "commit"],
    tolerance_px: 24,
  },
  asset_kinds: ["emoji", "image", "text", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: [
    "game_started",
    "item_selected",
    "selection_submitted",
    "game_completed",
  ],
  engine_session: "TapSelectMultiSession",
  status: "published",
  version: 1,
});
