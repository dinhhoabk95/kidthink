/**
 * Spec sở hữu: docs/specs/05-content/lesson-flow-model.md
 * Rules: BR-LFM-04, BR-LFM-05, BR-LFM-06
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
 * `BR-LFM-04` — cảnh báo phải nêu **rõ lệch bao nhiêu**, cấm chung chung.
 *
 * `!= null` chứ không phải truthy: `targetAgeMin: 0` là một mốc có thật, còn
 * `0 && …` thì coi như không khai.
 */
export function buildAgeRecommendationWarning(
  input: AgeWarningInput
): string | undefined {
  const { childAge, targetAgeMin, targetAgeMax } = input;
  const belowFloor = targetAgeMin != null && childAge < targetAgeMin;
  const aboveCeiling = targetAgeMax != null && childAge > targetAgeMax;

  if (!(belowFloor || aboveCeiling)) {
    return;
  }
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
