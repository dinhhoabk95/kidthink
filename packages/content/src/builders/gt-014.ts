import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  DatasetItem,
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

function resolveGoalAndPrompt(
  difficulty: number,
  useRefScale: boolean
): {
  goal: "balance" | "pick_heavier" | "pick_lighter";
  prompt: string;
  targetSide: "left" | "right" | undefined;
} {
  if (useRefScale) {
    return {
      goal: "balance",
      prompt: "Bé xem cân mẫu rồi đặt vật cho thăng bằng nhé!",
      targetSide: undefined,
    };
  }
  if (difficulty === 3) {
    return {
      goal: "pick_lighter",
      prompt: "Đố bé chạm vào đĩa cân bồng nhẹ hơn nhé!",
      targetSide: "right",
    };
  }
  if (difficulty >= 4) {
    return {
      goal: "balance",
      prompt: "Bé đặt thêm vật lên đĩa cho cân bằng nhé!",
      targetSide: undefined,
    };
  }
  return {
    goal: "pick_heavier",
    prompt: "Đố bé chạm vào đĩa cân trĩu nặng hơn nhé!",
    targetSide: "left",
  };
}

/**
 * Cân mẫu thể hiện phương trình thế: 1 vật nặng (weight=2) = 2 vật nhẹ (weight=1+1).
 * Nhờ đó trên cân chính (trái=1 vật nặng [2], phải=1 vật nhẹ [1]), trẻ suy ra cần
 * đặt thêm đúng 1 vật nhẹ (weight=1) từ khay vào đĩa phải để cân bằng.
 */
function buildReferenceScales(
  useRefScale: boolean,
  itemHeavy: DatasetItem,
  itemLight: DatasetItem
) {
  if (!useRefScale) {
    return undefined;
  }
  return [
    {
      scale_id: "ref_scale_1",
      left_pan: [
        {
          item_id: `${itemHeavy.id.slice(0, 22)}_ref_l`,
          asset: resolveItemAsset(itemHeavy, true),
          weight: 2,
        },
      ],
      right_pan: [
        {
          item_id: `${itemLight.id.slice(0, 22)}_ref_r1`,
          asset: resolveItemAsset(itemLight, true),
          weight: 1,
        },
        {
          item_id: `${itemLight.id.slice(0, 22)}_ref_r2`,
          asset: resolveItemAsset(itemLight, true),
          weight: 1,
        },
      ],
    },
  ];
}

function buildTrayItems(
  itemHeavy: DatasetItem,
  itemLight: DatasetItem,
  shuffled: readonly DatasetItem[],
  targetItemCount: number,
  useRefScale: boolean
) {
  const tray = [
    {
      item_id: `${itemHeavy.id.slice(0, 25)}_tray`,
      asset: resolveItemAsset(itemHeavy, true),
      weight: 2,
    },
    {
      item_id: `${itemLight.id.slice(0, 25)}_tray`,
      asset: resolveItemAsset(itemLight, true),
      weight: 1,
    },
  ];
  for (let i = 2; i < targetItemCount; i++) {
    const extraItem = shuffled[i] ?? {
      id: `${itemHeavy.id.slice(0, 20)}_ex_${i}`,
      label: itemHeavy.label,
      glyph: "🍎",
    };
    tray.push({
      item_id: `${extraItem.id.slice(0, 25)}_tray`,
      asset: resolveItemAsset(extraItem, true),
      weight: useRefScale ? (i % 3) + 2 : (i % 4) + 1,
    });
  }
  return tray;
}

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
    const firstItem = safeGetItem(shuffled, 0);
    const secondItem = safeGetItem(shuffled, 1);
    const shouldSwap =
      typeof firstItem.value === "number" &&
      typeof secondItem.value === "number" &&
      firstItem.value < secondItem.value;
    const itemHeavy = shouldSwap ? secondItem : firstItem;
    const itemLight = shouldSwap ? firstItem : secondItem;

    const useRefScale =
      (opts.difficulty >= 5 ||
        (dataset.skill_code === "C1.MEAS.07" && opts.difficulty >= 3)) &&
      shuffled.length >= 2;

    const heavyPanWeight = useRefScale ? 2 : 3;
    const leftPan = [
      {
        item_id: `${itemHeavy.id.slice(0, 25)}_left`,
        asset: resolveItemAsset(itemHeavy, true),
        weight: heavyPanWeight,
      },
    ];
    const rightPan = [
      {
        item_id: `${itemLight.id.slice(0, 25)}_right`,
        asset: resolveItemAsset(itemLight, true),
        weight: 1,
      },
    ];
    const tray = buildTrayItems(
      itemHeavy,
      itemLight,
      shuffled,
      targetItemCount,
      useRefScale
    );

    const weightSpan =
      typeof params.weight_span === "number" ? params.weight_span : 3;

    const { goal, prompt, targetSide } = resolveGoalAndPrompt(
      opts.difficulty,
      useRefScale
    );
    const referenceScales = buildReferenceScales(
      useRefScale,
      itemHeavy,
      itemLight
    );

    return {
      content_pack: {
        prompt,
        left_pan: leftPan,
        right_pan: rightPan,
        tray,
        goal,
        ...(targetSide ? { target_side: targetSide } : {}),
        ...(referenceScales ? { reference_scales: referenceScales } : {}),
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
