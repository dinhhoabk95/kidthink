/**
 * Fixture vi phạm: ba vòng GT-009 trùng hệt nhau (cùng đáp án, cùng manh mối).
 * Chỉ dùng cho ca âm của `gt-009-corpus.test.ts`.
 */
interface FixturePack {
  readonly candidates: readonly { candidate_id: string; value: number }[];
  readonly clues: readonly {
    clue_id: string;
    predicate: { kind: "greater_than" | "less_than"; value: number };
  }[];
  readonly answer_candidate_id: string;
}

const ROUND: FixturePack = {
  candidates: [
    { candidate_id: "c1", value: 1 },
    { candidate_id: "c2", value: 2 },
    { candidate_id: "c3", value: 3 },
    { candidate_id: "c4", value: 4 },
    { candidate_id: "c5", value: 5 },
  ],
  clues: [
    { clue_id: "clue_1", predicate: { kind: "greater_than", value: 2 } },
    { clue_id: "clue_2", predicate: { kind: "less_than", value: 4 } },
  ],
  answer_candidate_id: "c3",
};

export const DUPLICATE_ROUNDS_FIXTURE: readonly FixturePack[] = [
  ROUND,
  ROUND,
  ROUND,
];
