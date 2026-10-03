/**
 * Logic thuần của lượt trẻ tự học một bài (`child-lesson-flow.md`).
 * Không chạm DB — service `child-lesson-flow.ts` nạp dữ liệu rồi gọi vào đây.
 */

import type { ChildLessonStepSnapshot } from "@mindkid/db";

export interface StepState {
  readonly index: number;
  readonly kind: ChildLessonStepSnapshot["kind"];
  readonly levelCode: string;
  readonly done: boolean;
  readonly locked: boolean;
}

export interface StepStates {
  readonly steps: readonly StepState[];
  /** Bước chưa xong, không khoá, đầu tiên; `null` khi không còn bước nào để chơi. */
  readonly currentStep: number | null;
  /** Mọi bước xong hoặc khoá, và ít nhất một level đã chơi xong. */
  readonly allDone: boolean;
}

export interface DeriveStepStatesInput {
  readonly plan: readonly ChildLessonStepSnapshot[];
  readonly startedAt: Date;
  /** Lần hoàn thành gần nhất của mỗi level, chỉ phiên thật của chính trẻ. */
  readonly lastCompletedAt: ReadonlyMap<string, Date>;
  readonly lockedLevelCodes: ReadonlySet<string>;
}

/**
 * Kế hoạch bước của một lượt (`BR-CLF-01`): mỗi level một bước theo thứ tự
 * đã sắp, bài làm quen nó cần đứng ngay trước, mỗi bài làm quen một lần.
 */
export function buildStepPlan(
  orderedLevelCodes: readonly string[],
  introsFor: (levelCode: string) => readonly string[]
): ChildLessonStepSnapshot[] {
  const seen = new Set<string>();
  const plan: ChildLessonStepSnapshot[] = [];
  for (const levelCode of orderedLevelCodes) {
    if (seen.has(levelCode)) {
      continue;
    }
    for (const introCode of introsFor(levelCode)) {
      if (!seen.has(introCode)) {
        seen.add(introCode);
        plan.push({ kind: "intro", level_code: introCode });
      }
    }
    seen.add(levelCode);
    plan.push({ kind: "game", level_code: levelCode });
  }
  return plan;
}

function isStepDone(
  step: ChildLessonStepSnapshot,
  input: DeriveStepStatesInput
): boolean {
  const completedAt = input.lastCompletedAt.get(step.level_code);
  if (!completedAt) {
    return false;
  }
  // Làm quen là cổng khái niệm: xong một lần là đủ (`BR-CIG`). Level chơi
  // phải xong trong chính lượt này (`BR-CLF-03`).
  return (
    step.kind === "intro" || completedAt.getTime() >= input.startedAt.getTime()
  );
}

export function deriveStepStates(input: DeriveStepStatesInput): StepStates {
  const steps: StepState[] = input.plan.map((step, index) => ({
    index,
    kind: step.kind,
    levelCode: step.level_code,
    done: isStepDone(step, input),
    locked: input.lockedLevelCodes.has(step.level_code),
  }));

  const current = steps.find((step) => !(step.done || step.locked));
  const playedAnyGame = steps.some((step) => step.kind === "game" && step.done);

  return {
    steps,
    currentStep: current ? current.index : null,
    allDone: current === undefined && playedAnyGame,
  };
}
