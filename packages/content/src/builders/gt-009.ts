import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
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

    const params = getEngineDifficultyParams("GT-009", opts.difficulty);
    const candidateCount = params.item_count;

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    const candidates = Array.from({ length: candidateCount }, (_, i) => ({
      candidate_id: `c${i + 1}`,
      value: i + 1,
      asset: resolveItemAsset(baseItem, true),
    }));

    let answerCandidateId = "c3";
    let clues: {
      clue_id: string;
      text: string;
      predicate:
        | { kind: "greater_than"; value: number }
        | { kind: "less_than"; value: number }
        | { kind: "not_equal"; value: number };
    }[] = [];

    if (params.clue_count === 1) {
      answerCandidateId = `c${candidateCount}`;
      clues = [
        {
          clue_id: "clue_1",
          text: `Số này lớn hơn ${candidateCount - 1}`,
          predicate: { kind: "greater_than", value: candidateCount - 1 },
        },
      ];
    } else if (params.clue_count === 2) {
      answerCandidateId = "c3";
      clues = [
        {
          clue_id: "clue_1",
          text: "Số này lớn hơn 2",
          predicate: { kind: "greater_than", value: 2 },
        },
        {
          clue_id: "clue_2",
          text: "Số này nhỏ hơn 4",
          predicate: { kind: "less_than", value: 4 },
        },
      ];
    } else {
      answerCandidateId = "c3";
      clues = [
        {
          clue_id: "clue_1",
          text: "Số này lớn hơn 1",
          predicate: { kind: "greater_than", value: 1 },
        },
        {
          clue_id: "clue_2",
          text: "Số này nhỏ hơn 4",
          predicate: { kind: "less_than", value: 4 },
        },
        {
          clue_id: "clue_3",
          text: "Số này khác 2",
          predicate: { kind: "not_equal", value: 2 },
        },
      ];
    }

    const clueCount =
      typeof params.clue_count === "number" ? params.clue_count : 2;

    return {
      content_pack: {
        prompt: "Bé hãy tìm ra số bí mật nhé!",
        candidates,
        clues,
        answer_candidate_id: answerCandidateId,
      },
      difficulty_params: {
        item_count: candidateCount,
        candidate_count: candidateCount,
        clue_count: clueCount,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
