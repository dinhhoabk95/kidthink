import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";

const itemSchema = z.object({
  item_id: z.string(),
  attribute: z.string(),
  /** Tên đọc được của vật — nguồn của `spokenLabel` trên bề mặt chơi. */
  label: z.string().min(1).max(40).optional(),
  asset: assetSchema(),
  is_correct: z.boolean(),
});

export const GT003ContentSchema = z
  .object({
    ...promptFields(),
    container: z.object({
      container_id: z.string(),
      label: z.string().min(1).max(40),
      accepts_attribute: z.string(),
    }),
    items: z.array(itemSchema).min(2).max(6),
  })
  .superRefine((content, ctx) => {
    const ids = new Set<string>();
    for (const item of content.items) {
      if (ids.has(item.item_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items"],
          message: `item_id trùng: '${item.item_id}'. Đặt cùng một vật hai lần thì lượt chơi không bao giờ đủ số.`,
        });
      }
      ids.add(item.item_id);
    }

    if (!content.items.some((item) => item.is_correct)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message:
          "Không có vật nào `is_correct` — lượt chơi không thắng được (BR-E003-03).",
      });
    }

    // `attribute` là kênh đề hiển thị trên rổ; nếu nó mâu thuẫn với
    // `is_correct` thì trẻ làm đúng theo thuộc tính vẫn bị từ chối (§14).
    for (const [index, item] of content.items.entries()) {
      const matchesContainer =
        item.attribute === content.container.accepts_attribute;
      if (matchesContainer !== item.is_correct) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "is_correct"],
          message: `'${item.item_id}' có attribute '${item.attribute}' nhưng is_correct=${item.is_correct}; rổ nhận '${content.container.accepts_attribute}'.`,
        });
      }
    }
  });

export const GT003DifficultySchema = z.object({
  /** Tổng số vật bày ra — khớp bảng tra độ khó (`BR-LDC-01`). */
  item_count: z.number().int().min(2).max(6).optional(),
  distractor_count: z.number().int().min(0).max(4),
  target_count: z.number().int().min(1).max(4),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
  /** Mặc định bật — tắt chỉ cho ca dạy có thứ tự cố định. */
  shuffle_items: z.boolean().optional(),
});

export type GT003Content = z.infer<typeof GT003ContentSchema>;
export type GT003Difficulty = z.infer<typeof GT003DifficultySchema>;

/**
 * Luật liên hợp đồng: `content_pack` và `difficulty_params` là hai cột khác
 * nhau trong DB nên không schema nào một mình bắt được mâu thuẫn giữa chúng.
 *
 * Số trên rổ đọc `target_count`, còn điều kiện thắng đếm `is_correct` — hai số
 * lệch nhau nghĩa là rổ nói dối trẻ về số vật cần bỏ vào.
 */
export function validateGT003Consistency(
  content: GT003Content,
  difficulty: GT003Difficulty
): string[] {
  const errors: string[] = [];
  const correctCount = content.items.filter((i) => i.is_correct).length;
  const distractorCount = content.items.length - correctCount;

  if (difficulty.target_count !== correctCount) {
    errors.push(
      `target_count=${difficulty.target_count} nhưng có ${correctCount} vật is_correct — số trên rổ lệch điều kiện thắng.`
    );
  }
  if (difficulty.distractor_count !== distractorCount) {
    errors.push(
      `distractor_count=${difficulty.distractor_count} nhưng có ${distractorCount} vật nhiễu.`
    );
  }
  if (
    difficulty.item_count !== undefined &&
    difficulty.item_count !== content.items.length
  ) {
    errors.push(
      `item_count=${difficulty.item_count} nhưng content_pack có ${content.items.length} vật.`
    );
  }
  return errors;
}

export default defineTemplate({
  code: "GT-003",
  name: "Kéo vào đích",
  mechanic: "drag-to-container",
  layouts: ["top-source-bottom-target", "left-source-right-target"],
  content_contract: GT003ContentSchema,
  difficulty_contract: GT003DifficultySchema,
  limits: {
    item_count: [2, 6],
    distractor_count: [0, 4],
    target_count: [1, 4],
  },
  age_min: 3,
  age_max: 6,
  requires_tap_fallback: true,
  input: {
    family: "drag",
    verbs: ["drop", "tap"],
    tolerance_px: 24,
  },
  // Khớp đúng union của `assetSchema()`: emoji · image · text. Trước đây khai
  // `audio` — một kind mà content contract không parse được bao giờ.
  asset_kinds: ["emoji", "image", "text"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: ["game_started", "item_dragged", "item_dropped", "game_completed"],
  engine_session: "DragToContainerSession",
  status: "published",
  version: 1,
});
