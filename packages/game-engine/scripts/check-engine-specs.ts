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
import { runEngineDepthSection } from "./gen-engine-depth-section.js";

function main(): void {
  const specsDir = repoPath("docs/specs/01-platform/engines");
  const templatesDir = repoPath("packages/game-engine/src/templates");
  const configPath = repoPath(
    "packages/game-engine/config/engine-spec-ready.json"
  );
  const plannedPath = repoPath(
    "packages/game-engine/config/engine-spec-planned.json"
  );

  const result = scanEngineSpecsGate(
    specsDir,
    templatesDir,
    configPath,
    plannedPath,
    repoPath(".")
  );
  const report = formatEngineSpecsReport(result);

  console.log("check:engine-specs");
  console.log(report);

  const s16Ok = runEngineDepthSection({ check: true });

  if (result.violations.length > 0 || !s16Ok) {
    process.exit(1);
  }
}

main();
