import { describe, expect, it } from "vitest";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures";
import { GT028Session } from "#src/templates/GT-028/session";
import template, {
  GT028ContentSchema,
  GT028DifficultySchema,
} from "#src/templates/GT-028/template";

const RE_TARGET_TOTAL_DIVISIBLE = /target_total phải chia hết cho step/;
const RE_ITEMS_STEP_MIN = /items.length \* step phải >= target_total/;

function getFixture(index: number) {
  const fixture = GT028_FIXTURES[index];
  if (!fixture) {
    throw new Error(`Fixture at index ${index} is missing`);
  }
  return fixture;
}

describe("GT-028: Chạm đếm tích luỹ (tap-count)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-028");
      expect(template.mechanic).toBe("tap-count");
      expect(template.layouts).toContain("grid");
      expect(template.layouts).toContain("flex-wrap");
      expect(template.age_min).toBe(4);
      expect(template.age_max).toBe(6);
      expect(template.banned_age_bands).toEqual(["3-4"]);
      expect(template.requires_tap_fallback).toBe(false);
      expect(template.events).toEqual([
        "game_started",
        "item_tapped",
        "count_undone",
        "count_submitted",
        "game_completed",
      ]);
      expect(template.input).toEqual({
        family: "tap",
        verbs: ["tap", "commit"],
        tolerance_px: 24,
      });
    });
  });

  describe("Contract Validation (BR-E028-01, BR-E028-02)", () => {
    it("parses all sample fixtures successfully", () => {
      for (const fixture of GT028_FIXTURES) {
        const parsedContent = GT028ContentSchema.parse(fixture.content);
        const parsedDiff = GT028DifficultySchema.parse(fixture.difficulty);
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects target_total not divisible by step (BR-E028-01)", () => {
      const invalid = {
        prompt: "Đếm nhảy cóc",
        step: 5,
        target_total: 12, // 12 % 5 !== 0
        items: [
          { item_id: "a1", asset: { kind: "emoji", ref: "⭐" } },
          { item_id: "a2", asset: { kind: "emoji", ref: "⭐" } },
          { item_id: "a3", asset: { kind: "emoji", ref: "⭐" } },
          { item_id: "a4", asset: { kind: "emoji", ref: "⭐" } },
        ],
      };
      expect(() => GT028ContentSchema.parse(invalid)).toThrow(
        RE_TARGET_TOTAL_DIVISIBLE
      );
    });

    it("rejects when items.length * step < target_total (BR-E028-02)", () => {
      const invalid = {
        prompt: "Đếm nhảy cóc",
        step: 10,
        target_total: 60, // items length 4 * 10 = 40 < 60
        items: [
          { item_id: "a1", asset: { kind: "emoji", ref: "⭐" } },
          { item_id: "a2", asset: { kind: "emoji", ref: "⭐" } },
          { item_id: "a3", asset: { kind: "emoji", ref: "⭐" } },
          { item_id: "a4", asset: { kind: "emoji", ref: "⭐" } },
        ],
      };
      expect(() => GT028ContentSchema.parse(invalid)).toThrow(
        RE_ITEMS_STEP_MIN
      );
    });
  });

  describe("Session Gameplay, Undo & Win Condition (BR-E028-03)", () => {
    it("validates actions purely without mutating state (BR-ENG-13)", () => {
      const f = getFixture(0);
      const session = new GT028Session(f.content, f.difficulty);
      session.setupEntities();

      expect(session.getCurrentCount()).toBe(0);

      const v1 = session.validateAction({
        type: "tap_item",
        data: { item_id: "apple_1" },
      });
      expect(v1.valid).toBe(true);
      expect(session.getCurrentCount()).toBe(0); // State unchanged

      const vSubmit = session.validateAction({
        type: "submit_count",
        data: {},
      });
      expect(vSubmit.valid).toBe(false);
      expect(session.checkWinCondition()).toBe(false);
    });

    it("runs complete gameplay loop with undo and submit", () => {
      const f = getFixture(0);
      const session = new GT028Session(f.content, f.difficulty);
      session.setupEntities();

      expect(session.getCurrentCount()).toBe(0);
      expect(session.checkWinCondition()).toBe(false);

      // Tap first 3 items (step = 2) -> count becomes 6
      expect(session.onTapItem("apple_1").valid).toBe(true);
      expect(session.getCurrentCount()).toBe(2);

      expect(session.onTapItem("apple_2").valid).toBe(true);
      expect(session.getCurrentCount()).toBe(4);

      expect(session.onTapItem("apple_3").valid).toBe(true);
      expect(session.getCurrentCount()).toBe(6);

      // Submit prematurely -> target is 8, current is 6 -> retry
      const premature = session.onSubmitCount();
      expect(premature.valid).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Undo apple_3 -> count back to 4
      expect(session.onTapItem("apple_3").valid).toBe(true);
      expect(session.getCurrentCount()).toBe(4);

      // Tap apple_3, apple_4 -> count = 8 (4 items * 2 = 8)
      session.onTapItem("apple_3");
      session.onTapItem("apple_4");
      expect(session.getCurrentCount()).toBe(8);

      // Submit correct count -> wins
      const submitRes = session.onSubmitCount();
      expect(submitRes.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);

      // checkWinCondition is pure
      for (let i = 0; i < 100; i++) {
        expect(session.checkWinCondition()).toBe(true);
      }

      session.completeSession();
      const telemetry = session.getTelemetry();
      const eventNames = telemetry.events.map((e) => e.event_name);
      expect(eventNames).toContain("game_started");
      expect(eventNames).toContain("item_tapped");
      expect(eventNames).toContain("count_undone");
      expect(eventNames).toContain("count_submitted");
      expect(eventNames).toContain("game_completed");
    });

    it("respects allow_undo: false", () => {
      const f = getFixture(0);
      const session = new GT028Session(f.content, {
        ...f.difficulty,
        allow_undo: false,
      });
      session.setupEntities();

      session.onTapItem("apple_1");
      expect(session.getCurrentCount()).toBe(2);

      // Tap again when allow_undo is false -> ignored
      const retryTap = session.onTapItem("apple_1");
      expect(retryTap.valid).toBe(false);
      expect(session.getCurrentCount()).toBe(2);
    });

    it("resolves slots properly", () => {
      const f = getFixture(1);
      const session = new GT028Session(f.content, f.difficulty);
      session.setupEntities();
      session.resolveSlots("4-5");
      expect(session.slots.length).toBe(f.content.items.length);
    });

    it("handles unified tap and commit gesture dispatch", () => {
      const f = getFixture(0);
      const session = new GT028Session(f.content, f.difficulty);
      session.prepareRound("4-5");

      // Tap outside slots -> ignored
      const missResult = session.dispatch({
        type: "tap",
        x: 10,
        y: 10,
        timeMs: 100,
      });
      expect(missResult).toEqual({ valid: false, feedback: "none" });

      const slot0 = session.slots[0];
      if (!slot0) {
        throw new Error("slot0 must exist");
      }

      // Tap on slot 0 -> selects apple_1
      const hitResult = session.dispatch({
        type: "tap",
        x: slot0.x,
        y: slot0.y,
        timeMs: 200,
      });
      expect(hitResult?.valid).toBe(true);
      expect(session.getCurrentCount()).toBe(2);

      const view = session.getView();
      expect(view.activePrompt).toBe(f.content.prompt);
      expect(view.entities.length).toBe(f.content.items.length);
      expect(view.entities[0]?.state).toBe("selected");

      // Submit prematurely -> invalid
      const commitPremature = session.dispatch({
        type: "commit",
        timeMs: 300,
      });
      expect(commitPremature?.valid).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Tap remaining items to reach target 8 (apple_2, apple_3, apple_4)
      for (let i = 1; i <= 3; i++) {
        const s = session.slots[i];
        if (!s) {
          throw new Error(`slot ${i} must exist`);
        }
        session.dispatch({
          type: "tap",
          x: s.x,
          y: s.y,
          timeMs: 400 + i * 100,
        });
      }
      expect(session.getCurrentCount()).toBe(8);

      // Commit when target is reached -> wins
      const commitWin = session.dispatch({
        type: "commit",
        timeMs: 800,
      });
      expect(commitWin?.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
    });
  });
});
