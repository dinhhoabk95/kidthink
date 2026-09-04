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

export const projectGT033: Projection<"GT-033"> = {
  template: "GT-033",
  requires: { min_items: 2, max_items: 4 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-033 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const itemA = safeGetItem(shuffled, 0);
    const itemB = safeGetItem(shuffled, 1);

    const palette = [
      {
        color_id: itemA.id,
        asset: resolveItemAsset(itemA, true),
        name_vi: itemA.label,
      },
      {
        color_id: itemB.id,
        asset: resolveItemAsset(itemB, true),
        name_vi: itemB.label,
      },
    ];

    // 2x2 grid: [A, B, B, null]
    const cells = [itemA.id, itemB.id, itemB.id, null];

    return {
      content_pack: {
        prompt: "Bé điền màu thích hợp vào ô trống nhé!",
        grid: { rows: 2, cols: 2 },
        palette,
        cells,
      },
      difficulty_params: {
        grid_rows: 2,
        grid_cols: 2,
        missing_count: 1,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
