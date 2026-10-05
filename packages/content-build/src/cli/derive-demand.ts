#!/usr/bin/env node
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import { ALL_ROADMAPS } from "@mindkid/content";
import {
  ALL_SEED_ACTIVITIES,
  ALL_SEED_LESSONS,
  SHIPPABLE_SEED_LEVELS,
} from "../catalog.js";
import {
  type ContentDemandLedger,
  type DemandLesson,
  type DemandLevel,
  deriveContentDemand,
  listPracticeCellsWithoutTemplate,
  serializeContentDemand,
} from "../gates/content-demand.js";
import {
  evaluateAuthoredRoadmaps,
  loadDifficultyMaxByBand,
} from "../gates/roadmap-seed-runner.js";
import { buildSkillTemplateAffinityMatrix } from "../gates/skill-template-affinity.js";

export const CONTENT_DEMAND_PATH =
  "packages/content/src/roadmaps/content-demand.json";

function collectLessons(): DemandLesson[] {
  const offlineActivities = new Set(
    ALL_SEED_ACTIVITIES.filter(
      (activity) => activity.header.activity_kind !== "digital_game"
    ).map((activity) => activity.header.code)
  );
  return ALL_SEED_LESSONS.map((lesson) => ({
    code: lesson.header.code,
    skill_codes: lesson.header.skill_codes,
    age_min: lesson.header.target_age_min,
    age_max: lesson.header.target_age_max,
    has_offline_activity: lesson.header.activity_codes.some((code) =>
      offlineActivities.has(code)
    ),
  }));
}

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
    lessons: collectLessons(),
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
  if (options.check) {
    const committed = fs.existsSync(target)
      ? canonical(fs.readFileSync(target, "utf8"))
      : "";
    if (committed !== JSON.stringify(ledger)) {
      console.error(
        "❌ content-demand.json lệch lộ trình hoặc kho — chạy `pnpm derive:demand` rồi commit"
      );
      return 1;
    }
    console.log("✅ content-demand.json khớp lộ trình");
    return 0;
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
