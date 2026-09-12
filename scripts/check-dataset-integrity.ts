/**
 * Cổng toàn vẹn bộ dữ liệu kỹ năng (`BR-SDI-01..08`).
 *
 * Cổng `check-thinking-structure` đo hình dạng; cổng này đo nghĩa. Nó bắt đúng
 * lớp lỗi mà Task #267 lọt qua: quan hệ trỏ vào vật không tồn tại, `ordering`
 * đảo ngược cho qua phép so vị trí, trục không khớp vật nào, `audio_path` trỏ
 * vào tệp chưa có, và chỗ trống prompt không ai thay.
 *
 * Bậc thang: nợ `C2`–`C6` có trước task #267 nằm trong
 * `scripts/dataset-integrity-baseline.json` và chỉ được GIẢM; `C1` chốt ở 0.
 * Một cặp `<mã kỹ năng>|<luật>` mới là vi phạm kể cả khi tổng không tăng.
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import { existsSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import {
  ALL_SKILL_SEEDS,
  SKILL_DATASETS,
  SKILL_IDENTITIES,
  SUBSTITUTED_PLACEHOLDERS,
} from "@mindkid/content";
import type { SkillDataset, SkillIdentity } from "@mindkid/shared";
import {
  type BaselineBreach,
  buildBaseline,
  evaluateAgainstBaseline,
  readBaseline,
  writeBaseline,
} from "./dataset-integrity/baseline.js";
import {
  checkAudioPathsResolve,
  checkAxesBindToItems,
  checkConceptLabelMatchesName,
  checkCrossDatasetItemConsistency,
  checkOrderingCoverage,
  checkOrderingNotReversed,
  checkPromptPlaceholders,
  checkRelationIntegrity,
  type IntegrityViolation,
} from "./dataset-integrity/rules.js";

export const PUBLIC_ROOT = repoPath("apps", "web", "public");
export const BASELINE_PATH = repoPath(
  "scripts",
  "dataset-integrity-baseline.json"
);

const BASELINE_NOTE =
  "Nợ toàn vẹn dataset có TRƯỚC review task #267. Nợ chỉ được GIẢM. " +
  "C1 chốt ở 0: mọi vi phạm C1 mới đều chặn ngay.";

export interface DatasetIntegrityReport {
  readonly inspectedDatasets: number;
  readonly violations: readonly IntegrityViolation[];
}

function audioResolver(publicRoot: string): (audioPath: string) => boolean {
  return (audioPath: string): boolean =>
    existsSync(`${publicRoot}${audioPath}`);
}

/**
 * Mọi dataset tới được tay trẻ, kể cả dataset chủ đề gắn thẳng vào level
 * (`SkillLevelPlan.dataset`) — chúng không nằm trong `SKILL_DATASETS` nhưng vẫn
 * được chiếu ra `content_pack`.
 */
export function collectAllDatasets(
  datasets: Record<string, SkillDataset>,
  seeds: readonly {
    readonly levels: readonly { readonly dataset?: SkillDataset }[];
  }[]
): readonly SkillDataset[] {
  const all: SkillDataset[] = Object.values(datasets);
  for (const seed of seeds) {
    for (const level of seed.levels) {
      if (level.dataset) {
        all.push(level.dataset);
      }
    }
  }
  return all;
}

export function runDatasetIntegrityCheck(options: {
  readonly datasets: readonly SkillDataset[];
  readonly identities: Record<string, SkillIdentity>;
  readonly resolvesAudio: (audioPath: string) => boolean;
  readonly substitutedPlaceholders: readonly string[];
}): DatasetIntegrityReport {
  const violations: IntegrityViolation[] = [];

  for (const dataset of options.datasets) {
    violations.push(
      ...checkRelationIntegrity(dataset),
      ...checkOrderingCoverage(dataset),
      ...checkOrderingNotReversed(dataset),
      ...checkAxesBindToItems(dataset),
      ...checkConceptLabelMatchesName(
        dataset,
        options.identities[dataset.skill_code]
      ),
      ...checkAudioPathsResolve(dataset, options.resolvesAudio),
      ...checkPromptPlaceholders(dataset, options.substitutedPlaceholders)
    );
  }

  violations.push(...checkCrossDatasetItemConsistency(options.datasets));

  return { inspectedDatasets: options.datasets.length, violations };
}

