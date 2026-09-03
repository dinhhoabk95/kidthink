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

export const projectGT025: Projection<"GT-025"> = {
  template: "GT-025",
  requires: { min_items: 2, max_items: 10 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-025 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const itemCommon = safeGetItem(shuffled, 0);
    const itemDiffLeft = safeGetItem(shuffled, 1);
    const itemDiffRight = shuffled[2] ?? itemCommon;

    const left_objects = [
      {
        id: "left_obj1",
        asset: resolveItemAsset(itemCommon, true),
        x: 150,
        y: 200,
      },
      {
        id: "left_obj2",
        asset: resolveItemAsset(itemDiffLeft, true),
        x: 300,
        y: 200,
      },
    ];

    const right_objects = [
      {
        id: "right_obj1",
        asset: resolveItemAsset(itemCommon, true),
        x: 150,
        y: 200,
      },
      {
        id: "right_obj2",
        asset: resolveItemAsset(itemDiffRight, true),
        x: 300,
        y: 200,
      },
    ];

    const differences = [
      {
        id: "diff_1",
        left_id: "left_obj2",
        right_id: "right_obj2",
        description: `Bên trái là ${itemDiffLeft.label}, bên phải là ${itemDiffRight.label}`,
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy tìm điểm khác biệt giữa hai bức hình nhé!",
        target_count: 1,
        left_objects,
        right_objects,
        differences,
      },
      difficulty_params: {
        difference_count: 1,
        show_difference_counter: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
