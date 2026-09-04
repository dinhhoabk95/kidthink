import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, shuffleDeterministic } from "./utils.js";

export const projectGT016: Projection<"GT-016"> = {
  template: "GT-016",
  requires: { min_items: 0, max_items: 12 },
  project(_dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    const rng = createRng(opts.seed + (opts.round_index ?? 0));

    const targetHour = 1 + rng.nextInt(12);
    const targetMinute: 0 | 30 =
      opts.difficulty >= 2 && rng.nextInt(2) === 1 ? 30 : 0;
    const targetTime = { hour: targetHour, minute: targetMinute };

    const distractor1Hour = (targetHour % 12) + 1;
    const distractor2Hour = ((targetHour + 2) % 12) + 1;

    const options = shuffleDeterministic(
      [
        { hour: targetTime.hour, minute: targetTime.minute, is_correct: true },
        { hour: distractor1Hour, minute: targetTime.minute, is_correct: false },
        {
          hour: distractor2Hour,
          minute: targetTime.minute === 0 ? 30 : 0,
          is_correct: false,
        },
      ],
      rng
    );

    return {
      content_pack: {
        prompt: "Bé hãy xem đồng hồ chỉ mấy giờ nhé!",
        mode: "read" as const,
        target_time: targetTime,
        options,
      },
      difficulty_params: {
        minute_step: 30,
        distractor_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
