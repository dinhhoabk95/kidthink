#!/usr/bin/env node
/**
 * CLI runner cho cổng kiểm tra ma trận seed mục 13 (Task #263 T13).
 *
 * Usage:
 *   pnpm --filter @mindkid/content-build check:engine-seed-matrix
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { ALL_SKILL_SEEDS } from "@mindkid/content";
import {
  buildSkillThinkingMap,
  evaluateEngineSeedMatrix,
  formatSeedMatrixReport,
  loadSeedMatrixBaseline,
} from "../gates/engine-seed-matrix.js";
import { ALL_SEED_LEVELS } from "../index.js";

export function runEngineSeedMatrixGate(options?: { quiet?: boolean }): number {
  const repoRoot = path.resolve(import.meta.dirname, "../../../../");
  const specsDir = path.join(repoRoot, "docs/specs/01-platform/engines");
  const baseline = loadSeedMatrixBaseline();
  const skillThinkingMap = buildSkillThinkingMap(ALL_SKILL_SEEDS);
  const report = evaluateEngineSeedMatrix(
    ALL_SEED_LEVELS,
    specsDir,
    baseline,
    skillThinkingMap
  );

  if (!options?.quiet) {
    console.log(formatSeedMatrixReport(report));
  }

  return report.passed ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(runEngineSeedMatrixGate());
}
