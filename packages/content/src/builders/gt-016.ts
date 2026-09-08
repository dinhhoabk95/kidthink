import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, shuffleDeterministic } from "./utils.js";

function buildClockOptions(
  targetHour: number,
  targetMinute: 0 | 30,
  distractorCount: number
) {
  const options = [
    { hour: targetHour, minute: targetMinute, is_correct: true },
  ];
  for (let i = 1; i <= distractorCount; i++) {
    const distHour = ((targetHour + i * 2 - 1) % 12) + 1;
    const distMinute: 0 | 30 = i % 2 === 1 && targetMinute === 0 ? 30 : 0;
    options.push({
      hour: distHour,
      minute: distMinute,
      is_correct: false,
    });
  }
  return options;
}

export const projectGT016: Projection<"GT-016"> = {
  template: "GT-016",
  requires: { min_items: 0, max_items: 12 },
  project(_dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-016", opts.difficulty);

    const targetHour = 1 + rng.nextInt(12);
    const targetMinute: 0 | 30 =
      params.minute_step <= 30 && rng.nextInt(2) === 1 ? 30 : 0;
    const targetTime = { hour: targetHour, minute: targetMinute };

    const rawOptions = buildClockOptions(
      targetHour,
      targetMinute,
      params.distractor_count
    );
    const options = shuffleDeterministic(rawOptions, rng);

    return {
      content_pack: {
        prompt: "Bé hãy xem đồng hồ chỉ mấy giờ nhé!",
        mode: "read" as const,
        target_time: targetTime,
        options,
      },
      difficulty_params: {
        item_count: params.item_count,
        minute_step: params.minute_step,
        distractor_count: params.distractor_count,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
