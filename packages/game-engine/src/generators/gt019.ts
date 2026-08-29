import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT019Generator: LevelGenerator = {
  engine: "GT-019",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["spatial", "rotation", "geometry"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 2);

    const target_slots = sampled.map((item, idx) => ({
      slot_id: `slot_${idx + 1}`,
      target_rotation: 0 as const,
      target_flip: "none" as const,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
    }));

    const pieces = sampled.map((item, idx) => ({
      piece_id: `piece_${idx + 1}`,
      initial_rotation: 90 as const,
      initial_flip: "none" as const,
      target_slot_id: `slot_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
    }));

    return {
      content_pack: {
        prompt: "Bé hãy xoay các mảnh ghép về đúng hướng nhé!",
        target_slots,
        pieces,
      },
      difficulty_params: {
        allow_flip: false,
        rotation_step: 90 as const,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
