import { z } from "zod";
import { assetSchema } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";

export const GT000AssetKindSchema = z.enum(["glyph", "word", "image"]);
export type GT000AssetKind = z.infer<typeof GT000AssetKindSchema>;

export const GT000AssetSchema = z
  .object({
    asset_id: z.string().min(1),
    kind: GT000AssetKindSchema,
    label: z.string().min(1),
    audio_path: z.string().optional(),
    glyph: z.string().optional(),
    text: z.string().optional(),
    image_ref: assetSchema().optional(),
    contrast_group: z.string().min(1),
  })
  .refine((asset) => Boolean(asset.glyph || asset.image_ref), {
    message:
      "Mọi chất liệu BẮT BUỘC có một hình minh hoạ (glyph hoặc image_ref) và một nhãn tiếng Việt (BR-E000-02)",
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

export const GT000SegmentSchema = z
  .object({
    segment_id: z.string().min(1),
    asset_ids: z.array(z.string().min(1)).min(2).max(6),
    steps: z.array(GT000StepSchema).min(3).max(12),
    is_review: z.boolean().default(false),
  })
  .refine(
    (seg) => {
      const lastStep = seg.steps.at(-1);
      return lastStep?.action === "recall";
    },
    {
      message:
        "Mọi phân đoạn BẮT BUỘC kết thúc bằng ít nhất một hành động recall (BR-E000-04)",
    }
  );

export const GT000ContentSchema = z
  .object({
    concept: z
      .object({
        skill_code: z
          .string()
          .regex(/^C[1-6]\.[A-Z]{2,5}\.\d{2}$/)
          .optional(),
        pre_skill_code: z
          .string()
          .regex(/^C[1-6]\.[A-Z]{2,5}\.\d{2}$/)
          .optional(),
        label: z.string().min(1),
      })
      .refine((c) => Boolean(c.skill_code || c.pre_skill_code), {
        message: "concept phải có skill_code hoặc pre_skill_code",
      }),
    prompt: z.string().optional(),
    assets: z.array(GT000AssetSchema).min(2).max(21),
    segments: z.array(GT000SegmentSchema).min(1).max(6).optional(),
    steps: z.array(GT000StepSchema).min(3).max(12).optional(),
    requires_reintro: z.boolean().default(false),
  })
  .refine((data) => Boolean(data.segments || data.steps), {
    message: "content_pack phải có segments hoặc steps",
  })
  .refine(
    (data) => {
      if (!data.segments || data.segments.length === 0) {
        return true;
      }
      const lastSeg = data.segments.at(-1);
      return lastSeg?.is_review === true;
    },
    {
      message:
        "Level BẮT BUỘC đóng bằng một phân đoạn ôn gộp mọi giá trị đã dạy (is_review = true) (BR-E000-04)",
    }
  );

export const GT000DifficultySchema = z
  .object({
    hint_after_ms: z.number().int().min(5000).max(30_000).default(12_000),
    allow_retry: z.boolean().default(true),
    auto_play_audio: z.boolean().default(true),
  })
  .strict();

export type GT000Asset = z.infer<typeof GT000AssetSchema>;
export type GT000Step = z.infer<typeof GT000StepSchema>;
export type GT000Segment = z.infer<typeof GT000SegmentSchema>;
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
    item_count: [2, 21],
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
    "intro_step_started",
    "intro_step_answered",
    "intro_step_deferred",
    "intro_recall_answered",
    "intro_segment_started",
    "intro_segment_completed",
    "tts_unavailable",
    "game_completed",
  ],
  engine_session: "GT000Session",
  status: "published",
  version: 1,
  input: {
    family: "tap",
    verbs: ["tap"],
    tolerance_px: 24,
  },
});
