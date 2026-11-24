import type {
  GT000Asset,
  GT000InteractionHint,
  GT000SceneBoardMode,
} from "@mindkid/game-engine/contracts";
import type {
  DatasetItem,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatDisplayLabel } from "@mindkid/shared";
import { extractVietnameseSyllables } from "./gt-000-phonics-helper.js";
import {
  inferPartWholeTarget,
  resolveCpaRepForBand,
} from "./gt-000-scene-modes.js";
import { resolveItemAsset } from "./utils.js";

const MAX_GT000_ASSETS = 21;
const MAX_TEACHING_SEGMENTS = 7;

const SEQUENCE_SKILL_PREFIXES: readonly string[] = [
  "C1.PAT.",
  "C1.ORD.",
  "C1.MEAS.10",
  "C1.MEAS.11",
  "C1.MEAS.12",
  "C3.SEQ.",
  "C3.RULE.",
  "C3.SRT.",
  "C3.ALG.",
  "C5.STO.",
  "C4.LIV.07",
  "C4.MAT.03",
  "C4.MAT.04",
];

const SORTING_SKILL_PREFIXES: readonly string[] = [
  "C3.CLS.",
  "C3.SET.",
  "C4.ECO.01",
  "C4.ECO.03",
  "C4.LIV.03",
  "C4.LIV.05",
  "C4.SAF.01",
  "C4.SAF.03",
];

const PHONICS_SKILL_PREFIXES: readonly string[] = [
  "C5.PHO.",
  "C5.TON.",
  "C5.RIM.",
  "C5.LET.",
  "C5.ALP.",
  "C5.ONS.",
  "C5.TMK.",
  "C5.DGR.",
  "C5.WRD.",
  "C5.RHY.",
];

const SPATIAL_SKILL_PREFIXES: readonly string[] = [
  "C2.ORI.",
  "C2.DIR.",
  "C2.SOL.",
  "C2.MIR.",
  "C2.ROT.",
  "C2.PER.",
  "C1.CMP.",
  "C1.MEAS.",
];

const RULE_MEMORY_SKILL_PREFIXES: readonly string[] = [
  "C6.WM.",
  "C4.MEM.",
  "C6.INH.",
  "C6.FLX.",
  "C6.ATT.",
  "C6.MON.",
];

const CAUSE_EFFECT_SKILL_PREFIXES: readonly string[] = [
  "C1.OTO.",
  "C4.CAU.",
  "C4.EXP.",
  "C3.INF.",
  "C3.DED.",
  "C3.ANA.",
];

function matchesAnyPrefix(
  skillCode: string,
  prefixes: readonly string[]
): boolean {
  return prefixes.some((p) => skillCode.startsWith(p));
}

export function resolveGT000ArchetypeMode(
  dataset: SkillDataset
): GT000SceneBoardMode {
  const code = dataset.skill_code;

  if (matchesAnyPrefix(code, ["C1.NCOMP.", "C1.ADD.", "C1.SUB.", "C1.PROB."])) {
    return "part_whole";
  }
  if (matchesAnyPrefix(code, ["C1.CNT.", "C1.NREC.", "C1.DAT."])) {
    return "cpa_bridge";
  }
  if (matchesAnyPrefix(code, SEQUENCE_SKILL_PREFIXES)) {
    return "sequence_strip";
  }
  if (matchesAnyPrefix(code, SPATIAL_SKILL_PREFIXES)) {
    return "spatial_stage";
  }
  if (matchesAnyPrefix(code, SORTING_SKILL_PREFIXES)) {
    return "sorting_baskets";
  }
  if (matchesAnyPrefix(code, PHONICS_SKILL_PREFIXES)) {
    return "word_phonics_box";
  }
  if (matchesAnyPrefix(code, RULE_MEMORY_SKILL_PREFIXES)) {
    return "rule_memory_stage";
  }
  if (matchesAnyPrefix(code, CAUSE_EFFECT_SKILL_PREFIXES)) {
    return "cause_effect";
  }
  return "single_card";
}

function collectOrderedDatasetItems(dataset: SkillDataset): DatasetItem[] {
  const itemById = new Map(dataset.items.map((item) => [item.id, item]));
  const ordered: DatasetItem[] = [];
  const seen = new Set<string>();

  for (const id of dataset.ordering ?? []) {
    const found = itemById.get(id);
    if (found && !seen.has(found.id)) {
      ordered.push(found);
      seen.add(found.id);
    }
  }
  for (const item of dataset.items) {
    if (!seen.has(item.id)) {
      ordered.push(item);
      seen.add(item.id);
    }
  }
  return ordered;
}

function filterPartWholeItems(
  ordered: readonly DatasetItem[],
  dataset: SkillDataset,
  targetWhole: number
): DatasetItem[] {
  const subsetIds = new Set<string>();
  for (const rel of dataset.relations ?? []) {
    if (rel.type === "subset") {
      subsetIds.add(rel.source_id);
      subsetIds.add(rel.target_id);
    }
  }
  return ordered.filter((item) => {
    if (subsetIds.has(item.id)) {
      return true;
    }
    return !(typeof item.value === "number" && item.value > targetWhole);
  });
}

export function selectTeachingItems(
  dataset: SkillDataset,
  mode: GT000SceneBoardMode
): DatasetItem[] {
  const ordered = collectOrderedDatasetItems(dataset);
  if (mode !== "part_whole") {
    return ordered.slice(0, MAX_GT000_ASSETS);
  }
  const targetWhole = inferPartWholeTarget(dataset);
  if (targetWhole === null) {
    return ordered.slice(0, MAX_GT000_ASSETS);
  }
  const filtered = filterPartWholeItems(ordered, dataset, targetWhole);
  return (filtered.length >= 2 ? filtered : ordered).slice(0, MAX_GT000_ASSETS);
}

