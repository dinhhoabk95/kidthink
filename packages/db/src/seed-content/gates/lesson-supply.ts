/**
 * Spec sở hữu: docs/specs/05-content/lesson-corpus-depth.md
 * Rules: BR-LCD-01..11, BR-LFM-01, BR-LFM-05
 */

import type { ContentSeed, LessonSeed } from "#src/seed-content/types";
import type { MvpCurriculumConfig } from "#src/seed-master/curricula";

export interface LessonSupplyMetrics {
  maxDemandSessions: number;
  longestFlowCode: string;
  publishedLessonCount: number;
  missingLessonCount: number;
  totalUniqueSkills: number;
  skillsWithZeroLevels: string[];
  skillsWithOneLevel: string[];
  skillsWithSufficientLevels: string[];
  levelsNeeded: number;
  flowViolations: Array<{
    curriculumCode: string;
    reason: string;
  }>;
}

export interface LessonSupplyEvaluation {
  metrics: LessonSupplyMetrics;
  isPassed: boolean;
  violations: string[];
}

export interface LessonSupplyInput {
  curriculaConfigs: MvpCurriculumConfig[];
  lessons: LessonSeed[];
  gameLevels: ContentSeed<unknown, unknown>[];
  flowLessonAssignments?: Record<string, string[]>; // Map curriculum_code -> array of lesson_codes
}

function calculateFlowDemand(publishedCurricula: MvpCurriculumConfig[]): {
  maxDemandSessions: number;
  longestFlowCode: string;
} {
  let maxDemandSessions = 0;
  let longestFlowCode = "";

  for (const cur of publishedCurricula) {
    const demand = cur.durationWeeks * cur.sessionsPerWeek;
    if (demand > maxDemandSessions) {
      maxDemandSessions = demand;
      longestFlowCode = cur.code;
    }
  }

  return { maxDemandSessions, longestFlowCode };
}

function checkFlowLessonAssignments(
  flowLessonAssignments: Record<string, string[]>
): Array<{ curriculumCode: string; reason: string }> {
  const violations: Array<{ curriculumCode: string; reason: string }> = [];

  for (const [curCode, assignedLessons] of Object.entries(
    flowLessonAssignments
  )) {
    const seen = new Set<string>();
    for (const lCode of assignedLessons) {
      if (!lCode || lCode.trim() === "") {
        violations.push({
          curriculumCode: curCode,
          reason: "BR-LCD-04: Flow chứa tiết trống không có lesson.",
        });
      }
      if (seen.has(lCode)) {
        violations.push({
          curriculumCode: curCode,
          reason: `BR-LCD-05: Flow ${curCode} bị lặp lại lesson ${lCode} trong cùng một flow.`,
        });
      }
      seen.add(lCode);
    }
  }

  return violations;
}

/**
 * Đếm số level published cho từng kỹ năng mà thư viện tiết đang nhắm tới.
 *
 * `skill_codes` là trường THẬT trên header seed, và nó là **một mảng**: một
 * tiết có thể nhắm nhiều kỹ năng. Bản cũ đọc `les.metadata.target_skill_code`
 * — `metadata` không tồn tại trên `LessonSeed` — nên tập kỹ năng luôn rỗng và
 * `min_levels_per_skill` là luật không thể vi phạm.
 *
 * Seed trong repo đều là nội dung đã xuất bản theo định nghĩa: không có trường
 * `status` để lọc, và lọc theo một trường không tồn tại thì cho ra 0.
 */
export function computeSkillLevelCoverage(
  lessons: LessonSeed[],
  gameLevels: ContentSeed<unknown, unknown>[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const les of lessons) {
    for (const sk of les.header.skill_codes) {
      counts.set(sk, 0);
    }
  }
  for (const gl of gameLevels) {
    for (const glSkill of gl.header.skill_codes) {
      if (counts.has(glSkill)) {
        counts.set(glSkill, (counts.get(glSkill) ?? 0) + 1);
      }
    }
  }
  return counts;
}

