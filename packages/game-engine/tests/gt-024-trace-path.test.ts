import { describe, expect, it } from "vitest";
import { GT024Session } from "#src/index";
import { GT024_FIXTURES } from "#src/templates/GT-024/fixtures.js";
import template from "#src/templates/GT-024/template";

const f1 = GT024_FIXTURES[0];

describe("GT-024: Vẽ theo nét (trace-path)", () => {
  it("template metadata enforces age limits and banned 3-4 band (BR-LVB-08)", () => {
    expect(template.code).toBe("GT-024");
    expect(template.mechanic).toBe("trace-path");
    expect(template.age_min).toBe(5);
    expect(template.age_max).toBe(6);
    expect(template.banned_age_bands).toContain("3-4");
    expect(template.requires_tap_fallback).toBe(false);
  });

  it("traces waypoints in order and completes round (BR-LVB-09)", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT024Session(f1.content, f1.difficulty);
    session.setupEntities();

    const telemetry1 = session.getTelemetry();
    const roundStarted = telemetry1.events.find(
      (e) => e.event_name === "round_started"
    );
    expect(roundStarted).toBeDefined();

    // Hit wp-top (480, 150)
    const res1 = session.onTracePoint({ x: 480, y: 150 });
    expect(res1.valid).toBe(true);
    expect(res1.reachedWaypointId).toBe("wp-top");
    expect(session.checkWinCondition()).toBe(false);

    // Hit wp-right (650, 380)
    const res2 = session.onTracePoint({ x: 655, y: 380 });
    expect(res2.valid).toBe(true);
    expect(res2.reachedWaypointId).toBe("wp-right");
    expect(session.checkWinCondition()).toBe(false);

    // Hit wp-left (310, 380)
    const res3 = session.onTracePoint({ x: 310, y: 385 });
    expect(res3.valid).toBe(true);
    expect(res3.reachedWaypointId).toBe("wp-left");
    expect(session.checkWinCondition()).toBe(false);

    // Hit wp-top-close (480, 150)
    const res4 = session.onTracePoint({ x: 480, y: 150 });
    expect(res4.valid).toBe(true);
    expect(res4.isComplete).toBe(true);
    expect(session.checkWinCondition()).toBe(true);

    const telemetry2 = session.getTelemetry();
    const roundCompleted = telemetry2.events.find(
      (e) => e.event_name === "round_completed"
    );
    expect(roundCompleted).toBeDefined();
    const traceCompleted = telemetry2.events.find(
      (e) => e.event_name === "trace_completed"
    );
    expect(traceCompleted).toBeDefined();
  });

  it("handles stroke and tap gestures via unified input dispatch", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT024Session(f1.content, f1.difficulty);
    session.prepareRound("5-6");

    // Gesture tap outside waypoint -> invalid
    const missTap = session.dispatch({
      type: "tap",
      x: 50,
      y: 50,
      timeMs: 100,
    });
    expect(missTap).toEqual({ valid: false, feedback: "none" });

    // Gesture stroke across wp-top (480, 150)
    const stroke1 = session.dispatch({
      type: "stroke",
      points: [
        { x: 470, y: 140 },
        { x: 480, y: 150 },
        { x: 490, y: 160 },
      ],
      timeMs: 200,
    });
    expect(stroke1?.valid).toBe(true);
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(1);

    // Gesture tap wp-right (650, 380)
    const tap2 = session.dispatch({
      type: "tap",
      x: 650,
      y: 380,
      timeMs: 300,
    });
    expect(tap2?.valid).toBe(true);
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(2);

    const view = session.getView();
    expect(view.activePrompt).toBe(f1.content.prompt);
    expect(view.entities.length).toBe(f1.content.waypoints.length);
    expect(view.entities[0]?.state).toBe("correct");
    expect(view.entities[1]?.state).toBe("correct");
    expect(view.entities[2]?.state).toBe("active");
  });
});
