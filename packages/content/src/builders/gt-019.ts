import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, shuffleDeterministic } from "./utils.js";

export const projectGT019: Projection<"GT-019"> = {
  template: "GT-019",
  requires: { min_items: 1, max_items: 4 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có 0 vật, nhưng GT-019 đòi hỏi tối thiểu 1 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const count = Math.min(
      Math.max(1, Math.min(opts.difficulty, 2)),
      dataset.items.length
    );
    const chosen = shuffleDeterministic(dataset.items, rng).slice(0, count);

    const target_slots = chosen.map((item, idx) => ({
      slot_id: `slot_${item.id}_${idx + 1}`,
      target_rotation: 0 as const,
      target_flip: "none" as const,
      asset: resolveItemAsset(item, true),
    }));

    const pieces = chosen.map((item, idx) => ({
      piece_id: `piece_${item.id}_${idx + 1}`,
      initial_rotation: 90 as const,
      initial_flip: "none" as const,
      target_slot_id: `slot_${item.id}_${idx + 1}`,
      asset: resolveItemAsset(item, true),
    }));

    return {
      content_pack: {
        prompt: "Bé hãy xoay các mảnh ghép về đúng hướng nhé!",
        target_slots,
        pieces,
      },
      difficulty_params: {
        allow_flip: false,
        rotation_step: 90 as const,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
