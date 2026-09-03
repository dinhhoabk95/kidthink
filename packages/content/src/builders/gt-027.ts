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

    const items = [
      {
        id: `${item1.id}_red`,
        asset: resolveItemAsset(item1, true),
        color: "red",
        shape: item1.label,
        size: "medium",
      },
      {
        id: `${item1.id}_blue`,
        asset: resolveItemAsset(item1, true),
        color: "blue",
        shape: item1.label,
        size: "medium",
      },
      {
        id: `${item2.id}_red`,
        asset: resolveItemAsset(item2, true),
        color: "red",
        shape: item2.label,
        size: "medium",
      },
      {
        id: `${item2.id}_blue`,
        asset: resolveItemAsset(item2, true),
        color: "blue",
        shape: item2.label,
        size: "medium",
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy chú ý tín hiệu để phân loại theo quy luật nhé!",
        rules,
        items: shuffleDeterministic(items, rng),
        switch_after_trials: 2,
      },
      difficulty_params: {
        signal_duration_ms: 2000,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
