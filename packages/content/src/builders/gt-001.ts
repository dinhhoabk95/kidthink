import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPromptLabel } from "@mindkid/shared";
import {
  assetKey,
  createRng,
  type KeywordAsset,
  keywordAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

function getOrderedDatasetItems(
  items: SkillDataset["items"]
): SkillDataset["items"] {
  const hasOrder = items.some(
    (i) => typeof i.ordering === "number" || typeof i.value === "number"
  );
  if (!hasOrder) {
    return items;
  }
  return items
    .slice()
    .sort(
      (a, b) => (a.ordering ?? a.value ?? 0) - (b.ordering ?? b.value ?? 0)
    );
}

function selectDistractorPool(
  orderedItems: SkillDataset["items"],
  targetId: string,
  targetKey: string
): SkillDataset["items"] {
  const distractorPool = orderedItems.filter((item) => item.id !== targetId);
  const distinctVisualPool = distractorPool.filter(
    (item) => assetKey(keywordAsset(item)) !== targetKey
  );
  if (distinctVisualPool.length > 0) {
    return distinctVisualPool;
  }
  return distractorPool.length > 0 ? distractorPool : orderedItems;
}

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

    const orderedItems = getOrderedDatasetItems(dataset.items);

    const baseRng = createRng(opts.seed);
    const baseIdx = baseRng.nextInt(orderedItems.length);
    const targetIdx = (baseIdx + (opts.round_index ?? 0)) % orderedItems.length;
    const targetItem = safeGetItem(orderedItems, targetIdx);
    const targetAsset = keywordAsset(targetItem);
    const targetKey = assetKey(targetAsset);

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const pool = selectDistractorPool(orderedItems, targetItem.id, targetKey);
    const shuffledPool = shuffleDeterministic(pool, rng);

    const chosenDistractors: Array<{
      id: string;
      asset: KeywordAsset;
      hasGlyph: boolean;
    }> = [];
    for (let i = 0; i < expectedDistractorCount; i++) {
      const d = safeGetItem(shuffledPool, i % shuffledPool.length);
      const uniqueId = i < shuffledPool.length ? d.id : `${d.id}_d${i + 1}`;
      chosenDistractors.push({
        id: uniqueId,
        asset: keywordAsset(d),
        hasGlyph: Boolean(d.glyph),
      });
    }

    const glyphItems = orderedItems.filter(
      (i) => Boolean(i.glyph) && i.id !== targetItem.id
    );
    const showsGlyph =
      Boolean(targetItem.glyph) || chosenDistractors.some((d) => d.hasGlyph);
    if (!showsGlyph && glyphItems.length > 0 && chosenDistractors.length > 0) {
      const glyphChoice = safeGetItem(
        glyphItems,
        (opts.round_index ?? 0) % glyphItems.length
      );
      chosenDistractors[chosenDistractors.length - 1] = {
        id: glyphChoice.id,
        asset: keywordAsset(glyphChoice),
        hasGlyph: true,
      };
    }

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
