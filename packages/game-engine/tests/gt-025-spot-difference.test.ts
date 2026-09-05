import { describe, expect, it } from "vitest";
import { GT025Session } from "#src/index";
import { GT025_FIXTURES } from "#src/templates/GT-025/fixtures.js";
import template from "#src/templates/GT-025/template";

const f1 = GT025_FIXTURES[0];
const f2 = GT025_FIXTURES[1];

describe("GT-025: Tìm điểm khác biệt (spot-difference)", () => {
  it("template metadata adheres to BR-LVB contract", () => {
    expect(template.code).toBe("GT-025");
    expect(template.mechanic).toBe("spot-difference");
    expect(template.age_min).toBe(4);
    expect(template.age_max).toBe(6);
    expect(template.requires_tap_fallback).toBe(false);
  });

  it("finds differences by tapping objects and completes round", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT025Session(f1.content, f1.difficulty);
    session.setupEntities();

    const telemetry1 = session.getTelemetry();
    const roundStarted = telemetry1.events.find(
      (e) => e.event_name === "round_started"
    );
    expect(roundStarted).toBeDefined();

    // Tap non-difference item (sun) -> retry
    const resWrong = session.onTapObject("left-sun");
    expect(resWrong.valid).toBe(false);
    expect(session.getFoundCount()).toBe(0);
    expect(session.checkWinCondition()).toBe(false);

    // Tap difference item (left-cat) -> correct
    const resCorrect = session.onTapObject("left-cat");
    expect(resCorrect.valid).toBe(true);
    expect(session.getFoundCount()).toBe(1);
    expect(session.checkWinCondition()).toBe(true);

    const telemetry2 = session.getTelemetry();
    const roundCompleted = telemetry2.events.find(
      (e) => e.event_name === "round_completed"
    );
    expect(roundCompleted).toBeDefined();
  });

  it("handles multi-difference level correctly", () => {
    if (!f2) {
      throw new Error("Missing fixture");
    }
    const session = new GT025Session(f2.content, f2.difficulty);
    session.setupEntities();

    // Tap first diff on right side
    const res1 = session.onTapObject("r-flower-2");
    expect(res1.valid).toBe(true);
    expect(session.getFoundCount()).toBe(1);
    expect(session.checkWinCondition()).toBe(false);

    // Tap same diff again -> ignored
    const resDup = session.onTapObject("l-flower-2");
    expect(resDup.valid).toBe(false);
    expect(session.getFoundCount()).toBe(1);

    // Tap second diff
    const res2 = session.onTapObject("l-bird");
    expect(res2.valid).toBe(true);
    expect(session.getFoundCount()).toBe(2);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("handles unified tap gesture dispatch", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT025Session(f1.content, f1.difficulty);
    session.prepareRound("4-5");

    // Chạm ngoài toạ độ mọi object
    const missResult = session.dispatch({
      type: "tap",
      x: 10,
      y: 10,
      timeMs: 100,
    });
    expect(missResult).toEqual({ valid: false, feedback: "none" });

    // Chạm vào left-cat (x: 200, y: 300)
    const hitResult = session.dispatch({
      type: "tap",
      x: 200,
      y: 300,
      timeMs: 200,
    });
    expect(hitResult?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.getFoundCount()).toBe(1);

    const view = session.getView();
    expect(view.activePrompt).toBe(f1.content.prompt);
    const catEntity = view.entities.find((e) => e.id === "left-cat");
    expect(catEntity?.state).toBe("correct");
  });
});
