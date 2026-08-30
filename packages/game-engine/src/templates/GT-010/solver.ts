/**
 * `solver.ts` — giải hệ phương trình hình ảnh mầm non (2–3 ẩn, nghiệm nguyên dương trong khoảng 1–20).
 */

export interface EquationDefinition {
  readonly equation_id: string;
  readonly left: readonly string[]; // symbol_ids
  readonly right_value: number;
}

export interface SystemSolution {
  readonly values: Record<string, number>;
}

/**
 * Tìm tất cả nghiệm nguyên dương trong khoảng [1, maxVal] cho hệ phương trình.
 */
export function solveEquationSystem(
  symbolIds: readonly string[],
  equations: readonly EquationDefinition[],
  maxVal = 20
): SystemSolution[] {
  const solutions: SystemSolution[] = [];
  const n = symbolIds.length;

  function evaluate(assignment: Record<string, number>): boolean {
    for (const eq of equations) {
      let sum = 0;
      for (const sym of eq.left) {
        sum += assignment[sym] ?? 0;
      }
      if (sum !== eq.right_value) {
        return false;
      }
    }
    return true;
  }

  function search(idx: number, current: Record<string, number>): void {
    if (solutions.length > 1) {
      return;
    }
    if (idx === n) {
      if (evaluate(current)) {
        solutions.push({ values: { ...current } });
      }
      return;
    }

    const sym = symbolIds[idx];
    if (!sym) {
      return;
    }
    for (let v = 1; v <= maxVal; v++) {
      current[sym] = v;
      search(idx + 1, current);
      delete current[sym];
      if (solutions.length > 1) {
        return;
      }
    }
  }

  search(0, {});
  return solutions;
}

/** Kiểm tra hệ có đúng 1 nghiệm nguyên dương duy nhất. */
export function hasUniqueSystemSolution(
  symbolIds: readonly string[],
  equations: readonly EquationDefinition[],
  maxVal = 20
): boolean {
  return solveEquationSystem(symbolIds, equations, maxVal).length === 1;
}

/** Tính đáp án đúng cho câu hỏi dựa trên nghiệm của hệ. */
export function evaluateQuestionAnswer(
  solution: SystemSolution,
  question:
    | { kind: "value"; symbol_id: string }
    | { kind: "sum"; symbol_ids: readonly string[] }
): number {
  if (question.kind === "value") {
    return solution.values[question.symbol_id] ?? 0;
  }
  return question.symbol_ids.reduce(
    (acc, sym) => acc + (solution.values[sym] ?? 0),
    0
  );
}
