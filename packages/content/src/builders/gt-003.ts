import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatDisplayLabel, formatPluralNoun } from "@mindkid/shared";
import {
  createRng,
  resolveItemAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

export const projectGT003: Projection<"GT-003"> = {
  template: "GT-003",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-003 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const targetItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );
    const targetAttr = targetItem.category?.type ?? targetItem.label;

    const params = getEngineDifficultyParams("GT-003", opts.difficulty);
    const targetCount = params.target_count ?? 2;
    const distractorCount = Math.min(
      params.distractor_count ?? 0,
      dataset.items.length - 1
    );

    const otherItems = dataset.items.filter((i) => i.id !== targetItem.id);
    const chosenDistractors = shuffleDeterministic(otherItems, rng).slice(
      0,
      distractorCount
    );

    const items = [
      ...Array.from({ length: targetCount }, (_, i) => ({
        item_id: `${targetItem.id}_${i + 1}`,
        attribute: targetAttr,
        asset: resolveItemAsset(targetItem, true),
        is_correct: true,
      })),
      ...chosenDistractors.map((d, i) => ({
        item_id: `${d.id}_${i + 1}`,
        attribute: d.category?.type ?? d.label,
        asset: resolveItemAsset(d, true),
        is_correct: false,
      })),
    ];

    return {
      content_pack: {
        prompt: `Bé hãy kéo ${formatPluralNoun(targetAttr)} vào giỏ nhé!`,
        container: {
          container_id: "basket_1",
          label: `Giỏ ${formatDisplayLabel(targetAttr)}`,
          accepts_attribute: targetAttr,
        },
        items: shuffleDeterministic(items, rng),
      },
      difficulty_params: {
        item_count: items.length,
        distractor_count: chosenDistractors.length,
        target_count: targetCount,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
