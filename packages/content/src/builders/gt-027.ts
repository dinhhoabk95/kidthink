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

function buildRuleSwitchItems(
  itemCount: number,
  item1: SkillDataset["items"][number],
  item2: SkillDataset["items"][number]
) {
  const colors = ["red", "blue"];
  const shapes = [item1, item2];

  return Array.from({ length: itemCount }, (_, i) => {
    const color = colors[i % 2] ?? "red";
    const shapeItem = shapes[Math.floor(i / 2) % 2] ?? item1;
    return {
      id: `${shapeItem.id}_${color}_${i + 1}`,
      asset: resolveItemAsset(shapeItem, true),
      color,
      shape: shapeItem.label,
      size: "medium",
    };
  });
}

export const projectGT027: Projection<"GT-027"> = {
  template: "GT-027",
  requires: { min_items: 4, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-027 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-027", opts.difficulty);
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const item1 = safeGetItem(shuffled, 0);
    const item2 = safeGetItem(shuffled, 1);

    const rules = [
      {
        id: "rule_shape",
        name: "Theo hình dạng",
        description: `Chọn hình ${item1.label}`,
        dimension: "shape" as const,
        target_value: item1.label,
        signal_text: `Hãy chọn hình ${item1.label}`,
      },
      {
        id: "rule_color",
        name: "Theo màu sắc",
        description: "Chọn màu đỏ",
        dimension: "color" as const,
        target_value: "red",
        signal_text: "Đổi quy luật: hãy chọn màu đỏ",
      },
    ];

    const rawItems = buildRuleSwitchItems(params.item_count, item1, item2);
    const items = shuffleDeterministic(rawItems, rng);

    return {
      content_pack: {
        prompt: "Bé phân loại theo tín hiệu quy luật nhé!",
        rules,
        items,
        switch_after_trials: 2,
      },
      difficulty_params: {
        item_count: params.item_count,
        target_count: params.target_count,
        signal_duration_ms: params.signal_duration_ms,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
