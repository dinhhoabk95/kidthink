import { describe, expect, it } from "vitest";
import { GT023_FIXTURES, GT023Session } from "#src/index";
import template from "#src/templates/GT-023/template";

const f1 = GT023_FIXTURES[0];

describe("GT-023: Lắp ghép hình thể (construct)", () => {
  it("template metadata adheres to BR-LVB contract", () => {
    expect(template.code).toBe("GT-023");
    expect(template.mechanic).toBe("construct");
    expect(template.age_min).toBe(4);
    expect(template.age_max).toBe(6);
    expect(template.requires_tap_fallback).toBe(true);
  });

  it("assembles parts via tap-tap or snap and completes round (BR-LVB-09)", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT023Session(f1.content, f1.difficulty);
    session.setupEntities();

    const telemetry1 = session.getTelemetry();
    const roundStarted = telemetry1.events.find(
      (e) => e.event_name === "round_started"
    );
    expect(roundStarted).toBeDefined();

    // Snap roof near roof anchor (480, 180)
    const snapRoof = session.onSnapPart("part-roof", 485, 175);
    expect(snapRoof?.isAnchorMatch).toBe(true);
    expect(session.checkWinCondition()).toBe(false);

    // Snap wall near wall anchor (480, 320)
    const snapWall = session.onSnapPart("part-wall", 475, 325);
    expect(snapWall?.isAnchorMatch).toBe(true);
    expect(session.checkWinCondition()).toBe(true);

    const telemetry2 = session.getTelemetry();
    const roundCompleted = telemetry2.events.find(
      (e) => e.event_name === "round_completed"
    );
    expect(roundCompleted).toBeDefined();
  });
});
