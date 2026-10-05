#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { ALL_SEED_LESSONS, SHIPPABLE_SEED_LEVELS } from "../catalog.js";
import {
  evaluateSeededRoadmapBalance,
  formatRoadmapBalanceReport,
  formatRoadmapViolationSummary,
  listRoadmapViolations,
} from "../gates/roadmap-balance.js";

export function runRoadmapBalanceGate(options?: {
  quiet?: boolean;
  verbose?: boolean;
}): number {
  const report = evaluateSeededRoadmapBalance(
    ALL_SEED_LESSONS,
    SHIPPABLE_SEED_LEVELS
  );

  if (!options?.quiet) {
    console.log("=== CỔNG CÂN BẰNG LỘ TRÌNH (check:roadmap-balance) ===");
    for (const line of formatRoadmapBalanceReport(report)) {
      console.log(line);
    }
  }

  if (report.passed) {
    if (!options?.quiet) {
      console.log(
        `\n✅ CỔNG XANH: ${report.programs.length} chương trình published thoả BR-CRM-*.`
      );
    }
    return 0;
  }

  if (!options?.quiet) {
    console.log(
      `\n❌ CỔNG ĐỎ: ${report.violating_programs}/${report.programs.length} chương trình vi phạm BR-CRM-*.`
    );
    const lines = options?.verbose
      ? listRoadmapViolations(report).map(
          (violation) => `  - [${violation.program_code}] ${violation.message}`
        )
      : formatRoadmapViolationSummary(report);
    for (const line of lines) {
      console.log(line);
    }
    if (!options?.verbose) {
      console.log("\n(Thêm --verbose để in từng dòng vi phạm.)");
    }
  }
  return 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(
    runRoadmapBalanceGate({ verbose: process.argv.includes("--verbose") })
  );
}
