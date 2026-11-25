import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  DatasetItem,
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPromptLabel } from "@mindkid/shared";
import {
  buildGT001PedagogicalShowcase,
  buildOptionQuantityRep,
} from "./gt-001-showcase-projector.js";
import {
  assetKey,
  createRng,
  type KeywordAsset,
  keywordAsset,
  pickAgeBandPrompt,
  safeGetItem,
  sanitizeChildPrompt,
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

type ArithmeticOp = "add" | "sub";

const ARITHMETIC_SKILL = /\.(ADD|SUB)\./;

/** Kỹ năng cộng/trừ: đề GT-001 phải nêu số hạng (`BR-E001-09`). */
function arithmeticOp(skillCode: string): ArithmeticOp | null {
  const m = ARITHMETIC_SKILL.exec(skillCode);
  if (!m) {
    return null;
  }
  return m[1] === "ADD" ? "add" : "sub";
}

/** Mỗi giá trị nguyên ≥ 0 một vật (vật đầu tiên mang giá trị đó). */
function distinctValuedItems(
  items: SkillDataset["items"]
): SkillDataset["items"] {
  const seen = new Set<number>();
  return items.filter((i) => {
    const v = i.value;
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || seen.has(v)) {
      return false;
    }
    seen.add(v);
    return true;
  });
}

/**
 * Phép tính có kết quả `result`, số hạng nêu thẳng trong đề: "Có 2, thêm 3 nữa
 * là mấy?" — đề "Gộp lại có tất cả bao nhiêu số 0?" không có số hạng nào thì
 * trẻ không thể tính (`BR-E001-09`).
 */
function arithmeticPrompt(
  op: ArithmeticOp,
  result: number,
  maxValue: number,
  rng: ReturnType<typeof createRng>
): string {
  if (op === "add") {
    const a = result >= 2 ? 1 + rng.nextInt(result - 1) : result;
    return `Có ${a}, thêm ${result - a} nữa là mấy?`;
  }
  const room = Math.max(0, Math.min(10, maxValue) - result);
  const b = room > 0 ? 1 + rng.nextInt(room) : 0;
  return `Có ${result + b}, bớt ${b} thì còn mấy?`;
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

    const op = arithmeticOp(dataset.skill_code);
    const valuedItems = op
      ? distinctValuedItems(getOrderedDatasetItems(dataset.items))
      : [];
    // Cộng/trừ: đáp án và vật nhiễu là các giá trị khác nhau, đề nêu số hạng.
    const arithmetic = op !== null && valuedItems.length >= 2;
    const orderedItems = arithmetic
      ? valuedItems
      : getOrderedDatasetItems(dataset.items);

    const baseRng = createRng(opts.seed);
    // Cộng thì kết quả ≥ 2; trừ thì 1 ≤ kết quả < giá trị lớn nhất để còn số
    // bị trừ ≥ 1 ("Có 0, thêm 0" hay "Có 5, bớt 0" không phải bài tính).
    const maxValue = Math.max(...orderedItems.map((i) => i.value ?? 0));
    const isResult = (v: number): boolean =>
      op === "add" ? v >= 2 : v >= 1 && v < Math.min(10, maxValue);
    const targetPool = arithmetic
      ? orderedItems.filter((i) => isResult(i.value ?? 0))
      : orderedItems;
    const candidates = targetPool.length > 0 ? targetPool : orderedItems;
    const baseIdx = baseRng.nextInt(candidates.length);
    const targetItem = safeGetItem(
      candidates,
      (baseIdx + (opts.round_index ?? 0)) % candidates.length
    );
    const targetIdx = orderedItems.indexOf(targetItem);
    const targetAsset = keywordAsset(targetItem);
    const targetKey = assetKey(targetAsset);

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const pool = selectDistractorPool(orderedItems, targetItem.id, targetKey);
    const shuffledPool = shuffleDeterministic(pool, rng);

    const chosenDistractors: Array<{
      id: string;
      asset: KeywordAsset;
      hasGlyph: boolean;
      rawItem: DatasetItem;
    }> = [];
    for (let i = 0; i < expectedDistractorCount; i++) {
      const d = safeGetItem(shuffledPool, i % shuffledPool.length);
      const uniqueId = i < shuffledPool.length ? d.id : `${d.id}_d${i + 1}`;
      chosenDistractors.push({
        id: uniqueId,
        asset: keywordAsset(d),
        hasGlyph: Boolean(d.glyph),
        rawItem: d,
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
        rawItem: glyphChoice,
      };
    }

    const options = [
      {
        item_id: targetItem.id,
        asset: targetAsset,
        is_correct: true,
        label: targetItem.label.slice(0, 40),
        representation: buildOptionQuantityRep(targetItem, opts),
      },
      ...chosenDistractors.map((d) => ({
        item_id: d.id,
        asset: d.asset,
        is_correct: false,
        label: d.rawItem.label.slice(0, 40),
        representation: buildOptionQuantityRep(d.rawItem, opts),
      })),
    ];

    const shuffledOptions = shuffleDeterministic(options, rng);

    const targetLabel = formatPromptLabel(targetItem.label, {
      value: targetItem.value,
      glyph: targetItem.glyph,
    });

    const bandFallback = pickAgeBandPrompt(
      opts.band,
      {
        mam: `Bé chạm vào ${targetLabel} nhé!`,
        choi: `Đố bé tìm đúng ${targetLabel} nhé!`,
        la: `Bé thử chọn đúng ${targetLabel} xem!`,
      },
      "Bé chạm chọn đáp án đúng nhé!",
      { forbidConjunctionVa: true }
    );
    const prompt =
      arithmetic && op && typeof targetItem.value === "number"
        ? arithmeticPrompt(op, targetItem.value, maxValue, rng)
        : templatePrompt();

    function templatePrompt(): string {
      return dataset.phrasing.prompt_template
        ? sanitizeChildPrompt(
            dataset.phrasing.prompt_template.replace("{label}", targetLabel),
            bandFallback,
            { forbidConjunctionVa: true }
          )
        : bandFallback;
    }

    const showcase = buildGT001PedagogicalShowcase({
      dataset,
      orderedItems,
      targetItem,
      targetIdx,
      targetKey,
      prompt,
      opts,
    });

    return {
      content_pack: {
        prompt,
        target_item: {
          item_id: targetItem.id,
          asset: targetAsset,
        },
        showcase,
        story_theme_code: opts.theme,
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
