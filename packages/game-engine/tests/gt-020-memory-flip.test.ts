import { describe, expect, it } from "vitest";
import { GT020_FIXTURES, GT020Session } from "#src/index";
import template from "#src/templates/GT-020/template";

const f1 = GT020_FIXTURES[0];

describe("GT-020: Lật thẻ tìm cặp (memory-flip)", () => {
  it("template metadata adheres to BR-LVB contract", () => {
    expect(template.code).toBe("GT-020");
    expect(template.mechanic).toBe("memory-flip");
    expect(template.age_min).toBe(3);
    expect(template.age_max).toBe(6);
    expect(template.requires_tap_fallback).toBe(false);
  });

  it("flips cards and completes round when all pairs are matched (BR-LVB-09)", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT020Session(f1.content, f1.difficulty);
    session.setupEntities();

    const telemetry1 = session.getTelemetry();
    const roundStarted = telemetry1.events.find(
      (e) => e.event_name === "round_started"
    );
    expect(roundStarted).toBeDefined();

    // Flip first card
    const res1 = session.onTapCard("cat-1");
    expect(res1?.state).toBe("face_up");
    expect(res1?.isSecondFlip).toBe(false);

    // Flip mismatch card (dog-1)
    const res2 = session.onTapCard("dog-1");
    expect(res2?.state).toBe("face_up");
    expect(res2?.isSecondFlip).toBe(true);
    expect(res2?.isMatch).toBe(false);

    // Close mismatch
    session.closeMismatch();

    // Flip cat-1 then cat-2
    session.onTapCard("cat-1");
    const resCat2 = session.onTapCard("cat-2");
    expect(resCat2?.isMatch).toBe(true);
    expect(session.checkWinCondition()).toBe(false);

    // Flip dog-1 then dog-2
    session.onTapCard("dog-1");
    const resDog2 = session.onTapCard("dog-2");
    expect(resDog2?.isMatch).toBe(true);

    // Won
    expect(session.checkWinCondition()).toBe(true);

    const telemetry2 = session.getTelemetry();
    const roundCompleted = telemetry2.events.find(
      (e) => e.event_name === "round_completed"
    );
    expect(roundCompleted).toBeDefined();
  });
});
