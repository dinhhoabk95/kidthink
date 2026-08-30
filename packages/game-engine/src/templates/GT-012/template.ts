import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";

const flashItemSchema = () =>
  z.object({
    item_id: z.string().min(1).max(32),
    asset: assetSchema(),
  });

const optionSchema = () =>
  z.object({
    value: z.number().int().min(1).max(10),
    is_correct: z.boolean(),
  });

export const GT012BaseSchema = z.object({
  ...promptFields(),
  flash_items: z.array(flashItemSchema()).min(1).max(6),
  arrangement: z
    .enum(["dice", "line", "triangle", "random", "hand"])
    .default("dice"),
  options: z.array(optionSchema()).min(2).max(6),
});

export const GT012ContentSchema = GT012BaseSchema.refine(
  (content) => {
    const correctCount = content.flash_items.length;
    const correctOptions = content.options.filter((o) => o.is_correct);
    const firstOpt = correctOptions[0];
    if (correctOptions.length !== 1 || !firstOpt) {
      return false;
    }
    return firstOpt.value === correctCount;
  },
  {
    message:
      "Phải có đúng 1 phương án đúng và giá trị của nó phải khớp số lượng vật thể trong flash_items.",
    path: ["options"],
  }
);

export const GT012DifficultySchema = z.object({
  flash_ms: z.number().int().min(800).max(3000).default(1500),
  item_count: z.number().int().min(1).max(6),
  distractor_count: z.number().int().min(1).max(5),
  allow_replay: z.boolean().default(true),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT012Content = z.infer<typeof GT012ContentSchema>;
export type GT012Difficulty = z.infer<typeof GT012DifficultySchema>;

export default defineTemplate({
  code: "GT-012",
  name: "Nhìn chớp rồi nhớ lại",
  mechanic: "flash-recall",
  layouts: ["grid", "horizontal-row"],
  content_contract: GT012ContentSchema,
  difficulty_contract: GT012DifficultySchema,
  limits: {
    item_count: [1, 6],
    distractor_count: [1, 5],
    target_count: [1, 1],
  },
  age_min: 3,
  age_max: 6,
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: [
    "game_started",
    "flash_shown",
    "flash_hidden",
    "flash_replayed",
    "value_selected",
    "game_completed",
  ],
  engine_session: "FlashRecallSession",
  status: "published",
  version: 1,
});
