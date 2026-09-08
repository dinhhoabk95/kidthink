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

export const projectGT007: Projection<"GT-007"> = {
  template: "GT-007",
  requires: { min_items: 1, max_items: 10 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-007`
      );
    }

    const params = getEngineDifficultyParams("GT-007", opts.difficulty);
    const wholeVal = params.item_count;

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );
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
    const distractorOptionCount = Math.max(1, params.distractor_count ?? 0);
    const distractors = shuffleDeterministic(distractorCandidates, rng).slice(
      0,
      distractorOptionCount
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

    const partCount =
      typeof params.part_count === "number" ? params.part_count : 2;

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
        item_count: params.item_count,
        part_count: partCount,
        distractor_count: params.distractor_count ?? 0,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
