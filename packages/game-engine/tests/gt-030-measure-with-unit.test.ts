import { describe, expect, it } from "vitest";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures";
import { GT030Session } from "#src/templates/GT-030/session";
import template, {
  GT030ContentSchema,
  GT030DifficultySchema,
} from "#src/templates/GT-030/template";

const RE_ANSWER_OPTIONS_MATCH =
  /Phải có đúng 1 đáp án đúng và giá trị của nó phải bằng object\.length_in_units/;

function getFixture(index: number) {
  const fixture = GT030_FIXTURES[index];
  if (!fixture) {
    throw new Error(`Fixture at index ${index} is missing`);
  }
  return fixture;
}

describe("GT-030: Đo bằng đơn vị lặp (measure-with-unit)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-030");
      expect(template.name).toBe("Đo bằng đơn vị lặp");
      expect(template.mechanic).toBe("measure-with-unit");
      expect(template.layouts).toContain("measure-strip");
      expect(template.layouts).toContain("horizontal-track");
      expect(template.age_min).toBe(5);
      expect(template.age_max).toBe(6);
      expect(template.banned_age_bands).toEqual(["3-4", "4-5"]);
      expect(template.requires_tap_fallback).toBe(true);
      expect(template.events).toEqual([
        "game_started",
        "unit_placed",
        "unit_removed",
        "answer_selected",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation (BR-E030-01..04)", () => {
    it("parses all sample fixtures successfully", () => {
      for (const fixture of GT030_FIXTURES) {
        const parsedContent = GT030ContentSchema.parse(fixture.content);
        const parsedDiff = GT030DifficultySchema.parse(fixture.difficulty);
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects when correct answer does not match object.length_in_units (BR-E030-01)", () => {
      const invalid = {
        prompt: "Bé hãy đo cây bút",
        object: {
          object_id: "obj1",
          asset: { kind: "emoji", ref: "✏️" },
          length_in_units: 4,
        },
        unit: {
          unit_id: "u1",
          asset: { kind: "emoji", ref: "📎" },
        },
        answer_options: [
          { option_id: "opt_3", value: 3, is_correct: false },
          { option_id: "opt_5", value: 5, is_correct: true }, // Marked 5 correct instead of 4
        ],
      };
      expect(() => GT030ContentSchema.parse(invalid)).toThrow(
        RE_ANSWER_OPTIONS_MATCH
      );
    });

    it("rejects when no answer option is marked correct", () => {
      const invalid = {
        prompt: "Bé hãy đo cây bút",
        object: {
          object_id: "obj1",
          asset: { kind: "emoji", ref: "✏️" },
          length_in_units: 4,
        },
        unit: {
          unit_id: "u1",
          asset: { kind: "emoji", ref: "📎" },
        },
        answer_options: [
          { option_id: "opt_3", value: 3, is_correct: false },
          { option_id: "opt_4", value: 4, is_correct: false },
        ],
      };
      expect(() => GT030ContentSchema.parse(invalid)).toThrow(
        RE_ANSWER_OPTIONS_MATCH
      );
    });

    it("rejects when length_in_units is outside 2..10 bounds", () => {
      const invalidLow = {
        prompt: "Bé hãy đo cây bút",
        object: {
          object_id: "obj1",
          asset: { kind: "emoji", ref: "✏️" },
          length_in_units: 1, // < 2
        },
        unit: {
          unit_id: "u1",
          asset: { kind: "emoji", ref: "📎" },
        },
        answer_options: [{ option_id: "opt_1", value: 1, is_correct: true }],
      };
      expect(() => GT030ContentSchema.parse(invalidLow)).toThrow();
    });
  });

  describe("Session Gameplay, Placement, Undo & Scoring", () => {
    it("validates actions purely without mutating state (BR-ENG-13)", () => {
      const f = getFixture(0);
      const session = new GT030Session(f.content, f.difficulty);
      session.setupEntities();

      expect(session.getPlacedUnitsCount()).toBe(0);

      const v = session.validateAction({
        type: "place_unit",
        data: {},
      });
      expect(v.valid).toBe(true);
      expect(session.getPlacedUnitsCount()).toBe(0); // State unchanged
    });

    it("runs complete measurement loop with unit placement and answer selection", () => {
      const f = getFixture(0); // 4 units target length
      const session = new GT030Session(f.content, f.difficulty);
      session.setupEntities();

      expect(session.getPlacedUnitsCount()).toBe(0);
      expect(session.checkWinCondition()).toBe(false);

      // Attempting to select an answer before placing all units is rejected
      const premature = session.validateAction({
        type: "select_option",
        data: { option_id: "opt_4" },
      });
      expect(premature.valid).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Place 1st unit
      const place1 = session.validateAction({
        type: "place_unit",
        data: {},
      });
      expect(place1.valid).toBe(true);
      session.commit({ type: "place_unit", data: {} });
      expect(session.getPlacedUnitsCount()).toBe(1);

      // Undo / Remove 1st unit
      const undo1 = session.validateAction({
        type: "remove_unit",
        data: {},
      });
      expect(undo1.valid).toBe(true);
      session.commit({ type: "remove_unit", data: {} });
      expect(session.getPlacedUnitsCount()).toBe(0);

      // Place all 4 units
      for (let i = 1; i <= 4; i++) {
        const place = session.validateAction({
          type: "place_unit",
          data: {},
        });
        expect(place.valid).toBe(true);
        session.commit({ type: "place_unit", data: {} });
        expect(session.getPlacedUnitsCount()).toBe(i);
      }

      // Trying to place a 5th unit when length is 4 is rejected
      const extraPlace = session.validateAction({
        type: "place_unit",
        data: {},
      });
      expect(extraPlace.valid).toBe(false);
      expect(session.getPlacedUnitsCount()).toBe(4);

      // Choose wrong answer
      const wrongChoice = session.validateAction({
        type: "select_option",
        data: { option_id: "opt_3" },
      });
      expect(wrongChoice.valid).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Choose correct answer
      const correctChoice = session.validateAction({
        type: "select_option",
        data: { option_id: "opt_4" },
      });
      expect(correctChoice.valid).toBe(true);
      session.commit({
        type: "select_option",
        data: { option_id: "opt_4" },
      });
      expect(session.checkWinCondition()).toBe(true);

      // Purity check
      for (let i = 0; i < 100; i++) {
        expect(session.checkWinCondition()).toBe(true);
      }

      session.completeSession();
      const telemetry = session.getTelemetry();
      const eventNames = telemetry.events.map((e) => e.event_name);
      expect(eventNames).toContain("game_started");
      expect(eventNames).toContain("unit_placed");
      expect(eventNames).toContain("unit_removed");
      expect(eventNames).toContain("answer_selected");
      expect(eventNames).toContain("game_completed");
    });

    it("handles fast repeated action before animation resolves", () => {
      const f = getFixture(1); // 5 units
      const session = new GT030Session(f.content, f.difficulty);
      session.setupEntities();

      for (let i = 0; i < 10; i++) {
        session.commit({ type: "place_unit", data: {} });
      }
      expect(session.getPlacedUnitsCount()).toBe(5);

      for (let i = 0; i < 10; i++) {
        session.commit({ type: "remove_unit", data: {} });
      }
      expect(session.getPlacedUnitsCount()).toBe(0);
    });

    it("ignores unknown actions cleanly", () => {
      const f = getFixture(0);
      const session = new GT030Session(f.content, f.difficulty);
      session.setupEntities();

      const invalid = session.validateAction({
        type: "unknown_action",
        data: {},
      });
      expect(invalid.valid).toBe(false);
    });

    it("handles unified tap gesture dispatch", () => {
      const f = getFixture(0); // 4 units, answer 4 is opt_4
      const session = new GT030Session(f.content, f.difficulty);
      session.prepareRound("5-6");

      // Tap outside slots -> ignored
      const miss = session.dispatch({
        type: "tap",
        x: 10,
        y: 10,
        timeMs: 100,
      });
      expect(miss).toEqual({ valid: false, feedback: "none" });

      const targetLength = f.content.object.length_in_units;
      const sourceSlot = session.slots[1 + targetLength];
      if (!sourceSlot) {
        throw new Error("sourceSlot must exist");
      }

      // Tap source slot 4 times to place 4 units
      for (let i = 1; i <= targetLength; i++) {
        const tapSource = session.dispatch({
          type: "tap",
          x: sourceSlot.x,
          y: sourceSlot.y,
          timeMs: 200 + i * 50,
        });
        expect(tapSource?.valid).toBe(true);
        expect(session.getPlacedUnitsCount()).toBe(i);
      }

      // 5th tap on source slot -> rejected (already full)
      const tapExtra = session.dispatch({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y,
        timeMs: 500,
      });
      expect(tapExtra?.valid).toBe(false);
      expect(session.getPlacedUnitsCount()).toBe(targetLength);

      const view = session.getView();
      expect(view.activePrompt).toBe(f.content.prompt);
      expect(view.entities.length).toBeGreaterThan(0);

      // Find correct option slot
      const correctOptIdx = f.content.answer_options.findIndex(
        (o) => o.is_correct
      );
      const optSlot = session.slots[2 + targetLength + correctOptIdx];
      if (!optSlot) {
        throw new Error("optSlot must exist");
      }

      // Tap correct option -> win
      const tapOpt = session.dispatch({
        type: "tap",
        x: optSlot.x,
        y: optSlot.y,
        timeMs: 600,
      });
      expect(tapOpt?.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
    });
  });
});
