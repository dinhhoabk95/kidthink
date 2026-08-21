/**
 * Luật loại trừ của `GT-009`, tách khỏi `template.ts` để `refine` của contract và
 * Session dùng **cùng một** cách tính. Hai bản sao của luật này là hai cách hiểu
 * khác nhau về "ứng viên nào bị loại", và trẻ sẽ thấy đúng chỗ lệch đó.
 */

export interface GT009Predicate {
  readonly kind: "greater_than" | "less_than" | "not_equal" | "between";
  readonly value?: number;
  readonly min?: number;
  readonly max?: number;
}

export interface GT009Candidate {
  readonly candidate_id: string;
  readonly value: number;
}

export interface GT009Clue {
  readonly clue_id: string;
  readonly predicate: GT009Predicate;
}

export interface GT009ContentShape {
  readonly candidates: readonly GT009Candidate[];
  readonly clues: readonly GT009Clue[];
  readonly answer_candidate_id: string;
}

/** Một ứng viên thoả một manh mối hay không. */
export function satisfiesClue(
  value: number,
  predicate: GT009Predicate
): boolean {
  switch (predicate.kind) {
    case "greater_than":
      return value > (predicate.value ?? Number.POSITIVE_INFINITY);
    case "less_than":
      return value < (predicate.value ?? Number.NEGATIVE_INFINITY);
    case "not_equal":
      return value !== predicate.value;
    case "between":
      return (
        value >= (predicate.min ?? Number.POSITIVE_INFINITY) &&
        value <= (predicate.max ?? Number.NEGATIVE_INFINITY)
      );
    default:
      return false;
  }
}

/** Ứng viên còn sống sau khi áp mọi manh mối trong `clueIds` (mặc định: tất cả). */
export function survivingCandidates(
  content: GT009ContentShape,
  clueIds?: readonly string[]
): GT009Candidate[] {
  const applied = clueIds
    ? content.clues.filter((c) => clueIds.includes(c.clue_id))
    : content.clues;
  return content.candidates.filter((candidate) =>
    applied.every((clue) => satisfiesClue(candidate.value, clue.predicate))
  );
}

/** Ứng viên còn sống sau khi áp **mọi** manh mối. */
export function cluesNarrowToExactlyOne(
  content: GT009ContentShape
): GT009Candidate[] {
  return survivingCandidates(content);
}
