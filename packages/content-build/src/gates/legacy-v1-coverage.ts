/**
 * Spec sở hữu: docs/specs/08-quality/legacy-v1-coverage.md
 * Rules: BR-LVC-01..05
 *
 * Cổng phủ 60 game types v1 theo bậc thang (Legacy V1 Coverage Gate).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import { ALL_TEMPLATES } from "@mindkid/game-engine";
import { LEGACY_V1_GAME_TYPES, type LegacyV1GameType } from "@mindkid/shared";
import { ALL_SEED_LEVELS } from "../catalog.js";
import type { ContentSeed } from "../types.js";

export interface LegacyV1CoverageStep {
  step: number;
  min_levels_per_type: number;
  min_types_covered: number;
  description: string;
}

export interface LegacyV1CoverageConfig {
  active_step: number;
  steps: LegacyV1CoverageStep[];
  history: Array<{ date: string; step: number; task: string; note: string }>;
}

export interface LegacyTypeCoverageDetail {
  gameType: LegacyV1GameType;
  validLevelCount: number;
  isCovered: boolean;
  sampleCodes: string[];
}

export interface LegacyV1CoverageReport {
  passed: boolean;
  activeStep: number;
  minLevelsPerType: number;
  minTypesCovered: number;
  coveredTypesCount: number;
  totalTypes: number;
  totalValidLevels: number;
  details: LegacyTypeCoverageDetail[];
}

export function loadLegacyV1CoverageConfig(
  customPath?: string
): LegacyV1CoverageConfig {
  const configPath =
    customPath ||
    repoPath("packages/content-build/src/thresholds/legacy-v1-coverage.json");
  const raw = readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as LegacyV1CoverageConfig;
}

function isValidLevelContract(level: ContentSeed<unknown, unknown>): boolean {
  const templateCode = level.header.template_code;
  const template = ALL_TEMPLATES[templateCode as keyof typeof ALL_TEMPLATES];
  if (!(template?.content_contract && template?.difficulty_contract)) {
    return false;
  }
  const contentRes = template.content_contract.safeParse(level.content_pack);
  const diffRes = template.difficulty_contract.safeParse(
    level.difficulty_params
  );
  return contentRes.success && diffRes.success;
}

function groupValidLevelsByLegacyRef(levels: ContentSeed<unknown, unknown>[]): {
  levelsByRef: Map<string, ContentSeed<unknown, unknown>[]>;
  totalValid: number;
} {
  const levelsByRef = new Map<string, ContentSeed<unknown, unknown>[]>();
  for (const t of LEGACY_V1_GAME_TYPES) {
    levelsByRef.set(t.legacy_id, []);
  }

  let totalValid = 0;
  for (const level of levels) {
    const ref = level.header?.legacy_v1_ref;
    if (!(ref && levelsByRef.has(ref))) {
      continue;
    }
    if (isValidLevelContract(level)) {
      levelsByRef.get(ref)?.push(level);
      totalValid++;
    }
  }

  return { levelsByRef, totalValid };
}

export function checkLegacyV1Coverage(
  levels: ContentSeed<unknown, unknown>[] = ALL_SEED_LEVELS,
  configPath?: string
): LegacyV1CoverageReport {
  if (!levels || levels.length === 0) {
    throw new Error(
      "Danh sách level rỗng — cấm báo xanh giả khi không nạp được dữ liệu."
    );
  }

  const config = loadLegacyV1CoverageConfig(configPath);
  const activeStep =
    config.steps.find((s) => s.step === config.active_step) || config.steps[0];
  if (!activeStep) {
    throw new Error(
      `Cấu hình bậc ${config.active_step} không tồn tại trong legacy-v1-coverage.json`
    );
  }

  const { levelsByRef, totalValid } = groupValidLevelsByLegacyRef(levels);
  const details: LegacyTypeCoverageDetail[] = [];
  let coveredTypesCount = 0;

  for (const gameType of LEGACY_V1_GAME_TYPES) {
    const validLevels = levelsByRef.get(gameType.legacy_id) || [];
    const validCount = validLevels.length;
    const isCovered = validCount >= activeStep.min_levels_per_type;
    if (isCovered) {
      coveredTypesCount++;
    }

    details.push({
      gameType,
      validLevelCount: validCount,
      isCovered,
      sampleCodes: validLevels.slice(0, 3).map((l) => l.header.code),
    });
  }

  const passed = coveredTypesCount >= activeStep.min_types_covered;

  return {
    passed,
    activeStep: activeStep.step,
    minLevelsPerType: activeStep.min_levels_per_type,
    minTypesCovered: activeStep.min_types_covered,
    coveredTypesCount,
    totalTypes: LEGACY_V1_GAME_TYPES.length,
    totalValidLevels: totalValid,
    details,
  };
}

export function printLegacyV1CoverageReport(
  report: LegacyV1CoverageReport
): void {
  console.log("\n========================================================");
  console.log("📊 BÁO CÁO CỔNG PHỦ 60 GAME TYPES V1 (Task #170)");
  console.log(`- Bậc thang kích hoạt: Bậc ${report.activeStep}`);
  console.log(`- Tiêu chí: ≥${report.minLevelsPerType} level/type`);
  console.log(
    `- Ngưỡng yêu cầu: ${report.minTypesCovered} / ${report.totalTypes} game types`
  );
  console.log(
    `- Thực tế đạt: ${report.coveredTypesCount} / ${report.totalTypes} game types (${report.totalValidLevels} levels hợp lệ)`
  );
  console.log("========================================================\n");

  console.log(
    "Mã v1  | Competency | Template | Số level | Trạng thái | Tên game"
  );
  console.log(
    "--------------------------------------------------------------------------------"
  );

  for (const d of report.details) {
    const status = d.isCovered ? "✅ ĐẠT" : "❌ THIẾU";
    const countStr = d.validLevelCount.toString().padStart(3, " ");
    console.log(
      `${d.gameType.legacy_id.padEnd(6)} | ${d.gameType.competency_id.padEnd(10)} | ${d.gameType.template_code.padEnd(8)} | ${countStr}      | ${status.padEnd(10)} | ${d.gameType.name_vi}`
    );
  }

  console.log(
    "--------------------------------------------------------------------------------"
  );
  if (report.passed) {
    console.log(
      `\n🎉 CỔNG XANH: Đã đạt ${report.coveredTypesCount}/${report.minTypesCovered} game types yêu cầu cho Bậc ${report.activeStep}!`
    );
  } else {
    console.error(
      `\n💥 CỔNG ĐỎ: Chỉ đạt ${report.coveredTypesCount}/${report.minTypesCovered} game types yêu cầu cho Bậc ${report.activeStep}!`
    );
  }
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  try {
    const report = checkLegacyV1Coverage();
    printLegacyV1CoverageReport(report);
    if (!report.passed) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Lỗi khi kiểm tra cổng legacy-v1-coverage:", err);
    process.exit(1);
  }
}
