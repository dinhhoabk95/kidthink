/**
 * Cổng kiểm tra spec engine theo hợp đồng SDD.
 *
 * Quy tắc: BR-ESS-01..14
 * Contract: docs/specs/01-platform/engine-spec-sheet.md
 *
 * Chạy: pnpm --filter @mindkid/game-engine check:engine-specs
 */
import { repoPath } from "@mindkid/config/paths";
import {
  formatEngineSpecsReport,
  scanEngineSpecsGate,
} from "../tests/gates/engine-specs.js";

function main(): void {
  const specsDir = repoPath("docs/specs/01-platform/engines");
  const templatesDir = repoPath("packages/game-engine/src/templates");
  const configPath = repoPath(
    "packages/game-engine/config/engine-spec-ready.json"
  );

  const result = scanEngineSpecsGate(specsDir, templatesDir, configPath);
  const report = formatEngineSpecsReport(result);

  console.log("check:engine-specs");
  console.log(report);

  if (result.violations.length > 0) {
    process.exit(1);
  }
}

main();
