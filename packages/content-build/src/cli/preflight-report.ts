#!/usr/bin/env node
/**
 * Báo cáo chiều sâu nội dung từng engine cho danh mục Preflight.
 *
 * Báo cáo **gọi thẳng cổng** (`evaluateEngineDepth`) thay vì tự dựng lại phép
 * so ngưỡng. Bản trước chép tay một mảng tám điều kiện `checks`, nên hai nguồn
 * sự thật cùng tồn tại: cổng đổi luật là báo cáo nói dối mà không ai biết —
 * đúng kiểu sai lệch mà một báo cáo tiền-go-live phải ❌ NEVER mắc.
 *
 * Dùng: pnpm --filter @mindkid/db tsx src/seed-content/cli/preflight-report.ts [--step N]
 */

import { pathToFileURL } from "node:url";
import {
  type EngineDepthConfig,
  evaluateEngineDepth,
  loadEngineDepthConfig,
} from "../gates/engine-content-depth";
import { ALL_SEED_LEVELS } from "../index.js";

const RULE = "═".repeat(79);

function parseStepOverride(argv: readonly string[]): number | undefined {
  const i = argv.indexOf("--step");
  if (i === -1) {
    return undefined;
  }
  const raw = argv[i + 1];
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`--step cần một số nguyên >= 0, nhận "${raw}"`);
  }
  return n;
}

/**
 * Báo cáo được phép soi một bậc **khác** bậc đang hiệu lực — đó là mục đích của
 * nó: cho thấy còn bao xa tới bậc kế. Nhưng nó soi bằng chính cổng, trên một
 * bản sao cấu hình, chứ ❌ NEVER bằng một bản luật chép tay.
 */
function withActiveStep(
  config: EngineDepthConfig,
  step: number
): EngineDepthConfig {
  if (!config.steps[String(step)]) {
    throw new Error(
      `Cấu hình không có bậc ${step}. Các bậc có: ${Object.keys(config.steps).join(", ")}`
    );
  }
  return {
    ...config,
    active_step: step,
    history: [...config.history, { step, date: config.date }],
  };
}

function main(): void {
  const baseConfig = loadEngineDepthConfig();
  const step = parseStepOverride(process.argv) ?? baseConfig.active_step;
  const config = withActiveStep(baseConfig, step);
  const criteria = config.steps[String(step)];
  if (!criteria) {
    throw new Error(`Không có tiêu chí cho bậc ${step}`);
  }

  const report = evaluateEngineDepth(ALL_SEED_LEVELS, config);

  process.stdout.write(`${RULE}\n`);
  process.stdout.write(
    `Preflight — Chiều sâu nội dung engine (ngưỡng bậc ${step})\n`
  );
  process.stdout.write(`${RULE}\n`);
  process.stdout.write(
    `Ngưỡng: level>=${criteria.level_count} band>=${criteria.min_band_count} ` +
      `thinking>=${criteria.thinking_span} what>=${criteria.what_span} ` +
      `theme>=${criteria.theme_span} diff>=${criteria.difficulty_span} ` +
      `free>=${criteria.min_free_or_login} oob<=${criteria.max_out_of_band ?? 0}\n\n`
  );

  const codes = Object.keys(report.perEngine).sort();
  for (const code of codes) {
    const entry = report.perEngine[code];
    if (!entry) {
      continue;
    }
    const { metrics: m, passed, deficits } = entry;
    const bands = m.valid_bands
      .map((b) => `${b}:${m.band_counts[b] ?? 0}`)
      .join(" ");
    process.stdout.write(
      `${passed ? "✅" : "❌"} ${m.engine_code}  level=${m.level_count}  ` +
        `band=[${bands}] min=${m.min_band_count}  thinking=${m.thinking_span}  ` +
        `what=${m.what_span}  theme=${m.theme_span}  diff=${m.difficulty_span}  ` +
        `free=${m.free_or_login_count}  oob=${m.out_of_band_count}\n`
    );
    if (passed) {
      continue;
    }
    // Thiếu hụt cũng do cổng tính — báo cáo chỉ in lại.
    const gaps = Object.entries(deficits)
      .filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v > 0))
      .map(([k, v]) => `${k} thiếu ${Array.isArray(v) ? v.join("/") : v}`);
    if (gaps.length > 0) {
      process.stdout.write(`   → ${gaps.join(", ")}\n`);
    }
  }

  process.stdout.write(
    `\nTổng: ${report.passedEnginesCount} đạt, ${report.failedEnginesCount} trượt ở bậc ${step}` +
      ` · level ngoài band: ${report.totalOutOfBandLevels}\n`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}

export { main as runPreflightReport };
