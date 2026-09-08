import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
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

const WHITESPACE_SPLIT_REGEX = /\s+/;

function buildGT030Prompt(unitLabel: string): string {
  const candidate1 = `Đồ vật này dài bằng mấy lần ${unitLabel} nhé?`;
  if (
    candidate1.trim().split(WHITESPACE_SPLIT_REGEX).filter(Boolean).length <= 12
  ) {
    return candidate1;
  }
  const candidate2 = `Vật này dài bằng mấy lần ${unitLabel} nhé?`;
  if (
    candidate2.trim().split(WHITESPACE_SPLIT_REGEX).filter(Boolean).length <= 12
  ) {
    return candidate2;
  }
  return "Đồ vật này dài bằng mấy đơn vị nhé?";
}

function buildAnswerOptions(
  lengthInUnits: number,
  optionCount: number,
  rng: ReturnType<typeof createRng>
) {
  const candidatePool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(
    (v) => v !== lengthInUnits
  );
  const chosenDistractors = shuffleDeterministic(candidatePool, rng).slice(
    0,
    optionCount - 1
  );

  const rawOptions = [
    {
      option_id: "opt_correct",
      value: lengthInUnits,
      is_correct: true,
    },
    ...chosenDistractors.map((v, i) => ({
      option_id: `opt_d_${i + 1}`,
      value: v,
      is_correct: false,
    })),
  ];

  return shuffleDeterministic(rawOptions, rng);
}

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
    const params = getEngineDifficultyParams("GT-030", opts.difficulty);
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const objectItem = safeGetItem(shuffled, 0);
    const unitItem = safeGetItem(shuffled, 1);

    const lengthInUnits = params.length_in_units ?? 4;
    const answer_options = buildAnswerOptions(
      lengthInUnits,
      params.item_count,
      rng
    );

    return {
      content_pack: {
        prompt: buildGT030Prompt(unitItem.label),
        object: {
          object_id: objectItem.id,
          asset: resolveItemAsset(objectItem, true),
          length_in_units: lengthInUnits,
        },
        unit: {
          unit_id: unitItem.id,
          asset: resolveItemAsset(unitItem, true),
        },
        answer_options,
      },
      difficulty_params: {
        item_count: params.item_count,
        length_in_units: lengthInUnits,
        gap_tolerance_pct: params.gap_tolerance_pct ?? 15,
        allow_retry: true,
        hint_after_ms: 8000,
      },
    };
  },
};
