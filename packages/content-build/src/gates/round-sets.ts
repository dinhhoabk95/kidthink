/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: gate validation logic */

/**
 * Spec sở hữu: docs/specs/05-content/round-set-model.md
 * Rule sở hữu: BR-RSM-01..13
 */

import { pathToFileURL } from "node:url";
import { validateRoundSet } from "@mindkid/shared";
import { ALL_SEED_LEVELS } from "../catalog.js";
import type { AnyContentSeed, ContentSeed } from "../types.js";

export interface RoundSetGateViolation {
  levelCode: string;
  ruleCode: string;
  message: string;
}

export interface RoundSetGateResult {
  totalLevelsChecked: number;
  multiRoundLevelsCount: number;
  singleRoundLevelsCount: number;
  violations: RoundSetGateViolation[];
  isPassed: boolean;
}

function isContentSeed(seed: AnyContentSeed): seed is ContentSeed {
  return (
    seed.kind === "game_level" || (!seed.kind && "template_code" in seed.header)
  );
}

/**
 * Kiểm tra các quy tắc round set BR-RSM-01..13 trên danh sách content seeds
 */
export function evaluateRoundSets(seeds: AnyContentSeed[]): RoundSetGateResult {
  const violations: RoundSetGateViolation[] = [];
  let multiRoundCount = 0;
  let singleRoundCount = 0;
  let totalChecked = 0;

  for (const seed of seeds) {
    if (!isContentSeed(seed)) {
      continue;
    }

    totalChecked++;
    const { header, content_pack, difficulty_params, rounds } = seed;
    let roundItems: Array<{
      round_index: number;
      template_code: string;
      instruction?: string | null;
      content_pack: unknown;
      difficulty_params: unknown;
      difficulty?: number | null;
      age_min?: number | null;
      age_max?: number | null;
      theme_id?: string | null;
    }>;

    if (rounds && rounds.length > 0) {
      multiRoundCount++;
      roundItems = rounds.map((r, idx) => ({
        round_index: idx,
        template_code: header.template_code,
        instruction: r.instruction,
        content_pack: r.content_pack,
        difficulty_params: r.difficulty_params,
        difficulty: r.difficulty ?? header.difficulty,
        age_min: header.age_min,
        age_max: header.age_max,
        theme_id: header.theme_tag || "farm",
      }));
    } else {
      singleRoundCount++;
      roundItems = [
        {
          round_index: 0,
          template_code: header.template_code,
          instruction: header.instruction || "",
          content_pack,
          difficulty_params,
          difficulty: header.difficulty,
          age_min: header.age_min,
          age_max: header.age_max,
          theme_id: header.theme_tag || "farm",
        },
      ];
    }

    const validation = validateRoundSet({
      rounds: roundItems,
      learning_objective_count: header.learning_objective_codes?.length || 1,
    });
    if (!validation.ok) {
      for (const err of validation.violations) {
        violations.push({
          levelCode: header.code,
          ruleCode: err.rule,
          message: err.message,
        });
      }
    }
  }

  return {
    totalLevelsChecked: totalChecked,
    multiRoundLevelsCount: multiRoundCount,
    singleRoundLevelsCount: singleRoundCount,
    violations,
    isPassed: violations.length === 0,
  };
}

export function formatRoundSetGateReport(result: RoundSetGateResult): string {
  const lines: string[] = [];
  lines.push("===============================================================");
  lines.push(" BÁO CÁO CỔNG ROUND SET (check:round-sets - BR-RSM-01..13)");
  lines.push("===============================================================");
  lines.push(`Tổng số level kiểm tra: ${result.totalLevelsChecked}`);
  lines.push(`  - Level 1 vòng mặc định: ${result.singleRoundLevelsCount}`);
  lines.push(
    `  - Level nhiều vòng (multi-round): ${result.multiRoundLevelsCount}`
  );

  if (result.violations.length > 0) {
    lines.push("\n--- DANH SÁCH VI PHẠM (BLOCKED) ---");
    for (const v of result.violations) {
      lines.push(
        ` [VI PHẠM] Level ${v.levelCode}: [${v.ruleCode}] ${v.message}`
      );
    }
  } else {
    lines.push("\n-> Toàn bộ round sets hợp lệ và tuân thủ BR-RSM-01..13.");
  }

  lines.push("===============================================================");
  lines.push(
    `KẾT QUẢ: ${result.isPassed ? "ĐẠT (PASS)" : "KHÔNG ĐẠT (BLOCKED)"}`
  );
  lines.push("===============================================================");

  return lines.join("\n");
}

// CLI runner
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const report = evaluateRoundSets(ALL_SEED_LEVELS);
    console.log(formatRoundSetGateReport(report));
    if (!report.isPassed) {
      process.exit(1);
    }
  } catch (e: unknown) {
    console.error("Lỗi khi chạy cổng round sets:", e);
    process.exit(1);
  }
}
