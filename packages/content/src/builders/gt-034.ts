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

export const projectGT034: Projection<"GT-034"> = {
  template: "GT-034",
  requires: { min_items: 2, max_items: 4 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-034 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const itemA = safeGetItem(shuffled, 0);
    const itemB = safeGetItem(shuffled, 1);

    const instruments = [
      {
        instrument_id: itemA.id,
        asset: resolveItemAsset(itemA, true),
        freq: 440,
        name_vi: itemA.label,
      },
      {
        instrument_id: itemB.id,
        asset: resolveItemAsset(itemB, true),
        freq: 880,
        name_vi: itemB.label,
      },
    ];

    // Pattern: A, B, A, B (motif AB repeats)
    const target_pattern = [itemA.id, itemB.id, itemA.id, itemB.id];

    return {
      content_pack: {
        prompt: "Bé hãy hoàn thành chuỗi âm thanh lặp lại nhé!",
        instruments,
        target_pattern,
        tempo_bpm: 80,
      },
      difficulty_params: {
        tempo_bpm: 80,
        pattern_length: 4,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
