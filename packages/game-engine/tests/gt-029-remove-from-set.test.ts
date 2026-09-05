import { describe, expect, it } from "vitest";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures";
import { GT029Session } from "#src/templates/GT-029/session";
import template, {
  GT029ContentSchema,
  GT029DifficultySchema,
} from "#src/templates/GT-029/template";

const RE_REMOVE_COUNT_LESS =
  /remove_count phải nhỏ hơn số vật ban đầu \(initial_items\.length\)/;
const RE_ANSWER_OPTIONS_MATCH =
  /Phải có đúng 1 đáp án đúng và giá trị của nó phải bằng initial_items\.length - remove_count/;

function getFixture(index: number) {
  const fixture = GT029_FIXTURES[index];
  if (!fixture) {
    throw new Error(`Fixture at index ${index} is missing`);
  }
  return fixture;
}

describe("GT-029: Bớt khỏi nhóm (remove-from-set)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-029");
      expect(template.name).toBe("Bớt khỏi nhóm");
      expect(template.mechanic).toBe("remove-from-set");
      expect(template.layouts).toContain("grid");
      expect(template.layouts).toContain("flex-wrap");
      expect(template.age_min).toBe(4);
      expect(template.age_max).toBe(6);
      expect(template.banned_age_bands).toEqual(["3-4"]);
      expect(template.requires_tap_fallback).toBe(true);
      expect(template.events).toEqual([
        "game_started",
        "item_removed",
        "item_restored",
        "answer_selected",
        "game_completed",
      ]);
      expect(template.input).toEqual({
        family: "tap",
        verbs: ["tap"],
        tolerance_px: 24,
      });
    });
  });

  describe("Contract Validation (BR-E029-01, BR-E029-02)", () => {
    it("parses all sample fixtures successfully", () => {
      for (const fixture of GT029_FIXTURES) {
        const parsedContent = GT029ContentSchema.parse(fixture.content);
        const parsedDiff = GT029DifficultySchema.parse(fixture.difficulty);
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects when remove_count >= initial_items.length (BR-E029-02)", () => {
      const invalid = {
        prompt: "Bé hãy bớt 5 quả táo",
        initial_items: [
          { item_id: "a1", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a2", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a3", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a4", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a5", asset: { kind: "emoji", ref: "🍎" } },
        ],
        remove_count: 5, // 5 >= 5
        answer_options: [
          { option_id: "opt_0", value: 0, is_correct: true },
          { option_id: "opt_1", value: 1, is_correct: false },
        ],
      };
      expect(() => GT029ContentSchema.parse(invalid)).toThrow(
        RE_REMOVE_COUNT_LESS
      );
    });

    it("rejects when correct answer option does not match initial_items.length - remove_count (BR-E029-01)", () => {
      const invalid = {
        prompt: "Bé hãy bớt 2 quả táo",
        initial_items: [
          { item_id: "a1", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a2", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a3", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a4", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a5", asset: { kind: "emoji", ref: "🍎" } },
        ],
        remove_count: 2, // 5 - 2 = 3
        answer_options: [
          { option_id: "opt_2", value: 2, is_correct: false },
          { option_id: "opt_4", value: 4, is_correct: true }, // Marked correct on 4 instead of 3
        ],
      };
      expect(() => GT029ContentSchema.parse(invalid)).toThrow(
        RE_ANSWER_OPTIONS_MATCH
      );
    });

    it("rejects when no answer option is marked correct", () => {
      const invalid = {
        prompt: "Bé hãy bớt 2 quả táo",
        initial_items: [
          { item_id: "a1", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a2", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a3", asset: { kind: "emoji", ref: "🍎" } },
          { item_id: "a4", asset: { kind: "emoji", ref: "🍎" } },
        ],
        remove_count: 2,
        answer_options: [
          { option_id: "opt_1", value: 1, is_correct: false },
          { option_id: "opt_2", value: 2, is_correct: false },
        ],
      };
      expect(() => GT029ContentSchema.parse(invalid)).toThrow(
        RE_ANSWER_OPTIONS_MATCH
      );
    });
  });

  describe("Session Gameplay, Removal, Restore & Scoring", () => {
    it("validates actions purely without mutating state (BR-ENG-13)", () => {
      const f = getFixture(0);
      const session = new GT029Session(f.content, f.difficulty);
      session.setupEntities();

      expect(session.getRemovedCount()).toBe(0);

      const v1 = session.validateAction({
        type: "remove_item",
        data: { item_id: "apple_1" },
      });
      expect(v1.valid).toBe(true);
      expect(session.getRemovedCount()).toBe(0); // State unchanged
    });

    it("runs complete gameplay loop with item removal and option choice", () => {
      const f = getFixture(0); // 5 items, remove 2, correct answer is 3
      const session = new GT029Session(f.content, f.difficulty);
      session.setupEntities();

      expect(session.getRemovedCount()).toBe(0);
      expect(session.getRemainingCount()).toBe(5);
      expect(session.checkWinCondition()).toBe(false);

      // Attempting to select an answer before removing items fails
      const premature = session.validateAction({
        type: "select_option",
        data: { option_id: "opt_3" },
      });
      expect(premature.valid).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Remove item 1
      session.commit({
        type: "remove_item",
        data: { item_id: "apple_1" },
      });
      expect(session.getRemovedCount()).toBe(1);
      expect(session.getRemainingCount()).toBe(4);

      // Restore item 1 (tap again)
      session.commit({
        type: "remove_item",
        data: { item_id: "apple_1" },
      });
      expect(session.getRemovedCount()).toBe(0);
      expect(session.getRemainingCount()).toBe(5);

      // Remove apple_1 and apple_2
      session.commit({
        type: "remove_item",
        data: { item_id: "apple_1" },
      });
      session.commit({
        type: "remove_item",
        data: { item_id: "apple_2" },
      });
      expect(session.getRemovedCount()).toBe(2);
      expect(session.getRemainingCount()).toBe(3);

      // Trying to remove a 3rd item when target remove_count is 2 gives feedback
      const extraRemove = session.validateAction({
        type: "remove_item",
        data: { item_id: "apple_3" },
      });
      expect(extraRemove.valid).toBe(false);

      // Select wrong answer
      const wrongAnswer = session.validateAction({
        type: "select_option",
        data: { option_id: "opt_2" },
      });
      expect(wrongAnswer.valid).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Select correct answer
      const correctAnswer = session.validateAction({
        type: "select_option",
        data: { option_id: "opt_3" },
      });
      expect(correctAnswer.valid).toBe(true);

      session.commit({
        type: "select_option",
        data: { option_id: "opt_3" },
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
      expect(eventNames).toContain("item_removed");
      expect(eventNames).toContain("item_restored");
      expect(eventNames).toContain("answer_selected");
      expect(eventNames).toContain("game_completed");
    });

    it("handles invalid item or action gracefully", () => {
      const f = getFixture(0);
      const session = new GT029Session(f.content, f.difficulty);
      session.setupEntities();

      const invalidItem = session.validateAction({
        type: "remove_item",
        data: { item_id: "nonexistent_item" },
      });
      expect(invalidItem.valid).toBe(false);

      const invalidAction = session.validateAction({
        type: "unknown_action",
        data: {},
      });
      expect(invalidAction.valid).toBe(false);
    });

    it("resolves slots correctly across age bands", () => {
      const f = getFixture(1);
      const session = new GT029Session(f.content, f.difficulty);
      session.setupEntities();
      session.resolveSlots("4-5");

      expect(session.slots.length).toBe(
        f.content.initial_items.length + f.content.answer_options.length
      );
    });

    it("handles unified tap gesture dispatch", () => {
      const f = getFixture(0);
      const session = new GT029Session(f.content, f.difficulty);
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
      const slot1 = session.slots[1];
      if (!(slot0 && slot1)) {
        throw new Error("slot0 and slot1 must exist");
      }

      // Tap item 0 -> removed
      const tap0 = session.dispatch({
        type: "tap",
        x: slot0.x,
        y: slot0.y,
        timeMs: 200,
      });
      expect(tap0?.valid).toBe(true);
      expect(session.getRemovedCount()).toBe(1);

      // Tap item 1 -> removed (now reached remove_count = 2)
      const tap1 = session.dispatch({
        type: "tap",
        x: slot1.x,
        y: slot1.y,
        timeMs: 300,
      });
      expect(tap1?.valid).toBe(true);
      expect(session.getRemovedCount()).toBe(2);

      const view = session.getView();
      expect(view.activePrompt).toBe(f.content.prompt);
      expect(view.entities.length).toBe(
        f.content.initial_items.length + f.content.answer_options.length
      );

      // Correct option index: f.content.answer_options find is_correct
      const correctOptIdx = f.content.answer_options.findIndex(
        (o) => o.is_correct
      );
      const optSlot =
        session.slots[f.content.initial_items.length + correctOptIdx];
      if (!optSlot) {
        throw new Error("optSlot must exist");
      }

      // Tap correct option -> win
      const tapOpt = session.dispatch({
        type: "tap",
        x: optSlot.x,
        y: optSlot.y,
        timeMs: 400,
      });
      expect(tapOpt?.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
    });
  });
});
