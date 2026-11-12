import { shuffle } from "#src/rng/shuffle";
import type {
  GT007Content,
  GT007Difficulty,
} from "#src/templates/GT-007/template";
import { getNouns, pickOne, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT007Generator: LevelGenerator<GT007Content, GT007Difficulty> = {
  engine: "GT-007",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["number-bond", "addition", "decomposition"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    // Band 4-5 chia vật thật, band 5-6 chọn chữ số (`BR-EBD-12`, `BR-E007-06`).
    const isDiscrete = age_band !== "5-6";
    const nouns = getNouns(vocabulary, 6);
    const item = pickOne(rng, nouns);

    const wholeVal =
      age_band === "4-5" ? 4 + rng.nextInt(3) : 6 + rng.nextInt(5); // 4..6 hoặc 6..10
    const part1Val = 1 + rng.nextInt(wholeVal - 1);
    const part2Val = wholeVal - part1Val;

    const whole = {
      id: "whole_1",
      value: wholeVal,
      label: `${wholeVal}`,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
    };

    const parts = [
      {
        id: "part_1",
        value: part1Val,
        is_target: false,
        label: `${part1Val}`,
      },
      {
        id: "part_2",
        value: part2Val,
        is_target: true,
        label: "?",
      },
    ];

    const distractor1 = part2Val > 1 ? part2Val - 1 : part2Val + 2;
    const distractor2 = part2Val + 1;

    const options = [
      {
        id: "opt_1",
        value: part2Val,
        is_correct: true,
      },
      {
        id: "opt_2",
        value: distractor1,
        is_correct: false,
      },
      {
        id: "opt_3",
        value: distractor2,
        is_correct: false,
      },
    ];

    return {
      content_pack: {
        prompt: isDiscrete
          ? "Bé hãy chia đồ vật vào khay còn trống cho đủ nhé!"
          : "Bé hãy tìm số còn thiếu để ghép thành số đúng nhé!",
        representation: isDiscrete
          ? ("discrete-object" as const)
          : ("numeral" as const),
        whole,
        parts,
        options: shuffle(options, rng),
      },
      difficulty_params: {
        item_count: options.length,
        part_count: 2,
        distractor_count: 2,
        hint_after_ms: 12_000,
        allow_retry: true,
      },
    };
  },
};
