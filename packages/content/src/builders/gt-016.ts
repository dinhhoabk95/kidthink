import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import {
  GT016_HINT_AFTER_MS_BY_STEP,
  pickGT016Distractors,
  pickGT016Target,
} from "@mindkid/game-engine/generators";
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
    const params = getEngineDifficultyParams("GT-016", opts.difficulty);

    const configuredStep = params.minute_step ?? 30;
    // Bậc 15 chưa có bộ sinh riêng: dùng bậc 30 (BR-E016-04).
    const ruleStep: 30 | 60 = configuredStep === 60 ? 60 : 30;
    const distractorCount = params.distractor_count ?? 3;

    const targetTime = pickGT016Target(rng, ruleStep);
    const distractors = pickGT016Distractors(
      rng,
      targetTime,
      ruleStep,
      distractorCount
    );
    const rawOptions = [
      { ...targetTime, is_correct: true },
      ...distractors.map((d) => ({ ...d, is_correct: false })),
    ];
    const options = shuffleDeterministic(rawOptions, rng);

    return {
      content_pack: {
        prompt: "Đố bé kim đồng hồ đang chỉ mấy giờ nhỉ?",
        mode: "read" as const,
        target_time: targetTime,
        options,
      },
      difficulty_params: {
        item_count: params.item_count,
        minute_step: configuredStep,
        distractor_count: distractorCount,
        hint_after_ms: GT016_HINT_AFTER_MS_BY_STEP[ruleStep],
        allow_retry: true,
      },
    };
  },
};
