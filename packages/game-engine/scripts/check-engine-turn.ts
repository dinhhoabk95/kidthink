/**
 * Cổng kiểm tra kịch bản lượt chơi của 37 engine (Task #262).
 *
 * Quy tắc: BR-ETS-01..12, BR-ESS-18, BR-ESS-19
 * Contract: docs/specs/01-platform/engine-turn-script.md
 *
 * Chạy: pnpm --filter @mindkid/game-engine check:engine-turn
 */
import { repoPath } from "@mindkid/config/paths";
import {
  formatEngineTurnReport,
  scanEngineTurnGate,
} from "#tests/gates/engine-turn.js";

function main(): void {
  const specsDir = repoPath("docs/specs/01-platform/engines");

  const result = scanEngineTurnGate({ specsDir });
  const report = formatEngineTurnReport(result);

  console.log("check:engine-turn");
  console.log(report);

  if (result.violations.length > 0) {
    process.exit(1);
  }
}

main();
