#!/usr/bin/env node
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import { ALL_ROADMAPS } from "@mindkid/content";
import { findDebtIncreases } from "#src/gates/level-demand";
import { SHIPPABLE_SEED_LEVELS } from "../catalog.js";
import {
  type ContentDemandLedger,
  type DemandLevel,
  deriveContentDemand,
  findBandMismatches,
  listPracticeCellsWithoutTemplate,
  serializeContentDemand,
} from "../gates/content-demand.js";
import {
  CONTENT_DEMAND_PATH,
  parseContentDemand,
} from "../gates/content-demand-file.js";

import {
  evaluateAuthoredRoadmaps,
  loadDifficultyMaxByBand,
} from "../gates/roadmap-seed-runner.js";
import { buildSkillTemplateAffinityMatrix } from "../gates/skill-template-affinity.js";

function collectLevels(): DemandLevel[] {
  return SHIPPABLE_SEED_LEVELS.map((level) => ({
    code: level.header.code,
    skill_codes: level.header.skill_codes,
    age_min: level.header.age_min,
    age_max: level.header.age_max,
    difficulty: level.header.difficulty,
  }));
}

export function computeContentDemand(): ContentDemandLedger {
  return deriveContentDemand({
    roadmaps: ALL_ROADMAPS,
    affinities: buildSkillTemplateAffinityMatrix().affinities,
    levels: collectLevels(),
    difficultyMaxByBand: loadDifficultyMaxByBand(),
  });
}

function canonical(text: string): string {
  return JSON.stringify(JSON.parse(text));
}

function printSummary(ledger: ContentDemandLedger): void {
  for (const row of ledger.summary) {
    console.log(
      `${row.roadmap_code} v${row.roadmap_version}: ${row.filled_cells}/${row.cells} ô đã lấp, nợ ${row.debt_cells}`
    );
  }
}

function reportBandMismatches(
  ledger: ContentDemandLedger,
  label: string
): number {
  const mismatches = findBandMismatches(ledger, collectLevels());
  for (const m of mismatches) {
    console.error(
      `❌ ${label}: ${m.content_code} đứng ở ${m.roadmap_code} tuần ${m.week_no} tiết ${m.session_no} nhưng ${m.reason === "unknown_content" ? "không có trong kho" : `không phủ band ${m.band}`} (BR-LRM-04)`
    );
  }
  return mismatches.length;
}

function reportDebtIncreases(
  committedText: string,
  derived: ContentDemandLedger
): boolean {
  const increases = findDebtIncreases(
    parseContentDemand(committedText),
    derived
  );
  for (const item of increases) {
    console.error(
      `❌ ${item.roadmap_code}: nợ tăng ${item.before} → ${item.after} ô so với sổ cầu đã commit (BR-LRM-09)`
    );
  }
  return increases.length > 0;
}

function checkCommittedLedger(
  target: string,
  ledger: ContentDemandLedger
): number {
  const committedText = fs.existsSync(target)
    ? fs.readFileSync(target, "utf8")
    : "";
  if (committedText !== "") {
    const committedLedger = parseContentDemand(committedText);
    if (reportBandMismatches(committedLedger, "sổ cầu đã commit") > 0) {
      return 1;
    }
    if (reportDebtIncreases(committedText, ledger)) {
      return 1;
    }
  }
  const committed = committedText === "" ? "" : canonical(committedText);
  if (committed !== JSON.stringify(ledger)) {
    console.error(
      "❌ content-demand.json lệch lộ trình hoặc kho — chạy `pnpm derive:demand` rồi commit"
    );
    return 1;
  }
  console.log("✅ content-demand.json khớp lộ trình");
  return 0;
}

export function runDeriveDemand(options: { check: boolean }): number {
  const failing = evaluateAuthoredRoadmaps().filter((row) => !row.passed);
  if (failing.length > 0) {
    console.error(
      `❌ Lộ trình đỏ, không suy sổ cầu: ${failing.map((row) => row.program_code).join(", ")}`
    );
    return 1;
  }

  const ledger = computeContentDemand();
  const missingTemplate = listPracticeCellsWithoutTemplate(ledger);
  if (missingTemplate.length > 0) {
    for (const cell of missingTemplate) {
      console.error(
        `❌ Ô ${cell.roadmap_code} tuần ${cell.week_no} tiết ${cell.session_no} (${cell.skill_code}) không có khuôn hợp lệ`
      );
    }
    return 1;
  }

  const target = repoPath(CONTENT_DEMAND_PATH);
  printSummary(ledger);
  if (reportBandMismatches(ledger, "sổ cầu suy ra") > 0) {
    return 1;
  }
  if (options.check) {
    return checkCommittedLedger(target, ledger);
  }
  fs.writeFileSync(target, serializeContentDemand(ledger));
  console.log(`Đã ghi ${CONTENT_DEMAND_PATH}`);
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runDeriveDemand({ check: process.argv.includes("--check") }));
}
