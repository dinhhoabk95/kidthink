/**
 * Cổng TEST RATCHET — Đo toàn bộ test suite của monorepo và kiểm soát nợ test.
 *
 *   pnpm check:test-ratchet             # Chạy vitest và đối chiếu baseline
 *   pnpm check:test-ratchet --update    # Cập nhật baseline khi nợ giảm
 *   pnpm check:test-ratchet --report=<file> # Đối chiếu từ report có sẵn
 *
 * Nguyên tắc ratchet: Số file test đỏ CHỈ ĐƯỢC GIẢM HOẶC GIỮ NGUYÊN.
 * Bất kỳ file test nào mới bị đỏ sẽ làm cổng thất bại (exit 1).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

interface VitestAssertionResult {
  ancestorTitles: string[];
  duration: number;
  failureMessages: string[];
  fullName: string;
  status: string;
  title: string;
}

interface VitestSuiteResult {
  assertionResults: VitestAssertionResult[];
  endTime: number;
  message: string;
  name: string;
  startTime: number;
  status: "passed" | "failed" | "skipped" | "pending";
}

interface VitestJsonReport {
  numFailedTestSuites: number;
  numPassedTestSuites: number;
  numTotalTestSuites: number;
  testResults: VitestSuiteResult[];
}

export interface TestBaseline {
  failedFiles: string[];
  totalFailed: number;
  /**
   * Sàn số test suite phải chạy. Không có sàn này, xoá một file test, đổi nó
   * thành `describe.skip`, hay để cả một project lỗi collection đều làm file
   * rơi khỏi `failedFiles` và cổng xanh hơn — nợ giảm giả.
   */
  minTotalSuites?: number;
}

export interface RatchetVerdict {
  readonly ok: boolean;
  readonly newFailedFiles: readonly string[];
  readonly missingSuites: number;
  readonly reasons: readonly string[];
}

function parseArgs(): {
  isUpdate: boolean;
  isForce: boolean;
  reportPath: string | null;
} {
  const args = process.argv.slice(2);
  let isUpdate = false;
  let isForce = false;
  let reportPath: string | null = null;

  for (const arg of args) {
    if (arg === "--update") {
      isUpdate = true;
    } else if (arg === "--force") {
      isForce = true;
    } else if (arg.startsWith("--report=")) {
      reportPath = arg.slice("--report=".length);
    }
  }

  return { isUpdate, isForce, reportPath };
}

function reportVerdictReasons(
  baselineData: TestBaseline,
  failedFiles: readonly string[],
  totalSuites: number
): void {
  const verdict = verifyAgainstBaseline(baselineData, failedFiles, totalSuites);
  for (const reason of verdict.reasons) {
    console.error(`     • ${reason}`);
  }
  for (const file of verdict.newFailedFiles) {
    console.error(`     • đỏ mới: ${file}`);
  }
  if (failedFiles.length > (baselineData.totalFailed ?? 0)) {
    console.error(
      `     • tổng file đỏ tăng: ${baselineData.totalFailed} → ${failedFiles.length}`
    );
  }
}

function runVitestAndGetReport(): string {
  const tempReportPath = path.join(
    os.tmpdir(),
    `vitest-ratchet-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  );

  console.log("▸ Đang chạy toàn bộ test suite repo (không --bail)...");
  spawnSync(
    "pnpm",
    [
      "exec",
      "vitest",
      "run",
      "--reporter=json",
      `--outputFile=${tempReportPath}`,
    ],
    {
      cwd: REPO_ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_OPTIONS: "--max-old-space-size=4096",
      },
    }
  );

  return tempReportPath;
}

function extractFailedFiles(report: VitestJsonReport): string[] {
  const rawFiles = (report.testResults || [])
    .filter((suite: VitestSuiteResult) => suite.status === "failed")
    .map((suite: VitestSuiteResult) =>
      path.relative(REPO_ROOT, suite.name).replace(/\\/g, "/")
    );

  const uniqueFiles: string[] = [];
  for (const file of rawFiles) {
    if (!uniqueFiles.includes(file)) {
      uniqueFiles.push(file);
    }
  }

  return uniqueFiles.sort();
}

function updateBaseline(
  baselinePath: string,
  failedFiles: string[],
  totalSuites: number
): void {
  const updatedBaseline: TestBaseline = {
    totalFailed: failedFiles.length,
    failedFiles,
    minTotalSuites: totalSuites,
  };
  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify(updatedBaseline, null, 2)}\n`,
    "utf8"
  );
  console.log(
    `✅ Đã cập nhật ${path.relative(REPO_ROOT, baselinePath)}: ${failedFiles.length} file đỏ.`
  );
}

