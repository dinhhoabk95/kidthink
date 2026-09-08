/**
 * Cổng kiểm tra miền hành vi của 37 engine (Task #261).
 *
 * Quy tắc: BR-EBD-01..13, BR-ESS-16, BR-ESS-17
 * Contract: docs/specs/01-platform/engine-behavior-domain.md
 *
 * Chạy: pnpm --filter @mindkid/game-engine check:engine-behavior
 */
import { repoPath } from "@mindkid/config/paths";
import {
  formatEngineBehaviorReport,
  scanEngineBehaviorGate,
} from "../tests/gates/engine-behavior.js";

function main(): void {
  const specsDir = repoPath("docs/specs/01-platform/engines");
  const configPath = repoPath(
    "packages/game-engine/config/engine-behavior-domain.json"
  );

  const baselinePath = repoPath("scripts/engine-behavior-baseline.json");

  const taggingSources = [
    repoPath("packages/db/src/schema/tagging.ts"),
    repoPath("docs/specs/01-platform/content-tagging.md"),
  ];

  const result = scanEngineBehaviorGate({
    specsDir,
    configPath,
    baselinePath,
    taggingSources,
  });
  const report = formatEngineBehaviorReport(result);

  console.log("check:engine-behavior");
  console.log(report);

  if (result.violations.length > 0) {
    process.exit(1);
  }
}

main();
