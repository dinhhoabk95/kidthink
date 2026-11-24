import type {
  GT000PartWholeOperation,
  GT000QuantityRepKind,
  GT000SceneBoard,
  GT000SceneBoardMode,
  GT000SpatialAnchorProp,
  GT000SpatialRelation,
} from "@mindkid/game-engine/contracts";
import type {
  DatasetItem,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import {
  buildWordPhonicsParts,
  detectVietnameseToneMark,
} from "./gt-000-phonics-helper.js";

export interface SceneBoardBuildContext {
  readonly mode: GT000SceneBoardMode;
  readonly dataset: SkillDataset;
  readonly allTeachingItems: readonly DatasetItem[];
  readonly chunkItems: readonly DatasetItem[];
  readonly targetItem: DatasetItem;
  readonly band: ProjectOptions["band"];
}

export function inferPartWholeTarget(dataset: SkillDataset): number | null {
  const subsetWholes: number[] = [];
  for (const rel of dataset.relations ?? []) {
    if (rel.type === "subset" && rel.metadata) {
      const wholeVal = Reflect.get(rel.metadata, "whole");
      if (typeof wholeVal === "number" && wholeVal >= 1) {
        subsetWholes.push(wholeVal);
      }
    }
  }
  if (subsetWholes.length > 0) {
    return Math.max(...subsetWholes);
  }
  if (dataset.skill_code.startsWith("C1.NCOMP.")) {
    const idx = Number.parseInt(dataset.skill_code.split(".")[2] ?? "0", 10);
    if (idx >= 1 && idx <= 9) {
      return idx + 1;
    }
  }
  return null;
}

function isOlderBand(band: ProjectOptions["band"]): boolean {
  return band === "5-6" || band === "4-6";
}

export function resolveCpaRepForBand(
  skillCode: string,
  band: ProjectOptions["band"],
  count: number
): GT000QuantityRepKind {
  if (skillCode === "C1.CNT.08") {
    return isOlderBand(band) ? "number-line" : "number-rod";
  }
  if (skillCode.startsWith("C1.DAT.")) {
    if (isOlderBand(band)) {
      return "tally";
    }
    return band === "3-4" ? "discrete-object" : "ten-frame";
  }
  if (band === "3-4") {
    if (skillCode === "C1.CNT.11" || count <= 5) {
      return "discrete-object";
    }
    return "number-rod";
  }
  if (isOlderBand(band) && skillCode !== "C1.CNT.11") {
    const usesLine = skillCode === "C1.NREC.09" || skillCode === "C1.CNT.07";
    return usesLine ? "number-line" : "ten-frame";
  }
  return count >= 1 && count <= 6 ? "dot-pattern" : "ten-frame";
}

function extractItemGlyph(item: DatasetItem): string {
  if (item.image?.kind === "emoji" && item.image.ref.length > 0) {
    return [...item.image.ref][0] ?? "🍎";
  }
  if (item.glyph && item.glyph.length > 0) {
    return [...item.glyph][0] ?? "🍎";
  }
  return "🍎";
}

const FIXED_SPATIAL_PAIRS: Readonly<
  Record<
    string,
    { anchor_prop: GT000SpatialAnchorProp; relation: GT000SpatialRelation }
  >
> = {
  "C1.CMP.10": { anchor_prop: "balance_scale", relation: "heavier_than" },
  "C1.CMP.11": { anchor_prop: "balance_scale", relation: "heavier_than" },
  "C1.MEAS.03": { anchor_prop: "balance_scale", relation: "heavier_than" },
  "C1.MEAS.07": { anchor_prop: "balance_scale", relation: "heavier_than" },
  "C1.CMP.08": { anchor_prop: "measure_baseline", relation: "taller_than" },
  "C1.CMP.09": { anchor_prop: "measure_baseline", relation: "taller_than" },
  "C1.MEAS.02": { anchor_prop: "measure_baseline", relation: "taller_than" },
  "C2.ORI.09": { anchor_prop: "sedge_fence", relation: "between" },
};

function hasAnyKeyword(text: string, words: readonly string[]): boolean {
  return words.some((w) => text.includes(w));
}

function resolveOrientationSpatialPair(
  skillCode: string,
  hint: string
): { anchor_prop: GT000SpatialAnchorProp; relation: GT000SpatialRelation } {
  const isBox =
    skillCode === "C2.ORI.07" ||
    skillCode === "C2.ORI.08" ||
    hasAnyKeyword(hint, ["trong", "ngoài", "inside", "outside"]);
  if (isBox) {
    const isOut =
      hasAnyKeyword(hint, ["ngoài", "outside"]) ||
      (skillCode === "C2.ORI.08" && !hint.includes("trong"));
    return {
      anchor_prop: "bamboo_box",
      relation: isOut ? "outside" : "inside",
    };
  }
  const isTable =
    hasAnyKeyword(skillCode, [
      "C2.ORI.03",
      "C2.ORI.04",
      "C2.DIR.01",
      "C2.DIR.02",
    ]) || hasAnyKeyword(hint, ["dưới", "trên"]);
  if (isTable) {
    const isUnder = hasAnyKeyword(hint, ["dưới", "xuống", "under", "down"]);
    return { anchor_prop: "wood_table", relation: isUnder ? "under" : "on" };
  }
  const isDepth =
    skillCode === "C2.ORI.05" ||
    skillCode === "C2.ORI.06" ||
    skillCode.startsWith("C2.PER.");
  if (isDepth) {
    const isBehind = hasAnyKeyword(hint, ["sau", "behind"]);
    return {
      anchor_prop: "sedge_fence",
      relation: isBehind ? "behind" : "in_front",
    };
  }
  const isRight = hasAnyKeyword(hint, ["phải", "right"]);
  return {
    anchor_prop: "sedge_fence",
    relation: isRight ? "right_of" : "left_of",
  };
}

function resolveSpatialPair(
  skillCode: string,
  item: DatasetItem
): { anchor_prop: GT000SpatialAnchorProp; relation: GT000SpatialRelation } {
  const fixed = FIXED_SPATIAL_PAIRS[skillCode];
  if (fixed) {
    return fixed;
  }
  if (skillCode.startsWith("C2.MIR.")) {
    return { anchor_prop: "mirror_axis", relation: "mirror_x" };
  }
  if (skillCode.startsWith("C2.ROT.")) {
    return { anchor_prop: "wood_table", relation: "rotate_90" };
  }
  if (skillCode.startsWith("C2.SOL.")) {
    return { anchor_prop: "slope_ramp", relation: "rolls_vs_stands" };
  }
  if (skillCode.startsWith("C1.CMP.") || skillCode.startsWith("C1.MEAS.")) {
    return { anchor_prop: "measure_baseline", relation: "longer_than" };
  }
  const hint =
    `${item.contrast_group ?? ""} ${item.category?.type ?? ""} ${item.label}`.toLowerCase();
  return resolveOrientationSpatialPair(skillCode, hint);
}

function resolvePartWholeOperation(skillCode: string): GT000PartWholeOperation {
  if (skillCode.startsWith("C1.ADD.") || skillCode === "C1.NCOMP.10") {
    return "combine";
  }
  if (skillCode.startsWith("C1.SUB.")) {
    return "take_away";
  }
  if (skillCode.startsWith("C1.PROB.")) {
    return "equal_share";
  }
  return "split";
}

function buildCpaBridgeBoard(ctx: SceneBoardBuildContext): GT000SceneBoard {
  const { dataset, targetItem, band } = ctx;
  const count =
    typeof targetItem.value === "number" && targetItem.value >= 0
      ? Math.min(20, Math.round(targetItem.value))
      : 1;
  return {
    mode: "cpa_bridge",
    count,
    rep_kind: resolveCpaRepForBand(dataset.skill_code, band, count),
    concrete_glyph: extractItemGlyph(targetItem),
    interactive_count: count >= 1,
  };
}

function buildPartWholeBoard(ctx: SceneBoardBuildContext): GT000SceneBoard {
  const { dataset, targetItem } = ctx;
  const inferredWhole = inferPartWholeTarget(dataset);
  const rawVal =
    typeof targetItem.value === "number" && targetItem.value >= 0
      ? Math.round(targetItem.value)
      : 2;
  const wholeCount = Math.max(2, inferredWhole ?? Math.max(2, rawVal));
  const clamped = rawVal <= wholeCount ? rawVal : Math.floor(wholeCount / 2);
  const partA = Math.min(wholeCount, Math.max(0, clamped));
  const splitWhole = partA === wholeCount && wholeCount >= 2;
  return {
    mode: "part_whole",
    whole_count: wholeCount,
    part_a_count: splitWhole ? 1 : partA,
    part_b_count: splitWhole ? wholeCount - 1 : Math.max(0, wholeCount - partA),
    item_glyph: extractItemGlyph(targetItem),
    operation: resolvePartWholeOperation(dataset.skill_code),
  };
}

function buildSequenceStripBoard(ctx: SceneBoardBuildContext): GT000SceneBoard {
  const { dataset, allTeachingItems, chunkItems, targetItem } = ctx;
  const basePool = chunkItems.length >= 2 ? chunkItems : allTeachingItems;
  const stripItems: DatasetItem[] = [];
  if (dataset.skill_code.startsWith("C1.PAT.") && basePool.length >= 2) {
    const first = basePool[0];
    const second = basePool[1];
    if (first && second) {
      stripItems.push(first, second, first, second);
    }
  }
  if (stripItems.length < 3) {
    stripItems.push(...allTeachingItems.slice(0, 4));
    while (stripItems.length < 3 && basePool[0]) {
      stripItems.push(basePool[0]);
    }
  }
  const targetId = `asset_${targetItem.id}`;
  const stripIds = stripItems.slice(0, 6).map((i) => `asset_${i.id}`);
  if (!stripIds.includes(targetId) && stripIds.length > 0) {
    stripIds[stripIds.length - 1] = targetId;
  }
  return {
    mode: "sequence_strip",
    strip_asset_ids: stripIds,
    focus_slot_index: Math.max(0, stripIds.lastIndexOf(targetId)),
  };
}

function buildSortingBasketsBoard(
  ctx: SceneBoardBuildContext
): GT000SceneBoard {
  const { allTeachingItems, targetItem } = ctx;
  const groups = new Map<string, { label: string; ids: string[] }>();
  for (const it of allTeachingItems) {
    const gKey = it.contrast_group ?? it.category?.type ?? "nhom_1";
    const gLabel = it.category?.type ?? it.contrast_group ?? "Nhóm bạn";
    const entry = groups.get(gKey) ?? { label: gLabel, ids: [] };
    if (entry.ids.length < 3) {
      entry.ids.push(`asset_${it.id}`);
    }
    groups.set(gKey, entry);
  }
  const entries = [...groups.values()];
  const firstGroup = entries[0] ?? {
    label: "Rổ thứ nhất",
    ids: [`asset_${targetItem.id}`],
  };
  const fallbackSecond = allTeachingItems[1]
    ? [`asset_${allTeachingItems[1].id}`]
    : [];
  const secondGroup = entries[1] ?? {
    label: "Rổ thứ hai",
    ids: fallbackSecond,
  };
  return {
    mode: "sorting_baskets",
    baskets: [
      {
        basket_id: "basket_a",
        label: firstGroup.label.slice(0, 28),
        shape_badge: "circle",
        sample_asset_ids: firstGroup.ids.slice(0, 3),
      },
      {
        basket_id: "basket_b",
        label: secondGroup.label.slice(0, 28),
        shape_badge: "square",
        sample_asset_ids: secondGroup.ids.slice(0, 3),
      },
    ],
  };
}

function buildCauseEffectBoard(ctx: SceneBoardBuildContext): GT000SceneBoard {
  const { dataset, allTeachingItems, chunkItems, targetItem } = ctx;
  const pairRel = dataset.relations?.find(
    (r) =>
      (r.type === "pair" || r.type === "contrast") &&
      (r.source_id === targetItem.id || r.target_id === targetItem.id)
  );
  const validIds = new Set(allTeachingItems.map((i) => i.id));
  const peerItem =
    chunkItems.find((i) => i.id !== targetItem.id) ??
    allTeachingItems.find((i) => i.id !== targetItem.id) ??
    targetItem;

  const useRel =
    pairRel !== undefined &&
    validIds.has(pairRel.source_id) &&
    validIds.has(pairRel.target_id);

  return {
    mode: "cause_effect",
    before_asset_id: `asset_${useRel ? pairRel.source_id : targetItem.id}`,
    trigger_glyph: "✨",
    after_asset_id: `asset_${useRel ? pairRel.target_id : peerItem.id}`,
  };
}

function buildRuleMemoryBoard(skillCode: string): GT000SceneBoard {
  const isMemory =
    skillCode.startsWith("C6.WM.") || skillCode.startsWith("C4.MEM.");
  return isMemory
    ? {
        mode: "rule_memory_stage",
        variant: "peekaboo_cover",
        rule_badge_glyph: "🎩",
        rule_label: "Nhìn kỹ rồi nhớ vị trí",
      }
    : {
        mode: "rule_memory_stage",
        variant: "rule_signal",
        rule_badge_glyph: "🔔",
        rule_label: "Làm đúng hiệu lệnh của cô",
      };
}

export function buildStepSceneBoard(
  ctx: SceneBoardBuildContext
): GT000SceneBoard {
  const skillCode = ctx.dataset.skill_code;
  switch (ctx.mode) {
    case "cpa_bridge":
      return buildCpaBridgeBoard(ctx);
    case "part_whole":
      return buildPartWholeBoard(ctx);
    case "spatial_stage": {
      const { anchor_prop, relation } = resolveSpatialPair(
        skillCode,
        ctx.targetItem
      );
      return { mode: "spatial_stage", anchor_prop, relation };
    }
    case "sequence_strip":
      return buildSequenceStripBoard(ctx);
    case "sorting_baskets":
      return buildSortingBasketsBoard(ctx);
    case "cause_effect":
      return buildCauseEffectBoard(ctx);
    case "word_phonics_box":
      return {
        mode: "word_phonics_box",
        meaning_asset_id: `asset_${ctx.targetItem.id}`,
        parts: buildWordPhonicsParts(ctx.targetItem, skillCode),
        tone_mark: detectVietnameseToneMark(
          ctx.targetItem.glyph ?? ctx.targetItem.label
        ),
      };
    case "rule_memory_stage":
      return buildRuleMemoryBoard(skillCode);
    default:
      return { mode: "single_card" };
  }
}
