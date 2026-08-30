import { describe, expect, it } from "vitest";
import {
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "#src/templates/GT-015/fixtures";
import { SudokuMiniSession } from "#src/templates/GT-015/session";
import template, {
  GT015BaseSchema,
  GT015ContentSchema,
  GT015DifficultySchema,
} from "#src/templates/GT-015/template";

const RE_UNIQUE_SUDOKU = /đúng 1 nghiệm duy nhất/;

describe("GT-015: Sudoku hình ảnh mini (sudoku-mini)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-015");
      expect(template.mechanic).toBe("sudoku-mini");
      expect(template.layouts).toContain("grid");
      expect(template.age_min).toBe(5);
      expect(template.age_max).toBe(6);
      expect(template.requires_tap_fallback).toBe(true);
      expect(template.events).toEqual([
        "game_started",
        "cell_filled",
        "constraint_violated",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation (BR-MTB-06, BR-TAK-04)", () => {
    it("parses all sample levels successfully", () => {
      for (const sample of [SAMPLE_LEVEL_1, SAMPLE_LEVEL_2, SAMPLE_LEVEL_3]) {
        const parsedContent = GT015ContentSchema.parse(sample.content_pack);
        const parsedDiff = GT015DifficultySchema.parse(
          sample.difficulty_params
        );
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects grid with multiple solutions (e.g. all empty)", () => {
      const emptyPack = {
        prompt: "Lưới trống không thể có nghiệm duy nhất",
        grid_size: 2 as const,
        regions: "row_col" as const,
        symbols: [
          { symbol_id: "s1", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
          { symbol_id: "s2", asset: { kind: "emoji", ref: "EMJ-banana" } },
        ],
        cells: [
          { row: 0, col: 0, symbol_id: null },
          { row: 0, col: 1, symbol_id: null },
          { row: 1, col: 0, symbol_id: null },
          { row: 1, col: 1, symbol_id: null },
        ],
      };
      expect(GT015BaseSchema.safeParse(emptyPack).success).toBe(true);
      expect(() => GT015ContentSchema.parse(emptyPack)).toThrow(
        RE_UNIQUE_SUDOKU
      );
    });
  });

  describe("Session Gameplay & Self-Correction (BR-MTB-14)", () => {
    it("runs complete gameplay loop with constraint detection on Sample Level 1", () => {
      const session = new SudokuMiniSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();

      expect(session.getGridSize()).toBe(2);
      expect(session.checkWinCondition()).toBe(false);

      // (0,0) is initial (cat), try filling it -> should be rejected
      expect(session.fillCell(0, 0, "dog")).toBe(false);

      // (0,1) is blank. Filling with "cat" creates row conflict with (0,0)
      session.fillCell(0, 1, "cat");
      expect(session.isConflicted(0, 1)).toBe(true);
      expect(session.isConflicted(0, 0)).toBe(true);
      expect(session.checkWinCondition()).toBe(false);

      // Correctly fill (0,1) with "dog" -> conflict resolved
      session.fillCell(0, 1, "dog");
      expect(session.isConflicted(0, 1)).toBe(false);
      expect(session.isConflicted(0, 0)).toBe(false);

      // Fill (1,0) with "dog" -> complete puzzle
      session.fillCell(1, 0, "dog");
      expect(session.checkWinCondition()).toBe(true);

      // Calling checkWinCondition 100 times has no side effects
      for (let i = 0; i < 100; i++) {
        expect(session.checkWinCondition()).toBe(true);
      }

      session.completeSession();
      const telemetry = session.getTelemetry();
      expect(telemetry.events.map((e) => e.event_name)).toEqual([
        "game_started",
        "cell_filled",
        "constraint_violated",
        "cell_filled",
        "cell_filled",
        "game_completed",
      ]);
    });
  });
});
