import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT034InstrumentSchema = z.object({
  instrument_id: z.string().min(1),
  asset: assetSchema(),
  freq: z.number().min(50).max(2000),
  type: z.enum(["sine", "triangle", "square", "sawtooth"]).optional(),
  name_vi: z.string().optional(),
});

/** Helper to check if a pattern contains at least one repeating sub-motif (BR-E034-01) */
export function hasRepeatingMotif(
  pattern: readonly (string | null)[]
): boolean {
  const n = pattern.length;
  if (n < 2) {
    return false;
  }
  for (let k = 1; k <= Math.floor(n / 2); k++) {
    for (let i = 0; i <= n - 2 * k; i++) {
      let isRepeat = true;
      for (let j = 0; j < k; j++) {
        if (pattern[i + j] !== pattern[i + k + j]) {
          isRepeat = false;
          break;
        }
      }
      if (isRepeat) {
        return true;
      }
    }
  }
  return false;
}

export const GT034ContentSchema = z
  .object({
    ...promptFields(),
    instruments: z.array(GT034InstrumentSchema).min(2).max(4),
    target_pattern: z.array(z.string().nullable()).min(4).max(12),
    tempo_bpm: z.number().int().min(60).max(120).default(80),
  })
  .refine(
    (c) => {
      const declaredIds = new Set(
        c.instruments.map((inst) => inst.instrument_id)
      );
      return c.target_pattern.every(
        (step) => step === null || declaredIds.has(step)
      );
    },
    {
      message:
        "All instrument_ids in target_pattern must exist in instruments list (BR-E034-02)",
      path: ["target_pattern"],
    }
  )
  .refine((c) => hasRepeatingMotif(c.target_pattern), {
    message:
      "target_pattern must contain at least one repeating motif (BR-E034-01)",
    path: ["target_pattern"],
  });

export const GT034DifficultySchema = z.object({
  pattern_length: z.number().int().min(4).max(12).default(4),
  instrument_count: z.number().int().min(2).max(4).default(2),
  tempo_bpm: z.number().int().min(60).max(120).default(80),
  allow_replay: z.boolean().default(true),
  replay_limit: z.number().int().min(1).max(5).default(3),
  hint_after_ms: z.number().int().min(1000).default(10_000),
});

export type GT034Instrument = z.infer<typeof GT034InstrumentSchema>;
export type GT034Content = z.infer<typeof GT034ContentSchema>;
export type GT034Difficulty = z.infer<typeof GT034DifficultySchema>;

export default defineTemplate({
  code: "GT-034",
  name: "Gõ theo nhịp",
  mechanic: "beat-sequence",
  status: "published",
  version: 1,
  engine_session: "GT034Session",
  layouts: ["horizontal-track", "step-ladder"],
  content_contract: GT034ContentSchema,
  difficulty_contract: GT034DifficultySchema,
  age_min: 5,
  age_max: 6,
  banned_age_bands: ["3-4", "4-5"],
  requires_tap_fallback: true,
  limits: {
    item_count: [2, 4],
    distractor_count: [0, 0],
    target_count: [4, 8],
  },
  asset_kinds: ["emoji", "image", "audio"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "pattern_played",
    "beat_tapped",
    "sequence_submitted",
    "game_completed",
  ],
});
