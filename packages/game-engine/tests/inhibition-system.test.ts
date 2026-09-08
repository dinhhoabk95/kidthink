import { describe, expect, it } from "vitest";
import {
  InhibitionSystem,
  type TrialItem,
} from "#src/systems/inhibition-system";

describe("InhibitionSystem (BR-TGB-08, BR-TGB-04, BR-TGB-05)", () => {
  const sampleTrials: TrialItem[] = [
    { id: "t1", kind: "go" },
    { id: "t2", kind: "nogo" },
    { id: "t3", kind: "go" },
    { id: "t4", kind: "nogo" },
  ];

  it("handles Go hit when action is taken within stimulus window", () => {
    const sys = new InhibitionSystem({
      trials: sampleTrials,
      stimulusWindowMs: 2000,
      isiMs: 200,
    });

    expect(sys.getCurrentTrial()?.id).toBe("t1");
    expect(sys.getState()).toBe("stimulus");

    // Action taken
    const res = sys.handleAction();
    expect(res).toEqual({ isCorrect: true, outcome: "hit" });
    expect(sys.getState()).toBe("isi");

    // Advance through ISI
    sys.tick(200);
    expect(sys.getCurrentTrial()?.id).toBe("t2");
    expect(sys.getState()).toBe("stimulus");
  });

  it("handles No-Go correct rejection when no action is taken (BR-TGB-04, BR-TGB-05)", () => {
    const sys = new InhibitionSystem({
      trials: sampleTrials,
      stimulusWindowMs: 1500,
      isiMs: 100,
    });

    // Trial 1 is Go, hit it
    sys.handleAction();
    sys.tick(100);

    // Trial 2 is No-Go
    expect(sys.getCurrentTrial()?.id).toBe("t2");
    expect(sys.getCurrentTrial()?.kind).toBe("nogo");

    // Tick past stimulus window without action
    const verdict = sys.tick(1500);
    expect(verdict).toEqual({ isCorrect: true, outcome: "correct_rejection" });
    expect(sys.getState()).toBe("isi");

    // ISI completes
    sys.tick(100);
    expect(sys.getCurrentTrial()?.id).toBe("t3");
  });

  it("handles No-Go false alarm when child taps incorrectly", () => {
    const sys = new InhibitionSystem({
      trials: sampleTrials,
      stimulusWindowMs: 1500,
      isiMs: 100,
    });

    // Skip trial 1 to trial 2
    sys.tick(1500); // Go miss
    sys.tick(100);

    // Trial 2: No-Go. Child taps.
    expect(sys.getCurrentTrial()?.kind).toBe("nogo");
    const verdict = sys.handleAction();
    expect(verdict).toEqual({ isCorrect: false, outcome: "false_alarm" });
  });

  it("handles Go miss when child does not tap in time", () => {
    const sys = new InhibitionSystem({
      trials: sampleTrials,
      stimulusWindowMs: 1000,
      isiMs: 0,
    });

    expect(sys.getCurrentTrial()?.kind).toBe("go");
    const verdict = sys.tick(1000);
    expect(verdict).toEqual({ isCorrect: false, outcome: "miss" });
    expect(sys.getCurrentTrial()?.id).toBe("t2");
  });

  it("completes all trials and finishes", () => {
    const sys = new InhibitionSystem({
      trials: [{ id: "t1", kind: "go" }],
      stimulusWindowMs: 1000,
      isiMs: 0,
    });

    sys.handleAction();
    expect(sys.isFinished()).toBe(true);
    expect(sys.getCurrentTrial()).toBeNull();
    expect(sys.getCorrectCount()).toBe(1);
  });

  it("handles untimed mode (BR-EBD-11, BR-E026-03): stimulus does not expire automatically and handles pass/tap", () => {
    const sys = new InhibitionSystem({
      trials: [
        { id: "t1", kind: "go" },
        { id: "t2", kind: "nogo" },
        { id: "t3", kind: "nogo" },
        { id: "t4", kind: "go" },
      ],
      stimulusWindowMs: 1000,
      isiMs: 100,
      untimed: true,
    });

    expect(sys.isUntimed()).toBe(true);
    expect(sys.getCurrentTrial()?.id).toBe("t1");
    expect(sys.getState()).toBe("stimulus");

    // Elapsed time far exceeds stimulusWindowMs, but stimulus does not timeout
    const tickResult = sys.tick(10_000);
    expect(tickResult).toBeNull();
    expect(sys.getState()).toBe("stimulus");
    expect(sys.getCurrentTrial()?.id).toBe("t1");

    // Child taps Go -> hit (correct)
    const hitRes = sys.handleAction("tap");
    expect(hitRes).toEqual({ isCorrect: true, outcome: "hit" });
    expect(sys.getState()).toBe("isi");

    sys.tick(100);
    expect(sys.getCurrentTrial()?.id).toBe("t2");
    expect(sys.getCurrentTrial()?.kind).toBe("nogo");

    // Stimulus stays again
    expect(sys.tick(5000)).toBeNull();

    // Child passes on No-Go -> correct_rejection (correct)
    const passRes = sys.handlePass();
    expect(passRes).toEqual({ isCorrect: true, outcome: "correct_rejection" });

    sys.tick(100);
    expect(sys.getCurrentTrial()?.id).toBe("t3");
    expect(sys.getCurrentTrial()?.kind).toBe("nogo");

    // Child taps on No-Go -> false_alarm (incorrect)
    const falseAlarmRes = sys.handleAction("tap");
    expect(falseAlarmRes).toEqual({ isCorrect: false, outcome: "false_alarm" });

    sys.tick(100);
    expect(sys.getCurrentTrial()?.id).toBe("t4");
    expect(sys.getCurrentTrial()?.kind).toBe("go");

    // Child passes on Go -> miss (incorrect)
    const missRes = sys.handlePass();
    expect(missRes).toEqual({ isCorrect: false, outcome: "miss" });

    sys.tick(100);
    expect(sys.isFinished()).toBe(true);
    expect(sys.getCorrectCount()).toBe(2);
  });
});
