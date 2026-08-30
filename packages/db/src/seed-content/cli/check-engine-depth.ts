#!/usr/bin/env node
/**
 * CLI runner cho cổng sàn chiều sâu mỗi engine (Task #122).
 *
 * Usage:
 *   pnpm --filter @mindkid/db check:engine-depth
 */

import { pathToFileURL } from "node:url";
import {
  evaluateEngineDepth,
  formatEngineDepthReport,
  loadEngineDepthConfig,
} from "#src/seed-content/gates/engine-content-depth";
import { ALL_SEED_LEVELS } from "#src/seed-content/index";

export function runEngineDepthGate(options?: { quiet?: boolean }): number {
  const config = loadEngineDepthConfig();
  const report = evaluateEngineDepth(ALL_SEED_LEVELS, config);

  if (!options?.quiet) {
    console.log(formatEngineDepthReport(report));
  }

  return report.passed ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(runEngineDepthGate());
}
