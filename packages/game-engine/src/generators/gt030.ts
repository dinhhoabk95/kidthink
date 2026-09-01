import type { Rng } from "#src/rng/types";
import {
  getNouns,
  pickOne,
  sampleUnique,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

function generateOptions(
  correctValue: number,
  optionCount: number,
  rng: Rng,
  maxValue: number
): { option_id: string; value: number; is_correct: boolean }[] {
  const distractors = new Set<number>();
  const candidates: number[] = [];

  for (
    let v = Math.max(1, correctValue - 3);
    v <= Math.min(maxValue, correctValue + 3);
    v++
  ) {
    if (v !== correctValue) {
      candidates.push(v);
    }
  }

  let fallback = 1;
  while (candidates.length < optionCount - 1) {
    if (fallback !== correctValue && !candidates.includes(fallback)) {
      candidates.push(fallback);
    }
    fallback++;
  }

  const chosenDistractors = sampleUnique(rng, candidates, optionCount - 1);
  for (const d of chosenDistractors) {
    distractors.add(d);
  }

  const list = [
    {
      option_id: `opt_${correctValue}`,
      value: correctValue,
      is_correct: true,
    },
    ...Array.from(distractors).map((val) => ({
      option_id: `opt_${val}`,
      value: val,
      is_correct: false,
    })),
  ];

  return sampleUnique(rng, list, list.length);
}

export const GT030Generator: LevelGenerator = {
  engine: "GT-030",
  axes: {
    age_band: ["5-6"],
    what: ["size", "quantity", "number"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band: _age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const chosenObject = nouns[0] ?? pickOne(rng, nouns);
    const chosenUnit = nouns[1] ?? chosenObject;

    const lengthInUnits = 3 + rng.nextInt(5); // 3, 4, 5, 6, 7
    const optionCount = 3 + rng.nextInt(2); // 3 or 4

    const answer_options = generateOptions(
      lengthInUnits,
      optionCount,
      rng,
      Math.max(10, lengthInUnits + 4)
    );

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
      },
      difficulty_params: {
        length_in_units: lengthInUnits,
        gap_tolerance_pct: 10,
        allow_retry: true,
        hint_after_ms: 8000,
      },
    };
  },
};
