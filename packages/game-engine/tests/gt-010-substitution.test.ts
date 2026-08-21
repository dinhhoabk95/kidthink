import { describe, expect, it } from "vitest";
import {
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "../src/templates/GT-010/fixtures.js";
import { SubstitutionSession } from "../src/templates/GT-010/session.js";
import template, {
  GT010BaseSchema,
  GT010ContentSchema,
  GT010DifficultySchema,
} from "../src/templates/GT-010/template.js";

const RE_UNIQUE_SOL = /nghiệm nguyên dương duy nhất/;

describe("GT-010: Thay thế biểu tượng (substitution)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-010");
      expect(template.mechanic).toBe("substitution");
      expect(template.layouts).toContain("equation-rows");
      expect(template.age_min).toBe(4);
      expect(template.age_max).toBe(6);
      expect(template.requires_tap_fallback).toBe(false);
      expect(template.events).toEqual([
        "game_started",
        "equation_solved",
        "value_selected",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation (BR-MTB-06, BR-TAK-04)", () => {
    it("parses all sample levels successfully", () => {
      for (const sample of [SAMPLE_LEVEL_1, SAMPLE_LEVEL_2, SAMPLE_LEVEL_3]) {
        const parsedContent = GT010ContentSchema.parse(sample.content_pack);
        const parsedDiff = GT010DifficultySchema.parse(
          sample.difficulty_params
        );
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects system with no unique positive integer solution", () => {
      const invalidPack = {
        prompt: "Hệ vô nghiệm nguyên dương",
        symbols: [
          { symbol_id: "a", asset: { kind: "emoji", ref: "🍎" } },
          { symbol_id: "b", asset: { kind: "emoji", ref: "🍌" } },
        ],
        // a + a = 5 -> a = 2.5 (not integer)
        equations: [
          { equation_id: "eq_1", left: ["a", "a"], right_value: 5 },
          { equation_id: "eq_2", left: ["a", "b"], right_value: 8 },
        ],
        question: { kind: "value" as const, symbol_id: "b" },
        options: [
          { value: 5, is_correct: true },
          { value: 6, is_correct: false },
        ],
      };
      expect(GT010BaseSchema.safeParse(invalidPack).success).toBe(true);
      expect(() => GT010ContentSchema.parse(invalidPack)).toThrow(
        RE_UNIQUE_SOL
      );
    });
  });

  describe("Session Gameplay & Self-Correction (BR-MTB-14)", () => {
    it("runs complete gameplay loop on Sample Level 1", () => {
      const session = new SubstitutionSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();

      expect(session.getSymbols().length).toBe(2);
      expect(session.getExpectedAnswer()).toBe(3);
      expect(session.checkWinCondition()).toBe(false);

      // Pin apple = 5
      session.pinSymbolValue("apple", 5);
      expect(session.getPinnedSymbolValue("apple")).toBe(5);
      expect(session.checkWinCondition()).toBe(false);

      // Select wrong value
      const wrongResult = session.selectValue(2);
      expect(wrongResult).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Select correct value (banana = 3)
      const correctResult = session.selectValue(3);
      expect(correctResult).toBe(true);
      expect(session.checkWinCondition()).toBe(true);

      // Calling checkWinCondition 100 times has no side effects
      for (let i = 0; i < 100; i++) {
        expect(session.checkWinCondition()).toBe(true);
      }

      session.completeSession();
      const telemetry = session.getTelemetry();
      expect(telemetry.events.map((e) => e.event_name)).toEqual([
        "game_started",
        "equation_solved",
        "value_selected",
        "value_selected",
        "game_completed",
      ]);
    });
  });
});
