import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, shuffleDeterministic } from "./utils.js";

export const projectGT021: Projection<"GT-021"> = {
  template: "GT-021",
  requires: { min_items: 2, max_items: 8 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-021 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const patternCount = Math.min(
      Math.max(2, Math.min(opts.difficulty + 1, 4)),
      dataset.items.length
    );

    const chosenItems = shuffleDeterministic(dataset.items, rng).slice(
      0,
      patternCount
    );

    const reference_pattern = chosenItems.map((item, idx) => ({
      slot_id: `ref_slot_${idx + 1}`,
      asset: resolveItemAsset(item, true),
    }));

    const target_slots = chosenItems.map((item, idx) => ({
      slot_id: `target_slot_${idx + 1}`,
      expected_asset_ref: item.id,
    }));

    const options = chosenItems.map((item) => ({
      item_id: item.id,
      asset: resolveItemAsset(item, true),
      asset_ref: item.id,
    }));

    return {
      content_pack: {
        prompt: "Bé hãy ghép hình đối xứng qua trục nhé!",
        axis: "vertical" as const,
        reference_pattern,
        target_slots,
        options: shuffleDeterministic(options, rng),
      },
      difficulty_params: {
        show_axis_guide: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