export function chunkItemsBalanced<T>(
  items: readonly T[],
  maxChunk = 3
): T[][] {
  const chunks: T[][] = [];
  let i = 0;
  while (i < items.length) {
    const remaining = items.length - i;
    if (maxChunk === 2 && remaining === 3) {
      chunks.push(items.slice(i, i + 3));
      break;
    }
    if (remaining <= maxChunk) {
      chunks.push(items.slice(i));
      break;
    }
    const chunkSize =
      remaining === maxChunk + 1 && maxChunk >= 3 ? maxChunk - 1 : maxChunk;
    chunks.push(items.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return chunks;
}

function interleaveByContrastGroup(
  items: readonly DatasetItem[]
): DatasetItem[] {
  const buckets = new Map<string, DatasetItem[]>();
  for (const item of items) {
    const key = item.contrast_group ?? item.category?.type ?? "primary";
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }
  if (buckets.size < 2) {
    return [...items];
  }
  const queues = [...buckets.values()];
  const result: DatasetItem[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const q of queues) {
      const next = q.shift();
      if (next) {
        result.push(next);
        added = true;
      }
    }
  }
  return result;
}

function orderByPairRelations(
  items: readonly DatasetItem[],
  dataset: SkillDataset
): DatasetItem[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const used = new Set<string>();
  const ordered: DatasetItem[] = [];

  for (const rel of dataset.relations ?? []) {
    if (rel.type !== "pair" && rel.type !== "contrast") {
      continue;
    }
    const src = byId.get(rel.source_id);
    const dst = byId.get(rel.target_id);
    if (src && dst && !used.has(src.id) && !used.has(dst.id)) {
      ordered.push(src, dst);
      used.add(src.id);
      used.add(dst.id);
    }
  }
  for (const item of items) {
    if (!used.has(item.id)) {
      ordered.push(item);
    }
  }
  return ordered;
}

export function chunkItemsPedagogically(
  items: readonly DatasetItem[],
  dataset: SkillDataset,
  mode: GT000SceneBoardMode
): DatasetItem[][] {
  if (mode === "cause_effect") {
    const paired = orderByPairRelations(items, dataset);
    const maxChunk = paired.length > MAX_TEACHING_SEGMENTS * 2 ? 3 : 2;
    return chunkItemsBalanced(paired, maxChunk);
  }

  const contrastModes: ReadonlySet<GT000SceneBoardMode> = new Set([
    "spatial_stage",
    "sorting_baskets",
    "rule_memory_stage",
    "word_phonics_box",
  ]);

  if (contrastModes.has(mode)) {
    const interleaved = interleaveByContrastGroup(items);
    const maxChunk = interleaved.length > MAX_TEACHING_SEGMENTS * 2 ? 3 : 2;
    return chunkItemsBalanced(interleaved, maxChunk);
  }

  return chunkItemsBalanced(items, 3);
}

export function buildGT000Asset(
  item: DatasetItem,
  mode: GT000SceneBoardMode,
  skillCode: string,
  band: ProjectOptions["band"]
): GT000Asset {
  const count =
    typeof item.value === "number" && item.value >= 0
      ? Math.min(100, Math.round(item.value))
      : undefined;

  const representation =
    mode === "cpa_bridge" && count !== undefined
      ? {
          kind: resolveCpaRepForBand(skillCode, band, count),
          count,
          max: count <= 10 ? 10 : 20,
        }
      : undefined;

  const syllables =
    mode === "word_phonics_box" ? extractVietnameseSyllables(item) : undefined;

  return {
    asset_id: `asset_${item.id}`,
    kind: item.glyph ? "glyph" : "image",
    label: formatDisplayLabel(item.label, {
      value: item.value,
      glyph: item.glyph,
    }),
    glyph: item.glyph,
    contrast_group: item.contrast_group ?? item.category?.type ?? "primary",
    image_ref: resolveItemAsset(item, false),
    audio_path: item.audio_path,
    value: item.value,
    ...(syllables ? { syllables } : {}),
    ...(representation ? { representation } : {}),
  };
}

export function resolvePresentInteractionHint(
  mode: GT000SceneBoardMode
): GT000InteractionHint {
  if (mode === "cpa_bridge") {
    return "tap_to_count";
  }
  if (mode === "part_whole") {
    return "tap_to_split";
  }
  return "tap_to_explore";
}

export function findSegmentLinkPair(
  chunk: readonly DatasetItem[],
  dataset: SkillDataset,
  mode: GT000SceneBoardMode
): {
  readonly sourceItem: DatasetItem;
  readonly targetItem: DatasetItem;
} | null {
  if (mode !== "cause_effect" && !dataset.skill_code.startsWith("C5.WRD.")) {
    return null;
  }
  if (chunk.length < 2) {
    return null;
  }
  const chunkMap = new Map(chunk.map((i) => [i.id, i]));
  for (const rel of dataset.relations ?? []) {
    if (rel.type === "pair" || rel.type === "contrast") {
      const src = chunkMap.get(rel.source_id);
      const dst = chunkMap.get(rel.target_id);
      if (src && dst && src.id !== dst.id) {
        return { sourceItem: src, targetItem: dst };
      }
    }
  }
  const first = chunk[0];
  const second = chunk[1];
  if (first && second && first.id !== second.id) {
    return { sourceItem: first, targetItem: second };
  }
  return null;
}
