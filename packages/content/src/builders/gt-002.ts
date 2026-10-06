import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  DatasetItem,
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPluralNoun } from "@mindkid/shared";
import {
  assetKey,
  createRng,
  keywordAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

/**
 * Lọc distractor khác asset đáp án và không trùng lặp asset từng đôi (BR-E002-04).
 */
function collectDistinctDistractorCandidates(
  items: readonly DatasetItem[],
  targetItem: DatasetItem,
  targetKey: string
): DatasetItem[] {
  const seenDistractorKeys = new Set<string>();
  const candidates: DatasetItem[] = [];

  for (const item of items) {
    if (item.id === targetItem.id) {
      continue;
    }
    const a = keywordAsset(item);
    const k = assetKey(a);
    if (k === targetKey) {
      continue;
    }
    if (!seenDistractorKeys.has(k)) {
      seenDistractorKeys.add(k);
      candidates.push(item);
    }
  }

  return candidates;
}

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
    let targetCount = params.target_count ?? 2;

    // S6b / D-275-7: Kẹp target_count theo opts.band (BR-E002-03)
    if (opts.band === "4-5" && targetCount > 3) {
      targetCount = 3;
    } else if (opts.band === "5-6" && targetCount > 4) {
      targetCount = 4;
    }

    const distractorCount = Math.max(1, expectedItemCount - targetCount);

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);

    const assemble = (targetItem: DatasetItem) => {
      const targetAsset = keywordAsset(targetItem);
      const targetKey = assetKey(targetAsset);

      // S6a / D-275-5: Distractor phải khác asset đáp án và khác nhau từng đôi (BR-E002-04)
      const distinctDistractorCandidates = collectDistinctDistractorCandidates(
        shuffled,
        targetItem,
        targetKey
      );

      if (distinctDistractorCandidates.length < distractorCount) {
        throw new Error(
          `[BR-E002-04] Dataset ${dataset.skill_code} không đủ ${distractorCount} distractor có asset phân biệt được so với đáp án (${distinctDistractorCandidates.length} khả dụng)`
        );
      }

      const shuffledDistractors = shuffleDeterministic(
        distinctDistractorCandidates,
        rng
      );

      const chosenTargets: Array<{
        item_id: string;
        asset: ReturnType<typeof keywordAsset>;
        is_correct: true;
      }> = [];
      for (let i = 0; i < targetCount; i++) {
        chosenTargets.push({
          item_id: `${targetItem.id}_t${i + 1}`,
          asset: targetAsset,
          is_correct: true,
        });
      }

      const distractorSources: DatasetItem[] = [];
      const chosenDistractors: Array<{
        item_id: string;
        asset: ReturnType<typeof keywordAsset>;
        is_correct: false;
      }> = [];
      for (let i = 0; i < distractorCount; i++) {
        const d = safeGetItem(shuffledDistractors, i);
        distractorSources.push(d);
        chosenDistractors.push({
          item_id: `${d.id}_d${i + 1}`,
          asset: keywordAsset(d),
          is_correct: false,
        });
      }
      return {
        targetItem,
        chosenTargets,
        chosenDistractors,
        distractorSources,
      };
    };

    let picked = assemble(safeGetItem(shuffled, 0));

    // Dataset có ký hiệu thì bàn chơi phải cho trẻ thấy ký hiệu đó (`BR-SDS-03`).
    // Chỉ chọn lại khi level này chưa hiện ký hiệu nào.
    const glyphItems = shuffled.filter((i) => i.glyph);
    const showsGlyph = [picked.targetItem, ...picked.distractorSources].some(
      (i) => i.glyph
    );
    if (glyphItems.length > 0 && !showsGlyph) {
      picked = assemble(
        safeGetItem(glyphItems, rng.nextInt(glyphItems.length))
      );
    }

    const { targetItem, chosenTargets, chosenDistractors } = picked;

    const pluralTarget = formatPluralNoun(targetItem.label, {
      value: targetItem.value,
      glyph: targetItem.glyph,
    });

    const items = [...chosenTargets, ...chosenDistractors];

    // S6b / D-275-6: Câu dẫn GT-002 luôn dựng từ tiêu chí: Bé hãy chọn tất cả {số nhiều} nhé!
    let pluralNoun = pluralTarget;
    if (pluralNoun.startsWith("tất cả ")) {
      pluralNoun = pluralNoun.slice(7);
    }
    const prompt = `Bé hãy chọn tất cả ${pluralNoun} nhé!`;
    const targetCriterion = `Chọn tất cả ${pluralNoun}`;

    return {
      content_pack: {
        prompt,
        target_criterion: targetCriterion,
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
