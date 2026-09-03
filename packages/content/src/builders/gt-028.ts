import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, safeGetItem } from "./utils.js";

export const projectGT028: Projection<"GT-028"> = {
  template: "GT-028",
  requires: { min_items: 1, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-028`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const step = 2; // đếm bước 2
    const totalSteps = Math.min(Math.max(2, opts.difficulty + 1), 5);
    const target_total = totalSteps * step;
    const itemCount = Math.max(4, totalSteps + 1);

    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );
    const items = Array.from({ length: itemCount }, (_, i) => ({
      item_id: `${baseItem.id}_${i + 1}`,
      asset: resolveItemAsset(baseItem, true),
    }));

    return {
      content_pack: {
        prompt: `Bé hãy chạm đếm cách 2 cho đến ${target_total} nhé!`,
        step: 2 as const,
        items,
        target_total,
      },
      difficulty_params: {
        step: 2 as const,
        item_count: itemCount,
        allow_undo: true,
        hint_after_ms: 8000,
        shuffle_items: true,
      },
    };
  },
};
