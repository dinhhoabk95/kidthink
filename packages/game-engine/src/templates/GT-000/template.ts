import { z } from "zod";
import { assetSchema } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";

export const GT000AssetKindSchema = z.enum(["glyph", "word", "image"]);
export type GT000AssetKind = z.infer<typeof GT000AssetKindSchema>;

export const GT000AssetSchema = z.object({
  asset_id: z.string().min(1),
  kind: GT000AssetKindSchema,
  label: z.string().min(1),
  audio_path: z.string().optional(),
  glyph: z.string().optional(),
  text: z.string().optional(),
  image_ref: assetSchema().optional(),
  contrast_group: z.string().min(1),
});

export const GT000StepPresentSchema = z.object({
  action: z.literal("present"),
  target_asset_id: z.string().min(1),
  narration_line: z.string().optional(),
});

export const GT000StepRecogniseSchema = z.object({
  action: z.literal("recognise"),
  target_asset_id: z.string().min(1),
  distractor_asset_ids: z.array(z.string().min(1)).min(1).max(3),
  prompt_line: z.string().optional(),
});

export const GT000StepLinkSchema = z.object({
  action: z.literal("link"),
  source_asset_id: z.string().min(1),
  target_asset_id: z.string().min(1),
  prompt_line: z.string().optional(),
});

export const GT000StepRecallSchema = z.object({
  action: z.literal("recall"),
  target_asset_id: z.string().min(1),
  option_asset_ids: z.array(z.string().min(1)).min(2).max(4),
  prompt_line: z.string().optional(),
});

export const GT000StepSchema = z.discriminatedUnion("action", [
  GT000StepPresentSchema,
  GT000StepRecogniseSchema,
  GT000StepLinkSchema,
  GT000StepRecallSchema,
]);

export const GT000ContentSchema = z.object({
  concept: z.object({
    skill_code: z.string().regex(/^C[1-6]\.[A-Z]{2,5}\.\d{2}$/),
    label: z.string().min(1),
  }),
  assets: z.array(GT000AssetSchema).min(2).max(6),
  steps: z.array(GT000StepSchema).min(3).max(12),
  requires_reintro: z.boolean().default(false),
});

export const GT000DifficultySchema = z.object({
  hint_after_ms: z.number().int().min(5000).max(30_000).default(12_000),
  allow_retry: z.boolean().default(true),
  auto_play_audio: z.boolean().default(true),
});

export type GT000Asset = z.infer<typeof GT000AssetSchema>;
export type GT000Step = z.infer<typeof GT000StepSchema>;
export type GT000Content = z.infer<typeof GT000ContentSchema>;
export type GT000Difficulty = z.infer<typeof GT000DifficultySchema>;

export const INTRO_SCORING = {
  max_score: 0,
  pass_threshold: 0,
  star_thresholds: [0, 0, 0] as [number, number, number],
};

export default defineTemplate({
  code: "GT-000",
  name: "Làm quen khái niệm",
  mechanic: "concept-intro",
  layouts: ["single-focus", "grid", "horizontal-row", "flex-wrap"],
  content_contract: GT000ContentSchema,
  difficulty_contract: GT000DifficultySchema,
  limits: {
    item_count: [2, 6],
    distractor_count: [1, 3],
    target_count: [1, 1],
  },
  age_min: 3,
  age_max: 6,
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image", "audio"],
  kind: "teach",
  scoring: INTRO_SCORING,
  events: [
    "game_started",
    "intro_period_started",
    "intro_item_presented",
    "intro_item_deferred",
    "intro_recall_answered",
    "tts_unavailable",
    "game_completed",
  ],
  engine_session: "GT000Session",
  status: "published",
  version: 1,
});
