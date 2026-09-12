#!/usr/bin/env node
/**
 * Cổng thẩm định hạt nhân nội dung (Task #271 LA).
 *
 * Chạy toàn bộ các cổng thẩm định (Gate 0..7, Montessori, Gate 8, Gate 9)
 * trên ALL_SEED_LEVELS kết hợp với SKILL_DATASETS.
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import { SKILL_DATASETS } from "@mindkid/content";
import { ALL_SEED_LEVELS } from "../catalog.js";
import { runEightGates } from "../gates/runner.js";
import type { GateIssue, GateResult } from "../types.js";

export const BASELINE_PATH = repoPath("scripts", "seed-gates-baseline.json");

export interface SeedGatesBaseline {
  readonly maxGate9Violations: number;
  readonly maxTotalViolations: number;
}

export interface SeedGatesReport {
  readonly totalLevels: number;
  readonly passedLevels: number;
  readonly failedLevels: number;
  readonly gateStats: Record<number, { name: string; failCount: number }>;
  readonly gate9Issues: Array<{
    levelCode: string;
    skillCode: string;
    issue: GateIssue;
  }>;
  readonly otherIssues: Array<{
    levelCode: string;
    gate: number;
    issue: GateIssue;
  }>;
}

export function readSeedGatesBaseline(): SeedGatesBaseline {
  if (!existsSync(BASELINE_PATH)) {
    return {
      maxGate9Violations: 0,
      maxTotalViolations: 0,
    };
  }
  const raw = JSON.parse(readFileSync(BASELINE_PATH, "utf-8")) as {
    maxGate9Violations?: number;
    maxTotalViolations?: number;
  };
  return {
    maxGate9Violations: raw.maxGate9Violations ?? 0,
    maxTotalViolations: raw.maxTotalViolations ?? 0,
  };
}

interface LevelIssueCollector {
  readonly gateStats: Record<number, { name: string; failCount: number }>;
  readonly gate9Issues: Array<{
    levelCode: string;
    skillCode: string;
    issue: GateIssue;
  }>;
  readonly otherIssues: Array<{
    levelCode: string;
    gate: number;
    issue: GateIssue;
  }>;
}

function recordGateIssues(
  g: GateResult,
  levelCode: string,
  primarySkill: string | undefined,
  collector: LevelIssueCollector
): boolean {
  let stat = collector.gateStats[g.gate];
  if (!stat) {
    stat = { name: g.name, failCount: 0 };
    collector.gateStats[g.gate] = stat;
  }
  if (g.passed) {
    return false;
  }
  stat.failCount += g.issues.length;
  for (const issue of g.issues) {
    if (g.gate === 9) {
      collector.gate9Issues.push({
        levelCode,
        skillCode: primarySkill ?? "UNKNOWN",
        issue,
      });
    } else {
      collector.otherIssues.push({
        levelCode,
        gate: g.gate,
        issue,
      });
    }
  }
  return true;
}

export function evaluateSeedGates(): SeedGatesReport {
  const existingCodes = new Set<string>();
  const collector: LevelIssueCollector = {
    gateStats: {},
    gate9Issues: [],
    otherIssues: [],
  };

  let failedLevels = 0;

  for (const level of ALL_SEED_LEVELS) {
    const primarySkill = level.header.skill_codes?.[0];
    const dataset = primarySkill ? SKILL_DATASETS[primarySkill] : undefined;
    const gates: GateResult[] = runEightGates(
      level,
      existingCodes,
      undefined,
      undefined,
      dataset
    );
    existingCodes.add(level.header.code);

    let levelHasIssue = false;
    for (const g of gates) {
      if (recordGateIssues(g, level.header.code, primarySkill, collector)) {
        levelHasIssue = true;
      }
    }

    if (levelHasIssue) {
      failedLevels++;
    }
  }

  return {
    totalLevels: ALL_SEED_LEVELS.length,
    passedLevels: ALL_SEED_LEVELS.length - failedLevels,
    failedLevels,
    gateStats: collector.gateStats,
    gate9Issues: collector.gate9Issues,
    otherIssues: collector.otherIssues,
  };
}

export function formatSeedGatesReport(
  report: SeedGatesReport,
  baseline: SeedGatesBaseline
): string {
  const lines: string[] = [
    "═════════════════════════════════════════════════════════════════",
    "             CỔNG THẨM ĐỊNH SEED GATES (Task #271 LA)            ",
    "═════════════════════════════════════════════════════════════════",
    `Tổng số level đã quét: ${report.totalLevels}`,
    `Số level đạt: ${report.passedLevels} · Số level trượt: ${report.failedLevels}`,
    "",
    "Thống kê theo từng Cổng:",
  ];

  const sortedGates = Object.keys(report.gateStats)
    .map((k) => Number(k))
    .sort((a, b) => a - b);

  for (const gateNum of sortedGates) {
    const stat = report.gateStats[gateNum];
    if (!stat) {
      continue;
    }
    const status =
      stat.failCount === 0 ? "✓ ĐẠT" : `✗ TRƯỢT (${stat.failCount} lỗi)`;
    lines.push(`  • Cổng ${gateNum} (${stat.name}): ${status}`);
  }

  if (report.gate9Issues.length > 0) {
    lines.push("");
    lines.push(
      `🚨 Vi phạm Cổng 9 (Khái niệm hiện ra) — ${report.gate9Issues.length} vi phạm (Trần: ${baseline.maxGate9Violations}):`
    );
    for (const item of report.gate9Issues.slice(0, 20)) {
      lines.push(
        `  - Level ${item.levelCode} (Skill ${item.skillCode}) [${item.issue.code}]: ${item.issue.message}`
      );
    }
    if (report.gate9Issues.length > 20) {
      lines.push(`  ... và ${report.gate9Issues.length - 20} vi phạm khác.`);
    }
  }

  const totalViolations = report.gate9Issues.length + report.otherIssues.length;
  lines.push("");
  if (
    report.gate9Issues.length <= baseline.maxGate9Violations &&
    totalViolations <= baseline.maxTotalViolations
  ) {
    lines.push(
      "✓ Toàn bộ seed levels đạt chuẩn các cổng (hoặc nằm trong hạn mức baseline)."
    );
  } else {
    lines.push(
      `✗ Phát hiện vi phạm vượt trần baseline (Gate 9: ${report.gate9Issues.length}/${baseline.maxGate9Violations}, Tổng: ${totalViolations}/${baseline.maxTotalViolations}).`
    );
  }
  lines.push(
    "═════════════════════════════════════════════════════════════════"
  );

  return lines.join("\n");
}

export function runSeedGatesCli(): number {
  const baseline = readSeedGatesBaseline();
  const report = evaluateSeedGates();
  console.log(formatSeedGatesReport(report, baseline));

  const totalViolations = report.gate9Issues.length + report.otherIssues.length;
  if (
    report.gate9Issues.length > baseline.maxGate9Violations ||
    totalViolations > baseline.maxTotalViolations
  ) {
    return 1;
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(runSeedGatesCli());
}
