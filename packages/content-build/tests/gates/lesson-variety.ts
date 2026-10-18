/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: analysis function */

/**
 * Spec sở hữu: docs/specs/05-content/lesson-template-variety.md
 * Rule sở hữu: BR-LTV-01..10
 *
 * Thư viện kiểm tra đa dạng khuôn trò chơi theo từng bài học.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export interface LessonItem {
  code: string;
  title: string;
  status: string;
  competencyCode?: string;
  skillCodes: string[];
  activityCodes: string[];
}

export interface ActivityItem {
  code: string;
  kind: string;
  refType?: string;
  refCode?: string;
  skillCodes?: string[];
}

export interface GameLevelItem {
  code: string;
  templateCode: string;
  skillCodes: string[];
  status: string;
}

export interface LessonVarietyExemption {
  lessonCode: string;
  skillCode: string;
  templateCode: string;
  recordedAt?: string;
}

export interface LessonVarietyViolation {
  ruleId: string;
  lessonCode: string;
  message: string;
  type: "error" | "warning";
}

export interface LessonVarietyReport {
  passed: boolean;
  totalLessons: number;
  validLessons: number;
  digitalGamePerLesson: Record<
    string,
    { count: number; templates: string[]; isPassing: boolean }
  >;
  violations: LessonVarietyViolation[];
  warnings: LessonVarietyViolation[];
  unreferencedTemplates: string[];
  orphanLevelCodes: string[];
  exemptionsCount: number;
}

export interface LessonVarietyConfig {
  minDigitalGamesPerLesson: number; // 1
  minDistinctTemplatesIfCompetencyHasMultiple: number; // 2
  exemptEngineTemplates?: string[];
}

export const DEFAULT_LESSON_VARIETY_CONFIG: LessonVarietyConfig = {
  minDigitalGamesPerLesson: 1,
  minDistinctTemplatesIfCompetencyHasMultiple: 2,
  exemptEngineTemplates: [
    "GT-000",
    "GT-033",
    "GT-034",
    "GT-035",
    "GT-036",
    "GT-037",
  ],
};

const DEFAULT_SPEC_PATH = fileURLToPath(
  new URL(
    "../../../../docs/specs/05-content/lesson-template-variety.md",
    import.meta.url
  )
);

const SEPARATOR_CELL_REGEX = /^[-:]+$/;
const EXEMPTION_SECTION_REGEX =
  /###\s+7\.4\s+Sổ miễn trừ([\s\S]*?)(?=\n##\s|\n###\s|$)/;

const cleanCell = (raw: string): string =>
  raw.trim().replace(/^`|`$/g, "").trim();

const isPlaceholderCell = (value: string): boolean =>
  value.length === 0 ||
  value === "—" ||
  value === "-" ||
  SEPARATOR_CELL_REGEX.test(value);

/**
 * BR-LTV-07: Đọc bảng Sổ miễn trừ tại mục 7.4 của spec lesson-template-variety.md.
 */
export function parseLessonVarietyExemptionLedger(
  markdown: string
): LessonVarietyExemption[] {
  const sectionMatch = markdown.match(EXEMPTION_SECTION_REGEX);
  if (!sectionMatch?.[1]) {
    return [];
  }

  const lines = sectionMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));

  const entries: LessonVarietyExemption[] = [];
  for (const line of lines) {
    const cells = line
      .slice(1, -1)
      .split("|")
      .map((cell) => cleanCell(cell));
    if (cells.length < 3) {
      continue;
    }
    const [lessonCode = "", skillCode = "", templateCode = "", recordedAt] =
      cells;
    if (
      lessonCode === "Bài học" ||
      (isPlaceholderCell(lessonCode) &&
        isPlaceholderCell(skillCode) &&
        isPlaceholderCell(templateCode))
    ) {
      continue;
    }

    entries.push({
      lessonCode: isPlaceholderCell(lessonCode) ? "" : lessonCode,
      skillCode: isPlaceholderCell(skillCode) ? "" : skillCode,
      templateCode: isPlaceholderCell(templateCode) ? "" : templateCode,
      ...(recordedAt && !isPlaceholderCell(recordedAt) ? { recordedAt } : {}),
    });
  }

  return entries;
}

export function loadLessonVarietyExemptionLedger(
  specPath: string = DEFAULT_SPEC_PATH
): LessonVarietyExemption[] {
  const markdown = readFileSync(specPath, "utf8");
  return parseLessonVarietyExemptionLedger(markdown);
}

