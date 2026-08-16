/**
 * Spec sở hữu: docs/specs/05-content/curriculum-model.md & docs/specs/06-admin/curriculum-builder.md
 * Business rules: BR-CRM-01..11, BR-CBD-01..08, D-LS..D-LZ
 */

export type ProgramType = "age_based" | "journey";

export interface CurriculumItemMetadata {
  week_no: number;
  session_no: number;
  position: number;
  entity_type: "lesson" | "game_level";
  entity_id: number;
  code?: string;
  title?: string;
  is_required?: boolean;
  status?: string;
  competency_code?: string;
  strand_code?: string;
  skill_codes?: string[];
  difficulty?: number;
  estimated_minutes?: number;
  is_offline?: boolean;
}

export interface CurriculumWeekMetadata {
  week_no: number;
  goal: string;
}

export interface CurriculumValidationInput {
  code?: string;
  program_type: ProgramType;
  target_age_min?: number | null;
  target_age_max?: number | null;
  duration_weeks: number;
  sessions_per_week: number;
  title?: string;
  access_tier?: string;
  status?: string;
  items: CurriculumItemMetadata[];
  weeks?: CurriculumWeekMetadata[];
  skill_prerequisites_map?: Record<string, string[]>;
}

export interface CompetencyShare {
  competency_code: string;
  count: number;
  share: number;
}

export interface WeekDifficulty {
  week_no: number;
  avg_difficulty: number;
}

export interface SessionDuration {
  week_no: number;
  session_no: number;
  minutes: number;
}

export interface RepeatedItemFinding {
  entity_id: number;
  code?: string;
  week_nos: number[];
}

export interface PrerequisiteViolation {
  skill_code: string;
  needs: string;
  at_week: number;
  prereq_at_week?: number;
}

export interface BalanceReport {
  competency_distribution: CompetencyShare[];
  missing_competencies: string[];
  difficulty_slope: WeekDifficulty[];
  session_minutes: SessionDuration[];
  repeated_items: RepeatedItemFinding[];
  prerequisite_violations: PrerequisiteViolation[];
  errors: string[];
  warnings: string[];
  is_balanced: boolean;
}

export interface CurriculumValidationResult {
  ok: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
  report: BalanceReport;
}

const ALL_COMPETENCIES = ["C1", "C2", "C3", "C4", "C5", "C6"];
const STRAND_COMPETENCY_REGEX = /^(C[1-6])/i;
const SKILL_COMPETENCY_REGEX = /^(C[1-6])/i;
const CODE_COMPETENCY_REGEX = /^(?:GL-|LES-)?(C[1-6])/i;

