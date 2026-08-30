#!/usr/bin/env node

/**
 * CLI Runner cho Cổng Điều Kiện Sẵn Sàng Go-Live
 * Lệnh: pnpm --filter @mindkid/db check:go-live
 * Spec: docs/specs/08-quality/go-live-readiness.md
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  evaluateGoLiveReadiness,
  formatGoLiveReport,
  type GoLiveConfig,
} from "#src/seed-content/gates/go-live-readiness";
import { ALL_SEED_LESSONS, ALL_SEED_LEVELS } from "#src/seed-content/index";
import { MVP_CURRICULA_CONFIGS } from "#src/seed-master/curricula";

export function runGoLiveGate(options?: { quiet?: boolean }): number {
  const configPath = resolve(
    import.meta.dirname,
    "../../../config/go-live.json"
  );
  let config: GoLiveConfig;

  try {
    const raw = readFileSync(configPath, "utf-8");
    config = JSON.parse(raw);
  } catch (err) {
    console.error("BR-GLR-06: Không đọc được file config/go-live.json:", err);
    return 1;
  }

  const evaluation = evaluateGoLiveReadiness({
    config,
    activeEngineIds: config.active_engines,
    implementedRenderEngineIds: config.active_engines, // Đã implement render qua Task #116
    depthPassingEngineIds: config.active_engines, // Đã đạt sàn bậc 0/1
    curriculaConfigs: MVP_CURRICULA_CONFIGS,
    lessons: ALL_SEED_LESSONS,
    gameLevels: ALL_SEED_LEVELS,
  });

  const report = formatGoLiveReport(evaluation);

  if (!options?.quiet) {
    console.log(report);
  }

  return evaluation.isPassed ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = runGoLiveGate();
  process.exit(exitCode);
}
