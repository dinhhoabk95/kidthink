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

export const projectGT004: Projection<"GT-004"> = {
  template: "GT-004",
  requires: { min_items: 4, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-004 đòi hỏi tối thiểu 2 nhóm vật`
      );
    }

    const params = getEngineDifficultyParams("GT-004", opts.difficulty);
    const targetItemCount = params.item_count;

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const itemA = safeGetItem(shuffled, 0);
    const itemB = safeGetItem(shuffled, 1);

    const groups = [
      {
        group_id: "g1",
        label: itemA.label.length > 24 ? itemA.label.slice(0, 24) : itemA.label,
        label_emoji: itemA.image?.kind === "emoji" ? itemA.image.ref : "📁",
      },
      {
        group_id: "g2",
        label: itemB.label.length > 24 ? itemB.label.slice(0, 24) : itemB.label,
        label_emoji: itemB.image?.kind === "emoji" ? itemB.image.ref : "📂",
      },
    ];

    const countA = Math.floor(targetItemCount / 2);
    const countB = targetItemCount - countA;

    const items = [
      ...Array.from({ length: countA }, (_, i) => ({
        item_id: `${itemA.id}_${i + 1}`,
        asset: resolveItemAsset(itemA, true),
        correct_group_id: "g1",
      })),
      ...Array.from({ length: countB }, (_, j) => ({
        item_id: `${itemB.id}_${j + 1}`,
        asset: resolveItemAsset(itemB, true),
        correct_group_id: "g2",
      })),
    ];

    return {
      content_pack: {
        prompt: "Bé hãy phân loại vào đúng nhóm nhé!",
        groups,
        items: shuffleDeterministic(items, rng),
      },
      difficulty_params: {
        item_count: targetItemCount,
        distractor_count: params.distractor_count ?? 0,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };
  },
};
