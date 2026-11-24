import {
  type GT002Content,
  type GT002Difficulty,
  type GT002Item,
  getEngineDifficultyParams,
} from "@mindkid/game-engine/contracts";
import type {
  DatasetAsset,
  DatasetItem,
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPluralNoun } from "@mindkid/shared";
import {
  buildGT002CriterionAnchor,
  buildGT002ItemRepresentation,
  formatGroupCriterionPhrase,
  type GT002CandidateGroup,
  inferPureGeometricSpec,
  selectViableTargetGroup,
  shouldPreserveGT002Order,
} from "#src/builders/gt-002-criterion-projector";
import {
  assetKey,
  countPromptWords,
  createRng,
  keywordAsset,
  pickAgeBandPrompt,
  safeGetItem,
  shuffleDeterministic,
} from "#src/builders/utils";

function buildRichGT002Item(
  item: DatasetItem,
  itemId: string,
  isCorrect: boolean,
  skillCode: string,
  opts: ProjectOptions
): GT002Item {
  const primaryAsset = keywordAsset(item);
  const label = item.label.trim().slice(0, 40);
  const hasCompanionImage =
    skillCode.startsWith("C5.") &&
    Boolean(item.glyph) &&
    Boolean(item.image) &&
    (item.image?.kind !== "emoji" || item.image.ref !== item.glyph?.trim());
  const secondaryAsset: DatasetAsset | undefined = hasCompanionImage
    ? item.image
    : undefined;
  const representation = buildGT002ItemRepresentation(item, skillCode, opts);
  const geometricSpec = inferPureGeometricSpec(item);

  return {
    item_id: itemId,
    asset: primaryAsset,
    is_correct: isCorrect,
    ...(label.length > 0 ? { label } : {}),
    ...(secondaryAsset ? { secondary_asset: secondaryAsset } : {}),
    ...(representation ? { representation } : {}),
    ...(geometricSpec ? { geometric_spec: geometricSpec } : {}),
  };
}

function arrangeSpatialOrderedItems(
  targets: readonly GT002Item[],
  distractors: readonly GT002Item[],
  groupRawKey: string
): GT002Item[] {
  const lower = groupRawKey.toLowerCase();
  if (lower.includes("giữa") || lower.includes("trung tâm")) {
    const half = Math.ceil(distractors.length / 2);
    return [
      ...distractors.slice(0, half),
      ...targets,
      ...distractors.slice(half),
    ];
  }
  if (lower.includes("góc") || lower.includes("hai bên")) {
    const half = Math.ceil(targets.length / 2);
    return [...targets.slice(0, half), ...distractors, ...targets.slice(half)];
  }
  return [...targets, ...distractors];
}

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
    const key = assetKey(keywordAsset(item));
    if (key === targetKey || seenDistractorKeys.has(key)) {
      continue;
    }
    seenDistractorKeys.add(key);
    candidates.push(item);
  }

  return candidates;
}

function buildBandPromptFromPhrase(
  band: ProjectOptions["band"],
  phrase: string
): string {
  const clean = phrase.startsWith("tất cả ") ? phrase.slice(7).trim() : phrase;
  const wordLen = countPromptWords(clean);
  const mamTpl =
    wordLen <= 6
      ? `Bé chạm chọn tất cả ${clean} nhé!`
      : `Bé chọn tất cả ${clean}!`;
  const choiTpl =
    wordLen <= 6
      ? `Đố bé tìm tất cả ${clean} nhé!`
      : `Đố bé tìm tất cả ${clean}!`;
  const laTpl =
    wordLen <= 6
      ? `Bé thử chọn tất cả ${clean} xem!`
      : `Bé thử chọn tất cả ${clean}!`;

  return pickAgeBandPrompt(
    band,
    { mam: mamTpl, choi: choiTpl, la: laTpl },
    "Bé chọn tất cả hình cùng loại nhé!"
  );
}

interface AssembledRoundSelection {
  readonly group: GT002CandidateGroup | null;
  readonly targetSources: readonly DatasetItem[];
  readonly distractorSources: readonly DatasetItem[];
  readonly chosenTargets: readonly GT002Item[];
  readonly chosenDistractors: readonly GT002Item[];
  readonly criterionPhrase: string;
}

function assembleFromGroup(
  group: GT002CandidateGroup,
  targetCount: number,
  distractorCount: number,
  skillCode: string,
  opts: ProjectOptions,
  rng: ReturnType<typeof createRng>
): AssembledRoundSelection {
  const targetSources = shuffleDeterministic(group.distinctTargets, rng).slice(
    0,
    targetCount
  );
  const distractorSources = shuffleDeterministic(
    group.distinctDistractors,
    rng
  ).slice(0, distractorCount);

  const chosenTargets = targetSources.map((src, idx) =>
    buildRichGT002Item(src, `${src.id}_t${idx + 1}`, true, skillCode, opts)
  );
  const chosenDistractors = distractorSources.map((src, idx) =>
    buildRichGT002Item(src, `${src.id}_d${idx + 1}`, false, skillCode, opts)
  );

  return {
    group,
    targetSources,
    distractorSources,
    chosenTargets,
    chosenDistractors,
    criterionPhrase: formatGroupCriterionPhrase(
      group,
      targetSources,
      skillCode
    ),
  };
}

