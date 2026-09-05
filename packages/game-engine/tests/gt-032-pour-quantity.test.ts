import { describe, expect, it } from "vitest";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures";
import { GT032Session } from "#src/templates/GT-032/session";
import template, {
  GT032ContentSchema,
  GT032DifficultySchema,
} from "#src/templates/GT-032/template";

const RE_FILL_LE_CAPACITY =
  /Mức nước fill_units phải nhỏ hơn hoặc bằng dung tích capacity_units/;
const RE_TRAP_PAIRS =
  /Khi conservation_trap bật, phải có ít nhất 2 cốc cùng fill_units mà khác shape/;

function getFixture(index: number) {
  const fixture = GT032_FIXTURES[index];
  if (!fixture) {
    throw new Error(`Fixture at index ${index} is missing`);
  }
  return fixture;
}

describe("GT-032: So lượng chất lỏng (pour-quantity)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-032");
      expect(template.name).toBe("So lượng chất lỏng");
      expect(template.mechanic).toBe("pour-quantity");
      expect(template.layouts).toContain("horizontal-row");
      expect(template.layouts).toContain("split-columns");
      expect(template.age_min).toBe(5);
      expect(template.age_max).toBe(6);
      expect(template.banned_age_bands).toEqual(["3-4", "4-5"]);
      expect(template.requires_tap_fallback).toBe(false);
      expect(template.input).toEqual({
        family: "tap",
        verbs: ["tap"],
        tolerance_px: 24,
      });
      expect(template.events).toEqual([
        "game_started",
        "cup_selected",
        "liquid_poured",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation (BR-E032-01..04)", () => {
    it("parses all sample fixtures successfully", () => {
      for (const fixture of GT032_FIXTURES) {
        const parsedContent = GT032ContentSchema.parse(fixture.content);
        const parsedDiff = GT032DifficultySchema.parse(fixture.difficulty);
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects when fill_units exceeds capacity_units (BR-E032-01)", () => {
      const invalid = {
        prompt: "Bé chọn cốc nhiều nước hơn nhé!",
        question_type: "more" as const,
        conservation_trap: false,
        cups: [
          {
            cup_id: "c1",
            shape: "standard" as const,
            capacity_units: 5,
            fill_units: 6, // 6 > 5!
          },
          {
            cup_id: "c2",
            shape: "standard" as const,
            capacity_units: 5,
            fill_units: 3,
          },
        ],
      };
      expect(() => GT032ContentSchema.parse(invalid)).toThrow(
        RE_FILL_LE_CAPACITY
      );
    });

    it("rejects float / non-integer fill_units (BR-E032-01)", () => {
      const invalid = {
        prompt: "Bé chọn cốc nhiều nước hơn nhé!",
        question_type: "more" as const,
        conservation_trap: false,
        cups: [
          {
            cup_id: "c1",
            shape: "standard" as const,
            capacity_units: 5,
            fill_units: 2.5,
          },
          {
            cup_id: "c2",
            shape: "standard" as const,
            capacity_units: 5,
            fill_units: 3,
          },
        ],
      };
      expect(() => GT032ContentSchema.parse(invalid)).toThrow();
    });

    it("rejects when conservation_trap is true but no pair with same fill and different shape exists (BR-E032-02)", () => {
      const invalid = {
        prompt: "Bé chọn cốc bằng nhau nhé!",
        question_type: "same" as const,
        conservation_trap: true,
        cups: [
          {
            cup_id: "c1",
            shape: "narrow_tall" as const,
            capacity_units: 8,
            fill_units: 3,
          },
          {
            cup_id: "c2",
            shape: "wide_short" as const,
            capacity_units: 8,
            fill_units: 5, // different fill units!
          },
        ],
      };
      expect(() => GT032ContentSchema.parse(invalid)).toThrow(RE_TRAP_PAIRS);
    });
  });

  describe("Session Gameplay & Comparison Rules", () => {
    it("validates actions purely without mutating state (BR-ENG-13)", () => {
      const f = getFixture(0);
      const session = new GT032Session(f.content, f.difficulty);
      session.setupEntities();

      expect(session.checkWinCondition()).toBe(false);
      expect(session.getSelectedCupId()).toBeNull();
      const eventsBefore = session.getTelemetry().events.length;

      const v = session.validateAction({
        type: "select_cup",
        data: { cup_id: "cup_b" },
      });
      expect(v.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(false);
      expect(session.getSelectedCupId()).toBeNull();
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
    });

    it("runs question_type 'more' correctly", () => {
      const f = getFixture(0); // cup_a fill: 2, cup_b fill: 5
      const session = new GT032Session(f.content, f.difficulty);
      session.setupEntities();

      expect(session.checkWinCondition()).toBe(false);

      // Wrong selection: cup_a (has 2)
      const wrong = session.validateAction({
        type: "select_cup",
        data: { cup_id: "cup_a" },
      });
      expect(wrong.valid).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Correct selection: cup_b (has 5)
      const correct = session.validateAction({
        type: "select_cup",
        data: { cup_id: "cup_b" },
      });
      expect(correct.valid).toBe(true);
      session.commit({ type: "select_cup", data: { cup_id: "cup_b" } });
      expect(session.checkWinCondition()).toBe(true);
      expect(session.getSelectedCupId()).toBe("cup_b");

      // Win condition purity
      for (let i = 0; i < 100; i++) {
        expect(session.checkWinCondition()).toBe(true);
      }

      session.completeSession();
      const telemetry = session.getTelemetry();
      expect(telemetry.events.map((e) => e.event_name)).toContain(
        "cup_selected"
      );
    });

    it("runs question_type 'less' correctly", () => {
      const f = getFixture(2); // cup_1: 6, cup_2: 2, cup_3: 5 -> min is cup_2 (2)
      const session = new GT032Session(f.content, f.difficulty);
      session.setupEntities();

      const wrong = session.validateAction({
        type: "select_cup",
        data: { cup_id: "cup_1" },
      });
      expect(wrong.valid).toBe(false);

      const correct = session.validateAction({
        type: "select_cup",
        data: { cup_id: "cup_2" },
      });
      expect(correct.valid).toBe(true);
      session.commit({ type: "select_cup", data: { cup_id: "cup_2" } });
      expect(session.checkWinCondition()).toBe(true);
    });

    it("runs Piaget conservation trap with question_type 'same' correctly", () => {
      const f = getFixture(1); // cup_tall (fill: 4), cup_wide (fill: 4), cup_small (fill: 2)
      const session = new GT032Session(f.content, f.difficulty);
      session.setupEntities();

      // Selecting cup_small (fill: 2) is incorrect
      const wrong = session.validateAction({
        type: "select_cup",
        data: { cup_id: "cup_small" },
      });
      expect(wrong.valid).toBe(false);

      // Selecting cup_tall (fill: 4) is correct
      const correct1 = session.validateAction({
        type: "select_cup",
        data: { cup_id: "cup_tall" },
      });
      expect(correct1.valid).toBe(true);
      session.commit({ type: "select_cup", data: { cup_id: "cup_tall" } });
      expect(session.checkWinCondition()).toBe(true);
    });

    it("handles show_hint action enabling tick marks", () => {
      const f = getFixture(0);
      const session = new GT032Session(f.content, f.difficulty);
      session.setupEntities();

      expect(session.showHintMarks).toBe(false);
      const res = session.validateAction({ type: "show_hint", data: {} });
      expect(res.valid).toBe(true);
      session.commit({ type: "show_hint", data: {} });
      expect(session.showHintMarks).toBe(true);
    });

    it("ignores unknown actions cleanly", () => {
      const f = getFixture(0);
      const session = new GT032Session(f.content, f.difficulty);
      session.setupEntities();

      const invalid = session.validateAction({
        type: "unknown_action",
        data: {},
      });
      expect(invalid.valid).toBe(false);
    });

    it("handles unified tap gesture dispatch and view generation", () => {
      const f = getFixture(0);
      const session = new GT032Session(f.content, f.difficulty);
      session.prepareRound("5-6");

      // Tap outside -> miss
      const miss = session.dispatch({
        type: "tap",
        x: 10,
        y: 10,
        timeMs: 100,
      });
      expect(miss).toEqual({ valid: false, feedback: "none" });

      const cup0Slot = session.slots[0];
      const cup1Slot = session.slots[1]; // cup_b (correct)
      if (!(cup0Slot && cup1Slot)) {
        throw new Error("cup slots must exist");
      }

      // Tap wrong cup (cup_a) -> retry
      const tapWrong = session.dispatch({
        type: "tap",
        x: cup0Slot.x,
        y: cup0Slot.y,
        timeMs: 200,
      });
      expect(tapWrong?.valid).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Tap correct cup (cup_b) -> correct & win
      const tapCorrect = session.dispatch({
        type: "tap",
        x: cup1Slot.x,
        y: cup1Slot.y,
        timeMs: 300,
      });
      expect(tapCorrect?.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
      expect(session.getSelectedCupId()).toBe("cup_b");

      const view = session.getView();
      expect(view.activePrompt).toBe(f.content.prompt);
      expect(view.entities.length).toBe(f.content.cups.length);
      const correctEntity = view.entities.find((e) => e.id === "cup_b");
      expect(correctEntity?.state).toBe("correct");
    });
  });
});
