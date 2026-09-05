import { describe, expect, it } from "vitest";
import {
  computeFreeSceneLayout,
  GT022Session,
  resolveLayout,
} from "#src/index";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures.js";
import template from "#src/templates/GT-022/template";

const f2 = GT022_FIXTURES[1];
const f3 = GT022_FIXTURES[2];

describe("GT-022: Tìm vật thể ẩn (hidden-object)", () => {
  it("template metadata adheres to BR-LVB contract", () => {
    expect(template.code).toBe("GT-022");
    expect(template.mechanic).toBe("hidden-object");
    expect(template.age_min).toBe(4);
    expect(template.age_max).toBe(6);
    expect(template.requires_tap_fallback).toBe(false);
  });

  it("free-scene layout generates valid slots and is registered in registry", () => {
    const layoutFn = resolveLayout("free-scene");
    expect(layoutFn).toBeDefined();

    const slots = computeFreeSceneLayout({
      slotCount: 4,
      ageBand: "4-5",
    });
    expect(slots.length).toBe(4);
    for (const slot of slots) {
      expect(slot.hitW).toBeGreaterThanOrEqual(64);
      expect(slot.hitH).toBeGreaterThanOrEqual(64);
    }
  });

  it("finds hidden objects and completes round when all targets found (BR-LVB-09, BR-LVB-11)", () => {
    if (!f2) {
      throw new Error("Missing fixture");
    }
    const session = new GT022Session(f2.content, f2.difficulty);
    session.setupEntities();

    const telemetry1 = session.getTelemetry();
    const roundStarted = telemetry1.events.find(
      (e) => e.event_name === "round_started"
    );
    expect(roundStarted).toBeDefined();

    // Tap distractor
    const resDistractor = session.onTapObject("seaweed");
    expect(resDistractor.valid).toBe(false);
    expect(session.checkWinCondition()).toBe(false);

    // Tap first fish
    const resFish1 = session.onTapObject("fish-1");
    expect(resFish1.valid).toBe(true);
    expect(resFish1.isNewFind).toBe(true);
    expect(session.checkWinCondition()).toBe(false);

    // Tap second fish
    const resFish2 = session.onTapObject("fish-2");
    expect(resFish2.valid).toBe(true);
    expect(resFish2.isNewFind).toBe(true);
    expect(session.checkWinCondition()).toBe(true);

    const telemetry2 = session.getTelemetry();
    const roundCompleted = telemetry2.events.find(
      (e) => e.event_name === "round_completed"
    );
    expect(roundCompleted).toBeDefined();
  });

  it("reveals hidden object before finding (Level 3)", () => {
    if (!f3) {
      throw new Error("Missing fixture");
    }
    const session = new GT022Session(f3.content, f3.difficulty);
    session.setupEntities();

    const rev = session.onRevealObject("target-rabbit");
    expect(rev).toBe(true);

    const res = session.onTapObject("target-rabbit");
    expect(res.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });
});
