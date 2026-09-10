import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import {
  createRng,
  resolveItemAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

export const projectGT029: Projection<"GT-029"> = {
  template: "GT-029",
  requires: { min_items: 1, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-029`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    const params = getEngineDifficultyParams("GT-029", opts.difficulty);
    const initialCount = params.initial_count ?? 3;
    const removeCount = Math.min(params.remove_count ?? 1, initialCount - 1);
    const expectedRemain = initialCount - removeCount;

    const initial_items = Array.from({ length: initialCount }, (_, i) => ({
      item_id: `${baseItem.id}_init_${i + 1}`,
      asset: resolveItemAsset(baseItem, true),
    }));

    const distractorCandidates = [0, 1, 2, 3, 4, 5, 6].filter(
      (v) => v !== expectedRemain
    );
    const distractors = shuffleDeterministic(distractorCandidates, rng).slice(
      0,
      2
    );

    const answer_options = [
      {
        option_id: "opt_correct",
        value: expectedRemain,
        is_correct: true,
      },
      ...distractors.map((v, i) => ({
        option_id: `opt_d_${i + 1}`,
        value: v,
        is_correct: false,
      })),
    ];

    return {
      content_pack: {
        prompt: `Bớt đi ${removeCount} thì còn lại mấy nhé?`,
        initial_items,
        remove_count: removeCount,
        answer_options: shuffleDeterministic(answer_options, rng),
      },
      difficulty_params: {
        item_count: initial_items.length,
        initial_count: initialCount,
        remove_count: removeCount,
        show_crossed_items: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
