import { z } from "zod";
import { assetSchema, promptFields } from "../../contracts/shared-fields.js";
import { defineTemplate } from "../../contracts/types.js";
import {
  hasNoFloatingCubes,
  isModelConnected,
} from "../../systems/isometric-system.js";

const cubeCoordSchema = () =>
  z.object({
    x: z.number().int().min(0).max(3),
    y: z.number().int().min(0).max(3),
    z: z.number().int().min(0).max(3),
    colorToken: z.string().min(1).max(32).optional(),
  });

const optionItemSchema = () =>
  z.object({
    option_id: z.string().min(1).max(32),
    asset: assetSchema(),
    is_correct: z.boolean(),
  });

export const GT017BaseSchema = z.object({
  ...promptFields(),
  model: z.array(cubeCoordSchema()).min(1).max(10),
  question: z.enum(["count_cubes", "top_view", "match_solid"]),
  options: z.array(optionItemSchema()).min(2).max(6),
});

export const GT017ContentSchema = GT017BaseSchema.refine(
  (content) => isModelConnected(content.model),
  {
    message: "Mô hình khối phải liên thông (các khối kề nhau, không rời rạc).",
    path: ["model"],
  }
)
  .refine((content) => hasNoFloatingCubes(content.model), {
    message:
      "Mô hình khối không được có khối lơ lửng (tầng z > 0 phải có khối đỡ bên dưới).",
    path: ["model"],
  })
  .refine(
    (content) => content.options.filter((o) => o.is_correct).length === 1,
    {
      message: "Phải có đúng 1 phương án mang is_correct = true.",
      path: ["options"],
    }
  );

export const GT017DifficultySchema = z.object({
  hidden_cube_count: z.number().int().min(0).max(3),
  distractor_count: z.number().int().min(1).max(5),
  allow_rotate: z.boolean(),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT017Content = z.infer<typeof GT017ContentSchema>;
export type GT017Difficulty = z.infer<typeof GT017DifficultySchema>;

export default defineTemplate({
  code: "GT-017",
  name: "Xếp khối và phối cảnh",
  mechanic: "block-stack",
  layouts: ["split-columns", "grid"],
  content_contract: GT017ContentSchema,
  difficulty_contract: GT017DifficultySchema,
  limits: {
    item_count: [2, 6],
    distractor_count: [1, 5],
    target_count: [1, 1],
  },
  age_min: 5,
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
    "model_rotated",
    "option_selected",
    "game_completed",
  ],
  engine_session: "BlockStackSession",
  status: "published",
  version: 1,
});
