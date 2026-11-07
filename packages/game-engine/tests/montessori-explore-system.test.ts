import { describe, expect, it } from "vitest";
import { MontessoriExploreTracker } from "#src/systems/montessori-explore-system";

describe("MontessoriExploreTracker — 2-Phase Explore/Challenge & Control of Error", () => {
  it("starts in explore phase when configured and transitions to challenge at milestone", () => {
    const tracker = new MontessoriExploreTracker({
      milestoneTarget: 2,
      startInExplore: true,
    });
    expect(tracker.getPhase()).toBe("explore");
    expect(tracker.getExploreActionsCount()).toBe(0);

    const firstTransition = tracker.recordExploreAction("test_pan");
    expect(firstTransition).toBe(false);
    expect(tracker.getPhase()).toBe("explore");
    expect(tracker.getExploreActionsCount()).toBe(1);

    const secondTransition = tracker.recordExploreAction("test_pan");
    expect(secondTransition).toBe(true);
    expect(tracker.getPhase()).toBe("challenge");
    expect(tracker.isExploreMilestoneReached()).toBe(true);
  });

  it("soft-transitions from explore to challenge after softTimeoutMs", () => {
    const tracker = new MontessoriExploreTracker({
      milestoneTarget: 3,
      softTimeoutMs: 5000,
      startInExplore: true,
    });
    expect(tracker.getPhase()).toBe("explore");
    tracker.tick(3000);
    expect(tracker.getPhase()).toBe("explore");
    tracker.tick(2500);
    expect(tracker.getPhase()).toBe("challenge");
  });

  it("records Control of Error diagnostics and activates micro_sandbox after 2 consecutive wrong attempts", () => {
    const tracker = new MontessoriExploreTracker({ milestoneTarget: 2 });
    expect(tracker.getPhase()).toBe("challenge");
    expect(tracker.isMicroSandboxActive()).toBe(false);

    const entered1 = tracker.recordWrongAttempt({
      reasonVi: "Bên trái (5) nặng hơn bên phải (3)",
      actualValue: 5,
      expectedValue: 3,
    });
    expect(entered1).toBe(false);
    expect(tracker.isMicroSandboxActive()).toBe(false);
    expect(tracker.getControlOfErrorDiagnostics()?.reasonVi).toBe(
      "Bên trái (5) nặng hơn bên phải (3)"
    );

    const entered2 = tracker.recordWrongAttempt({
      reasonVi: "Bên trái (5) nặng hơn bên phải (3)",
      actualValue: 5,
      expectedValue: 3,
    });
    expect(entered2).toBe(true);
    expect(tracker.isMicroSandboxActive()).toBe(true);
    expect(tracker.getPhase()).toBe("micro_sandbox");

    // Micro-sandbox keeps diagnostics visible across ticks until solved
    tracker.tick(5000);
    expect(tracker.getControlOfErrorDiagnostics()).not.toBeNull();

    // Correct attempt resets wrong counter and exits micro_sandbox
    tracker.recordCorrectAttempt();
    expect(tracker.isMicroSandboxActive()).toBe(false);
    expect(tracker.getConsecutiveWrongCount()).toBe(0);
    expect(tracker.getControlOfErrorDiagnostics()).toBeNull();
  });
});
