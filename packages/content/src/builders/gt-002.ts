import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPluralNoun, formatPromptLabel } from "@mindkid/shared";
import {
  createRng,
  resolveItemAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

export const projectGT002: Projection<"GT-002"> = {
  template: "GT-002",
  requires: { min_items: 3, max_items: 8 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 3) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-002 đòi hỏi tối thiểu 3 vật`
      );
    }

    const params = getEngineDifficultyParams("GT-002", opts.difficulty);
    const expectedItemCount = params.item_count;
    const targetCount = params.target_count ?? 2;
    const distractorCount =
      params.distractor_count ?? Math.max(1, expectedItemCount - targetCount);

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const targetItem = safeGetItem(shuffled, 0);

    const distractorPool = shuffled.filter((i) => i.id !== targetItem.id);
    const pool = distractorPool.length > 0 ? distractorPool : shuffled;
    const shuffledDistractors = shuffleDeterministic(pool, rng);

    const chosenTargets: Array<{
      item_id: string;
      asset: ReturnType<typeof resolveItemAsset>;
      is_correct: true;
    }> = [];
    for (let i = 0; i < targetCount; i++) {
      chosenTargets.push({
        item_id: `${targetItem.id}_t${i + 1}`,
        asset: resolveItemAsset(targetItem, true),
        is_correct: true,
      });
    }

    const chosenDistractors: Array<{
      item_id: string;
      asset: ReturnType<typeof resolveItemAsset>;
      is_correct: false;
    }> = [];
    for (let i = 0; i < distractorCount; i++) {
      const d = safeGetItem(
        shuffledDistractors,
        i % shuffledDistractors.length
      );
      chosenDistractors.push({
        item_id: `${d.id}_d${i + 1}`,
        asset: resolveItemAsset(d, true),
        is_correct: false,
      });
    }

    const targetLabel = formatPromptLabel(targetItem.label, {
      value: targetItem.value,
      glyph: targetItem.glyph,
    });
    const pluralTarget = formatPluralNoun(targetItem.label, {
      value: targetItem.value,
      glyph: targetItem.glyph,
    });

    const items = [...chosenTargets, ...chosenDistractors];

    const prompt =
      dataset.phrasing.prompt_template.length >= 4
        ? dataset.phrasing.prompt_template.replace("{label}", targetLabel)
        : `Bé hãy chọn ${pluralTarget} nhé!`;

    return {
      content_pack: {
        prompt:
          prompt.length >= 4 ? prompt : `Bé hãy chọn ${pluralTarget} nhé!`,
        target_criterion: `Chọn ${pluralTarget}`,
        items: shuffleDeterministic(items, rng),
      },
      difficulty_params: {
        item_count: expectedItemCount,
        target_count: targetCount,
        distractor_count: distractorCount,
        hint_after_ms: params.hint_after_ms ?? 10_000,
        allow_retry: params.allow_retry ?? true,
      },
    };
  },
};
