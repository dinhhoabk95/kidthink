#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import {
  formatRoadmapBalanceReport,
  formatRoadmapViolationSummary,
  listRoadmapViolations,
  summarizeRows,
} from "../gates/roadmap-measure.js";
import { evaluateAuthoredRoadmaps } from "../gates/roadmap-seed-runner.js";

export function runRoadmapBalanceGate(options?: {
  quiet?: boolean;
  verbose?: boolean;
}): number {
  const report = summarizeRows(evaluateAuthoredRoadmaps());

  if (!options?.quiet) {
    console.log("=== CỔNG CÂN BẰNG LỘ TRÌNH (check:roadmap-balance) ===");
    for (const line of formatRoadmapBalanceReport(report)) {
      console.log(line);
    }
  }

  if (report.passed) {
    if (!options?.quiet) {
      console.log(
        `\n✅ CỔNG XANH: ${report.programs.length} lộ trình soạn thoả BR-CRM-*.`
      );
    }
    return 0;
  }

  if (!options?.quiet) {
    console.log(
      `\n❌ CỔNG ĐỎ: ${report.violating_programs}/${report.programs.length} lộ trình vi phạm BR-CRM-*.`
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
