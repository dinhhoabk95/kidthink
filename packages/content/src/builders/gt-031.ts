import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, safeGetItem } from "./utils.js";

export const projectGT031: Projection<"GT-031"> = {
  template: "GT-031",
  requires: { min_items: 1, max_items: 8 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-031`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    // Coins of value 1, 2, 5
    const coins = [
      { coin_id: "c_1_1", asset: resolveItemAsset(baseItem, true), value: 1 },
      { coin_id: "c_1_2", asset: resolveItemAsset(baseItem, true), value: 1 },
      { coin_id: "c_2_1", asset: resolveItemAsset(baseItem, true), value: 2 },
      { coin_id: "c_2_2", asset: resolveItemAsset(baseItem, true), value: 2 },
    ];

    const targetAmount = Math.min(Math.max(2, opts.difficulty + 1), 4);

    return {
      content_pack: {
        prompt: `Bé hãy chọn các đồng tiền để có đúng ${targetAmount} đồng nhé!`,
        coins,
        target_amount: targetAmount,
        item_to_buy: {
          label: baseItem.label,
          asset: resolveItemAsset(baseItem, true),
        },
      },
      difficulty_params: {
        target_amount: targetAmount,
        coin_kind_count: 2,
        exact_change: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
