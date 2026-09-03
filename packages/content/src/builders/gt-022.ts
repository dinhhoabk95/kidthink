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

export const projectGT022: Projection<"GT-022"> = {
  template: "GT-022",
  requires: { min_items: 3, max_items: 8 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 3) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-022 đòi hỏi tối thiểu 3 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const targetIdx = rng.nextInt(dataset.items.length);
    const targetItem = safeGetItem(dataset.items, targetIdx);

    const otherItems = dataset.items.filter((_, i) => i !== targetIdx);
    const targetCount = 2;
    const distractorCount = Math.min(
      Math.max(2, Math.min(opts.difficulty + 2, 6)),
      otherItems.length
    );

    const chosenDistractors = shuffleDeterministic(otherItems, rng).slice(
      0,
      distractorCount
    );

    const scene_objects = [
      ...Array.from({ length: targetCount }, (_, i) => ({
        id: `${targetItem.id}_t${i + 1}`,
        asset: resolveItemAsset(targetItem, true),
        is_target: true,
        is_hidden: false,
        x: 100 + rng.nextInt(760),
        y: 80 + rng.nextInt(380),
      })),
      ...chosenDistractors.map((d, i) => ({
        id: `${d.id}_d${i + 1}`,
        asset: resolveItemAsset(d, true),
        is_target: false,
        is_hidden: false,
        x: 100 + rng.nextInt(760),
        y: 80 + rng.nextInt(380),
      })),
    ];

    return {
      content_pack: {
        prompt: `Bé hãy tìm các hình ${targetItem.label} nhé!`,
        target_description: targetItem.label,
        scene_objects: shuffleDeterministic(scene_objects, rng),
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
        show_target_counter: true,
      },
    };
  },
};
