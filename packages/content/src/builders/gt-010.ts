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

export const projectGT010: Projection<"GT-010"> = {
  template: "GT-010",
  requires: { min_items: 2, max_items: 3 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-010 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const items = shuffleDeterministic(dataset.items, rng);
    const itemA = safeGetItem(items, 0);
    const itemB = safeGetItem(items, 1);

    const valA = 2 + rng.nextInt(4); // 2..5
    const valB = 1 + rng.nextInt(4); // 1..4

    const symA = {
      symbol_id: itemA.id,
      asset: resolveItemAsset(itemA, false),
    };
    const symB = {
      symbol_id: itemB.id,
      asset: resolveItemAsset(itemB, false),
    };

    const equations = [
      {
        equation_id: "eq_1",
        left: [itemA.id, itemA.id],
        right_value: valA * 2,
      },
      {
        equation_id: "eq_2",
        left: [itemA.id, itemB.id],
        right_value: valA + valB,
      },
    ];

    const distractors: number[] = [];
    for (const candidate of [valB + 1, valB - 1, valA, valB + 2, valB + 3]) {
      if (
        distractors.length < 3 &&
        candidate > 0 &&
        candidate !== valB &&
        !distractors.includes(candidate)
      ) {
        distractors.push(candidate);
      }
    }

    const options = shuffleDeterministic(
      [
        { value: valB, is_correct: true },
        ...distractors.map((value) => ({ value, is_correct: false })),
      ],
      rng
    );

    return {
      content_pack: {
        prompt: "Bé tính xem hình có giá trị bao nhiêu nhé!",
        symbols: [symA, symB],
        equations,
        question: { kind: "value" as const, symbol_id: itemB.id },
        options,
      },
      difficulty_params: {
        equation_count: 2,
        step_count: 1,
        distractor_count: distractors.length,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
