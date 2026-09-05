import { describe, expect, it } from "vitest";
import { GT026_FIXTURES, GT026Session } from "#src/index";
import template from "#src/templates/GT-026/template";

const f1 = GT026_FIXTURES[0];

describe("GT-026: Chỉ chạm khi đúng dấu (go-nogo)", () => {
  it("template metadata adheres to BR-LVB contract", () => {
    expect(template.code).toBe("GT-026");
    expect(template.mechanic).toBe("go-nogo");
    expect(template.age_min).toBe(4);
    expect(template.age_max).toBe(6);
    expect(template.banned_age_bands).toContain("3-4");
    expect(template.requires_tap_fallback).toBe(false);
  });

  it("handles go action and nogo inhibition correctly", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT026Session(f1.content, f1.difficulty);
    session.setupEntities();

    const telemetry1 = session.getTelemetry();
    const roundStarted = telemetry1.events.find(
      (e) => e.event_name === "round_started"
    );
    expect(roundStarted).toBeDefined();

    // Trial 1: "go"
    expect(session.getCurrentTrial()?.kind).toBe("go");
    expect(session.getState()).toBe("stimulus");

    // Tap on stimulus for "go" -> correct
    const resGo = session.onTapStimulus();
    expect(resGo.valid).toBe(true);

    // ISI gap: state should be "isi"
    expect(session.getState()).toBe("isi");

    // Advance through ISI (500ms)
    session.update(550);

    // Trial 2: "go"
    expect(session.getCurrentTrial()?.kind).toBe("go");
    expect(session.getState()).toBe("stimulus");
    const resGo2 = session.onTapStimulus();
    expect(resGo2.valid).toBe(true);

    // Advance through ISI to Trial 3 ("nogo")
    session.update(550);
    expect(session.getCurrentTrial()?.kind).toBe("nogo");
    expect(session.getState()).toBe("stimulus");

    // Let stimulus window time out without tap (inhibition success)
    const timeoutVerdict = session.update(
      f1.difficulty.stimulus_window_ms + 100
    );
    expect(timeoutVerdict).toBeDefined();
    expect(timeoutVerdict?.valid).toBe(true);
  });

  it("handles unified tap gesture dispatch", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT026Session(f1.content, f1.difficulty);
    session.prepareRound("4-5");

    const slot = session.slots[0];
    if (!slot) {
      throw new Error("slot must exist");
    }

    // Tap outside slot -> invalid
    const missResult = session.dispatch({
      type: "tap",
      x: 10,
      y: 10,
      timeMs: 100,
    });
    expect(missResult).toEqual({ valid: false, feedback: "none" });

    // Tap on stimulus slot for trial 1 ("go") -> correct
    const hitResult = session.dispatch({
      type: "tap",
      x: slot.x,
      y: slot.y,
      timeMs: 200,
    });
    expect(hitResult?.valid).toBe(true);

    const view = session.getView();
    expect(view.activePrompt).toBe(f1.content.prompt);
  });
});