export function verifyAgainstBaseline(
  baselineData: TestBaseline,
  failedFiles: readonly string[],
  totalSuites: number
): RatchetVerdict {
  const baselineFilesSet = new Set<string>(baselineData.failedFiles || []);
  const newFailedFiles = failedFiles.filter(
    (file: string) => !baselineFilesSet.has(file)
  );
  const minTotalSuites = baselineData.minTotalSuites ?? 0;
  const missingSuites = Math.max(0, minTotalSuites - totalSuites);
  const reasons: string[] = [];

  if (newFailedFiles.length > 0) {
    reasons.push(
      `${newFailedFiles.length} file test đỏ MỚI không nằm trong baseline`
    );
  }
  if (missingSuites > 0) {
    reasons.push(
      `số suite chạy được tụt từ ${minTotalSuites} xuống ${totalSuites} (thiếu ${missingSuites})`
    );
  }

  return {
    ok: reasons.length === 0,
    newFailedFiles,
    missingSuites,
    reasons,
  };
}

/** Ratchet chỉ được siết: --update từ chối ghi khi nợ xấu hơn baseline. */
export function isLoosening(
  baselineData: TestBaseline,
  failedFiles: readonly string[],
  totalSuites: number
): boolean {
  const verdict = verifyAgainstBaseline(baselineData, failedFiles, totalSuites);
  return !verdict.ok || failedFiles.length > (baselineData.totalFailed ?? 0);
}

function reportVerdict(
  baselineData: TestBaseline,
  failedFiles: readonly string[],
  totalSuites: number
): void {
  const verdict = verifyAgainstBaseline(baselineData, failedFiles, totalSuites);

  console.log("\n📊 Kết quả kiểm tra Test Ratchet:");
  console.log(`   - Tổng số file test đỏ hiện tại: ${failedFiles.length}`);
  console.log(`   - Baseline cho phép: ${baselineData.totalFailed}`);
  console.log(
    `   - Suite chạy được: ${totalSuites} (sàn: ${baselineData.minTotalSuites ?? 0})`
  );

  if (!verdict.ok) {
    console.error(`\n✗ Test ratchet THẤT BẠI: ${verdict.reasons.join("; ")}`);
    for (const file of verdict.newFailedFiles) {
      console.error(`     • ${file}`);
    }
    process.exit(1);
  }

  if (failedFiles.length < baselineData.totalFailed) {
    console.log(
      `\n🎉 Tiến bộ! Số file test đỏ đã giảm từ ${baselineData.totalFailed} xuống ${failedFiles.length}.`
    );
    console.log(
      "   Hãy chạy 'pnpm check:test-ratchet:update' để hạ ngưỡng baseline."
    );
  } else {
    console.log(
      `\n✅ Cổng xanh: Không có file test đỏ mới (${failedFiles.length}/${baselineData.totalFailed}).`
    );
  }
}

/**
 * Ghi baseline mới. Ratchet chỉ được siết: từ chối khi trạng thái xấu hơn,
 * trừ khi người chạy nói rõ `--force`.
 */
function runUpdate(
  baselinePath: string,
  failedFiles: string[],
  totalSuites: number,
  isForce: boolean
): void {
  if (fs.existsSync(baselinePath) && !isForce) {
    const previous = JSON.parse(
      fs.readFileSync(baselinePath, "utf8")
    ) as TestBaseline;
    if (isLoosening(previous, failedFiles, totalSuites)) {
      console.error(
        "\n✗ Từ chối nới baseline: trạng thái hiện tại xấu hơn baseline."
      );
      reportVerdictReasons(previous, failedFiles, totalSuites);
      console.error(
        "  Sửa test đỏ mới, hoặc chạy lại với --force nếu thật sự muốn nới."
      );
      process.exit(1);
    }
  }
  updateBaseline(baselinePath, failedFiles, totalSuites);
}

function main(): void {
  const { isUpdate, isForce, reportPath: passedReportPath } = parseArgs();
  const baselinePath = path.join(REPO_ROOT, "scripts/test-baseline.json");

  let reportFile = passedReportPath;
  let shouldCleanupTemp = false;

  if (!reportFile) {
    reportFile = runVitestAndGetReport();
    shouldCleanupTemp = true;
  }

  if (!fs.existsSync(reportFile)) {
    console.error(`✗ Không tìm thấy file báo cáo vitest: ${reportFile}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(reportFile, "utf8");
    const report = JSON.parse(rawData) as VitestJsonReport;
    const failedFiles = extractFailedFiles(report);

    const totalSuites = report.numTotalTestSuites ?? 0;

    if (isUpdate) {
      runUpdate(baselinePath, failedFiles, totalSuites, isForce);
      process.exit(0);
    }

    if (!fs.existsSync(baselinePath)) {
      console.error(
        `✗ Không tìm thấy file baseline: ${baselinePath}. Chạy với '--update' để tạo.`
      );
      process.exit(1);
    }

    const baselineData = JSON.parse(
      fs.readFileSync(baselinePath, "utf8")
    ) as TestBaseline;
    reportVerdict(baselineData, failedFiles, totalSuites);
  } finally {
    if (shouldCleanupTemp && reportFile && fs.existsSync(reportFile)) {
      try {
        fs.unlinkSync(reportFile);
      } catch {
        // bỏ qua lỗi xoá file tạm
      }
    }
  }
}

if (process.argv[1]?.includes("check-test-ratchet")) {
  main();
}
