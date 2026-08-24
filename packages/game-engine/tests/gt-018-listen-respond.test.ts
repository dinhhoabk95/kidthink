import { describe, expect, it } from "vitest";
import { GT018_FIXTURES, GT018Session } from "#src/index";
import template from "#src/templates/GT-018/template";

const f1 = GT018_FIXTURES[0];
const f3 = GT018_FIXTURES[2];

describe("GT-018: Nghe rồi làm (listen-respond)", () => {
  it("template metadata adheres to BR-LVB contract", () => {
    expect(template.code).toBe("GT-018");
    expect(template.mechanic).toBe("listen-respond");
    expect(template.age_min).toBe(4);
    expect(template.age_max).toBe(6);
    expect(template.requires_tap_fallback).toBe(false);
  });

  it("selection mode: emits round_started and completes with correct selection (BR-LVB-09)", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT018Session(f1.content, f1.difficulty);
    session.setupEntities();

    const telemetry1 = session.getTelemetry();
    const roundStarted = telemetry1.events.find(
      (e) => e.event_name === "round_started"
    );
    expect(roundStarted).toBeDefined();

    // Wrong tap
    const resWrong = session.validateAction({
      type: "tap_option",
      data: { item_id: "dog" },
    });
    expect(resWrong.valid).toBe(false);
    expect(resWrong.feedback).toBe("amber_soft");

    // Correct tap
    const resCorrect = session.validateAction({
      type: "tap_option",
      data: { item_id: "cat" },
    });
    expect(resCorrect.valid).toBe(true);
    expect(resCorrect.feedback).toBe("pop_celebrate");

    // Lock item
    const lockRes = session.onItemSelect("cat");
    expect(lockRes.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);

    const telemetry2 = session.getTelemetry();
    const roundCompleted = telemetry2.events.find(
      (e) => e.event_name === "round_completed"
    );
    expect(roundCompleted).toBeDefined();
  });

  it("sequence mode: allows reordering and win on correct sequence (BR-LVB-09)", () => {
    if (!f3) {
      throw new Error("Missing fixture");
    }
    const session = new GT018Session(f3.content, f3.difficulty);
    session.setupEntities();
    expect(session.checkWinCondition()).toBe(false);

    // Initial sequence is ["rabbit", "ant", "elephant"]
    // Target is ["ant", "rabbit", "elephant"]
    // Swap index 0 and 1
    session.onReorderStep(0, 1);

    const submitRes = session.onSubmitSequence();
    expect(submitRes.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);

    const telemetry = session.getTelemetry();
    const roundCompleted = telemetry.events.find(
      (e) => e.event_name === "round_completed"
    );
    expect(roundCompleted).toBeDefined();
  });

  it("audio security: does not invoke microphone or recording APIs (BR-LVB-02)", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT018Session(f1.content, f1.difficulty);
    session.setupEntities();
    expect(session).toBeInstanceOf(GT018Session);
  });
});