export function evaluateLessonVariety(
  lessons: LessonItem[],
  activities: ActivityItem[],
  gameLevels: GameLevelItem[],
  config: LessonVarietyConfig = DEFAULT_LESSON_VARIETY_CONFIG,
  exemptions: Set<string> | LessonVarietyExemption[] = new Set()
): LessonVarietyReport {
  const activityMap = new Map<string, ActivityItem>();
  for (const act of activities) {
    activityMap.set(act.code, act);
  }

  const levelMap = new Map<string, GameLevelItem>();
  const templatesPerCompetency = new Map<string, Set<string>>();
  const templatesPerSkill = new Map<string, Set<string>>();
  const publishedTemplates = new Set<string>();

  for (const gl of gameLevels) {
    if (gl.status === "published") {
      levelMap.set(gl.code, gl);
      publishedTemplates.add(gl.templateCode);
      for (const sc of gl.skillCodes) {
        if (!templatesPerSkill.has(sc)) {
          templatesPerSkill.set(sc, new Set());
        }
        templatesPerSkill.get(sc)?.add(gl.templateCode);

        const comp = sc.split(".")[0];
        if (comp) {
          if (!templatesPerCompetency.has(comp)) {
            templatesPerCompetency.set(comp, new Set());
          }
          templatesPerCompetency.get(comp)?.add(gl.templateCode);
        }
      }
    }
  }

  const violations: LessonVarietyViolation[] = [];
  const warnings: LessonVarietyViolation[] = [];
  const exemptLessonCodes = new Set<string>();

  if (exemptions instanceof Set) {
    for (const code of exemptions) {
      exemptLessonCodes.add(code);
    }
  } else {
    for (const entry of exemptions) {
      if (!(entry.lessonCode && entry.skillCode && entry.templateCode)) {
        violations.push({
          ruleId: "BR-LTV-07",
          lessonCode: entry.lessonCode || "UNKNOWN",
          message: `Hàng miễn trừ trong mục 7.4 thiếu thông tin bắt buộc (bài học="${entry.lessonCode}", kỹ năng="${entry.skillCode}", khuôn="${entry.templateCode}").`,
          type: "error",
        });
        continue;
      }

      const skillTemplates =
        templatesPerSkill.get(entry.skillCode) ?? new Set();
      if (
        skillTemplates.size !== 1 ||
        !skillTemplates.has(entry.templateCode)
      ) {
        violations.push({
          ruleId: "BR-LTV-07",
          lessonCode: entry.lessonCode,
          message: `Miễn trừ của bài học ${entry.lessonCode} cho kỹ năng ${entry.skillCode} (${entry.templateCode}) không hợp lệ: kỹ năng hiện có ${skillTemplates.size} khuôn published [${[...skillTemplates].join(", ")}].`,
          type: "error",
        });
        continue;
      }

      exemptLessonCodes.add(entry.lessonCode);
    }
  }

  const digitalGamePerLesson: LessonVarietyReport["digitalGamePerLesson"] = {};
  const referencedTemplates = new Set<string>();
  const referencedLevelCodes = new Set<string>();
  let validCount = 0;
  let publishedLessonCount = 0;

  for (const les of lessons) {
    if (les.status !== "published") {
      continue;
    }
    publishedLessonCount++;

    const dgActivities: ActivityItem[] = [];
    const dgTemplates: string[] = [];
    const usedTemplateSet = new Set<string>();

    for (const actCode of les.activityCodes) {
      const act = activityMap.get(actCode);
      if (act && act.kind === "digital_game") {
        dgActivities.push(act);
        if (act.refType === "game_level" && act.refCode) {
          const gl = levelMap.get(act.refCode);
          if (gl) {
            dgTemplates.push(gl.templateCode);
            usedTemplateSet.add(gl.templateCode);
            referencedTemplates.add(gl.templateCode);
            referencedLevelCodes.add(gl.code);

            // BR-LTV-04: Skill alignment (same skill or same competency cluster)
            const hasCommonSkill = gl.skillCodes.some((sc) =>
              les.skillCodes.some(
                (lsc) => sc === lsc || sc.split(".")[0] === lsc.split(".")[0]
              )
            );
            if (!hasCommonSkill && les.skillCodes.length > 0) {
              violations.push({
                ruleId: "BR-LTV-04",
                lessonCode: les.code,
                message: `Bước chơi ${act.code} (${gl.code}) có kỹ năng [${gl.skillCodes.join(", ")}] không khớp với bài học [${les.skillCodes.join(", ")}]`,
                type: "error",
              });
            }
          }
        }
      }
    }

    const digitalCount = dgActivities.length;
    const distinctTemplatesCount = usedTemplateSet.size;

    // BR-LTV-01: At least 1 digital game
    if (digitalCount < config.minDigitalGamesPerLesson) {
      violations.push({
        ruleId: "BR-LTV-01",
        lessonCode: les.code,
        message: `Bài học ${les.code} có 0 bước chơi số (sàn: ${config.minDigitalGamesPerLesson}).`,
        type: "error",
      });
    }

    // BR-LTV-02: Distinct templates if >= 2 digital games
    if (digitalCount >= 2 && distinctTemplatesCount < digitalCount) {
      violations.push({
        ruleId: "BR-LTV-02",
        lessonCode: les.code,
        message: `Bài học ${les.code} có ${digitalCount} bước chơi số nhưng chỉ dùng ${distinctTemplatesCount} khuôn (${dgTemplates.join(", ")}). Phải dùng khuôn khác nhau.`,
        type: "error",
      });
    }

    // BR-LTV-03: Competency has >= 2 templates -> Lesson must have >= 2 templates
    const comp =
      les.competencyCode ||
      (les.skillCodes[0] ? les.skillCodes[0].split(".")[0] : undefined);
    const compAvailableTemplates = comp
      ? templatesPerCompetency.get(comp)?.size || 0
      : 0;

    if (
      compAvailableTemplates >= 2 &&
      distinctTemplatesCount <
        config.minDistinctTemplatesIfCompetencyHasMultiple &&
      !exemptLessonCodes.has(les.code)
    ) {
      violations.push({
        ruleId: "BR-LTV-03",
        lessonCode: les.code,
        message: `Năng lực ${comp} có ${compAvailableTemplates} khuôn nhưng bài học ${les.code} chỉ có ${distinctTemplatesCount} khuôn (sàn: ${config.minDistinctTemplatesIfCompetencyHasMultiple}).`,
        type: "error",
      });
    }

    const isPassing =
      digitalCount >= config.minDigitalGamesPerLesson &&
      (digitalCount < 2 || distinctTemplatesCount === digitalCount) &&
      (compAvailableTemplates < 2 ||
        distinctTemplatesCount >=
          config.minDistinctTemplatesIfCompetencyHasMultiple ||
        exemptLessonCodes.has(les.code));

    if (isPassing) {
      validCount++;
    }

    digitalGamePerLesson[les.code] = {
      count: digitalCount,
      templates: dgTemplates,
      isPassing,
    };
  }

  const unreferencedTemplates: string[] = [];
  const orphanLevelCodes: string[] = [];
  const exemptEngines = new Set(config.exemptEngineTemplates ?? []);

  if (publishedLessonCount > 0) {
    // BR-LTV-09: Every active engine with published game levels must be referenced by >= 1 published lesson
    for (const templateCode of [...publishedTemplates].sort()) {
      if (exemptEngines.has(templateCode)) {
        continue;
      }
      if (!referencedTemplates.has(templateCode)) {
        unreferencedTemplates.push(templateCode);
        violations.push({
          ruleId: "BR-LTV-09",
          lessonCode: templateCode,
          message: `Khuôn trò chơi ${templateCode} có game level published nhưng không có bài học published nào trỏ tới.`,
          type: "error",
        });
      }
    }

    // BR-LTV-10: Warn when a published game level is not referenced by any published lesson
    for (const gl of gameLevels) {
      if (gl.status !== "published") {
        continue;
      }
      if (!referencedLevelCodes.has(gl.code)) {
        orphanLevelCodes.push(gl.code);
        warnings.push({
          ruleId: "BR-LTV-10",
          lessonCode: gl.code,
          message: `Màn chơi ${gl.code} (${gl.templateCode}) đã published nhưng chưa có bài học nào trỏ tới (chỉ vào được qua danh mục).`,
          type: "warning",
        });
      }
    }
  }

  return {
    passed: violations.length === 0,
    totalLessons: publishedLessonCount,
    validLessons: validCount,
    digitalGamePerLesson,
    violations,
    warnings,
    unreferencedTemplates,
    orphanLevelCodes,
    exemptionsCount: exemptLessonCodes.size,
  };
}

