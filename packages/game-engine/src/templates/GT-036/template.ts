import { z } from "zod";
import { assetSchema } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT036PaletteItemSchema = z.object({
  id: z.string().min(1).max(32),
  asset: assetSchema(),
});

export const GT036ContentSchema = z
  .object({
    prompt: z.string().min(1).max(200),
    prompt_audio_ref: z.string().optional(),
    palette: z.array(GT036PaletteItemSchema).min(2).max(6),
    track_length: z.number().int().min(4).max(16).default(8),
    min_repetitions: z.number().int().min(2).max(4).default(2),
  })
  .refine(
    (content) => {
      // BR-E036-04: Palette và track_length phải đủ để dựng ít nhất một mô-típ lặp min_repetitions lần
      return content.track_length >= content.min_repetitions * 2;
    },
    {
      message:
        "BR-E036-04: track_length phải đủ để chứa ít nhất một mô-típ lặp lại theo min_repetitions.",
    }
  )
  .refine(
    (content) => {
      // BR-E036-03: Palette cấm chứa token màu phản hồi của hệ thống
      const forbiddenTokens = ["success", "danger", "feedback", "correct"];
      for (const item of content.palette) {
        const asset = item.asset;
        if (asset.kind === "emoji") {
          const refLower = asset.ref.toLowerCase();
          if (forbiddenTokens.some((tok) => refLower.includes(tok))) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        "BR-E036-03: Palette không được chứa asset có token màu phản hồi hệ thống.",
    }
  );

export const GT036DifficultySchema = z.object({
  palette_size: z.number().int().min(2).max(6).default(3),
  track_length: z.number().int().min(4).max(16).default(8),
  min_repetitions: z.number().int().min(2).max(4).default(2),
  strictness: z.enum(["relaxed", "strict"]).default("relaxed"),
  allow_retry: z.boolean().default(true),
  hint_after_ms: z.number().int().min(1000).max(60_000).default(10_000),
});

export type GT036PaletteItem = z.infer<typeof GT036PaletteItemSchema>;
export type GT036Content = z.infer<typeof GT036ContentSchema>;
export type GT036Difficulty = z.infer<typeof GT036DifficultySchema>;

const GT036Template = defineTemplate({
  code: "GT-036",
  name: "Tự tạo quy luật",
  mechanic: "free-create",
  status: "draft",
  version: 1,
  engine_session: "GT036Session",
  layouts: ["free-scene", "horizontal-track"],
  content_contract: GT036ContentSchema,
  difficulty_contract: GT036DifficultySchema,
  age_min: 5,
  age_max: 6,
  banned_age_bands: ["3-4", "4-5"],
  requires_tap_fallback: true,
  limits: {
    item_count: [2, 6],
    distractor_count: [0, 0],
    target_count: [1, 1],
  },
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "element_placed",
    "element_removed",
    "creation_submitted",
    "rule_detected",
    "game_completed",
  ],
});

export default GT036Template;
