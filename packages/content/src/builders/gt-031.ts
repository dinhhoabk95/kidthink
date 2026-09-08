import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, safeGetItem } from "./utils.js";

function buildCoins(
  itemCount: number,
  targetAmount: number,
  baseItem: SkillDataset["items"][number]
) {
  const coinValues: number[] = [];
  if (targetAmount === 3) {
    coinValues.push(1, 2);
  } else if (targetAmount === 5) {
    coinValues.push(1, 2, 2);
  } else if (targetAmount === 7) {
    coinValues.push(2, 5);
  } else if (targetAmount === 10) {
    coinValues.push(5, 5);
  } else {
    // 15
    coinValues.push(5, 10);
  }

  // Điền thêm các coin phụ để đủ itemCount
  const fillers = [1, 2, 5, 2, 1, 2];
  let fillerIdx = 0;
  while (coinValues.length < itemCount) {
    coinValues.push(fillers[fillerIdx % fillers.length] ?? 1);
    fillerIdx++;
  }

  return coinValues.slice(0, itemCount).map((val, idx) => ({
    coin_id: `c_${val}_${idx + 1}`,
    asset: resolveItemAsset(baseItem, true),
    value: val,
  }));
}

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
    const params = getEngineDifficultyParams("GT-031", opts.difficulty);
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    const targetAmount = params.target_amount ?? 5;
    const coinKindCount = params.coin_kind_count ?? 2;
    const coins = buildCoins(params.item_count, targetAmount, baseItem);

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
        item_count: params.item_count,
        target_amount: targetAmount,
        coin_kind_count: coinKindCount,
        exact_change: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
