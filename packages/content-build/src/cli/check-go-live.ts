#!/usr/bin/env node

/**
 * CLI Runner cho Cổng Điều Kiện Sẵn Sàng Go-Live
 * Lệnh: pnpm --filter @mindkid/db check:go-live
 * Spec: docs/specs/08-quality/go-live-readiness.md
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { z } from "zod";
import {
  evaluateEngineDepth,
  loadEngineDepthConfig,
} from "#src/gates/engine-content-depth";
import {
  evaluateGoLiveReadiness,
  formatGoLiveReport,
  loadGoLiveConfig,
} from "#src/gates/go-live-readiness";
import { ALL_SEED_LESSONS, ALL_SEED_LEVELS } from "#src/index";
import { ROADMAP_CURRICULA_CONFIGS } from "#src/seed-master/roadmap-curricula";

const renderImplementedSchema = z.array(z.string());

function resolveActiveEngineIds(): string[] {
  return Object.keys(ALL_TEMPLATES).sort();
}

function resolveImplementedRenderEngineIds(scope: string[]): string[] {
  const configPath = repoPath(
    "packages/game-engine/config/render-implemented.json"
  );
  const parsed = renderImplementedSchema.parse(
    JSON.parse(readFileSync(configPath, "utf8"))
  );
  const implemented = new Set(parsed);
  return scope.filter((id) => implemented.has(id));
}

/** Engine đạt sàn nội dung = engine `passed` theo chính cổng độ sâu. */
function resolveDepthPassingEngineIds(scope: string[]): string[] {
  const report = evaluateEngineDepth(ALL_SEED_LEVELS, loadEngineDepthConfig());
  return scope.filter((id) => report.perEngine[id]?.passed === true);
}

export function runGoLiveGate(options?: { quiet?: boolean }): number {
  let config: ReturnType<typeof loadGoLiveConfig>;
  try {
    config = loadGoLiveConfig();
  } catch (err) {
    console.error("BR-GLR-06: Không đọc được config/go-live.json:", err);
    return 1;
  }

  const scope = config.active_engines;

  const evaluation = evaluateGoLiveReadiness({
    config,
    activeEngineIds: resolveActiveEngineIds(),
    implementedRenderEngineIds: resolveImplementedRenderEngineIds(scope),
    depthPassingEngineIds: resolveDepthPassingEngineIds(scope),
    curriculaConfigs: ROADMAP_CURRICULA_CONFIGS,
    lessons: [...ALL_SEED_LESSONS],
    gameLevels: ALL_SEED_LEVELS,
    enforceContractParse: true,
  });

  const report = formatGoLiveReport(evaluation);

  if (!options?.quiet) {
    console.log(report);
  }

  return evaluation.isPassed ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const exitCode = runGoLiveGate();
  process.exit(exitCode);
}
