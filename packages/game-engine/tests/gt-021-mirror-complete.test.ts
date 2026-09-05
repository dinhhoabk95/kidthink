import { describe, expect, it } from "vitest";
import {
  computeMirrorAxisSplitLayout,
  GT021Session,
  resolveLayout,
} from "#src/index";
import { GT021_FIXTURES } from "#src/templates/GT-021/fixtures.js";
import template from "#src/templates/GT-021/template";

const f2 = GT021_FIXTURES[1];

describe("GT-021: Hoàn thiện đối xứng (mirror-complete)", () => {
  it("template metadata adheres to BR-LVB contract", () => {
    expect(template.code).toBe("GT-021");
    expect(template.mechanic).toBe("mirror-complete");
    expect(template.age_min).toBe(4);
    expect(template.age_max).toBe(6);
    expect(template.requires_tap_fallback).toBe(true);
  });

  it("mirror-axis-split layout generates valid slots and is registered in registry", () => {
    const layoutFn = resolveLayout("mirror-axis-split");
    expect(layoutFn).toBeDefined();

    const slots = computeMirrorAxisSplitLayout({
      slotCount: 3,
      ageBand: "4-5",
      targetCount: 2,
    });
    expect(slots.length).toBe(1 + 2 + 3); // 1 neutral reference + 2 targets + 3 sources
    expect(slots[0]?.role).toBe("neutral");
    expect(slots[1]?.role).toBe("target");
    expect(slots[3]?.role).toBe("source");
  });

  it("places options and completes round when symmetric pattern is finished (BR-LVB-09)", () => {
    if (!f2) {
      throw new Error("Missing fixture");
    }
    const session = new GT021Session(f2.content, f2.difficulty);
    session.setupEntities();

    const telemetry1 = session.getTelemetry();
    const roundStarted = telemetry1.events.find(
      (e) => e.event_name === "round_started"
    );
    expect(roundStarted).toBeDefined();

    // Place wrong option
    const resWrong = session.onPlaceOption("opt-yellow", "top-right");
    expect(resWrong.valid).toBe(false);
    expect(session.checkWinCondition()).toBe(false);

    // Place correct top-right
    const resTop = session.onPlaceOption("opt-red", "top-right");
    expect(resTop.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(false);

    // Place correct bottom-right
    const resBottom = session.onPlaceOption("opt-blue", "bottom-right");
    expect(resBottom.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);

    const telemetry2 = session.getTelemetry();
    const roundCompleted = telemetry2.events.find(
      (e) => e.event_name === "round_completed"
    );
    expect(roundCompleted).toBeDefined();
  });
});