function extractCompetency(item: CurriculumItemMetadata): string | null {
  if (item.competency_code?.trim()) {
    return item.competency_code.trim().toUpperCase();
  }
  if (item.strand_code?.trim()) {
    const match = item.strand_code.match(STRAND_COMPETENCY_REGEX);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  if (Array.isArray(item.skill_codes) && item.skill_codes.length > 0) {
    const firstSkill = item.skill_codes[0];
    const match = firstSkill.match(SKILL_COMPETENCY_REGEX);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  if (item.code) {
    const match = item.code.match(CODE_COMPETENCY_REGEX);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return null;
}

function checkWeekCountsAndGoals(
  durationWeeks: number,
  itemsByWeek: Map<number, CurriculumItemMetadata[]>,
  weeks: CurriculumWeekMetadata[],
  errors: string[]
): void {
  for (let w = 1; w <= durationWeeks; w++) {
    const weekItems = itemsByWeek.get(w) || [];
    if (weekItems.length === 0) {
      errors.push(`BR-CBD-02: Tuần ${w} không có hoạt động nào (tuần rỗng)`);
    } else if (weekItems.length < 3) {
      errors.push(
        `BR-CBD-04: Tuần ${w} chỉ có ${weekItems.length} hoạt động (yêu cầu tối thiểu 3)`
      );
    }
  }

  const weekGoalMap = new Map<number, string>();
  for (const wk of weeks) {
    if (wk.goal && wk.goal.trim().length > 0) {
      weekGoalMap.set(wk.week_no, wk.goal.trim());
    }
  }
  for (let w = 1; w <= durationWeeks; w++) {
    if (!weekGoalMap.has(w)) {
      errors.push(`BR-CRM-10: Tuần ${w} chưa có câu mục tiêu cho người lớn`);
    }
  }
}

function checkCompetencyDistribution(
  items: CurriculumItemMetadata[],
  programType: ProgramType,
  errors: string[],
  warnings: string[]
): { distribution: CompetencyShare[]; missing: string[] } {
  const competencyCounts = new Map<string, number>();
  let totalCountedItems = 0;

  for (const item of items) {
    const comp = extractCompetency(item);
    if (comp) {
      competencyCounts.set(comp, (competencyCounts.get(comp) || 0) + 1);
      totalCountedItems++;
    }
  }

  const distribution: CompetencyShare[] = [];
  for (const comp of ALL_COMPETENCIES) {
    const count = competencyCounts.get(comp) || 0;
    const share = totalCountedItems > 0 ? count / totalCountedItems : 0;
    distribution.push({
      competency_code: comp,
      count,
      share: Number(share.toFixed(3)),
    });

    if (share > 0.4) {
      errors.push(
        `BR-CRM-07: Năng lực ${comp} chiếm ${(share * 100).toFixed(1)}% vượt trần 40%`
      );
    }
  }

  const missing = ALL_COMPETENCIES.filter(
    (c) => (competencyCounts.get(c) || 0) === 0
  );
  if (programType === "age_based" && missing.length > 0) {
    warnings.push(
      `BR-CRM-08: Chương trình theo tuổi chưa phủ đủ 6 năng lực (thiếu: ${missing.join(", ")})`
    );
  }

  return { distribution, missing };
}

function validateSingleWeekDiversity(
  weekNo: number,
  weekItems: CurriculumItemMetadata[],
  warnings: string[]
): void {
  const weekComps = new Set<string>();
  let hasOffline = false;

  for (const item of weekItems) {
    const comp = extractCompetency(item);
    if (comp) {
      weekComps.add(comp);
    }
    if (item.is_offline === true) {
      hasOffline = true;
    }
  }

  if (weekComps.size < 2 || weekComps.size > 4) {
    warnings.push(
      `BR-CRM-02: Tuần ${weekNo} chạm ${weekComps.size} năng lực (khuyến nghị 2-4 năng lực mỗi tuần)`
    );
  }

  if (!hasOffline) {
    warnings.push(
      `BR-CRM-05: Tuần ${weekNo} chưa có hoạt động ngoài màn hình nào`
    );
  }
}

function checkWeeklyDiversity(
  durationWeeks: number,
  itemsByWeek: Map<number, CurriculumItemMetadata[]>,
  warnings: string[]
): void {
  for (let w = 1; w <= durationWeeks; w++) {
    const weekItems = itemsByWeek.get(w) || [];
    if (weekItems.length > 0) {
      validateSingleWeekDiversity(w, weekItems, warnings);
    }
  }
}

function checkDifficultySlope(
  durationWeeks: number,
  itemsByWeek: Map<number, CurriculumItemMetadata[]>,
  errors: string[],
  warnings: string[]
): WeekDifficulty[] {
  const difficultySlope: WeekDifficulty[] = [];
  let sumAllDifficulty = 0;
  let countDifficultyItems = 0;

  for (let w = 1; w <= durationWeeks; w++) {
    const weekItems = itemsByWeek.get(w) || [];
    const diffList = weekItems
      .map((i) => i.difficulty)
      .filter((d): d is number => typeof d === "number" && d > 0);

    const avg =
      diffList.length > 0
        ? diffList.reduce((acc, v) => acc + v, 0) / diffList.length
        : 1;
    difficultySlope.push({
      week_no: w,
      avg_difficulty: Number(avg.toFixed(2)),
    });

    for (const d of diffList) {
      sumAllDifficulty += d;
      countDifficultyItems++;
    }
  }

  const overallAvgDifficulty =
    countDifficultyItems > 0 ? sumAllDifficulty / countDifficultyItems : 1;
  const week1Avg = difficultySlope[0]?.avg_difficulty ?? 1;

  if (week1Avg > overallAvgDifficulty && durationWeeks > 1) {
    errors.push(
      `BR-CRM-06: Độ khó trung bình tuần 1 (${week1Avg}) cao hơn trung bình toàn chương trình (${Number(overallAvgDifficulty.toFixed(2))})`
    );
  }

  for (let w = 1; w < difficultySlope.length; w++) {
    const prev = difficultySlope[w - 1].avg_difficulty;
    const curr = difficultySlope[w].avg_difficulty;
    if (curr < prev - 1.5) {
      warnings.push(
        `BR-CRM-04: Độ khó tuần ${w + 1} (${curr}) giảm mạnh so với tuần ${w} (${prev})`
      );
    }
  }

  return difficultySlope;
}

function checkSessionDurations(
  durationWeeks: number,
  sessionsPerWeek: number,
  items: CurriculumItemMetadata[],
  warnings: string[]
): SessionDuration[] {
  const sessionMinutesMap = new Map<string, number>();
  for (const item of items) {
    const key = `${item.week_no}_${item.session_no}`;
    const mins =
      item.estimated_minutes || (item.entity_type === "lesson" ? 20 : 10);
    sessionMinutesMap.set(key, (sessionMinutesMap.get(key) || 0) + mins);
  }

  const sessionMinutes: SessionDuration[] = [];
  for (let w = 1; w <= durationWeeks; w++) {
    for (let s = 1; s <= (sessionsPerWeek || 3); s++) {
      const key = `${w}_${s}`;
      const mins = sessionMinutesMap.get(key) || 0;
      sessionMinutes.push({ week_no: w, session_no: s, minutes: mins });
      if (mins > 45) {
        warnings.push(
          `Tuần ${w} buổi ${s} có thời lượng ${mins} phút (> 45 phút khuyến nghị)`
        );
      }
    }
  }
  return sessionMinutes;
}

function checkRepeatedItems(
  items: CurriculumItemMetadata[],
  errors: string[]
): RepeatedItemFinding[] {
  const repeatedItems: RepeatedItemFinding[] = [];
  const itemWeekOccurrences = new Map<number, number[]>();
  for (const item of items) {
    const list = itemWeekOccurrences.get(item.entity_id) || [];
    list.push(item.week_no);
    itemWeekOccurrences.set(item.entity_id, list);
  }

  for (const [entityId, weekNos] of itemWeekOccurrences.entries()) {
    const sortedWeeks = [...new Set(weekNos)].sort((a, b) => a - b);
    for (let i = 0; i < sortedWeeks.length - 1; i++) {
      const w1 = sortedWeeks[i];
      const w2 = sortedWeeks[i + 1];
      if (w2 - w1 <= 3) {
        const itemObj = items.find((it) => it.entity_id === entityId);
        repeatedItems.push({
          entity_id: entityId,
          code: itemObj?.code,
          week_nos: [w1, w2],
        });
        errors.push(
          `BR-CRM-09: Hoạt động ${itemObj?.code || entityId} bị lặp lại trong cửa sổ 4 tuần (tuần ${w1} và tuần ${w2})`
        );
        break;
      }
    }
  }
  return repeatedItems;
}

function collectSkillOccurrences(items: CurriculumItemMetadata[]) {
  const skillFirstSeenWeek = new Map<string, number>();
  const skillAllWeeks = new Map<string, Set<number>>();

  for (const item of items) {
    if (Array.isArray(item.skill_codes)) {
      for (const skill of item.skill_codes) {
        const existing = skillFirstSeenWeek.get(skill);
        if (existing === undefined) {
          skillFirstSeenWeek.set(skill, item.week_no);
        } else {
          skillFirstSeenWeek.set(skill, Math.min(existing, item.week_no));
        }
        let allSet = skillAllWeeks.get(skill);
        if (!allSet) {
          allSet = new Set();
          skillAllWeeks.set(skill, allSet);
        }
        allSet.add(item.week_no);
      }
    }
  }

  return { skillFirstSeenWeek, skillAllWeeks };
}

function checkPrerequisiteRules(
  prereqsMap: Record<string, string[]> | undefined,
  skillFirstSeenWeek: Map<string, number>,
  errors: string[]
): PrerequisiteViolation[] {
  const prerequisiteViolations: PrerequisiteViolation[] = [];
  if (!prereqsMap) {
    return prerequisiteViolations;
  }

  for (const [skill, firstWeek] of skillFirstSeenWeek.entries()) {
    const prereqs = prereqsMap[skill] || [];
    for (const prereq of prereqs) {
      const prereqFirstWeek = skillFirstSeenWeek.get(prereq);
      if (prereqFirstWeek === undefined || prereqFirstWeek > firstWeek) {
        prerequisiteViolations.push({
          skill_code: skill,
          needs: prereq,
          at_week: firstWeek,
          prereq_at_week: prereqFirstWeek,
        });
        errors.push(
          `BR-CRM-01 / BR-CBD-06: Kỹ năng ${skill} ở tuần ${firstWeek} xuất hiện trước kỹ năng tiên quyết ${prereq} (tuần ${prereqFirstWeek ?? "chưa có"})`
        );
      }
    }
  }
  return prerequisiteViolations;
}

function checkSkillReviewAndLastWeeks(
  durationWeeks: number,
  skillFirstSeenWeek: Map<string, number>,
  skillAllWeeks: Map<string, Set<number>>,
  errors: string[],
  warnings: string[]
): void {
  for (const [skill, firstWeek] of skillFirstSeenWeek.entries()) {
    if (firstWeek <= durationWeeks - 3) {
      const weeksWithSkill = skillAllWeeks.get(skill) || new Set();
      const hasReview =
        weeksWithSkill.has(firstWeek + 1) ||
        weeksWithSkill.has(firstWeek + 2) ||
        weeksWithSkill.has(firstWeek + 3);
      if (!hasReview) {
        warnings.push(
          `BR-CRM-03: Kỹ năng ${skill} xuất hiện lần đầu ở tuần ${firstWeek} chưa được ôn lại trong tuần ${firstWeek + 1}..${firstWeek + 3}`
        );
      }
    }
  }

  if (durationWeeks >= 4) {
    const last3WeeksStart = durationWeeks - 2;
    for (const [skill, firstWeek] of skillFirstSeenWeek.entries()) {
      if (firstWeek >= last3WeeksStart) {
        errors.push(
          `BR-CRM-11: Kỹ năng mới ${skill} xuất hiện ở tuần ${firstWeek} thuộc 3 tuần cuối (tuần ${last3WeeksStart}..${durationWeeks})`
        );
      }
    }
  }
}

function checkPrerequisitesAndProgression(
  durationWeeks: number,
  items: CurriculumItemMetadata[],
  prereqsMap: Record<string, string[]> | undefined,
  errors: string[],
  warnings: string[]
): PrerequisiteViolation[] {
  const { skillFirstSeenWeek, skillAllWeeks } = collectSkillOccurrences(items);
  const prerequisiteViolations = checkPrerequisiteRules(
    prereqsMap,
    skillFirstSeenWeek,
    errors
  );
  checkSkillReviewAndLastWeeks(
    durationWeeks,
    skillFirstSeenWeek,
    skillAllWeeks,
    errors,
    warnings
  );
  return prerequisiteViolations;
}

export function calculateCurriculumBalance(
  input: CurriculumValidationInput
): BalanceReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items = Array.isArray(input.items) ? input.items : [];
  const weeks = Array.isArray(input.weeks) ? input.weeks : [];
  const durationWeeks = Math.max(1, input.duration_weeks || 1);

  const itemsByWeek = new Map<number, CurriculumItemMetadata[]>();
  for (let w = 1; w <= durationWeeks; w++) {
    itemsByWeek.set(w, []);
  }
  for (const item of items) {
    const list = itemsByWeek.get(item.week_no);
    if (list) {
      list.push(item);
    }
  }

  checkWeekCountsAndGoals(durationWeeks, itemsByWeek, weeks, errors);
  const { distribution, missing } = checkCompetencyDistribution(
    items,
    input.program_type,
    errors,
    warnings
  );
  checkWeeklyDiversity(durationWeeks, itemsByWeek, warnings);
  const difficultySlope = checkDifficultySlope(
    durationWeeks,
    itemsByWeek,
    errors,
    warnings
  );
  const sessionMinutes = checkSessionDurations(
    durationWeeks,
    input.sessions_per_week,
    items,
    warnings
  );
  const repeatedItems = checkRepeatedItems(items, errors);
  const prerequisiteViolations = checkPrerequisitesAndProgression(
    durationWeeks,
    items,
    input.skill_prerequisites_map,
    errors,
    warnings
  );

  for (const item of items) {
    if (item.status && item.status !== "published") {
      errors.push(
        `BR-CBD-03: Hoạt động ${item.code || item.entity_id} ở trạng thái '${item.status}', chưa xuất bản (published)`
      );
    }
  }

  return {
    competency_distribution: distribution,
    missing_competencies: missing,
    difficulty_slope: difficultySlope,
    session_minutes: sessionMinutes,
    repeated_items: repeatedItems,
    prerequisite_violations: prerequisiteViolations,
    errors,
    warnings,
    is_balanced: errors.length === 0,
  };
}

export function validateCurriculumModel(
  input: CurriculumValidationInput
): CurriculumValidationResult {
  const report = calculateCurriculumBalance(input);
  return {
    ok: report.errors.length === 0,
    valid: report.errors.length === 0,
    errors: report.errors,
    warnings: report.warnings,
    report,
  };
}
