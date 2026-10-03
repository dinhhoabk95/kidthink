import { describe, expect, it } from "vitest";
import {
  buildStepPlan,
  deriveStepStates,
} from "#server/services/child-lesson-steps";

const STARTED_AT = new Date("2026-10-03T08:00:00Z");
const BEFORE = new Date("2026-10-02T08:00:00Z");
const AFTER = new Date("2026-10-03T08:05:00Z");

describe("buildStepPlan (BR-CLF-01)", () => {
  it("level theo thứ tự đã sắp, làm quen đứng ngay trước level cần nó", () => {
    const plan = buildStepPlan(["GL-A", "GL-B"], (code) =>
      code === "GL-A" ? ["GL-INTRO-1"] : []
    );

    expect(plan).toEqual([
      { kind: "intro", level_code: "GL-INTRO-1" },
      { kind: "game", level_code: "GL-A" },
      { kind: "game", level_code: "GL-B" },
    ]);
  });

  it("một bài làm quen chỉ xuất hiện một lần dù nhiều level cần", () => {
    const plan = buildStepPlan(["GL-A", "GL-B"], () => ["GL-INTRO-1"]);

    expect(plan.filter((s) => s.kind === "intro")).toHaveLength(1);
    expect(plan).toHaveLength(3);
  });

  it("level lặp lại trong bài chỉ thành một bước", () => {
    const plan = buildStepPlan(["GL-A", "GL-A"], () => []);

    expect(plan).toEqual([{ kind: "game", level_code: "GL-A" }]);
  });
});

describe("deriveStepStates (BR-CLF-03)", () => {
  const plan = buildStepPlan(["GL-A", "GL-B"], (code) =>
    code === "GL-A" ? ["GL-INTRO-1"] : []
  );

  it("level xong trước khi mở lượt không tính; làm quen xong lúc nào cũng tính", () => {
    const states = deriveStepStates({
      plan,
      startedAt: STARTED_AT,
      lastCompletedAt: new Map([
        ["GL-INTRO-1", BEFORE],
        ["GL-A", BEFORE],
      ]),
      lockedLevelCodes: new Set(),
    });

    expect(states.steps.map((s) => s.done)).toEqual([true, false, false]);
    expect(states.currentStep).toBe(1);
    expect(states.allDone).toBe(false);
  });

  it("xong mọi bước sau khi mở lượt thì allDone và không còn bước hiện tại", () => {
    const states = deriveStepStates({
      plan,
      startedAt: STARTED_AT,
      lastCompletedAt: new Map([
        ["GL-INTRO-1", BEFORE],
        ["GL-A", AFTER],
        ["GL-B", AFTER],
      ]),
      lockedLevelCodes: new Set(),
    });

    expect(states.allDone).toBe(true);
    expect(states.currentStep).toBeNull();
  });

  it("bước bị khoá bậc không chặn bài (giống BR-CUR-05)", () => {
    const states = deriveStepStates({
      plan,
      startedAt: STARTED_AT,
      lastCompletedAt: new Map([
        ["GL-INTRO-1", BEFORE],
        ["GL-A", AFTER],
      ]),
      lockedLevelCodes: new Set(["GL-B"]),
    });

    expect(states.steps[2]?.locked).toBe(true);
    expect(states.allDone).toBe(true);
    expect(states.currentStep).toBeNull();
  });

  it("Ca âm: mọi level đều khoá thì bài KHÔNG tự xong", () => {
    const states = deriveStepStates({
      plan,
      startedAt: STARTED_AT,
      lastCompletedAt: new Map([["GL-INTRO-1", BEFORE]]),
      lockedLevelCodes: new Set(["GL-A", "GL-B"]),
    });

    expect(states.allDone).toBe(false);
  });

  it("bỏ qua bước khoá khi chọn bước hiện tại", () => {
    const states = deriveStepStates({
      plan,
      startedAt: STARTED_AT,
      lastCompletedAt: new Map([["GL-INTRO-1", BEFORE]]),
      lockedLevelCodes: new Set(["GL-A"]),
    });

    expect(states.currentStep).toBe(2);
  });
});
