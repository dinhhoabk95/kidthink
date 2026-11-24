import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import {
  countPromptWords,
  createRng,
  resolveItemAsset,
  safeGetItem,
  sanitizeChildPrompt,
  shuffleDeterministic,
} from "./utils.js";

function buildGT030Prompt(unitLabel: string): string {
  const candidate1 = `Đố bé vật này dài bằng mấy lần ${unitLabel} nhỉ?`;
  if (countPromptWords(candidate1) <= 12) {
    return sanitizeChildPrompt(
      candidate1,
      "Đố bé vật này dài bằng mấy đơn vị nhỉ?"
    );
  }
  const candidate2 = `Vật này dài bằng mấy ${unitLabel} nhỉ?`;
  if (countPromptWords(candidate2) <= 12) {
    return sanitizeChildPrompt(
      candidate2,
      "Đố bé vật này dài bằng mấy đơn vị nhỉ?"
    );
  }
  return "Đố bé vật này dài bằng mấy đơn vị nhỉ?";
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
    const firstItem = safeGetItem(shuffled, 0);
    const secondItem = safeGetItem(shuffled, 1);
    const firstMetric = firstItem.value ?? firstItem.ordering ?? 1;
    const secondMetric = secondItem.value ?? secondItem.ordering ?? 0;
    const objectItem = firstMetric >= secondMetric ? firstItem : secondItem;
    const unitItem = firstMetric >= secondMetric ? secondItem : firstItem;

    const lengthInUnits = params.length_in_units ?? 4;
    const answer_options = buildAnswerOptions(
      lengthInUnits,
      params.item_count,
      rng
    );

    let rep: "number-rod" | "discrete-object" | undefined;
    if (opts.representation === "number-rod") {
      rep = "number-rod";
    } else if (opts.representation === "discrete-object") {
      rep = "discrete-object";
    }

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
        ...(rep ? { representation: rep } : {}),
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
