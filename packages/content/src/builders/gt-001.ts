import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPromptLabel } from "@mindkid/shared";
import {
  createRng,
  resolveItemAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

export const projectGT001: Projection<"GT-001"> = {
  template: "GT-001",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-001 đòi hỏi tối thiểu 2 vật`
      );
    }

    const params = getEngineDifficultyParams("GT-001", opts.difficulty);
    const expectedItemCount = params.item_count;
    const expectedDistractorCount =
      params.distractor_count ?? Math.max(1, expectedItemCount - 1);

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const targetIdx = rng.nextInt(dataset.items.length);
    const targetItem = safeGetItem(dataset.items, targetIdx);

    const distractorPool = dataset.items.filter((_, idx) => idx !== targetIdx);
    const pool = distractorPool.length > 0 ? distractorPool : dataset.items;
    const shuffledPool = shuffleDeterministic(pool, rng);

    const chosenDistractors: Array<{
      id: string;
      asset: ReturnType<typeof resolveItemAsset>;
    }> = [];
    for (let i = 0; i < expectedDistractorCount; i++) {
      const d = safeGetItem(shuffledPool, i % shuffledPool.length);
      const uniqueId = i < shuffledPool.length ? d.id : `${d.id}_d${i + 1}`;
      chosenDistractors.push({
        id: uniqueId,
        asset: resolveItemAsset(d, true),
      });
    }

    const targetAsset = resolveItemAsset(targetItem, true);

    const options = [
      {
        item_id: targetItem.id,
        asset: targetAsset,
        is_correct: true,
      },
      ...chosenDistractors.map((d) => ({
        item_id: d.id,
        asset: d.asset,
        is_correct: false,
      })),
    ];

    const shuffledOptions = shuffleDeterministic(options, rng);

    const targetLabel = formatPromptLabel(targetItem.label, {
      value: targetItem.value,
      glyph: targetItem.glyph,
    });

    const rawPrompt = dataset.phrasing.prompt_template
      ? dataset.phrasing.prompt_template.replace("{label}", targetLabel)
      : `Bé hãy chọn ${targetLabel} nhé!`;
    const prompt =
      rawPrompt.length >= 4 ? rawPrompt : `Bé hãy chọn ${targetLabel} nhé!`;

    return {
      content_pack: {
        prompt,
        target_item: {
          item_id: targetItem.id,
          asset: targetAsset,
        },
        options: shuffledOptions,
      },
      difficulty_params: {
        item_count: expectedItemCount,
        distractor_count: expectedDistractorCount,
        hint_after_ms: params.hint_after_ms ?? 10_000,
        allow_retry: params.allow_retry ?? true,
        shuffle_items: true,
      },
    };
  },
};
