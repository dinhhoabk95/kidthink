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

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const groupCount = 2;
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const itemA = safeGetItem(shuffled, 0);
    const itemB = safeGetItem(shuffled, 1);

    const groups = [
      {
        group_id: "g1",
        label: itemA.label,
        label_emoji: itemA.image?.kind === "emoji" ? itemA.image.ref : "📁",
      },
      {
        group_id: "g2",
        label: itemB.label,
        label_emoji: itemB.image?.kind === "emoji" ? itemB.image.ref : "📂",
      },
    ];

    const items = [
      {
        item_id: `${itemA.id}_1`,
        asset: resolveItemAsset(itemA, true),
        correct_group_id: "g1",
      },
      {
        item_id: `${itemA.id}_2`,
        asset: resolveItemAsset(itemA, true),
        correct_group_id: "g1",
      },
      {
        item_id: `${itemB.id}_1`,
        asset: resolveItemAsset(itemB, true),
        correct_group_id: "g2",
      },
      {
        item_id: `${itemB.id}_2`,
        asset: resolveItemAsset(itemB, true),
        correct_group_id: "g2",
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy phân loại các hình vào đúng nhóm nhé!",
        groups,
        items: shuffleDeterministic(items, rng),
      },
      difficulty_params: {
        group_count: groupCount,
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
