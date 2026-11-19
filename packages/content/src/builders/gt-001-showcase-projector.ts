import type {
  GT001QuantityRep,
  GT001Showcase,
} from "@mindkid/game-engine/contracts";
import {
  CONTENT_THEMES,
  type DatasetItem,
  type ProjectOptions,
  type QuantityRepKind,
  type SkillDataset,
} from "@mindkid/shared";
import { VN_MOET_PRESCHOOL_TOPICS } from "#src/inventories/vn-preschool-culture";
import { assetKey, type KeywordAsset, keywordAsset } from "./utils.js";

const SEQUENCE_PROMPT_RE = /(?:đứng sau|liền sau|tiếp theo|kế tiếp)/i;
const COMPARISON_GROUP_RE =
  /(?:size|length|height|weight|capacity|big|small|long|short|tall|heavy|light)/i;
const SHAPE_STRAND_RE = /^C2\.(?:SHP|SOL|SYM|COM|ROT)\./;

const SAFE_FALLBACK_PROP_EMOJIS = ["📖", "🧺", "🌟", "🏡", "🎈"] as const;

function resolveCpaRepKind(
  count: number,
  band: ProjectOptions["band"],
  rungRep?: QuantityRepKind | "numeral"
): GT001QuantityRep["kind"] {
  if (band === "3-4") {
    return count <= 10 ? "number-rod" : "ten-frame";
  }
  if (
    rungRep &&
    rungRep !== "numeral" &&
    rungRep !== "finger" &&
    rungRep !== "discrete-object"
  ) {
    if (rungRep === "dot-pattern" && count > 6) {
      return "ten-frame";
    }
    return rungRep;
  }
  return count <= 6 ? "dot-pattern" : "ten-frame";
}

function pickDistinctThemePropAsset(
  themeCode: string,
  forbiddenAssetKey: string
): KeywordAsset {
  const moetTopic = VN_MOET_PRESCHOOL_TOPICS.find((t) =>
    t.canonical_themes.some((code) => code === themeCode)
  );
  if (moetTopic) {
    for (const manip of moetTopic.manipulative_items) {
      const candidate: KeywordAsset = { kind: "emoji", ref: manip.emoji_ref };
      if (assetKey(candidate) !== forbiddenAssetKey) {
        return candidate;
      }
    }
  }

  const theme = CONTENT_THEMES.find((t) => t.code === themeCode);
  if (theme) {
    const iconCandidate: KeywordAsset = {
      kind: "emoji",
      ref: theme.icon_emoji_ref,
    };
    if (assetKey(iconCandidate) !== forbiddenAssetKey) {
      return iconCandidate;
    }
    for (const noun of theme.nouns) {
      const candidate: KeywordAsset = { kind: "emoji", ref: noun.emoji_ref };
      if (assetKey(candidate) !== forbiddenAssetKey) {
        return candidate;
      }
    }
  }

  for (const fallbackEmoji of SAFE_FALLBACK_PROP_EMOJIS) {
    const candidate: KeywordAsset = { kind: "emoji", ref: fallbackEmoji };
    if (assetKey(candidate) !== forbiddenAssetKey) {
      return candidate;
    }
  }
  return { kind: "emoji", ref: "📖" };
}

function findComparisonAnchorItem(
  dataset: SkillDataset,
  orderedItems: readonly DatasetItem[],
  targetItem: DatasetItem,
  targetKey: string
): DatasetItem | undefined {
  const contrastRel = dataset.relations?.find(
    (rel) =>
      rel.type === "contrast" &&
      (rel.source_id === targetItem.id || rel.target_id === targetItem.id)
  );
  if (contrastRel) {
    const partnerId =
      contrastRel.source_id === targetItem.id
        ? contrastRel.target_id
        : contrastRel.source_id;
    const partner = orderedItems.find((item) => item.id === partnerId);
    if (partner && assetKey(keywordAsset(partner)) !== targetKey) {
      return partner;
    }
  }

  const diffGroup = orderedItems.find(
    (item) =>
      item.id !== targetItem.id &&
      item.contrast_group !== targetItem.contrast_group &&
      assetKey(keywordAsset(item)) !== targetKey
  );
  if (diffGroup) {
    return diffGroup;
  }

  return orderedItems.find(
    (item) =>
      item.id !== targetItem.id && assetKey(keywordAsset(item)) !== targetKey
  );
}

