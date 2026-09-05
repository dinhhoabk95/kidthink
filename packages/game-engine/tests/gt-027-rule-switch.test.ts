import { describe, expect, it } from "vitest";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures.js";
import { GT027Session } from "#src/templates/GT-027/session.js";
import template from "#src/templates/GT-027/template";

const f1 = GT027_FIXTURES[0];

describe("GT-027: Đổi luật giữa chừng (rule-switch)", () => {
  it("template metadata adheres to contract", () => {
    expect(template.code).toBe("GT-027");
    expect(template.mechanic).toBe("rule-switch");
    expect(template.age_min).toBe(5);
    expect(template.age_max).toBe(6);
    expect(template.banned_age_bands).toContain("3-4");
    expect(template.requires_tap_fallback).toBe(false);
    expect(template.input).toEqual({
      family: "tap",
      verbs: ["tap"],
      tolerance_px: 24,
    });
  });

  it("evaluates rules, switches rule after target trials, and completes round", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT027Session(f1.content, f1.difficulty);
    session.setupEntities();

    expect(session.getActiveRule()?.id).toBe("rule-red");
    expect(session.isSignaling()).toBe(false);

    // Rule 1: target red
    // it-3 is star/yellow -> wrong under Rule 1
    const resWrong = session.onSelectItem("it-3");
    expect(resWrong.valid).toBe(false);

    // it-1 is red circle -> correct
    const res1 = session.onSelectItem("it-1");
    expect(res1.valid).toBe(true);
    expect(session.isSignaling()).toBe(false);

    // it-2 is red square -> correct (2nd success -> triggers switch)
    const res2 = session.onSelectItem("it-2");
    expect(res2.valid).toBe(true);
    expect(session.isSignaling()).toBe(true);
    expect(session.getSignalInfo()?.text).toBe(
      "Đổi luật rồi: Giờ bé hãy chọn hình ngôi sao nhé!"
    );

    // During signal duration, selection is ignored
    const resDuringSignal = session.onSelectItem("it-3");
    expect(resDuringSignal.valid).toBe(false);

    // Advance time past signal duration (2000ms)
    session.update(2100);
    expect(session.isSignaling()).toBe(false);
    expect(session.getActiveRule()?.id).toBe("rule-star");

    // Rule 2: target star
    // it-1 is red circle -> wrong under Rule 2
    const resWrongRule2 = session.onSelectItem("it-1");
    expect(resWrongRule2.valid).toBe(false);

    // it-3 is yellow star -> correct
    const res3 = session.onSelectItem("it-3");
    expect(res3.valid).toBe(true);

    // it-4 is blue star -> correct (2nd success under Rule 2 -> reaches target total 4 -> wins)
    const res4 = session.onSelectItem("it-4");
    expect(res4.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("handles unified tap gesture dispatch", () => {
    if (!f1) {
      throw new Error("Missing fixture");
    }
    const session = new GT027Session(f1.content, f1.difficulty);
    session.prepareRound("5-6");

    expect(session.slots.length).toBe(f1.content.items.length);

    // Tap outside slots -> ignored
    const missResult = session.dispatch({
      type: "tap",
      x: 10,
      y: 10,
      timeMs: 100,
    });
    expect(missResult).toEqual({ valid: false, feedback: "none" });

    // it-1 (red circle) is at slot index 0
    const slot0 = session.slots[0];
    if (!slot0) {
      throw new Error("slot0 must exist");
    }

    const hitResult = session.dispatch({
      type: "tap",
      x: slot0.x,
      y: slot0.y,
      timeMs: 200,
    });
    expect(hitResult?.valid).toBe(true);

    const view = session.getView();
    expect(view.activePrompt).toBe(f1.content.prompt);
    expect(view.entities.length).toBe(f1.content.items.length);
    expect(view.entities[0]?.id).toBe("it-1");
    expect(view.entities[0]?.state).toBe("correct");
  });
});
