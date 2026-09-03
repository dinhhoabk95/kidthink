/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: analysis function */

/**
 * Spec sở hữu: docs/specs/05-content/lesson-template-variety.md
 * Rule sở hữu: BR-LTV-01..08
 *
 * Thư viện kiểm tra đa dạng khuôn trò chơi theo từng bài học.
 */

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
  exemptionsCount: number;
}

export interface LessonVarietyConfig {
  minDigitalGamesPerLesson: number; // 1
  minDistinctTemplatesIfCompetencyHasMultiple: number; // 2
}

export const DEFAULT_LESSON_VARIETY_CONFIG: LessonVarietyConfig = {
  minDigitalGamesPerLesson: 1,
  minDistinctTemplatesIfCompetencyHasMultiple: 2,
};

export function evaluateLessonVariety(
  lessons: LessonItem[],
  activities: ActivityItem[],
  gameLevels: GameLevelItem[],
  config: LessonVarietyConfig = DEFAULT_LESSON_VARIETY_CONFIG,
  exemptions: Set<string> = new Set()
): LessonVarietyReport {
  const activityMap = new Map<string, ActivityItem>();
  for (const act of activities) {
    activityMap.set(act.code, act);
  }

  const levelMap = new Map<string, GameLevelItem>();
  for (const gl of gameLevels) {
    if (gl.status === "published") {
      levelMap.set(gl.code, gl);
    }
  }

  // Count available templates per competency
  const templatesPerCompetency = new Map<string, Set<string>>();
  for (const gl of gameLevels) {
    if (gl.status === "published") {
      for (const sc of gl.skillCodes) {
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
  const digitalGamePerLesson: LessonVarietyReport["digitalGamePerLesson"] = {};
  let validCount = 0;

  for (const les of lessons) {
    if (les.status !== "published") {
      continue;
    }

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
      !exemptions.has(les.code)
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
        exemptions.has(les.code));

    if (isPassing) {
      validCount++;
    }

    digitalGamePerLesson[les.code] = {
      count: digitalCount,
      templates: dgTemplates,
      isPassing,
    };
  }

  return {
    passed: violations.length === 0,
    totalLessons: lessons.filter((l) => l.status === "published").length,
    validLessons: validCount,
    digitalGamePerLesson,
    violations,
    exemptionsCount: exemptions.size,
  };
}

export function formatLessonVarietyReport(report: LessonVarietyReport): string {
  const lines: string[] = [];
  lines.push(
    "================================================================================"
  );
  lines.push("[BÁO CÁO ĐA DẠNG KHUÔN TRÒ CHƠI TRONG BÀI HỌC]");
  lines.push("Đo sàn đa dạng khuôn theo bài học (BR-LTV-01..08)");
  lines.push(
    "================================================================================"
  );
  lines.push("");
  lines.push(
    `Tổng số bài học published: ${report.totalLessons} | Đạt chuẩn: ${report.validLessons}/${report.totalLessons}`
  );
  lines.push(`Miễn trừ đang hiệu lực: ${report.exemptionsCount}`);
  lines.push("");

  if (report.violations.length > 0) {
    lines.push("❌ VI PHẠM SÀN ĐA DẠNG KHUÔN BÀI HỌC (CHẶN PUBLISH / COMMIT):");
    for (const v of report.violations) {
      lines.push(`  - [${v.ruleId}] ${v.message}`);
    }
  } else {
    lines.push(
      "✅ Mọi bài học published đều đạt sàn đa dạng khuôn trò chơi (BR-LTV-01..08)."
    );
  }

  return lines.join("\n");
}