export interface BuildShowcaseInput {
  readonly dataset: SkillDataset;
  readonly orderedItems: readonly DatasetItem[];
  readonly targetItem: DatasetItem;
  readonly targetIdx: number;
  readonly targetKey: string;
  readonly prompt: string;
  readonly opts: ProjectOptions;
}

/**
 * Dựng cấu hình `GT001Showcase` (Thẻ Ngữ Cảnh Thông Minh) cho trang trái
 * Cuốn Sách Gỗ Pop-up (`BR-E001-06`).
 */
export function buildGT001PedagogicalShowcase(
  input: BuildShowcaseInput
): GT001Showcase {
  const {
    dataset,
    orderedItems,
    targetItem,
    targetIdx,
    targetKey,
    prompt,
    opts,
  } = input;
  const conceptShort = dataset.concept_label.slice(0, 40);

  const hasSequenceRelation =
    dataset.relations?.some((rel) => rel.type === "sequence") === true;
  if (
    orderedItems.length >= 3 &&
    targetIdx >= 2 &&
    (hasSequenceRelation || SEQUENCE_PROMPT_RE.test(prompt))
  ) {
    const prevTwo = orderedItems[targetIdx - 2];
    const prevOne = orderedItems[targetIdx - 1];
    if (prevTwo && prevOne) {
      return {
        mode: "sequence_gap",
        sequence_preview: [keywordAsset(prevTwo), keywordAsset(prevOne)],
        cue_label_vi: conceptShort,
      };
    }
  }

  const isComparisonSkill =
    dataset.skill_code.startsWith("C1.CMP.") ||
    (Boolean(targetItem.contrast_group) &&
      COMPARISON_GROUP_RE.test(targetItem.contrast_group ?? ""));
  if (isComparisonSkill) {
    const anchor = findComparisonAnchorItem(
      dataset,
      orderedItems,
      targetItem,
      targetKey
    );
    if (anchor) {
      return {
        mode: "comparison_anchor",
        cue_asset: keywordAsset(anchor),
        cue_label_vi: anchor.label.slice(0, 40),
      };
    }
  }

  if (
    dataset.skill_code.startsWith("C1.") &&
    typeof targetItem.value === "number" &&
    targetItem.value >= 1 &&
    targetItem.value <= 20
  ) {
    const repKind = resolveCpaRepKind(
      targetItem.value,
      opts.band,
      opts.representation
    );
    return {
      mode: "cpa_bridge",
      representation: {
        kind: repKind,
        count: targetItem.value,
        max: targetItem.value <= 10 ? 10 : 20,
        min: 0,
      },
      cue_label_vi: conceptShort,
      bridge_badge_vi: `= ${targetItem.value}`,
    };
  }

  if (SHAPE_STRAND_RE.test(dataset.skill_code)) {
    return {
      mode: "silhouette_clue",
      cue_asset: keywordAsset(targetItem),
      cue_label_vi: conceptShort,
    };
  }

  return {
    mode: "story_riddle",
    cue_asset: pickDistinctThemePropAsset(opts.theme, targetKey),
    cue_label_vi: conceptShort,
  };
}

export function buildOptionQuantityRep(
  item: DatasetItem,
  opts: ProjectOptions
): GT001QuantityRep | undefined {
  const rep = opts.representation;
  if (
    !(
      rep &&
      rep !== "numeral" &&
      rep !== "finger" &&
      rep !== "discrete-object" &&
      !item.glyph &&
      typeof item.value === "number" &&
      item.value >= 1 &&
      item.value <= 20
    )
  ) {
    return undefined;
  }
  const safeKind = rep === "dot-pattern" && item.value > 6 ? "ten-frame" : rep;
  return {
    kind: safeKind,
    count: item.value,
    max: item.value <= 10 ? 10 : 20,
    min: 0,
  };
}
