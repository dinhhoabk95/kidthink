#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import {
  evaluateEngineAllocationWithDebt,
  formatEngineAllocationReport,
  loadEngineAllocationDebt,
  runEngineAllocationGate,
} from "#src/gates/allocation";

export function runEngineAllocationCli(options?: {
  strict?: boolean;
  quiet?: boolean;
}): number {
  const isStrict = options?.strict ?? process.argv.includes("--strict");
  const result = runEngineAllocationGate();
  const debt = loadEngineAllocationDebt();
  const debtEval = evaluateEngineAllocationWithDebt(result, debt);

  if (!options?.quiet) {
    console.log(formatEngineAllocationReport(result));
    console.log(
      `  Sổ nợ bậc thang (chỉ giảm): ô thiếu ${result.deficitCells}/${debt.max_deficit_cells}, level lĩnh vực cấm ${result.prohibitedViolations.length}/${debt.max_prohibited_violations}`
    );
  }

  const passed = isStrict ? result.valid : debtEval.passed;

  if (passed) {
    if (!options?.quiet) {
      console.log(
        "  ✅ CỔNG XANH: Ma trận phân bổ lĩnh vực tư duy tuân thủ quy tắc và không phát sinh nợ mới."
      );
    }
    return 0;
  }

  if (!options?.quiet) {
    console.error(
      "  ❌ CỔNG ĐỎ: Phát hiện vi phạm ngoài baseline hoặc nợ cũ đã trả:"
    );
    for (const v of debtEval.unexcusedViolations) {
      console.error(`    ✗ ${v}`);
    }
    for (const s of debtEval.staleDebt) {
      console.error(`    ✗ ${s}`);
    }
  }
  return 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runEngineAllocationCli());
}
