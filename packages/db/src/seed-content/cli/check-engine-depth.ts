#!/usr/bin/env node
/**
 * CLI runner cho cổng sàn chiều sâu mỗi engine (Task #122).
 *
 * Usage:
 *   pnpm --filter @mindkid/db check:engine-depth
 */

import { ALL_SEED_LEVELS } from "#src/seed-content/index";
import {
  evaluateEngineDepth,
  formatEngineDepthReport,
  loadEngineDepthConfig,
} from "../gates/engine-content-depth.js";

function main(): void {
  const config = loadEngineDepthConfig();
  const report = evaluateEngineDepth(ALL_SEED_LEVELS, config);

  console.log(formatEngineDepthReport(report));

  if (!report.passed) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
