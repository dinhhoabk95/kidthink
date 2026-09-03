#!/usr/bin/env node
import { pathToFileURL } from "node:url";

/**
 * CLI Runner cho Cổng Cung Cầu Giáo Án
 * Lệnh: pnpm --filter @mindkid/db check:lesson-supply
 * Spec: docs/specs/05-content/lesson-corpus-depth.md
 */

import {
  evaluateLessonSupply,
  formatLessonSupplyReport,
} from "../gates/lesson-supply";
import { ALL_SEED_LESSONS, ALL_SEED_LEVELS } from "../index.js";
import { MVP_CURRICULA_CONFIGS } from "../seed-master/curricula.js";

export function runLessonSupplyGate(options?: { quiet?: boolean }): number {
  const evaluation = evaluateLessonSupply({
    curriculaConfigs: MVP_CURRICULA_CONFIGS,
    lessons: [...ALL_SEED_LESSONS],
    gameLevels: ALL_SEED_LEVELS,
  });

  const report = formatLessonSupplyReport(evaluation, MVP_CURRICULA_CONFIGS);

  if (!options?.quiet) {
    console.log(report);
  }

  return evaluation.isPassed ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const exitCode = runLessonSupplyGate();
  process.exit(exitCode);
}
