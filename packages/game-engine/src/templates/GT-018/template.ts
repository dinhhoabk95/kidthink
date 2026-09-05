import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT018ContentSchema = z.object({
  ...promptFields(),
  audio_prompt: z.object({
    text: z.string().min(1),
    audio_url: z.string().optional(),
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
});

export const GT018DifficultySchema = z.object({
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
