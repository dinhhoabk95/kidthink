import { describe, expect, it } from "vitest";
import { rotatePiece90, togglePieceFlip } from "#src/index";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures.js";
import { GT019Session } from "#src/templates/GT-019/session.js";
import template from "#src/templates/GT-019/template";

const f1 = GT019_FIXTURES[0];
const f3 = GT019_FIXTURES[2];

describe("GT-019: Xoay và lật mảnh (rotate-transform)", () => {
  it("template metadata enforces tap fallback (BR-LVB-06, BR-GTC-06)", () => {
    expect(template.code).toBe("GT-019");
    expect(template.mechanic).toBe("rotate-transform");
    expect(template.age_min).toBe(4);
    expect(template.age_max).toBe(6);
    expect(template.requires_tap_fallback).toBe(true);
  });

  it("discrete 90° rotation helper works without gestures (BR-LVB-02, BR-ENG-12)", () => {
    expect(rotatePiece90(0, "cw")).toBe(90);
    expect(rotatePiece90(90, "cw")).toBe(180);
    expect(rotatePiece90(180, "cw")).toBe(270);
    expect(rotatePiece90(270, "cw")).toBe(0);

    expect(rotatePiece90(0, "ccw")).toBe(270);
    expect(rotatePiece90(270, "ccw")).toBe(180);

    expect(togglePieceFlip("none", "horizontal")).toBe("horizontal");
    expect(togglePieceFlip("horizontal", "horizontal")).toBe("none");
  });

  it("rotates piece via button action and places to win (BR-LVB-09)", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT019Session(f1.content, f1.difficulty);
    session.setupEntities();

    const telemetry1 = session.getTelemetry();
    const roundStarted = telemetry1.events.find(
      (e) => e.event_name === "round_started"
    );
    expect(roundStarted).toBeDefined();

    // Initial rotation is 90°, target is 0°
    expect(session.getPieceTransform("arrow-1")?.rotation).toBe(90);

    // Rotate 3 times CW (90 -> 180 -> 270 -> 0)
    session.onRotatePiece("arrow-1", "cw");
    session.onRotatePiece("arrow-1", "cw");
    session.onRotatePiece("arrow-1", "cw");
    expect(session.getPieceTransform("arrow-1")?.rotation).toBe(0);

    // Place via tap-tap or drop
    const placeRes = session.onPlacePiece("arrow-1", "slot-1");
    expect(placeRes.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);

    const telemetry2 = session.getTelemetry();
    const roundCompleted = telemetry2.events.find(
      (e) => e.event_name === "round_completed"
    );
    expect(roundCompleted).toBeDefined();
  });

  it("flip transformation works when allow_flip is true (Level 3)", () => {
    if (!f3) {
      throw new Error("Missing fixture");
    }
    const session = new GT019Session(f3.content, f3.difficulty);
    session.setupEntities();

    // Rotate to 90°
    session.onRotatePiece("piece-hand", "cw");
    // Flip horizontally
    session.onFlipPiece("piece-hand", "horizontal");

    expect(session.getPieceTransform("piece-hand")).toEqual({
      rotation: 90,
      flip: "horizontal",
    });

    const placeRes = session.onPlacePiece("piece-hand", "slot-hand");
    expect(placeRes.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });
});
