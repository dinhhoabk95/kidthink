import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { resolveItemAsset, safeGetItem } from "./utils.js";

export const projectGT006: Projection<"GT-006"> = {
  template: "GT-006",
  requires: { min_items: 3, max_items: 5 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 3) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-006 đòi hỏi tối thiểu 3 vật`
      );
    }

    const params = getEngineDifficultyParams("GT-006", opts.difficulty);
    const expectedItemCount = params.item_count;

    // If ordering specified, use it
    let orderedIds = dataset.ordering ?? dataset.items.map((i) => i.id);
    if (orderedIds.length < expectedItemCount) {
      orderedIds = dataset.items.map((i) => i.id);
    }

    const itemMap = new Map(dataset.items.map((i) => [i.id, i]));
    const selectedIds: string[] = [];
    for (let i = 0; i < expectedItemCount; i++) {
      if (i < orderedIds.length) {
        selectedIds.push(safeGetItem(orderedIds, i));
      } else {
        const fallback = safeGetItem(dataset.items, i % dataset.items.length);
        selectedIds.push(fallback.id);
      }
    }

    const sequence = selectedIds.map((id, index) => {
      const item = itemMap.get(id);
      if (!item) {
        throw new Error(
          `[BR-SDS-02] Item ${id} trong ordering không tìm thấy trong items của dataset ${dataset.skill_code}`
        );
      }
      return {
        step_id: `step-${item.id}-${index + 1}`,
        order_index: index,
        asset: resolveItemAsset(item, true),
        label: item.label,
      };
    });

    return {
      content_pack: {
        prompt: "Bé hãy sắp xếp theo đúng thứ tự nhé!",
        sequence,
      },
      difficulty_params: {
        item_count: expectedItemCount,
        target_count: expectedItemCount,
        hint_after_ms: params.hint_after_ms ?? 15_000,
        allow_retry: params.allow_retry ?? true,
        shuffle_initial: true,
      },
    };
  },
};
