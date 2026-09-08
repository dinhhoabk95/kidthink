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

export const projectGT014: Projection<"GT-014"> = {
  template: "GT-014",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-014 đòi hỏi tối thiểu 2 vật`
      );
    }

    const params = getEngineDifficultyParams("GT-014", opts.difficulty);
    const targetItemCount = params.item_count;

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const itemHeavy = safeGetItem(shuffled, 0);
    const itemLight = safeGetItem(shuffled, 1);

    const leftPan = [
      {
        item_id: `${itemHeavy.id}_left`,
        asset: resolveItemAsset(itemHeavy, true),
        weight: 3,
      },
    ];
    const rightPan = [
      {
        item_id: `${itemLight.id}_right`,
        asset: resolveItemAsset(itemLight, true),
        weight: 1,
      },
    ];

    const tray = [
      {
        item_id: `${itemHeavy.id}_tray`,
        asset: resolveItemAsset(itemHeavy, true),
        weight: 3,
      },
      {
        item_id: `${itemLight.id}_tray`,
        asset: resolveItemAsset(itemLight, true),
        weight: 1,
      },
    ];

    for (let i = 2; i < targetItemCount; i++) {
      const extraItem = shuffled[i] ?? {
        id: `${itemHeavy.id}_extra_${i}`,
        label: itemHeavy.label,
        glyph: "⚖️",
      };
      tray.push({
        item_id: `${extraItem.id}_tray`,
        asset: resolveItemAsset(extraItem, true),
        weight: (i % 4) + 1,
      });
    }

    const weightSpan =
      typeof params.weight_span === "number" ? params.weight_span : 3;

    return {
      content_pack: {
        prompt: "Bé hãy chạm vào bên đĩa cân nặng hơn nhé!",
        left_pan: leftPan,
        right_pan: rightPan,
        tray,
        goal: "pick_heavier" as const,
        target_side: "left" as const,
      },
      difficulty_params: {
        item_count: targetItemCount,
        tray_count: targetItemCount,
        weight_span: weightSpan,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
