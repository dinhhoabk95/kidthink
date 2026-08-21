/**
 * Pure evaluation library for Lesson Exemplar Matrix (BR-LEX-01..11).
 * Spec: docs/specs/05-content/lesson-exemplar-set.md
 *
 * Rules:
 * - BR-LEX-07: Matrix covers 6 competencies × 3 age bands (18 cells), each cell ≥ 1 (floor 18).
 * - BR-LEX-08: Ceiling of 2 exemplars per cell (maximum 36 across entire matrix).
 */

export type CompetencyCode = "C1" | "C2" | "C3" | "C4" | "C5" | "C6";
export type AgeBand = "3-4" | "4-5" | "5-6";

export const COMPETENCIES: readonly CompetencyCode[] = [
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
];

export const AGE_BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

export interface LessonExemplarRecord {
  id: number;
  code: string;
  title: string;
  competency: string | null;
  ageBand: string | null;
  isExemplar: boolean;
  status: string;
}

export interface ExemplarMatrixEvaluation {
  matrix: Record<CompetencyCode, Record<AgeBand, number>>;
  totalExemplars: number;
  filledCellsCount: number;
  emptyCells: Array<{ competency: CompetencyCode; ageBand: AgeBand }>;
  exceededCells: Array<{
    competency: CompetencyCode;
    ageBand: AgeBand;
    count: number;
  }>;
  isValid: boolean;
  violations: string[];
}

function initEmptyMatrix(): Record<CompetencyCode, Record<AgeBand, number>> {
  return {
    C1: { "3-4": 0, "4-5": 0, "5-6": 0 },
    C2: { "3-4": 0, "4-5": 0, "5-6": 0 },
    C3: { "3-4": 0, "4-5": 0, "5-6": 0 },
    C4: { "3-4": 0, "4-5": 0, "5-6": 0 },
    C5: { "3-4": 0, "4-5": 0, "5-6": 0 },
    C6: { "3-4": 0, "4-5": 0, "5-6": 0 },
  };
}

function isCompetencyCode(
  val: string | null | undefined
): val is CompetencyCode {
  return (
    val === "C1" ||
    val === "C2" ||
    val === "C3" ||
    val === "C4" ||
    val === "C5" ||
    val === "C6"
  );
}

function isAgeBand(val: string | null | undefined): val is AgeBand {
  return val === "3-4" || val === "4-5" || val === "5-6";
}

function populateMatrix(
  lessons: readonly LessonExemplarRecord[],
  matrix: Record<CompetencyCode, Record<AgeBand, number>>
): number {
  let total = 0;
  for (const l of lessons) {
    if (!l.isExemplar || l.status !== "published") {
      continue;
    }
    const c = l.competency;
    const a = l.ageBand;
    if (isCompetencyCode(c) && isAgeBand(a) && matrix[c]?.[a] !== undefined) {
      matrix[c][a] += 1;
      total += 1;
    }
  }
  return total;
}

function analyzeMatrixCells(
  matrix: Record<CompetencyCode, Record<AgeBand, number>>
) {
  const emptyCells: Array<{ competency: CompetencyCode; ageBand: AgeBand }> =
    [];
  const exceededCells: Array<{
    competency: CompetencyCode;
    ageBand: AgeBand;
    count: number;
  }> = [];
  let filledCellsCount = 0;

  for (const c of COMPETENCIES) {
    for (const a of AGE_BANDS) {
      const cnt = matrix[c][a];
      if (cnt === 0) {
        emptyCells.push({ competency: c, ageBand: a });
      } else {
        filledCellsCount += 1;
        if (cnt > 2) {
          exceededCells.push({ competency: c, ageBand: a, count: cnt });
        }
      }
    }
  }

  return { emptyCells, exceededCells, filledCellsCount };
}

function collectViolations(
  exceededCells: Array<{
    competency: CompetencyCode;
    ageBand: AgeBand;
    count: number;
  }>,
  emptyCells: Array<{ competency: CompetencyCode; ageBand: AgeBand }>,
  isPhase4: boolean
): string[] {
  const violations: string[] = [];

  for (const exc of exceededCells) {
    violations.push(
      `[BR-LEX-08] Ô [${exc.competency} | ${exc.ageBand}] có ${exc.count} tiết học mẫu (vượt trần 2 mẫu/ô).`
    );
  }

  if (isPhase4) {
    for (const emp of emptyCells) {
      violations.push(
        `[BR-LEX-07] Ô [${emp.competency} | ${emp.ageBand}] chưa có tiết học mẫu (sàn 1 mẫu/ô).`
      );
    }
  }

  return violations;
}

export function evaluateExemplarMatrix(
  lessons: readonly LessonExemplarRecord[],
  options?: { isPhase4?: boolean }
): ExemplarMatrixEvaluation {
  const isPhase4 = options?.isPhase4 ?? false;
  const matrix = initEmptyMatrix();
  const totalExemplars = populateMatrix(lessons, matrix);
  const { emptyCells, exceededCells, filledCellsCount } =
    analyzeMatrixCells(matrix);
  const violations = collectViolations(exceededCells, emptyCells, isPhase4);

  return {
    matrix,
    totalExemplars,
    filledCellsCount,
    emptyCells,
    exceededCells,
    isValid: violations.length === 0,
    violations,
  };
}
