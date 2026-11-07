import { describe, expect, it } from "vitest";
import {
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "#src/templates/GT-010/fixtures";
import { SubstitutionSession } from "#src/templates/GT-010/session";
import template, {
  GT010BaseSchema,
  GT010ContentSchema,
  GT010DifficultySchema,
} from "#src/templates/GT-010/template";

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

  describe("Fixture band 4-5 theo bảng giá một bước (BR-E010-05)", () => {
    it("mỗi dòng luật một ký hiệu, câu hỏi là tổng hai ký hiệu, step_count 1, giá 1–4, tổng ≤ 8", () => {
      const sample = SAMPLE_LEVEL_1;
      expect(sample.age_band).toBe("4-5");
      const content = GT010ContentSchema.parse(sample.content_pack);
      expect(sample.difficulty_params.step_count).toBe(1);
      for (const eq of content.equations) {
        expect(eq.left).toHaveLength(1);
        expect(eq.right_value).toBeGreaterThanOrEqual(1);
        expect(eq.right_value).toBeLessThanOrEqual(4);
      }
      expect(content.question.kind).toBe("sum");
      const correct = content.options.find((o) => o.is_correct);
      expect(correct?.value).toBeLessThanOrEqual(8);
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
      expect(session.getExpectedAnswer()).toBe(5);
      expect(session.checkWinCondition()).toBe(false);

      // Pin apple = 3
      session.pinSymbolValue("apple", 3);
      expect(session.getPinnedSymbolValue("apple")).toBe(3);
      expect(session.checkWinCondition()).toBe(false);

      // Select wrong value
      const wrongResult = session.selectValue(4);
      expect(wrongResult).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Select correct value (apple + banana = 3 + 2 = 5)
      const correctResult = session.selectValue(5);
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
        "control_of_error",
        "value_selected",
        "game_completed",
      ]);
    });

    it("supports Montessori 2-phase explore -> challenge, Control of Error, and Micro-Sandbox auto-pinning", () => {
      const session = new SubstitutionSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();
      session.startExplorePhase();

      expect(session.getExploreTracker().getPhase()).toBe("explore");

      session.pinSymbolValue("apple", 3);
      expect(session.getExploreTracker().getPhase()).toBe("explore");

      session.pinSymbolValue("banana", 2);
      expect(session.getExploreTracker().getPhase()).toBe("challenge");

      // Reset to fresh challenge state with no pinned symbols
      session.setupEntities();
      expect(session.getPinnedSymbolValue("apple")).toBeUndefined();
      expect(session.isMicroSandboxActive()).toBe(false);

      // First wrong attempt -> Control of Error reasonVi
      expect(session.selectValue(4)).toBe(false);
      expect(session.getControlOfError()?.reasonVi).toBe(
        "Giá trị 4 chưa khớp phép thay thế (cần 5)"
      );
      expect(session.isMicroSandboxActive()).toBe(false);
      expect(session.getPinnedSymbolValue("apple")).toBeUndefined();

      // Second consecutive wrong attempt -> enters Micro-Sandbox and auto-pins base symbol ("apple" = 3)
      expect(session.selectValue(8)).toBe(false);
      expect(session.isMicroSandboxActive()).toBe(true);
      expect(session.getPinnedSymbolValue("apple")).toBe(3);

      // Correct attempt -> clears Control of Error and exits Micro-Sandbox
      expect(session.selectValue(5)).toBe(true);
      expect(session.isMicroSandboxActive()).toBe(false);
      expect(session.getControlOfError()).toBeNull();
    });

    it("resolves text symbol glyphs, option slot hint index, and neutral equation roles in getView()", () => {
      const textSymbolPack = {
        ...SAMPLE_LEVEL_1.content_pack,
        symbols: [
          { symbol_id: "apple", asset: { kind: "text" as const, text: "7" } },
          { symbol_id: "banana", asset: { kind: "text" as const, text: "2" } },
        ],
      };
      const session = new SubstitutionSession(
        textSymbolPack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.prepareRound("4-5");

      const hintIdx = session.getHintTargetIndex();
      expect(hintIdx).not.toBeNull();
      const hintedSlot = session.slots[hintIdx ?? -1];
      expect(hintedSlot?.role).toBe("source");

      const view = session.getView();
      const eqEntity = view.entities.find((e) => e.id === "eq_1");
      expect(eqEntity?.role).toBe("neutral");
      expect(eqEntity?.label).toBe("7 = 3");

      const optEntity = view.entities.find((e) => e.id === "opt-1");
      expect(optEntity?.spokenLabel).toBe("Số 5");
    });
  });
});
