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
import {
  evaluateEngineDepth,
  loadEngineDepthConfig,
} from "../gates/engine-content-depth";
import {
  evaluateGoLiveReadiness,
  formatGoLiveReport,
  loadGoLiveConfig,
} from "../gates/go-live-readiness";
import { ALL_SEED_LESSONS, ALL_SEED_LEVELS } from "../index.js";
import { MVP_CURRICULA_CONFIGS } from "../seed-master/curricula.js";

/**
 * Engine nào đang active — hỏi **registry template**, không hỏi file cấu hình.
 *
 * Cấu hình khai *phạm vi mong muốn*; registry khai *thực tế*. So hai thứ khác
 * nguồn mới là một phép đo. Bản cũ truyền `config.active_engines` vào cả ba
 * tham số, nên `BR-GLR-05`, `BR-ERC-01` và `BR-ECD-01` đều là phép so một mảng
 * với chính nó: ba dòng `[PASS]` không hề nhìn vào một engine nào.
 */
function resolveActiveEngineIds(): string[] {
  return Object.keys(ALL_TEMPLATES).sort();
}

/**
 * Engine có `render()` = engine nằm trong bậc thang render của game-engine.
 *
 * ❌ NEVER suy ra từ `getLevelGenerator(id)`: **bộ sinh level** là công cụ soạn
 * nội dung, không liên quan gì tới việc engine có vẽ được hay không. Dùng nó
 * làm proxy khiến `BR-ERC-01` báo 19/27 trong khi con số thật nằm ở
 * `packages/game-engine/config/render-implemented.json` — nguồn mà chính cổng
 * `check:render` đo và cưỡng chế.
 */
function resolveImplementedRenderEngineIds(scope: string[]): string[] {
  const configPath = repoPath(
    "packages/game-engine/config/render-implemented.json"
  );
  const parsed: unknown = JSON.parse(readFileSync(configPath, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error(
      `render-implemented.json phải là một mảng mã engine, đọc ra ${typeof parsed}`
    );
  }
  const implemented = new Set(
    parsed.filter((x): x is string => typeof x === "string")
  );
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
    curriculaConfigs: MVP_CURRICULA_CONFIGS,
    lessons: [...ALL_SEED_LESSONS],
    gameLevels: ALL_SEED_LEVELS,
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
