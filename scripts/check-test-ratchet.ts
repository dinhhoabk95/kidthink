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

interface TestBaseline {
  failedFiles: string[];
  totalFailed: number;
}

function parseArgs(): { isUpdate: boolean; reportPath: string | null } {
  const args = process.argv.slice(2);
  let isUpdate = false;
  let reportPath: string | null = null;

  for (const arg of args) {
    if (arg === "--update") {
      isUpdate = true;
    } else if (arg.startsWith("--report=")) {
      reportPath = arg.slice("--report=".length);
    }
  }

  return { isUpdate, reportPath };
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

function updateBaseline(baselinePath: string, failedFiles: string[]): void {
  const updatedBaseline: TestBaseline = {
    totalFailed: failedFiles.length,
    failedFiles,
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

function verifyAgainstBaseline(
  baselineData: TestBaseline,
  failedFiles: string[]
): void {
  const baselineFilesSet = new Set<string>(baselineData.failedFiles || []);
  const newFailedFiles = failedFiles.filter(
    (file: string) => !baselineFilesSet.has(file)
  );

  console.log("\n📊 Kết quả kiểm tra Test Ratchet:");
  console.log(`   - Tổng số file test đỏ hiện tại: ${failedFiles.length}`);
  console.log(`   - Baseline cho phép: ${baselineData.totalFailed}`);

  if (newFailedFiles.length > 0) {
    console.error(
      `\n✗ Test ratchet THẤT BẠI: Phát hiện ${newFailedFiles.length} file test đỏ MỚI không nằm trong baseline:`
    );
    for (const file of newFailedFiles) {
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

function main(): void {
  const { isUpdate, reportPath: passedReportPath } = parseArgs();
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

    if (isUpdate) {
      updateBaseline(baselinePath, failedFiles);
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
    verifyAgainstBaseline(baselineData, failedFiles);
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

main();