function assembleSingleCloneFallback(
  shuffled: readonly DatasetItem[],
  targetCount: number,
  distractorCount: number,
  skillCode: string,
  opts: ProjectOptions,
  rng: ReturnType<typeof createRng>
): AssembledRoundSelection {
  const buildForTarget = (targetItem: DatasetItem) => {
    const targetKey = assetKey(keywordAsset(targetItem));
    const candidates = collectDistinctDistractorCandidates(
      shuffled,
      targetItem,
      targetKey
    );
    if (candidates.length < distractorCount) {
      throw new Error(
        `[BR-E002-04] Dataset ${skillCode} không đủ ${distractorCount} distractor có asset phân biệt được so với đáp án (${candidates.length} khả dụng)`
      );
    }
    const distractorSources = shuffleDeterministic(candidates, rng).slice(
      0,
      distractorCount
    );
    const chosenTargets = Array.from({ length: targetCount }, (_, i) =>
      buildRichGT002Item(
        targetItem,
        `${targetItem.id}_t${i + 1}`,
        true,
        skillCode,
        opts
      )
    );
    const chosenDistractors = distractorSources.map((src, idx) =>
      buildRichGT002Item(src, `${src.id}_d${idx + 1}`, false, skillCode, opts)
    );
    return { targetItem, distractorSources, chosenTargets, chosenDistractors };
  };

  let picked = buildForTarget(safeGetItem(shuffled, 0));
  const glyphItems = shuffled.filter((i) => Boolean(i.glyph));
  const showsGlyph = [picked.targetItem, ...picked.distractorSources].some(
    (i) => Boolean(i.glyph)
  );
  if (glyphItems.length > 0 && !showsGlyph) {
    picked = buildForTarget(
      safeGetItem(glyphItems, rng.nextInt(glyphItems.length))
    );
  }

  const pluralTarget = formatPluralNoun(picked.targetItem.label, {
    value: picked.targetItem.value,
    glyph: picked.targetItem.glyph,
  });

  return {
    group: null,
    targetSources: [picked.targetItem],
    distractorSources: picked.distractorSources,
    chosenTargets: picked.chosenTargets,
    chosenDistractors: picked.chosenDistractors,
    criterionPhrase: pluralTarget.startsWith("tất cả ")
      ? pluralTarget.slice(7)
      : pluralTarget,
  };
}

export const projectGT002: Projection<"GT-002", GT002Content, GT002Difficulty> =
  {
    template: "GT-002",
    requires: { min_items: 3, max_items: 8 },
    project(
      dataset: SkillDataset,
      opts: ProjectOptions
    ): ProjectedPack<GT002Content, GT002Difficulty> {
      if (dataset.items.length < 3) {
        throw new Error(
          `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-002 đòi hỏi tối thiểu 3 vật`
        );
      }

      const params = getEngineDifficultyParams("GT-002", opts.difficulty);
      const expectedItemCount = params.item_count;
      let targetCount = params.target_count ?? 2;

      if (opts.band === "4-5" && targetCount > 3) {
        targetCount = 3;
      } else if (opts.band === "5-6" && targetCount > 4) {
        targetCount = 4;
      }

      const distractorCount = Math.max(1, expectedItemCount - targetCount);
      const roundOffset = opts.round_index ?? 0;
      const rng = createRng(opts.seed + roundOffset);
      const shuffled = shuffleDeterministic(dataset.items, rng);

      const viableGroup = selectViableTargetGroup(
        dataset,
        targetCount,
        distractorCount,
        opts.seed + roundOffset
      );

      const assembled = viableGroup
        ? assembleFromGroup(
            viableGroup,
            targetCount,
            distractorCount,
            dataset.skill_code,
            opts,
            rng
          )
        : assembleSingleCloneFallback(
            shuffled,
            targetCount,
            distractorCount,
            dataset.skill_code,
            opts,
            rng
          );

      const preserveOrder = shouldPreserveGT002Order(dataset.skill_code);
      const orderedItems = preserveOrder
        ? arrangeSpatialOrderedItems(
            assembled.chosenTargets,
            assembled.chosenDistractors,
            assembled.group?.rawKey ?? dataset.concept_label
          )
        : shuffleDeterministic(
            [...assembled.chosenTargets, ...assembled.chosenDistractors],
            rng
          );

      const prompt = buildBandPromptFromPhrase(
        opts.band,
        assembled.criterionPhrase
      );
      const criterionAnchor = buildGT002CriterionAnchor({
        skillCode: dataset.skill_code,
        criterionPhrase: assembled.criterionPhrase,
        group: assembled.group,
        targetSources: assembled.targetSources,
        distractorSources: assembled.distractorSources,
        opts,
      });

      return {
        content_pack: {
          prompt,
          target_criterion: `Chọn tất cả ${assembled.criterionPhrase}`.slice(
            0,
            80
          ),
          criterion_anchor: criterionAnchor,
          ...(preserveOrder ? { preserve_order: true } : {}),
          items: orderedItems,
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