function groupByRule(
  violations: readonly IntegrityViolation[]
): Map<string, IntegrityViolation[]> {
  const byRule = new Map<string, IntegrityViolation[]>();
  for (const violation of violations) {
    const bucket = byRule.get(violation.rule);
    if (bucket) {
      bucket.push(violation);
    } else {
      byRule.set(violation.rule, [violation]);
    }
  }
  return new Map([...byRule.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

const MAX_LINES_PER_RULE = 15;

export function reportViolations(
  report: DatasetIntegrityReport,
  isVerbose: boolean
): void {
  if (report.violations.length === 0) {
    console.log(
      `✅ [check:dataset-integrity] Đạt yêu cầu (duyệt: ${report.inspectedDatasets} dataset, 0 vi phạm).`
    );
    return;
  }

  console.error(
    `❌ [check:dataset-integrity] ${report.violations.length} vi phạm trên ${report.inspectedDatasets} dataset:`
  );
  for (const [rule, bucket] of groupByRule(report.violations)) {
    console.error(`\n  ── ${rule} — ${bucket.length} vi phạm`);
    const shown = isVerbose ? bucket : bucket.slice(0, MAX_LINES_PER_RULE);
    for (const violation of shown) {
      console.error(`     ${violation.skillCode}: ${violation.detail}`);
    }
    if (shown.length < bucket.length) {
      console.error(
        `     … còn ${bucket.length - shown.length} dòng nữa (chạy với --verbose để xem hết)`
      );
    }
  }
}

function reportBreaches(breaches: readonly BaselineBreach[]): void {
  console.error(
    `\n❌ [check:dataset-integrity] ${breaches.length} lần phá bậc thang:`
  );
  for (const breach of breaches) {
    console.error(`     [${breach.kind}] ${breach.detail}`);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const isVerbose = args.includes("--verbose");
  const isUpdate = args.includes("--update");
  const isForce = args.includes("--force");

  const report = runDatasetIntegrityCheck({
    datasets: collectAllDatasets(SKILL_DATASETS, ALL_SKILL_SEEDS),
    identities: SKILL_IDENTITIES,
    resolvesAudio: audioResolver(PUBLIC_ROOT),
    substitutedPlaceholders: SUBSTITUTED_PLACEHOLDERS,
  });

  if (isUpdate) {
    const result = writeBaseline(
      BASELINE_PATH,
      buildBaseline(report.violations, BASELINE_NOTE),
      isForce
    );
    console.log(
      `${result.written ? "✅" : "❌"} [check:dataset-integrity] ${result.message}`
    );
    if (!result.written) {
      process.exit(1);
    }
    return;
  }

  const baseline = readBaseline(BASELINE_PATH);
  const breaches = evaluateAgainstBaseline(report.violations, baseline);

  if (isVerbose || breaches.length > 0) {
    reportViolations(report, isVerbose);
  }

  if (breaches.length > 0) {
    reportBreaches(breaches);
    console.log(`⏱️ Thời gian thực thi: ${process.uptime().toFixed(2)}s`);
    process.exit(1);
  }

  console.log(
    `✅ [check:dataset-integrity] Đạt bậc thang (duyệt: ${report.inspectedDatasets} dataset, ` +
      `nợ: ${report.violations.length}/${baseline.max_total_violations}, C1: ` +
      `${report.violations.filter((v) => v.skillCode.startsWith("C1.")).length}/0).`
  );
  console.log(`⏱️ Thời gian thực thi: ${process.uptime().toFixed(2)}s`);
}

if (process.argv[1]?.endsWith("check-dataset-integrity.ts")) {
  main();
}
