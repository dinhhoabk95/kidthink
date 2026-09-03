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

export const projectGT012: Projection<"GT-012"> = {
  template: "GT-012",
  requires: { min_items: 1, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-012 đòi hỏi tối thiểu 1 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    // Number of flash items between 1 and 6 based on difficulty
    const targetCount = Math.min(
      Math.max(1, Math.min(opts.difficulty + 1, 6)),
      dataset.items.length
    );

    // Pick 1 base item to repeat or pick targetCount distinct items
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );
    const flashItems = Array.from({ length: targetCount }, (_, i) => ({
      item_id: `${baseItem.id}-${i + 1}`,
      asset: resolveItemAsset(baseItem, false),
    }));

    // Options: correct count + distractors
    const distractorCandidates = [1, 2, 3, 4, 5, 6].filter(
      (v) => v !== targetCount
    );
    const shuffledDistractors = shuffleDeterministic(
      distractorCandidates,
      rng
    ).slice(0, 2);

    const options = [
      { value: targetCount, is_correct: true },
      ...shuffledDistractors.map((v) => ({ value: v, is_correct: false })),
    ];

    const shuffledOptions = shuffleDeterministic(options, rng);

    return {
      content_pack: {
        prompt: "Bé hãy nhớ xem có bao nhiêu hình vừa xuất hiện nhé!",
        flash_items: flashItems,
        arrangement: "dice" as const,
        options: shuffledOptions,
      },
      difficulty_params: {
        flash_ms: 1500,
        item_count: targetCount,
        distractor_count: 2,
        allow_replay: true,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