export function formatLessonVarietyReport(report: LessonVarietyReport): string {
  const lines: string[] = [];
  lines.push(
    "================================================================================"
  );
  lines.push("[BÁO CÁO ĐA DẠNG KHUÔN TRÒ CHƠI TRONG BÀI HỌC]");
  lines.push("Đo sàn đa dạng khuôn theo bài học (BR-LTV-01..10)");
  lines.push(
    "================================================================================"
  );
  lines.push("");
  lines.push(
    `Tổng số bài học published: ${report.totalLessons} | Đạt chuẩn: ${report.validLessons}/${report.totalLessons}`
  );
  lines.push(`Miễn trừ đang hiệu lực: ${report.exemptionsCount}`);
  lines.push(
    `Cảnh báo màn chơi chưa nối bài học (BR-LTV-10): ${report.warnings.length}`
  );
  lines.push("");

  if (report.violations.length > 0) {
    lines.push("❌ VI PHẠM SÀN ĐA DẠNG KHUÔN BÀI HỌC (CHẶN PUBLISH / COMMIT):");
    for (const v of report.violations) {
      lines.push(`  - [${v.ruleId}] ${v.message}`);
    }
  } else {
    lines.push(
      "✅ Mọi bài học published đều đạt sàn đa dạng khuôn trò chơi (BR-LTV-01..10)."
    );
  }

  return lines.join("\n");
}
