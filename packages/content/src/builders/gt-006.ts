import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { resolveItemAsset } from "./utils.js";

export const projectGT006: Projection<"GT-006"> = {
  template: "GT-006",
  requires: { min_items: 3, max_items: 5 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 3) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-006 đòi hỏi tối thiểu 3 vật`
      );
    }

    const itemCount = Math.min(
      Math.max(3, Math.min(opts.difficulty + 2, 5)),
      dataset.items.length
    );

    // If ordering specified, use it
    let orderedIds = dataset.ordering ?? dataset.items.map((i) => i.id);
    if (orderedIds.length < itemCount) {
      orderedIds = dataset.items.map((i) => i.id);
    }

    const itemMap = new Map(dataset.items.map((i) => [i.id, i]));
    const selectedIds = orderedIds.slice(0, itemCount);

    const sequence = selectedIds.map((id, index) => {
      const item = itemMap.get(id);
      if (!item) {
        throw new Error(
          `[BR-SDS-02] Item ${id} trong ordering không tìm thấy trong items của dataset ${dataset.skill_code}`
        );
      }
      return {
        step_id: `step-${item.id}`,
        order_index: index,
        asset: resolveItemAsset(item, true),
        label: item.label,
      };
    });

    return {
      content_pack: {
        prompt: "Bé hãy sắp xếp các hình theo đúng thứ tự nhé!",
        sequence,
      },
      difficulty_params: {
        hint_after_ms: 15_000,
        allow_retry: true,
        shuffle_initial: true,
      },
    };
  },
};
