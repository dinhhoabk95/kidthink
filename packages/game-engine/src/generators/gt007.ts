import { getNouns, pickOne } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT007Generator: LevelGenerator = {
  engine: "GT-007",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["number-bond", "addition", "decomposition"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, age_band, vocabulary }) {
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
        label: `${part2Val}`,
        is_correct: true,
      },
      {
        id: "opt_2",
        value: distractor1,
        label: `${distractor1}`,
        is_correct: false,
      },
      {
        id: "opt_3",
        value: distractor2,
        label: `${distractor2}`,
        is_correct: false,
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy tìm số còn thiếu để ghép thành số đúng nhé!",
        whole,
        parts,
        options,
      },
      difficulty_params: {
        whole_range: [1, 10] as [number, number],
        target_part_count: 1,
        option_count: 3,
        hint_after_ms: 12_000,
        allow_retry: true,
        show_visual_dots: true,
      },
    };
  },
};
