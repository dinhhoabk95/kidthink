/**
 * Cổng kiểm tra hai chiều kho giá trị kỹ năng (Task #255, #265 / BR-SVI-01..12).
 *
 * Chiều 1 (Tính hợp lệ): dataset ⊆ inventory — cấm item ngoại lai / trang trí.
 * Chiều 2 (Độ bao phủ): inventory ⊆ ⋃ dataset — đo nợ giá trị chưa được dạy.
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  C1_MEASURE_DIMENSION_INVENTORY,
  C1_NUMBER_BOND_INVENTORY,
  C1_NUMERAL_INVENTORY,
  C1_ORDINAL_INVENTORY,
  C1_PATTERN_UNIT_INVENTORY,
  C1_QUANTITY_REP_INVENTORY,
  C5_DIGRAPH_INVENTORY,
  C5_LETTER_INVENTORY,
  C5_ONSET_INVENTORY,
  C5_RIME_INVENTORY,
  C5_TONE_MARK_INVENTORY,
  C5_VOCABULARY_INVENTORY,
  type MeasureDimensionInventoryItem,
  type NumeralInventoryItem,
  type OrdinalInventoryItem,
  SKILL_DATASETS,
} from "@mindkid/content";
import type { DatasetItem, SkillDataset } from "@mindkid/shared";

export interface InventoryCheckTarget {
  readonly id: string;
  readonly name: string;
  readonly skillCodes: readonly string[];
  readonly expectedIds: readonly string[];
  readonly validIds: readonly string[];
  readonly perSkillValidIds?: Readonly<Record<string, readonly string[]>>;
}

export interface InvalidItemViolation {
  readonly skillCode: string;
  readonly itemId: string;
  readonly itemLabel: string;
}

export interface InventoryDebtReport {
  readonly invalidItems: readonly InvalidItemViolation[];
  readonly missingByTarget: Readonly<Record<string, readonly string[]>>;
  readonly totalMissing: number;
}

export interface InventoryBaselineData {
  readonly total_missing_items: number;
  readonly missing_by_target: Record<string, string[]>;
}

export interface InventorySanityViolation {
  readonly code:
    | "BR-SVI-02"
    | "BR-SVI-03"
    | "BR-SVI-05"
    | "BR-SVI-06"
    | "BR-SVI-08"
    | "BR-SVI-09"
    | "BR-SVI-11"
    | "BR-SVI-12";
  readonly message: string;
}

const REPO_ROOT = join(import.meta.dirname, "..");
const BASELINE_PATH = join(
  import.meta.dirname,
  "value-inventory-baseline.json"
);
const LEADING_SLASH_RE = /^\//;

export function groupItemsByField<
  T extends { readonly id: string; readonly group: string },
>(items: readonly T[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const item of items) {
    const list = result[item.group] ?? [];
    list.push(item.id);
    result[item.group] = list;
  }
  return result;
}

// ── 6 Target Ngôn ngữ (C5) ──────────────────────────────────────────────────

export function buildC5LetTarget(): InventoryCheckTarget {
  const letterIds = C5_LETTER_INVENTORY.map((item) => item.id);
  const letterBySkill = groupItemsByField(C5_LETTER_INVENTORY);
  letterBySkill["C5.ALP.04"] = [...letterIds];
  return {
    id: "C5.LET",
    name: "29 chữ cái tiếng Việt (C5.LET.01..05, C5.ALP.04)",
    skillCodes: [
      "C5.LET.01",
      "C5.LET.02",
      "C5.LET.03",
      "C5.LET.04",
      "C5.LET.05",
      "C5.ALP.04",
    ],
    expectedIds: letterIds,
    validIds: letterIds,
    perSkillValidIds: letterBySkill,
  };
}

export function buildC5DgrTarget(): InventoryCheckTarget {
  const digraphIds = C5_DIGRAPH_INVENTORY.map((item) => item.id);
  const digraphBySkill = groupItemsByField(C5_DIGRAPH_INVENTORY);
  return {
    id: "C5.DGR",
    name: "11 chữ ghép tiếng Việt (C5.DGR.01..02)",
    skillCodes: ["C5.DGR.01", "C5.DGR.02"],
    expectedIds: digraphIds,
    validIds: digraphIds,
    perSkillValidIds: digraphBySkill,
  };
}

export function buildC5TmkTarget(): InventoryCheckTarget {
  const toneMarkIds = C5_TONE_MARK_INVENTORY.map((item) => item.id);
  const toneMarkBySkill = groupItemsByField(C5_TONE_MARK_INVENTORY);
  for (const code of [
    "C5.TON.01",
    "C5.TON.02",
    "C5.TON.03",
    "C5.TON.04",
    "C5.TON.05",
    "C5.TON.06",
  ]) {
    toneMarkBySkill[code] = [...toneMarkIds];
  }
  return {
    id: "C5.TMK",
    name: "6 dấu thanh tiếng Việt (C5.TMK.01..03, C5.TON.01..06)",
    skillCodes: [
      "C5.TMK.01",
      "C5.TMK.02",
      "C5.TMK.03",
      "C5.TON.01",
      "C5.TON.02",
      "C5.TON.03",
      "C5.TON.04",
      "C5.TON.05",
      "C5.TON.06",
    ],
    expectedIds: toneMarkIds,
    validIds: toneMarkIds,
    perSkillValidIds: toneMarkBySkill,
  };
}

export function buildC5RimTarget(): InventoryCheckTarget {
  const rimeIds = C5_RIME_INVENTORY.map((item) => item.id);
  const rimeBySkill = groupItemsByField(C5_RIME_INVENTORY);
  return {
    id: "C5.RIM",
    name: "53 vần tiếng Việt (C5.RIM.01..06)",
    skillCodes: [
      "C5.RIM.01",
      "C5.RIM.02",
      "C5.RIM.03",
      "C5.RIM.04",
      "C5.RIM.05",
      "C5.RIM.06",
    ],
    expectedIds: rimeIds,
    validIds: rimeIds,
    perSkillValidIds: rimeBySkill,
  };
}

export function buildC5OnsTarget(): InventoryCheckTarget {
  const onsetIds = C5_ONSET_INVENTORY.map((item) => item.id);
  const onsetBySkill = groupItemsByField(C5_ONSET_INVENTORY);
  return {
    id: "C5.ONS",
    name: "22 âm đầu tiếng Việt (C5.ONS.01..04)",
    skillCodes: ["C5.ONS.01", "C5.ONS.02", "C5.ONS.03", "C5.ONS.04"],
    expectedIds: onsetIds,
    validIds: onsetIds,
    perSkillValidIds: onsetBySkill,
  };
}

export function buildC5VocTarget(): InventoryCheckTarget {
  const vocIds = C5_VOCABULARY_INVENTORY.map((item) => item.id);
  const vocBySkill = groupItemsByField(C5_VOCABULARY_INVENTORY);
  return {
    id: "C5.VOC",
    name: "15 bộ từ vựng GDMN (C5.VOC.06..20)",
    skillCodes: Object.keys(vocBySkill),
    expectedIds: vocIds,
    validIds: vocIds,
    perSkillValidIds: vocBySkill,
  };
}

// ── 6 Target Số học (C1) ────────────────────────────────────────────────────

export function buildC1NumeralTarget(): InventoryCheckTarget {
  // BR-SVI-07: 0–10 gắn required: true; cổng chỉ đòi phủ trọn phần required.
  const requiredNumeralIds = C1_NUMERAL_INVENTORY.filter(
    (item) => item.required
  ).map((item) => item.id);
  const allNumeralIds = C1_NUMERAL_INVENTORY.map((item) => item.id);

  const n0To5 = ["n0", "n1", "n2", "n3", "n4", "n5"];
  const n0To10 = requiredNumeralIds;
  const n11To20 = C1_NUMERAL_INVENTORY.filter((item) => !item.required).map(
    (item) => item.id
  );

  const perSkillValidIds: Record<string, readonly string[]> = {
    "C1.NREC.01": n0To5,
    "C1.NREC.02": n0To5,
    "C1.NREC.03": n0To10,
    "C1.NREC.04": n11To20,
  };

  return {
    id: "C1.NREC",
    name: "21 chữ số tiếng Việt 0–20 (C1.NREC.01..04)",
    skillCodes: ["C1.NREC.01", "C1.NREC.02", "C1.NREC.03", "C1.NREC.04"],
    expectedIds: requiredNumeralIds,
    validIds: allNumeralIds,
    perSkillValidIds,
  };
}

export function buildC1OrdinalTarget(): InventoryCheckTarget {
  const ordinalIds = C1_ORDINAL_INVENTORY.map((item) => item.id);
  const ord1To3 = ["ord_1", "ord_2", "ord_3"];
  const ord1To5 = ["ord_1", "ord_2", "ord_3", "ord_4", "ord_5"];
  const ord1To10 = [...ordinalIds];

  const perSkillValidIds: Record<string, readonly string[]> = {
    "C1.ORD.01": ord1To3,
    "C1.ORD.02": ord1To5,
    "C1.ORD.03": ord1To5,
    "C1.ORD.04": ord1To10,
    "C1.ORD.05": ord1To5,
    "C1.ORD.06": ord1To10,
  };

  return {
    id: "C1.ORD",
    name: "10 số thứ tự tiếng Việt (C1.ORD.01..06)",
    skillCodes: [
      "C1.ORD.01",
      "C1.ORD.02",
      "C1.ORD.03",
      "C1.ORD.04",
      "C1.ORD.05",
      "C1.ORD.06",
    ],
    expectedIds: ordinalIds,
    validIds: ordinalIds,
    perSkillValidIds,
  };
}

export function buildC1BondTarget(): InventoryCheckTarget {
  const bondIds = C1_NUMBER_BOND_INVENTORY.map((item) => item.id);
  return {
    id: "C1.NCOMP",
    name: "65 cặp phân tách số 1–10 (C1.NCOMP.01..09)",
    skillCodes: [
      "C1.NCOMP.01",
      "C1.NCOMP.02",
      "C1.NCOMP.03",
      "C1.NCOMP.04",
      "C1.NCOMP.05",
      "C1.NCOMP.06",
      "C1.NCOMP.07",
      "C1.NCOMP.08",
      "C1.NCOMP.09",
    ],
    // Ghi chú (L3.9): Không đo coverage qua item id của dataset mà đo ở tầng level (Task kế tiếp).
    expectedIds: [],
    validIds: bondIds,
  };
}

export function buildC1RepTarget(): InventoryCheckTarget {
  const repIds = C1_QUANTITY_REP_INVENTORY.map((item) => item.id);
  return {
    id: "C1.REP",
    name: "8 dạng biểu diễn lượng (C1.CNT.01..08, C1.DAT.01)",
    skillCodes: [
      "C1.CNT.01",
      "C1.CNT.02",
      "C1.CNT.03",
      "C1.CNT.04",
      "C1.CNT.05",
      "C1.CNT.06",
      "C1.CNT.07",
      "C1.CNT.08",
      "C1.DAT.01",
    ],
    // Ghi chú (L3.9): Không đo coverage qua item id của dataset mà đo ở tầng level (Task kế tiếp).
    expectedIds: [],
    validIds: repIds,
  };
}

export function buildC1MeasureTarget(): InventoryCheckTarget {
  const dimensionIds = C1_MEASURE_DIMENSION_INVENTORY.map((item) => item.id);
  return {
    id: "C1.MEAS",
    name: "6 cặp chiều đo đối lập (C1.MEAS.01..05, C1.CMP.01, C1.CMP.04)",
    skillCodes: [
      "C1.MEAS.01",
      "C1.MEAS.02",
      "C1.MEAS.03",
      "C1.MEAS.04",
      "C1.MEAS.05",
      "C1.CMP.01",
      "C1.CMP.04",
    ],
    // Ghi chú (L3.9): Không đo coverage qua item id của dataset mà đo ở tầng level (Task kế tiếp).
    expectedIds: [],
    validIds: dimensionIds,
  };
}

export function buildC1PatternTarget(): InventoryCheckTarget {
  const patternIds = C1_PATTERN_UNIT_INVENTORY.map((item) => item.id);
  return {
    id: "C1.PAT",
    name: "6 mẫu đơn vị lặp quy luật (C1.PAT.01..05)",
    skillCodes: [
      "C1.PAT.01",
      "C1.PAT.02",
      "C1.PAT.03",
      "C1.PAT.04",
      "C1.PAT.05",
    ],
    // Ghi chú (L3.9): Không đo coverage qua item id của dataset mà đo ở tầng level (Task kế tiếp).
    expectedIds: [],
    validIds: patternIds,
  };
}

export function buildInventoryTargets(): readonly InventoryCheckTarget[] {
  return [
    buildC5LetTarget(),
    buildC5DgrTarget(),
    buildC5TmkTarget(),
    buildC5RimTarget(),
    buildC5OnsTarget(),
    buildC5VocTarget(),
    buildC1NumeralTarget(),
    buildC1OrdinalTarget(),
    buildC1BondTarget(),
    buildC1RepTarget(),
    buildC1MeasureTarget(),
    buildC1PatternTarget(),
  ];
}

// ── Sanity Checks (BR-SVI-06, BR-SVI-08, BR-SVI-09, BR-SVI-11, BR-SVI-12) ──

export function checkInventoryFilesExist(
  repoRoot: string = REPO_ROOT
): readonly InventorySanityViolation[] {
  const violations: InventorySanityViolation[] = [];
  const requiredFiles: ReadonlyArray<{
    readonly targetId: string;
    readonly relativePath: string;
  }> = [
    {
      targetId: "C1.NREC",
      relativePath: "packages/content/src/inventories/c1-numeral.ts",
    },
    {
      targetId: "C1.ORD",
      relativePath: "packages/content/src/inventories/c1-ordinal.ts",
    },
    {
      targetId: "C1.NCOMP",
      relativePath: "packages/content/src/inventories/c1-number-bond.ts",
    },
    {
      targetId: "C1.REP",
      relativePath: "packages/content/src/inventories/c1-quantity-rep.ts",
    },
    {
      targetId: "C1.MEAS",
      relativePath: "packages/content/src/inventories/c1-measure-dimension.ts",
    },
    {
      targetId: "C1.PAT",
      relativePath: "packages/content/src/inventories/c1-pattern-unit.ts",
    },
    {
      targetId: "C5.LET",
      relativePath: "packages/content/src/inventories/c5-letter.ts",
    },
    {
      targetId: "C5.DGR",
      relativePath: "packages/content/src/inventories/c5-digraph.ts",
    },
    {
      targetId: "C5.TMK",
      relativePath: "packages/content/src/inventories/c5-tone-mark.ts",
    },
    {
      targetId: "C5.RIM",
      relativePath: "packages/content/src/inventories/c5-rime.ts",
    },
    {
      targetId: "C5.ONS",
      relativePath: "packages/content/src/inventories/c5-onset.ts",
    },
    {
      targetId: "C5.VOC",
      relativePath: "packages/content/src/inventories/c5-vocabulary.ts",
    },
  ];

  for (const item of requiredFiles) {
    const fullPath = join(repoRoot, item.relativePath);
    if (!existsSync(fullPath)) {
      violations.push({
        code: "BR-SVI-06",
        message: `Target ${item.targetId} không có kho giá trị (thiếu ${item.relativePath})`,
      });
    }
  }

  return violations;
}

export function checkNumeralInventoryProperties(
  items: readonly NumeralInventoryItem[] = C1_NUMERAL_INVENTORY,
  repoRoot: string = REPO_ROOT
): readonly InventorySanityViolation[] {
  const violations: InventorySanityViolation[] = [];

  for (const item of items) {
    if (typeof item.value !== "number") {
      violations.push({
        code: "BR-SVI-08",
        message: `Mục chữ số id "${item.id}" thiếu trường value hợp lệ`,
      });
      continue;
    }

    if (!item.glyph || item.glyph.trim() === "") {
      violations.push({
        code: "BR-SVI-08",
        message: `Mục chữ số (value: ${item.value}) thiếu trường glyph`,
      });
    }

    if (!item.audio_path || item.audio_path.trim() === "") {
      violations.push({
        code: "BR-SVI-08",
        message: `Mục chữ số (value: ${item.value}) thiếu trường audio_path`,
      });
    } else {
      const cleanPath = item.audio_path.replace(LEADING_SLASH_RE, "");
      const fullDiskPath = join(repoRoot, "apps/web/public", cleanPath);
      if (!existsSync(fullDiskPath)) {
        violations.push({
          code: "BR-SVI-08",
          message: `File âm thanh của chữ số ${item.value} không tồn tại trên đĩa: ${item.audio_path}`,
        });
      }
    }
  }

  return violations;
}

export function checkOrdinalInventoryProperties(
  items: readonly OrdinalInventoryItem[] = C1_ORDINAL_INVENTORY,
  repoRoot: string = REPO_ROOT
): readonly InventorySanityViolation[] {
  const violations: InventorySanityViolation[] = [];

  for (const item of items) {
    if (item.audio_path && item.audio_path.trim() !== "") {
      const cleanPath = item.audio_path.replace(LEADING_SLASH_RE, "");
      const fullDiskPath = join(repoRoot, "apps/web/public", cleanPath);
      if (!existsSync(fullDiskPath)) {
        violations.push({
          code: "BR-SVI-08",
          message: `File âm thanh của số thứ tự "${item.label}" (${item.id}) không tồn tại trên đĩa: ${item.audio_path}`,
        });
      }
    }
  }

  return violations;
}

function isMatchPole(text: string, pole: string): boolean {
  const wordBoundaryRe = new RegExp(`(^|\\s|[-_])${pole}($|\\s|[-_])`, "i");
  return wordBoundaryRe.test(text);
}

function datasetHasDimensionPole(
  dataset: SkillDataset,
  dimId: string,
  pole: string,
  suffix: "_more" | "_less"
): boolean {
  return dataset.items.some(
    (it) =>
      it.id === `${dimId}${suffix}` ||
      it.id.endsWith(suffix) ||
      isMatchPole(it.id, pole) ||
      isMatchPole(it.label, pole)
  );
}

function findDimensionPolarityViolation(
  dataset: SkillDataset,
  dim: MeasureDimensionInventoryItem,
  skillCode: string
): InventorySanityViolation | null {
  const hasMore = datasetHasDimensionPole(
    dataset,
    dim.id,
    dim.pole_more,
    "_more"
  );
  const hasLess = datasetHasDimensionPole(
    dataset,
    dim.id,
    dim.pole_less,
    "_less"
  );

  const isDedicatedSkill = dim.group === skillCode && skillCode === "C1.CMP.04";
  const touchesDimension = hasMore || hasLess;

  if (!(isDedicatedSkill || touchesDimension)) {
    return null;
  }
  if (hasMore && hasLess) {
    return null;
  }

  let presentPole = "";
  if (hasMore) {
    presentPole = dim.pole_more;
  } else if (hasLess) {
    presentPole = dim.pole_less;
  }

  let missingPole = `cả "${dim.pole_more}" và "${dim.pole_less}"`;
  if (hasMore) {
    missingPole = `cực "${dim.pole_less}"`;
  } else if (hasLess) {
    missingPole = `cực "${dim.pole_more}"`;
  }

  return {
    code: "BR-SVI-11",
    message: presentPole
      ? `Cặp chiều đo [${dim.label}] bị khuyết một cực trong kỹ năng ${skillCode}: chỉ chứa cực "${presentPole}" mà không chứa ${missingPole}`
      : `Cặp chiều đo [${dim.label}] bị khuyết cả hai cực trong kỹ năng ${skillCode}: không chứa ${missingPole}`,
  };
}

function buildInventoryPropertyMap(): ReadonlyMap<
  string,
  { glyph?: string; label?: string }
> {
  const map = new Map<string, { glyph?: string; label?: string }>();
  const allInventories = [
    C1_NUMERAL_INVENTORY,
    C1_ORDINAL_INVENTORY,
    C5_TONE_MARK_INVENTORY,
    C5_LETTER_INVENTORY,
    C5_DIGRAPH_INVENTORY,
    C5_ONSET_INVENTORY,
    C5_RIME_INVENTORY,
  ];
  for (const invList of allInventories) {
    for (const item of invList) {
      map.set(item.id, { glyph: item.glyph, label: item.label });
    }
  }
  return map;
}

function checkDatasetItemProperty(
  item: DatasetItem,
  skillCode: string,
  invMap: ReadonlyMap<string, { glyph?: string; label?: string }>,
  violations: InventorySanityViolation[]
): void {
  const inv = invMap.get(item.id);
  if (!inv) {
    return;
  }
  if (inv.glyph && item.glyph && item.glyph !== inv.glyph) {
    violations.push({
      code: "BR-SVI-05",
      message: `Item "${item.id}" trong kỹ năng ${skillCode} có glyph "${item.glyph}" không khớp với kho giá trị ("${inv.glyph}")`,
    });
  }
  if (
    inv.label &&
    item.label &&
    item.label.trim().toLowerCase() !== inv.label.trim().toLowerCase()
  ) {
    violations.push({
      code: "BR-SVI-05",
      message: `Item "${item.id}" trong kỹ năng ${skillCode} có label "${item.label}" không khớp với kho giá trị ("${inv.label}")`,
    });
  }
}

export function checkItemPropertiesMatchInventory(
  datasets: Readonly<Record<string, SkillDataset>> = SKILL_DATASETS
): readonly InventorySanityViolation[] {
  const violations: InventorySanityViolation[] = [];
  const inventoryMap = buildInventoryPropertyMap();

  for (const [skillCode, dataset] of Object.entries(datasets)) {
    for (const item of dataset.items) {
      checkDatasetItemProperty(item, skillCode, inventoryMap, violations);
    }
  }

  return violations;
}

export function checkMeasureDimensionsPolarity(
  datasets: Readonly<Record<string, SkillDataset>> = SKILL_DATASETS,
  inventory: readonly MeasureDimensionInventoryItem[] = C1_MEASURE_DIMENSION_INVENTORY
): readonly InventorySanityViolation[] {
  const violations: InventorySanityViolation[] = [];
  const targetSkills = [
    "C1.MEAS.01",
    "C1.MEAS.02",
    "C1.MEAS.03",
    "C1.MEAS.04",
    "C1.MEAS.05",
    "C1.CMP.01",
    "C1.CMP.04",
  ];

  for (const skillCode of targetSkills) {
    const dataset = datasets[skillCode];
    if (!dataset) {
      continue;
    }

    for (const dim of inventory) {
      const v = findDimensionPolarityViolation(dataset, dim, skillCode);
      if (v) {
        violations.push(v);
      }
    }
  }

  return violations;
}

export function checkSkillNumeralOrOrdinalSource(
  skillCode: string,
  dataset: SkillDataset
): readonly InventorySanityViolation[] {
  const hasValidSource = dataset.items.some((item) => {
    const hasGlyph = Boolean(item.glyph && item.glyph.trim() !== "");
    const hasValue = typeof item.value === "number";
    const isInOrdinal = C1_ORDINAL_INVENTORY.some((ord) => ord.id === item.id);
    return hasGlyph || hasValue || isInOrdinal;
  });

  if (!hasValidSource) {
    return [
      {
        code: "BR-SVI-09",
        message: `Kỹ năng ${skillCode} không lấy giá trị nào từ c1-ordinal (chỉ chứa các item emoji không có glyph và không có value)`,
      },
    ];
  }
  return [];
}

export function checkRatchetProgression(
  totalMissing: number,
  baselineTotal: number
): readonly InventorySanityViolation[] {
  if (totalMissing > baselineTotal) {
    return [
      {
        code: "BR-SVI-12",
        message: `Ratchet đi lùi: nợ giá trị kho tăng từ ${baselineTotal} lên ${totalMissing}!`,
      },
    ];
  }
  return [];
}

// ── Lõi So khớp Hai chiều (Validity & Coverage) ──────────────────────────────

function collectSkillViolations(
  skillCode: string,
  allowedIds: ReadonlySet<string>,
  outViolations: InvalidItemViolation[],
  datasets: Readonly<Record<string, SkillDataset>>
): void {
  const dataset = datasets[skillCode];
  if (!dataset) {
    return;
  }
  for (const item of dataset.items) {
    if (!allowedIds.has(item.id)) {
      outViolations.push({
        skillCode,
        itemId: item.id,
        itemLabel: item.label,
      });
    }
  }
}

export function checkTargetValidity(
  target: InventoryCheckTarget,
  outViolations: InvalidItemViolation[],
  datasets: Readonly<Record<string, SkillDataset>> = SKILL_DATASETS
): void {
  if (!target.perSkillValidIds) {
    return;
  }
  for (const skillCode of target.skillCodes) {
    const allowed = new Set(
      target.perSkillValidIds[skillCode] ?? target.validIds
    );
    collectSkillViolations(skillCode, allowed, outViolations, datasets);
  }
}

export function checkTargetCoverage(
  target: InventoryCheckTarget,
  datasets: Readonly<Record<string, SkillDataset>> = SKILL_DATASETS
): readonly string[] {
  const presentIds = new Set<string>();
  for (const skillCode of target.skillCodes) {
    const dataset = datasets[skillCode];
    if (!dataset) {
      continue;
    }
    for (const item of dataset.items) {
      presentIds.add(item.id);
    }
  }

  const missing: string[] = [];
  for (const expectedId of target.expectedIds) {
    if (!presentIds.has(expectedId)) {
      missing.push(expectedId);
    }
  }
  return missing;
}

export function measureInventoryDebt(
  targets: readonly InventoryCheckTarget[] = buildInventoryTargets(),
  datasets: Readonly<Record<string, SkillDataset>> = SKILL_DATASETS
): InventoryDebtReport {
  const invalidItems: InvalidItemViolation[] = [];
  const missingByTarget: Record<string, readonly string[]> = {};
  let totalMissing = 0;

  for (const target of targets) {
    checkTargetValidity(target, invalidItems, datasets);
    const missing = checkTargetCoverage(target, datasets);
    if (missing.length > 0) {
      missingByTarget[target.id] = missing;
      totalMissing += missing.length;
    }
  }

  return {
    invalidItems,
    missingByTarget,
    totalMissing,
  };
}

export function readBaseline(
  baselinePath: string = BASELINE_PATH
): InventoryBaselineData {
  if (existsSync(baselinePath)) {
    try {
      return JSON.parse(
        readFileSync(baselinePath, "utf-8")
      ) as InventoryBaselineData;
    } catch (error) {
      throw new Error(
        `[BR-SVI-12] Không thể đọc hoặc parse file baseline từ ${baselinePath}: ${String(error)}`
      );
    }
  }
  return {
    total_missing_items: 9999,
    missing_by_target: {},
  };
}

function printSummary(
  totalMissing: number,
  baselineTotal: number,
  missingByTarget: Readonly<Record<string, readonly string[]>>
): void {
  console.log(
    `   - Tổng số giá trị còn nợ chưa phủ (missing): ${totalMissing}`
  );
  console.log(`   - Ngưỡng baseline hiện tại: ${baselineTotal}`);

  for (const [targetId, missing] of Object.entries(missingByTarget)) {
    const preview = missing.slice(0, 5).join(", ");
    const suffix = missing.length > 5 ? "..." : "";
    console.log(
      `     • Target [${targetId}]: thiếu ${missing.length} giá trị: ${preview}${suffix}`
    );
  }
}

export function updateBaselineFile(
  totalMissing: number,
  missingByTarget: Readonly<Record<string, readonly string[]>>
): void {
  const nextBaseline: InventoryBaselineData = {
    total_missing_items: totalMissing,
    missing_by_target: missingByTarget as Record<string, string[]>,
  };
  writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(nextBaseline, null, 2)}\n`,
    "utf-8"
  );
  console.log(
    `✅ Đã cập nhật value-inventory-baseline.json thành ${totalMissing} nợ.`
  );
}

export function handleUpdateBaseline(
  report: InventoryDebtReport,
  baseline: InventoryBaselineData,
  sanityViolations: readonly InventorySanityViolation[],
  acceptNewTargets: readonly string[] = []
): {
  readonly exitCode: number;
  readonly report: InventoryDebtReport;
  readonly sanityViolations: readonly InventorySanityViolation[];
} {
  for (const targetId of Object.keys(report.missingByTarget)) {
    if (
      !(
        targetId in baseline.missing_by_target ||
        acceptNewTargets.includes(targetId)
      )
    ) {
      console.error(
        `❌ [BR-SVI-12] Phát hiện target mới [${targetId}] có ${report.missingByTarget[targetId]?.length} nợ chưa có trong baseline. Dùng cờ --accept-new-target=${targetId} để chấp nhận.`
      );
      return { exitCode: 1, report, sanityViolations };
    }
  }

  for (const [targetId, oldMissing] of Object.entries(
    baseline.missing_by_target
  )) {
    const currentMissing = report.missingByTarget[targetId] ?? [];
    if (currentMissing.length > oldMissing.length) {
      console.error(
        `❌ Không thể cập nhật baseline: Nợ target [${targetId}] tăng từ ${oldMissing.length} lên ${currentMissing.length}.`
      );
      return { exitCode: 1, report, sanityViolations };
    }
  }
  updateBaselineFile(report.totalMissing, report.missingByTarget);
  return { exitCode: 0, report, sanityViolations };
}

export function runValueInventoryCheck(options: {
  readonly isUpdate: boolean;
  readonly repoRoot?: string;
  readonly baselinePath?: string;
  readonly datasets?: Readonly<Record<string, SkillDataset>>;
  readonly acceptNewTargets?: readonly string[];
}): {
  readonly exitCode: number;
  readonly report: InventoryDebtReport;
  readonly sanityViolations: readonly InventorySanityViolation[];
} {
  const root = options.repoRoot ?? REPO_ROOT;
  const datasets = options.datasets ?? SKILL_DATASETS;
  const baseline = readBaseline(options.baselinePath ?? BASELINE_PATH);

  // 1. Sanity checks (BR-SVI-05, BR-SVI-06, BR-SVI-08, BR-SVI-09, BR-SVI-11)
  const fileViolations = checkInventoryFilesExist(root);
  const numeralViolations = checkNumeralInventoryProperties(
    C1_NUMERAL_INVENTORY,
    root
  );
  const ordinalViolations = checkOrdinalInventoryProperties(
    C1_ORDINAL_INVENTORY,
    root
  );
  const measureViolations = checkMeasureDimensionsPolarity(
    datasets,
    C1_MEASURE_DIMENSION_INVENTORY
  );

  const numeralOrdinalSkills = [
    "C1.NREC.01",
    "C1.NREC.02",
    "C1.NREC.03",
    "C1.NREC.04",
    "C1.ORD.01",
    "C1.ORD.02",
    "C1.ORD.03",
    "C1.ORD.04",
    "C1.ORD.05",
    "C1.ORD.06",
  ];
  const sourceViolations: InventorySanityViolation[] = [];
  for (const skillCode of numeralOrdinalSkills) {
    const ds = datasets[skillCode];
    if (ds) {
      sourceViolations.push(...checkSkillNumeralOrOrdinalSource(skillCode, ds));
    }
  }

  const propertyViolations = checkItemPropertiesMatchInventory(datasets);

  const sanityViolations = [
    ...fileViolations,
    ...numeralViolations,
    ...ordinalViolations,
    ...measureViolations,
    ...sourceViolations,
    ...propertyViolations,
  ];

  if (sanityViolations.length > 0) {
    for (const v of sanityViolations) {
      console.error(`❌ [${v.code}] ${v.message}`);
    }
    return {
      exitCode: 1,
      report: measureInventoryDebt(buildInventoryTargets(), datasets),
      sanityViolations,
    };
  }

  // 2. Debt check (Validity & Coverage)
  const report = measureInventoryDebt(buildInventoryTargets(), datasets);

  if (report.invalidItems.length > 0) {
    console.error(
      `❌ [BR-SVI-02] Vi phạm tính hợp lệ: Phát hiện ${report.invalidItems.length} item ngoại lai:`
    );
    for (const inv of report.invalidItems) {
      console.error(
        `   - Kỹ năng ${inv.skillCode}: item id "${inv.itemId}" ("${inv.itemLabel}")`
      );
    }
    return { exitCode: 1, report, sanityViolations };
  }

  console.log(
    "   ✓ Chiều 1 (Tính hợp lệ): 100% item thuộc kho giá trị (không có item ngoại lai)."
  );
  printSummary(
    report.totalMissing,
    baseline.total_missing_items,
    report.missingByTarget
  );

  if (options.isUpdate) {
    return handleUpdateBaseline(
      report,
      baseline,
      sanityViolations,
      options.acceptNewTargets ?? []
    );
  }

  const ratchetViolations = checkRatchetProgression(
    report.totalMissing,
    baseline.total_missing_items
  );
  if (ratchetViolations.length > 0) {
    console.error(`❌ [BR-SVI-12] ${ratchetViolations[0]?.message}`);
    return { exitCode: 1, report, sanityViolations: ratchetViolations };
  }

  console.log(
    `✅ [check:value-inventory] Đạt yêu cầu (nợ: ${report.totalMissing}/${baseline.total_missing_items}).`
  );
  return { exitCode: 0, report, sanityViolations: [] };
}

function main(): void {
  const args = process.argv.slice(2);
  const isUpdate = args.includes("--update");
  const acceptNewTargets = args
    .filter((a) => a.startsWith("--accept-new-target="))
    .map((a) => a.replace("--accept-new-target=", ""));

  console.log(
    "📊 [check-value-inventory] Cổng kiểm tra hai chiều kho giá trị:"
  );
  const { exitCode } = runValueInventoryCheck({ isUpdate, acceptNewTargets });
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

if (process.argv[1]?.endsWith("check-value-inventory.ts")) {
  main();
}
