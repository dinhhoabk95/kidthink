import {
  getNouns,
  pickOne,
  sampleUnique,
  VALID_GENERATOR_THEMES,
} from "#src/generators/helpers";
import type { LevelGenerator } from "#src/generators/types";
import { shuffle } from "#src/rng/shuffle";
import type {
  GT019Content,
  GT019Difficulty,
} from "#src/templates/GT-019/template";

type RotationDeg = 0 | 90 | 180 | 270;

const ROTATIONS: RotationDeg[] = [0, 90, 180, 270];

export const GT019Generator: LevelGenerator<GT019Content, GT019Difficulty> = {
  engine: "GT-019",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["spatial", "rotation", "geometry"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }): {
    content_pack: GT019Content;
    difficulty_params: GT019Difficulty;
  } {
    const nouns = getNouns(vocabulary, 6);
    const isOlder = age_band === "5-6";
    const count = isOlder ? 2 + rng.nextInt(2) : 1 + rng.nextInt(2);
    const sampled = sampleUnique(rng, nouns, count);

    const target_slots: GT019Content["target_slots"] = [];
    const rawPieces: GT019Content["pieces"] = [];

    for (let idx = 0; idx < sampled.length; idx++) {
      const item = sampled[idx];
      if (!item) {
        continue;
      }
      const targetRot: RotationDeg = pickOne(rng, ROTATIONS);
      const otherRotations = ROTATIONS.filter((r) => r !== targetRot);
      const initRot: RotationDeg = pickOne(rng, otherRotations);

      target_slots.push({
        slot_id: `slot_${idx + 1}`,
        target_rotation: targetRot,
        target_flip: "none",
        asset: { kind: "emoji", ref: item.emoji_ref },
      });

      rawPieces.push({
        piece_id: `piece_${idx + 1}`,
        initial_rotation: initRot,
        initial_flip: "none",
        target_slot_id: `slot_${idx + 1}`,
        asset: { kind: "emoji", ref: item.emoji_ref },
      });
    }

    const pieces =
      rawPieces.length >= 2 ? shuffle(rawPieces, rng) : [...rawPieces];

    return {
      content_pack: {
        prompt: "Bé hãy xoay các mảnh ghép về đúng hướng nhé!",
        target_slots,
        pieces,
      },
      difficulty_params: {
        allow_flip: false,
        rotation_step: 90,
        hint_after_ms: isOlder ? 9000 : 8000,
        allow_retry: true,
      },
    };
  },
};
