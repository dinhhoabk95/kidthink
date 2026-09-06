/**
 * Cổng kiểm tra hai chiều kho giá trị kỹ năng (Task #255 / BR-SVI-01..05).
 *
 * Chiều 1 (Tính hợp lệ): dataset ⊆ inventory — cấm item ngoại lai / trang trí.
 * Chiều 2 (Độ bao phủ): inventory ⊆ ⋃ dataset — đo nợ giá trị chưa được dạy.
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  C5_DIGRAPH_INVENTORY,
  C5_LETTER_INVENTORY,
  C5_ONSET_INVENTORY,
  C5_RIME_INVENTORY,
  C5_TONE_MARK_INVENTORY,
  C5_VOCABULARY_INVENTORY,
  SKILL_DATASETS,
} from "@mindkid/content";

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

const BASELINE_PATH = join(
  import.meta.dirname,
  "value-inventory-baseline.json"
);

function groupItemsByField<
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

function buildC5LetTarget(): InventoryCheckTarget {
  const letterIds = C5_LETTER_INVENTORY.map((item) => item.id);
  const letterBySkill = groupItemsByField(C5_LETTER_INVENTORY);
  return {
    id: "C5.LET",
    name: "29 chữ cái tiếng Việt (C5.LET.01..05)",
    skillCodes: [
      "C5.LET.01",
      "C5.LET.02",
      "C5.LET.03",
      "C5.LET.04",
      "C5.LET.05",
    ],
    expectedIds: letterIds,
    validIds: letterIds,
    perSkillValidIds: letterBySkill,
  };
}

function buildC5DgrTarget(): InventoryCheckTarget {
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

function buildC5TmkTarget(): InventoryCheckTarget {
  const toneMarkIds = C5_TONE_MARK_INVENTORY.map((item) => item.id);
  const toneMarkBySkill = groupItemsByField(C5_TONE_MARK_INVENTORY);
  return {
    id: "C5.TMK",
    name: "6 dấu thanh tiếng Việt (C5.TMK.01..03)",
    skillCodes: ["C5.TMK.01", "C5.TMK.02", "C5.TMK.03"],
    expectedIds: toneMarkIds,
    validIds: toneMarkIds,
    perSkillValidIds: toneMarkBySkill,
  };
}

function buildC5RimTarget(): InventoryCheckTarget {
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

function buildC5OnsTarget(): InventoryCheckTarget {
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

function buildC5VocTarget(): InventoryCheckTarget {
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

export function buildInventoryTargets(): readonly InventoryCheckTarget[] {
  const letterIds = C5_LETTER_INVENTORY.map((item) => item.id);
  const toneMarkIds = C5_TONE_MARK_INVENTORY.map((item) => item.id);

  return [
    buildC5LetTarget(),
    buildC5DgrTarget(),
    buildC5TmkTarget(),
    buildC5RimTarget(),
    buildC5OnsTarget(),
    buildC5VocTarget(),
    {
      id: "C5.ALP.04",
      name: "Kỹ năng tổng hợp nhận đủ 29 chữ cái (C5.ALP.04)",
      skillCodes: ["C5.ALP.04"],
      expectedIds: letterIds,
      validIds: letterIds,
    },
    {
      id: "C5.TON",
      name: "Strand nhận biết thanh điệu cũ (C5.TON.01..06)",
      skillCodes: [
        "C5.TON.01",
        "C5.TON.02",
        "C5.TON.03",
        "C5.TON.04",
        "C5.TON.05",
        "C5.TON.06",
      ],
      expectedIds: toneMarkIds,
      validIds: toneMarkIds,
    },
  ];
}

function collectSkillViolations(
  skillCode: string,
  allowedIds: ReadonlySet<string>,
  outViolations: InvalidItemViolation[]
): void {
  const dataset = SKILL_DATASETS[skillCode];
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

function checkTargetValidity(
  target: InventoryCheckTarget,
  outViolations: InvalidItemViolation[]
): void {
  if (!target.perSkillValidIds) {
    return;
  }
  for (const skillCode of target.skillCodes) {
    const allowed = new Set(
      target.perSkillValidIds[skillCode] ?? target.validIds
    );
    collectSkillViolations(skillCode, allowed, outViolations);
  }
}

function checkTargetCoverage(target: InventoryCheckTarget): readonly string[] {
  const presentIds = new Set<string>();
  for (const skillCode of target.skillCodes) {
    const dataset = SKILL_DATASETS[skillCode];
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

export function measureInventoryDebt(): InventoryDebtReport {
  const targets = buildInventoryTargets();
  const invalidItems: InvalidItemViolation[] = [];
  const missingByTarget: Record<string, readonly string[]> = {};
  let totalMissing = 0;

  for (const target of targets) {
    checkTargetValidity(target, invalidItems);
    const missing = checkTargetCoverage(target);
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

function readBaseline(): InventoryBaselineData {
  if (existsSync(BASELINE_PATH)) {
    try {
      return JSON.parse(
        readFileSync(BASELINE_PATH, "utf-8")
      ) as InventoryBaselineData;
    } catch {
      // fallback
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

function updateBaselineFile(
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

function main(): void {
  const args = process.argv.slice(2);
  const isUpdate = args.includes("--update");
  const baseline = readBaseline();

  const { invalidItems, missingByTarget, totalMissing } =
    measureInventoryDebt();

  console.log(
    "📊 [check-value-inventory] Cổng kiểm tra hai chiều kho giá trị:"
  );

  if (invalidItems.length > 0) {
    console.error(
      `❌ [BR-SVI-02] Vi phạm tính hợp lệ: Phát hiện ${invalidItems.length} item ngoại lai:`
    );
    for (const inv of invalidItems) {
      console.error(
        `   - Kỹ năng ${inv.skillCode}: item id "${inv.itemId}" ("${inv.itemLabel}")`
      );
    }
    process.exit(1);
  }
  console.log(
    "   ✓ Chiều 1 (Tính hợp lệ): 100% item thuộc kho giá trị (không có item ngoại lai)."
  );

  printSummary(totalMissing, baseline.total_missing_items, missingByTarget);

  if (isUpdate) {
    if (totalMissing > baseline.total_missing_items) {
      console.error(
        `❌ Không thể cập nhật baseline: Nợ giá trị tăng từ ${baseline.total_missing_items} lên ${totalMissing}.`
      );
      process.exit(1);
    }
    updateBaselineFile(totalMissing, missingByTarget);
    process.exit(0);
  }

  if (totalMissing > baseline.total_missing_items) {
    console.error(
      `❌ Cổng đỏ (BR-SVI-03): Nợ giá trị kho tăng từ ${baseline.total_missing_items} lên ${totalMissing}!`
    );
    process.exit(1);
  }

  console.log(
    `✅ [check:value-inventory] Đạt yêu cầu (nợ: ${totalMissing}/${baseline.total_missing_items}).`
  );
}

if (process.argv[1]?.endsWith("check-value-inventory.ts")) {
  main();
}
