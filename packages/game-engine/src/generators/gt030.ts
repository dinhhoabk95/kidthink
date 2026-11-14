import {
  generateNumericOptions,
  getNouns,
  sampleUnique,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT030Generator: LevelGenerator = {
  engine: "GT-030",
  axes: {
    age_band: ["5-6"],
    what: ["size", "quantity", "number"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band: _age_band, what, vocabulary, escalation_step }) {
    const nouns = getNouns(vocabulary, 6);
    const [chosenObject, chosenUnit] = sampleUnique(rng, nouns, 2);
    if (!(chosenObject && chosenUnit)) {
      throw new Error("GT-030 cần ít nhất 2 danh từ");
    }

    const step = Math.max(0, Math.min(3, escalation_step ?? 0));
    const minLen = 4 + Math.min(2, Math.floor(step / 2));
    const maxLen = Math.min(8, minLen + 2);
    const lengthInUnits = minLen + rng.nextInt(maxLen - minLen + 1);
    const optionCount = step >= 2 ? 4 : 3 + rng.nextInt(2);

    const answer_options = generateNumericOptions(
      lengthInUnits,
      optionCount,
      rng,
      Math.max(10, lengthInUnits + 3)
    );

    const representation =
      what === "number" ? ("number-rod" as const) : ("discrete-unit" as const);
    const prompt = `Bé hãy xếp các ${chosenUnit.label_vi} để đo xem ${chosenObject.label_vi} dài mấy ${chosenUnit.label_vi} nhé!`;

    return {
      content_pack: {
        prompt,
        object: {
          object_id: "obj_main",
          asset: {
            kind: "emoji" as const,
            ref: chosenObject.emoji_ref,
          },
          length_in_units: lengthInUnits,
        },
        unit: {
          unit_id: "unit_measure",
          asset: {
            kind: "emoji" as const,
            ref: chosenUnit.emoji_ref,
          },
        },
        answer_options,
        representation,
      },
      difficulty_params: {
        item_count: answer_options.length,
        length_in_units: lengthInUnits,
        gap_tolerance_pct: 10,
        allow_retry: true,
        hint_after_ms: 8000,
      },
    };
  },
};
