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
    value: z.number().optional(),
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

/**
 * Tập nói theo — `BR-CIM-19`, `BR-E000-10`.
 *
 * Máy đọc mẫu, trẻ nói theo thành tiếng, rồi chạm để đi tiếp.
 * Cấm — NEVER yêu cầu micro, NEVER ghi âm, NEVER chấm phát âm (`BR-CIR-21`).
 */
export const GT000StepEchoSchema = z.object({
  action: z.literal("echo"),
  target_asset_id: z.string().min(1),
  repeat_count: z.number().int().min(1).max(3).default(1),
  prompt_line: z.string().optional(),
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
  GT000StepEchoSchema,
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
  )
  .refine(
    (seg) => seg.is_review || seg.steps.some((step) => step.action === "echo"),
    {
      message:
        "Mọi phân đoạn dạy BẮT BUỘC có ít nhất một hành động echo — tập nói theo (BR-E000-10)",
    }
  );

export const GT000ContentSchema = z
  .object({
    concept: z.object({
      // BR-CTM-03: neo vào một kỹ năng chơi thật. Bậc `pre` đã bị gỡ 2026-09-06,
      // nên `pre_skill_code` không còn là trường hợp lệ.
      skill_code: z.string().regex(/^C[1-6]\.[A-Z]{2,5}\.\d{2}$/),
      label: z.string().min(1),
      /** Mã mọi kỹ năng chơi mà chủ đề này dạy — BR-CTM-04. */
      teaches: z.array(z.string().regex(/^C[1-6]\.[A-Z]{2,5}\.\d{2}$/)).min(1),
      /** Dãy giá trị có thứ tự của chủ đề — BR-CTM-09. */
      values: z.array(z.string().min(1)).min(2).max(21),
      /** Thứ tự tiết trong chủ đề nhiều tiết — BR-CIM-20. */
      sequence_no: z.number().int().min(1).default(1),
    }),
    prompt: z.string().optional(),
    assets: z.array(GT000AssetSchema).min(2).max(21),
    segments: z.array(GT000SegmentSchema).min(1).max(8).optional(),
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
  )
  .refine(
    (data) => !data.steps || data.steps.some((step) => step.action === "echo"),
    {
      message:
        "Bài dùng dãy `steps` phẳng BẮT BUỘC có ít nhất một hành động echo (BR-E000-10)",
    }
  )
  .refine(
    (data) => {
      // BR-CTM-09: mọi giá trị của chủ đề phải được dạy trong bài.
      const taught = new Set(data.assets.map((a) => a.asset_id));
      return data.concept.values.every(
        (v) => taught.has(v) || taught.has(`asset_${v}`)
      );
    },
    {
      message:
        "content_pack BẮT BUỘC dạy mọi giá trị khai trong concept.values (BR-CTM-09)",
    }
  );

export const GT000DifficultySchema = z
  .object({
    hint_after_ms: z.number().int().min(5000).max(30_000).default(12_000),
    allow_retry: z.boolean().default(true),
    auto_play_audio: z.boolean().default(true),
  })
  .strict();

export type GT000StepEcho = z.infer<typeof GT000StepEchoSchema>;
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
    "intro_echo_started",
    "intro_echo_completed",
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
