import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, safeGetItem } from "./utils.js";

export const projectGT009: Projection<"GT-009"> = {
  template: "GT-009",
  requires: { min_items: 1, max_items: 10 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-009`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    // 4 candidates with values 1, 2, 3, 4
    const candidates = [
      { candidate_id: "c1", value: 1, asset: resolveItemAsset(baseItem, true) },
      { candidate_id: "c2", value: 2, asset: resolveItemAsset(baseItem, true) },
      { candidate_id: "c3", value: 3, asset: resolveItemAsset(baseItem, true) },
      { candidate_id: "c4", value: 4, asset: resolveItemAsset(baseItem, true) },
    ];

    // Clue: lớn hơn 2 và nhỏ hơn 4 -> 3 (c3)
    const answerCandidateId = "c3";
    const clues = [
      {
        clue_id: "clue_1",
        text: "Số này lớn hơn 2",
        predicate: { kind: "greater_than" as const, value: 2 },
      },
      {
        clue_id: "clue_2",
        text: "Số này nhỏ hơn 4",
        predicate: { kind: "less_than" as const, value: 4 },
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy dựa vào các manh mối để tìm ra số bí mật nhé!",
        candidates,
        clues,
        answer_candidate_id: answerCandidateId,
      },
      difficulty_params: {
        candidate_count: 4,
        clue_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
