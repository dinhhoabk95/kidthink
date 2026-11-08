import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT018ContentSchema = z
  .object({
    ...promptFields(),
    /**
     * Chỉ mang **chữ** của lời nghe. Tệp âm đi theo `instruction_audio_path` ở cấp
     * vòng — một nguồn lời đọc duy nhất (`BR-ETS-04`).
     */
    audio_prompt: z.object({
      text: z.string().min(1),
      /**
       * Các vật mà lời đọc **gọi tên**, theo thứ tự nói — dải biểu tượng khi tắt
       * tiếng chỉ vẽ đúng chừng này (`BR-E018-06`). Thiếu thì chế độ `sequence`
       * dùng `target_sequence`, chế độ `select` không vẽ vật nào: engine không
       * tự đoán lời đọc nói gì, vì vẽ phương án đúng của một câu đố nghe là lộ đáp án.
       */
      strip_item_ids: z.array(z.string()).min(1).optional(),
    }),
    response_mode: z.enum(["select", "sequence"]).default("select"),
    target_sequence: z.array(z.string()).optional(),
    options: z
      .array(
        z.object({
          item_id: z.string(),
          asset: assetSchema(),
          is_correct: z.boolean().default(false),
        })
      )
      .min(2)
      .max(8),
  })
  .superRefine((content, ctx) => {
    const ids = content.options.map((o) => o.item_id);
    const stripIds = content.audio_prompt.strip_item_ids;
    if (stripIds?.some((id) => !ids.includes(id))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "audio_prompt.strip_item_ids: mọi id phải có trong options",
        path: ["audio_prompt", "strip_item_ids"],
      });
    }
    if (content.response_mode === "select") {
      const correct = content.options.filter((o) => o.is_correct).length;
      // Cần ít nhất 1 đáp án đúng và còn ít nhất 1 mồi nhử, nếu không level vô nghiệm/vô nghĩa.
      if (correct < 1 || correct >= content.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Chế độ 'select' cần ít nhất 1 option đúng và ít nhất 1 option sai",
          path: ["options"],
        });
      }
      return;
    }
    const target = content.target_sequence;
    if (!target || target.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Chế độ 'sequence' bắt buộc có target_sequence không rỗng",
        path: ["target_sequence"],
      });
      return;
    }
    const known = new Set(ids);
    if (
      new Set(target).size !== target.length ||
      target.some((t) => !known.has(t))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "target_sequence không được lặp và mọi id phải có trong options",
        path: ["target_sequence"],
      });
      return;
    }
    if (target.length === ids.length && target.every((t, i) => t === ids[i])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "target_sequence trùng thứ tự ban đầu của options (vòng giải sẵn)",
        path: ["target_sequence"],
      });
    }
  });

const GT018DifficultySchema = z.object({
  hint_after_ms: z.number().int().min(5000).max(30_000).default(8000),
  allow_retry: z.boolean().default(true),
  auto_play_audio: z.boolean().default(true),
});

export type GT018Content = z.infer<typeof GT018ContentSchema>;
export type GT018Difficulty = z.infer<typeof GT018DifficultySchema>;

export default defineTemplate({
  code: "GT-018",
  name: "Nghe rồi làm",
  mechanic: "listen-respond",
  layouts: ["grid", "horizontal-row", "flex-wrap"],
  content_contract: GT018ContentSchema,
  difficulty_contract: GT018DifficultySchema,
  limits: {
    item_count: [2, 8],
    distractor_count: [1, 4],
    target_count: [1, 4],
  },
  age_min: 4,
  age_max: 6,
  requires_tap_fallback: false,
  input: {
    family: "tap",
    verbs: ["tap", "commit"],
    tolerance_px: 24,
  },
  asset_kinds: ["emoji", "image", "audio"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "round_started",
    "item_selected",
    "sequence_submitted",
    "round_completed",
    "game_completed",
  ],
  engine_session: "GT018Session",
  status: "published",
  version: 1,
});
