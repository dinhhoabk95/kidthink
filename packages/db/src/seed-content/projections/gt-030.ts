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

export const projectGT030: Projection<"GT-030"> = {
  template: "GT-030",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-030 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const objectItem = safeGetItem(shuffled, 0);
    const unitItem = safeGetItem(shuffled, 1);

    const lengthInUnits = Math.min(Math.max(2, opts.difficulty + 2), 6);

    const distractorCandidates = [1, 2, 3, 4, 5, 6, 7].filter(
      (v) => v !== lengthInUnits
    );
    const distractors = shuffleDeterministic(distractorCandidates, rng).slice(
      0,
      2
    );

    const answer_options = [
      {
        option_id: "opt_correct",
        value: lengthInUnits,
        is_correct: true,
      },
      ...distractors.map((v, i) => ({
        option_id: `opt_d_${i + 1}`,
        value: v,
        is_correct: false,
      })),
    ];

    return {
      content_pack: {
        prompt: `Đồ vật này dài bằng mấy lần ${unitItem.label} nhé?`,
        object: {
          object_id: objectItem.id,
          asset: resolveItemAsset(objectItem, true),
          length_in_units: lengthInUnits,
        },
        unit: {
          unit_id: unitItem.id,
          asset: resolveItemAsset(unitItem, true),
        },
        answer_options: shuffleDeterministic(answer_options, rng),
      },
      difficulty_params: {
        length_in_units: lengthInUnits,
        allow_ruler_snap: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