function evaluateSkillLevels(
  publishedLessons: LessonSeed[],
  gameLevels: ContentSeed<unknown, unknown>[]
) {
  const skillLevelCounts = computeSkillLevelCoverage(
    publishedLessons,
    gameLevels
  );

  const skillsWithZeroLevels: string[] = [];
  const skillsWithOneLevel: string[] = [];
  const skillsWithSufficientLevels: string[] = [];
  let levelsNeeded = 0;

  for (const [sk, count] of skillLevelCounts.entries()) {
    if (count === 0) {
      skillsWithZeroLevels.push(sk);
      levelsNeeded += 2;
    } else if (count === 1) {
      skillsWithOneLevel.push(sk);
      levelsNeeded += 1;
    } else {
      skillsWithSufficientLevels.push(sk);
    }
  }

  return {
    totalUniqueSkills: skillLevelCounts.size,
    skillsWithZeroLevels,
    skillsWithOneLevel,
    skillsWithSufficientLevels,
    levelsNeeded,
  };
}

/**
 * Đánh giá cung cầu giáo án theo BR-LCD-01..11
 */
export function evaluateLessonSupply(
  input: LessonSupplyInput
): LessonSupplyEvaluation {
  const {
    curriculaConfigs,
    lessons,
    gameLevels,
    flowLessonAssignments = {},
  } = input;
  const violations: string[] = [];

  // BR-LCD-06: Nguồn không đọc được / rỗng -> đỏ, cấm giá trị mặc định
  if (!curriculaConfigs || curriculaConfigs.length === 0) {
    return {
      metrics: {
        maxDemandSessions: 0,
        longestFlowCode: "NONE",
        publishedLessonCount: 0,
        missingLessonCount: 0,
        totalUniqueSkills: 0,
        skillsWithZeroLevels: [],
        skillsWithOneLevel: [],
        skillsWithSufficientLevels: [],
        levelsNeeded: 0,
        flowViolations: [],
      },
      isPassed: false,
      violations: [
        "BR-LCD-06: Nguồn chương trình curriculaConfigs rỗng hoặc không đọc được.",
      ],
    };
  }

  // 1. Tính cầu tiết: max(durationWeeks * sessionsPerWeek) (BR-LCD-02, BR-LCD-03)
  const publishedCurricula = curriculaConfigs.filter(
    (c) => c.status === "published"
  );
  if (publishedCurricula.length === 0) {
    violations.push(
      "BR-LCD-03: Không có chương trình nào ở trạng thái published."
    );
  }

  const { maxDemandSessions, longestFlowCode } =
    calculateFlowDemand(publishedCurricula);

  // 2. Đếm cung tiết (BR-LCD-03)
  // Seed repo = đã xuất bản. `LessonSeedHeader` không có `status`.
  const publishedLessons = lessons;
  const publishedLessonCount = publishedLessons.length;
  const missingLessonCount = Math.max(
    0,
    maxDemandSessions - publishedLessonCount
  );

  if (publishedLessonCount < maxDemandSessions) {
    violations.push(
      `BR-LCD-01: Thư viện thiếu tiết: Cầu flow dài nhất (${longestFlowCode}) là ${maxDemandSessions} tiết, cung thư viện hiện có ${publishedLessonCount} tiết (thiếu ${missingLessonCount} tiết).`
    );
  }

  // 3. Kiểm tra flow lesson assignments (BR-LCD-04, BR-LCD-05)
  const flowViolations = checkFlowLessonAssignments(flowLessonAssignments);
  for (const fv of flowViolations) {
    violations.push(`${fv.curriculumCode}: ${fv.reason}`);
  }

  // 4. Đo cầu game level theo kỹ năng (BR-LCD-10)
  const skillStats = evaluateSkillLevels(publishedLessons, gameLevels);

  if (
    skillStats.skillsWithZeroLevels.length > 0 ||
    skillStats.skillsWithOneLevel.length > 0
  ) {
    violations.push(
      `BR-LCD-10: Có ${skillStats.skillsWithZeroLevels.length + skillStats.skillsWithOneLevel.length} kỹ năng chưa đạt sàn 2 level published (cần soạn thêm ${skillStats.levelsNeeded} level).`
    );
  }

  const metrics: LessonSupplyMetrics = {
    maxDemandSessions,
    longestFlowCode,
    publishedLessonCount,
    missingLessonCount,
    totalUniqueSkills: skillStats.totalUniqueSkills,
    skillsWithZeroLevels: skillStats.skillsWithZeroLevels,
    skillsWithOneLevel: skillStats.skillsWithOneLevel,
    skillsWithSufficientLevels: skillStats.skillsWithSufficientLevels,
    levelsNeeded: skillStats.levelsNeeded,
    flowViolations,
  };

  return {
    metrics,
    isPassed: violations.length === 0,
    violations,
  };
}

