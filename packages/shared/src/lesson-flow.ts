/**
 * Spec sở hữu: docs/specs/05-content/lesson-flow-model.md
 * Rules: BR-LFM-02, BR-LFM-03, BR-LFM-04, BR-LFM-05, BR-LFM-06, BR-LFM-07, BR-LFM-08, BR-LFM-09
 *
 * Ba luật này trước đây **chỉ tồn tại trong file test**: `lesson-flow-model.test.ts`
 * khai `validateNoDuplicateLessonsInFlow` và `validatePrerequisites` ngay trong
 * thân test rồi kiểm chính chúng, còn thông điệp cảnh báo tuổi thì được chép
 * nguyên văn từ route. Xoá route đi, bộ test đó vẫn xanh.
 */

export interface AgeWarningInput {
  childAge: number;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
}

/**
 * `BR-LFM-02`, `BR-LFM-03`, `BR-LFM-04` (§7.3, §8) — khoảng cách từ tuổi trẻ tới
 * khoảng nhãn của flow (`0` khi trong khoảng).
 */
export function computeAgeGap(input: AgeWarningInput): number {
  const { childAge, targetAgeMin, targetAgeMax } = input;
  if (targetAgeMin != null && childAge < targetAgeMin) {
    return targetAgeMin - childAge;
  }
  if (targetAgeMax != null && childAge > targetAgeMax) {
    return childAge - targetAgeMax;
  }
  return 0;
}

/**
 * `BR-LFM-04` — cảnh báo phải nêu **rõ lệch bao nhiêu**, cấm chung chung.
 *
 * `!= null` chứ không phải truthy: `targetAgeMin: 0` là một mốc có thật, còn
 * `0 && …` thì coi như không khai.
 */
export function buildAgeRecommendationWarning(
  input: AgeWarningInput
): string | undefined {
  if (computeAgeGap(input) === 0) {
    return;
  }
  const { childAge, targetAgeMin, targetAgeMax } = input;
  return `Flow này gợi ý cho trẻ ${targetAgeMin ?? 3}–${targetAgeMax ?? 6} tuổi, bé nhà bạn ${childAge} tuổi`;
}

/** `BR-LFM-05` — một flow cấm chứa cùng một lesson hai lần. */
export function findDuplicateLessonsInFlow(
  lessonCodes: readonly string[]
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const code of lessonCodes) {
    if (seen.has(code)) {
      duplicates.add(code);
    }
    seen.add(code);
  }
  return [...duplicates];
}

/**
 * `BR-LFM-06` — thứ tự lesson trong flow phải tôn trọng prerequisite.
 *
 * Trả về kỹ năng ĐẦU TIÊN xuất hiện trước điều kiện tiên quyết của nó, hoặc
 * `undefined` nếu thứ tự hợp lệ. Trả về thủ phạm thay vì boolean vì thông điệp
 * "flow sai thứ tự" mà không nói sai ở đâu thì không sửa được.
 */
export function findPrerequisiteViolation(
  skillSequence: readonly string[],
  prerequisites: Readonly<Record<string, readonly string[]>>
): { skill: string; missing: string } | undefined {
  const mastered = new Set<string>();
  for (const skill of skillSequence) {
    for (const required of prerequisites[skill] ?? []) {
      if (!mastered.has(required)) {
        return { skill, missing: required };
      }
    }
    mastered.add(skill);
  }
  return;
}

/**
 * `BR-LFM-08` — flow chỉ `published` khi mọi tiết của nó trỏ tới lesson
 * `published` có thật (không có tiết trống hay bài chưa publish).
 */
export function findUnpublishedFlowLessons(
  flowLessonCodes: readonly string[],
  publishedLessonCodes: ReadonlySet<string>
): string[] {
  if (flowLessonCodes.length === 0) {
    return ["<empty-flow>"];
  }
  const missing: string[] = [];
  for (const code of flowLessonCodes) {
    const trimmed = code.trim();
    if (!trimmed) {
      missing.push("<blank-slot>");
    } else if (!publishedLessonCodes.has(trimmed)) {
      missing.push(trimmed);
    }
  }
  return missing;
}

export function canPublishLessonFlow(input: {
  readonly flowLessonCodes: readonly string[];
  readonly publishedLessonCodes: ReadonlySet<string>;
}): { readonly ok: boolean; readonly missingLessonCodes: string[] } {
  const missingLessonCodes = findUnpublishedFlowLessons(
    input.flowLessonCodes,
    input.publishedLessonCodes
  );
  return {
    ok: missingLessonCodes.length === 0,
    missingLessonCodes,
  };
}

export interface FlowCandidateInput {
  readonly code: string;
  readonly title: string;
  readonly sessionCount: number;
  readonly targetAgeMin?: number | null;
  readonly targetAgeMax?: number | null;
}

export interface RankedChildFlow {
  readonly code: string;
  readonly title: string;
  readonly session_count: number;
  readonly age_label: string;
  readonly fits_age: boolean;
  readonly age_gap: number;
  readonly recommend_score: number;
  readonly warning?: string;
}

/**
 * `BR-LFM-02`, `BR-LFM-03`, `BR-LFM-07`, `BR-LFM-09` — xếp hạng danh sách flow
 * theo tuổi trẻ mà không lọc bỏ flow vì tuổi hay gói, và không tự ghi danh.
 */
export function rankFlowsForChild(
  childAge: number,
  flows: readonly FlowCandidateInput[]
): RankedChildFlow[] {
  return flows
    .map((flow) => {
      const ageGap = computeAgeGap({
        childAge,
        targetAgeMin: flow.targetAgeMin,
        targetAgeMax: flow.targetAgeMax,
      });
      const warning = buildAgeRecommendationWarning({
        childAge,
        targetAgeMin: flow.targetAgeMin,
        targetAgeMax: flow.targetAgeMax,
      });
      return {
        code: flow.code,
        title: flow.title,
        session_count: flow.sessionCount,
        age_label: `${flow.targetAgeMin ?? 3}–${flow.targetAgeMax ?? 6}`,
        fits_age: ageGap === 0,
        age_gap: ageGap,
        recommend_score: Math.max(0, 100 - ageGap * 25),
        ...(warning ? { warning } : {}),
      };
    })
    .sort((a, b) => a.age_gap - b.age_gap || a.code.localeCompare(b.code));
}
