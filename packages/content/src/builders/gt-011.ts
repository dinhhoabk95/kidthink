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

export const projectGT011: Projection<"GT-011"> = {
  template: "GT-011",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-011 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const itemA = safeGetItem(shuffled, 0);
    const itemB = safeGetItem(shuffled, 1);

    // 2x2 matrix: [A, B], [B, ?=A] (row/col symmetry)
    const cells = [
      { row: 0, col: 0, asset: resolveItemAsset(itemA, true) },
      { row: 0, col: 1, asset: resolveItemAsset(itemB, true) },
      { row: 1, col: 0, asset: resolveItemAsset(itemB, true) },
      { row: 1, col: 1, asset: null },
    ];

    const otherItems = shuffled.filter(
      (it) => it.id !== itemA.id && it.id !== itemB.id
    );
    const distractorExtra = otherItems[0] ?? {
      id: `${itemA.id}_extra`,
      label: itemA.label,
      glyph: "⭐",
    };

    const options = [
      {
        option_id: "opt_correct",
        asset: resolveItemAsset(itemA, true),
        is_correct: true,
      },
      {
        option_id: "opt_d1",
        asset: resolveItemAsset(itemB, true),
        is_correct: false,
      },
      {
        option_id: "opt_d2",
        asset: resolveItemAsset(distractorExtra, true),
        is_correct: false,
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy tìm hình thích hợp vào ô trống nhé!",
        matrix: {
          rows: 2 as const,
          cols: 2 as const,
          cells,
        },
        options: shuffleDeterministic(options, rng),
      },
      difficulty_params: {
        grid_size: 2,
        distractor_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