/**
 * Format báo cáo theo BR-LCD-08: In chi tiết từng flow và số buổi thiếu, cấm in phần trăm tổng
 */
export function formatLessonSupplyReport(
  evaluation: LessonSupplyEvaluation,
  curriculaConfigs: MvpCurriculumConfig[]
): string {
  const { metrics, isPassed, violations } = evaluation;
  const lines: string[] = [];

  lines.push("===============================================================");
  lines.push(" BÁO CÁO CUNG CẦU GIÁO ÁN (check:lesson-supply - BR-LCD-01..11)");
  lines.push("===============================================================");
  lines.push(
    `Cầu tiết (Flow dài nhất: ${metrics.longestFlowCode}): ${metrics.maxDemandSessions} tiết`
  );
  lines.push(
    `Cung tiết hiện có: ${metrics.publishedLessonCount} lesson published`
  );

  if (metrics.missingLessonCount > 0) {
    lines.push(`-> THIẾU TIẾT: ${metrics.missingLessonCount} tiết [CHẶN]`);
  } else {
    lines.push(`-> Cung tiết ĐẠT SÀN (đủ ${metrics.maxDemandSessions} tiết)`);
  }

  lines.push("\n--- CHI TIẾT TỪNG CHƯƠNG TRÌNH (BR-LCD-08) ---");
  for (const cur of curriculaConfigs) {
    const curDemand = cur.durationWeeks * cur.sessionsPerWeek;
    const curMissing = Math.max(0, curDemand - metrics.publishedLessonCount);
    lines.push(
      `- ${cur.code.padEnd(10)}: ${curDemand} buổi (${cur.durationWeeks}w x ${cur.sessionsPerWeek}s) | Trạng thái: ${cur.status} | Thiếu: ${curMissing} buổi`
    );
  }

  lines.push("\n--- CẦU GAME LEVEL THEO KỸ NĂNG (BR-LCD-10) ---");
  lines.push(`Tổng kỹ năng thư viện cần: ${metrics.totalUniqueSkills}`);
  lines.push(`  - Kỹ năng có 0 level: ${metrics.skillsWithZeroLevels.length}`);
  lines.push(`  - Kỹ năng có 1 level: ${metrics.skillsWithOneLevel.length}`);
  lines.push(
    `  - Kỹ năng có >=2 level: ${metrics.skillsWithSufficientLevels.length}`
  );
  lines.push(`-> Level cần soạn thêm: ${metrics.levelsNeeded} level`);

  if (violations.length > 0) {
    lines.push("\n--- DANH SÁCH VI PHẠM ---");
    for (const v of violations) {
      lines.push(` [VI PHẠM] ${v}`);
    }
  }

  lines.push("===============================================================");
  lines.push(`KẾT QUẢ: ${isPassed ? "ĐẠT (PASS)" : "KHÔNG ĐẠT (BLOCKED)"}`);
  lines.push("===============================================================");

  return lines.join("\n");
}
