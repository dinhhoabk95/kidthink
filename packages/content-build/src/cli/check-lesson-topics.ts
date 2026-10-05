#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import {
  ALL_SEED_ACTIVITIES,
  ALL_SEED_LESSONS,
  ALL_SEED_LEVELS,
} from "#src/catalog";
import { loadContentDemandLedger } from "#src/gates/content-demand-file";
import {
  evaluateLessonTopics,
  type LessonTopicsActivity,
  type LessonTopicsInput,
  type LessonTopicsReport,
  type LessonTopicsRule,
} from "#src/gates/lesson-topics";
import { buildSkillTemplateAffinityMatrix } from "#src/gates/skill-template-affinity";

const PRINT_LIMIT_PER_RULE = 5;

function levelTemplateByCode(): Map<string, string> {
  return new Map(
    ALL_SEED_LEVELS.map((level) => [
      level.header.code,
      level.header.template_code,
    ])
  );
}

function collectActivities(): Map<string, LessonTopicsActivity> {
  const templates = levelTemplateByCode();
  return new Map(
    ALL_SEED_ACTIVITIES.map((activity) => {
      const { header } = activity;
      const template =
        header.activity_kind === "digital_game" && header.ref_code
          ? templates.get(header.ref_code)
          : undefined;
      return [
        header.code,
        {
          code: header.code,
          skill_codes: header.skill_codes,
          template_code: template,
        },
      ];
    })
  );
}

function offscreenLessonCodes(): Set<string> {
  const ledger = loadContentDemandLedger();
  return new Set(
    ledger.cells
      .filter((cell) => cell.role === "offscreen")
      .flatMap((cell) => cell.filled_by)
  );
}

export function buildLessonTopicsInput(): LessonTopicsInput {
  const offscreen = offscreenLessonCodes();
  return {
    lessons: ALL_SEED_LESSONS.map(({ header }) => ({
      code: header.code,
      skill_codes: header.skill_codes,
      activity_codes: header.activity_codes,
      topics: header.topics ?? [],
      offscreen: offscreen.has(header.code),
    })),
    activities: collectActivities(),
    affinities: buildSkillTemplateAffinityMatrix().affinities,
  };
}

function countByRule(
  report: LessonTopicsReport
): Map<LessonTopicsRule, number> {
  const counts = new Map<LessonTopicsRule, number>();
  for (const found of report.violations) {
    counts.set(found.rule, (counts.get(found.rule) ?? 0) + 1);
  }
  return counts;
}

function printReport(report: LessonTopicsReport): void {
  const { summary } = report;
  console.log(
    `Bài: ${summary.lessons} · chưa khai topics[]: ${summary.lessons_without_topics} · khai đúng 1 chủ đề: ${summary.lessons_with_one_topic}`
  );
  console.log(
    `Hoạt động mỗi bài: ${summary.activity_count_min}..${summary.activity_count_max} · khuôn riêng biệt mỗi bài: ${summary.lesson_template_count_min}..${summary.lesson_template_count_max}`
  );
  const counts = countByRule(report);
  for (const rule of [...counts.keys()].sort()) {
    console.error(`❌ ${rule}: ${counts.get(rule)} vi phạm`);
    const shown = report.violations
      .filter((found) => found.rule === rule)
      .slice(0, PRINT_LIMIT_PER_RULE);
    for (const found of shown) {
      console.error(`   ${found.lesson_code}: ${found.detail}`);
    }
  }
}

export function runLessonTopicsGate(): number {
  const report = evaluateLessonTopics(buildLessonTopicsInput());
  printReport(report);
  if (report.violations.length > 0) {
    return 1;
  }
  console.log("✅ Bố cục bài đạt BR-LTC-01/03/04/05/06/07/09");
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runLessonTopicsGate());
}
