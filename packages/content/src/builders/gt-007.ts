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

export const projectGT007: Projection<"GT-007"> = {
  template: "GT-007",
  requires: { min_items: 1, max_items: 10 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-007`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );
    const wholeVal = Math.min(Math.max(2, opts.difficulty + 2), 6);
    const part1Val = 1 + rng.nextInt(wholeVal - 1);
    const targetPartVal = wholeVal - part1Val;

    const parts = [
      {
        id: "part_1",
        value: part1Val,
        is_target: false,
        asset: resolveItemAsset(baseItem, true),
      },
      {
        id: "part_2",
        value: targetPartVal,
        is_target: true,
        asset: resolveItemAsset(baseItem, true),
      },
    ];

    const distractorCandidates = [1, 2, 3, 4, 5, 6].filter(
      (v) => v !== targetPartVal
    );
    const distractors = shuffleDeterministic(distractorCandidates, rng).slice(
      0,
      2
    );

    const options = [
      {
        id: "opt_correct",
        value: targetPartVal,
        asset: resolveItemAsset(baseItem, true),
        is_correct: true,
      },
      ...distractors.map((v, i) => ({
        id: `opt_d_${i + 1}`,
        value: v,
        asset: resolveItemAsset(baseItem, true),
        is_correct: false,
      })),
    ];

    return {
      content_pack: {
        prompt: `Số ${wholeVal} tách thành ${part1Val} và mấy nhé?`,
        whole: {
          id: "whole_1",
          value: wholeVal,
          asset: resolveItemAsset(baseItem, true),
        },
        parts,
        options: shuffleDeterministic(options, rng),
      },
      difficulty_params: {
        part_count: 2,
        distractor_count: 2,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
