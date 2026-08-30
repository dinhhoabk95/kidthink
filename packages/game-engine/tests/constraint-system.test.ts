import { describe, expect, it } from "vitest";
import {
  countSudokuSolutions,
  findConstraintViolations,
  get2x2BoxIndex,
  hasUniqueSolution,
  isSudokuCompleteAndValid,
  type SudokuGrid,
} from "#src/systems/constraint-system";

describe("constraintSystem (BR-MTB-15)", () => {
  describe("get2x2BoxIndex", () => {
    it("computes 2x2 box index correctly for 4x4 grid", () => {
      expect(get2x2BoxIndex(0, 0)).toBe(0);
      expect(get2x2BoxIndex(0, 1)).toBe(0);
      expect(get2x2BoxIndex(1, 0)).toBe(0);
      expect(get2x2BoxIndex(1, 1)).toBe(0);

      expect(get2x2BoxIndex(0, 2)).toBe(1);
      expect(get2x2BoxIndex(1, 3)).toBe(1);

      expect(get2x2BoxIndex(2, 0)).toBe(2);
      expect(get2x2BoxIndex(3, 1)).toBe(2);

      expect(get2x2BoxIndex(2, 2)).toBe(3);
      expect(get2x2BoxIndex(3, 3)).toBe(3);
    });
  });

  describe("findConstraintViolations", () => {
    it("returns empty when no duplicates exist", () => {
      const grid: SudokuGrid<string> = {
        size: 2,
        cells: [
          { row: 0, col: 0, value: "A" },
          { row: 0, col: 1, value: "B" },
          { row: 1, col: 0, value: "B" },
          { row: 1, col: 1, value: "A" },
        ],
      };
      expect(findConstraintViolations(grid)).toEqual([]);
    });

    it("detects row duplicates", () => {
      const grid: SudokuGrid<string> = {
        size: 2,
        cells: [
          { row: 0, col: 0, value: "A" },
          { row: 0, col: 1, value: "A" },
          { row: 1, col: 0, value: null },
          { row: 1, col: 1, value: null },
        ],
      };
      const violations = findConstraintViolations(grid);
      expect(violations.length).toBe(2);
      expect(violations[0]?.kind).toBe("row");
      expect(violations[0]?.row).toBe(0);
    });

    it("detects column duplicates", () => {
      const grid: SudokuGrid<string> = {
        size: 2,
        cells: [
          { row: 0, col: 0, value: "A" },
          { row: 0, col: 1, value: null },
          { row: 1, col: 0, value: "A" },
          { row: 1, col: 1, value: null },
        ],
      };
      const violations = findConstraintViolations(grid);
      expect(violations.length).toBe(2);
      expect(violations[0]?.kind).toBe("col");
      expect(violations[0]?.col).toBe(0);
    });

    it("detects 2x2 box duplicates in 4x4 grid when regions = row_col_box", () => {
      const grid: SudokuGrid<string> = {
        size: 4,
        regions: "row_col_box",
        cells: [
          // Box 0: (0,0) and (1,1) have 'A' (different row and col)
          { row: 0, col: 0, value: "A" },
          { row: 0, col: 1, value: "B" },
          { row: 1, col: 0, value: "C" },
          { row: 1, col: 1, value: "A" }, // Duplicate in Box 0
          // Fill rest with null
          { row: 0, col: 2, value: null },
          { row: 0, col: 3, value: null },
          { row: 1, col: 2, value: null },
          { row: 1, col: 3, value: null },
          { row: 2, col: 0, value: null },
          { row: 2, col: 1, value: null },
          { row: 2, col: 2, value: null },
          { row: 2, col: 3, value: null },
          { row: 3, col: 0, value: null },
          { row: 3, col: 1, value: null },
          { row: 3, col: 2, value: null },
          { row: 3, col: 3, value: null },
        ],
      };
      const violations = findConstraintViolations(grid);
      expect(violations.some((v) => v.kind === "box")).toBe(true);
    });
  });

  describe("countSudokuSolutions & hasUniqueSolution", () => {
    it("2x2 grid with 1 blank has 1 unique solution", () => {
      const grid: SudokuGrid<string> = {
        size: 2,
        cells: [
          { row: 0, col: 0, value: "A" },
          { row: 0, col: 1, value: "B" },
          { row: 1, col: 0, value: "B" },
          { row: 1, col: 1, value: null }, // must be "A"
        ],
      };
      expect(countSudokuSolutions(grid, ["A", "B"])).toBe(1);
      expect(hasUniqueSolution(grid, ["A", "B"])).toBe(true);
    });

    it("2x2 empty grid has 2 solutions", () => {
      const grid: SudokuGrid<string> = {
        size: 2,
        cells: [
          { row: 0, col: 0, value: null },
          { row: 0, col: 1, value: null },
          { row: 1, col: 0, value: null },
          { row: 1, col: 1, value: null },
        ],
      };
      expect(countSudokuSolutions(grid, ["A", "B"])).toBe(2);
      expect(hasUniqueSolution(grid, ["A", "B"])).toBe(false);
    });

    it("3x3 Latin square with 2 blanks has 1 unique solution", () => {
      // 1 2 3
      // 2 3 1
      // 3 ? ?  -> blanks at (2,1) must be 1, (2,2) must be 2
      const grid: SudokuGrid<number> = {
        size: 3,
        cells: [
          { row: 0, col: 0, value: 1 },
          { row: 0, col: 1, value: 2 },
          { row: 0, col: 2, value: 3 },
          { row: 1, col: 0, value: 2 },
          { row: 1, col: 1, value: 3 },
          { row: 1, col: 2, value: 1 },
          { row: 2, col: 0, value: 3 },
          { row: 2, col: 1, value: null },
          { row: 2, col: 2, value: null },
        ],
      };
      expect(countSudokuSolutions(grid, [1, 2, 3])).toBe(1);
      expect(hasUniqueSolution(grid, [1, 2, 3])).toBe(true);
    });

    it("4x4 Sudoku with box regions has unique solution", () => {
      // 1 2 | 3 4
      // 3 4 | 1 2
      // -----+-----
      // 2 1 | 4 3
      // 4 3 | 2 ? -> blank at (3,3) must be 1
      const grid: SudokuGrid<number> = {
        size: 4,
        regions: "row_col_box",
        cells: [
          { row: 0, col: 0, value: 1 },
          { row: 0, col: 1, value: 2 },
          { row: 0, col: 2, value: 3 },
          { row: 0, col: 3, value: 4 },

          { row: 1, col: 0, value: 3 },
          { row: 1, col: 1, value: 4 },
          { row: 1, col: 2, value: 1 },
          { row: 1, col: 3, value: 2 },

          { row: 2, col: 0, value: 2 },
          { row: 2, col: 1, value: 1 },
          { row: 2, col: 2, value: 4 },
          { row: 2, col: 3, value: 3 },

          { row: 3, col: 0, value: 4 },
          { row: 3, col: 1, value: 3 },
          { row: 3, col: 2, value: 2 },
          { row: 3, col: 3, value: null },
        ],
      };
      expect(hasUniqueSolution(grid, [1, 2, 3, 4])).toBe(true);
    });

    it("returns 0 solutions for contradictory initial grid", () => {
      const grid: SudokuGrid<number> = {
        size: 2,
        cells: [
          { row: 0, col: 0, value: 1 },
          { row: 0, col: 1, value: 1 }, // duplicate
          { row: 1, col: 0, value: null },
          { row: 1, col: 1, value: null },
        ],
      };
      expect(countSudokuSolutions(grid, [1, 2])).toBe(0);
      expect(hasUniqueSolution(grid, [1, 2])).toBe(false);
    });
  });

  describe("isSudokuCompleteAndValid", () => {
    it("returns true when complete and valid", () => {
      const grid: SudokuGrid<string> = {
        size: 2,
        cells: [
          { row: 0, col: 0, value: "A" },
          { row: 0, col: 1, value: "B" },
          { row: 1, col: 0, value: "B" },
          { row: 1, col: 1, value: "A" },
        ],
      };
      expect(isSudokuCompleteAndValid(grid)).toBe(true);
    });

    it("returns false if any cell is null", () => {
      const grid: SudokuGrid<string> = {
        size: 2,
        cells: [
          { row: 0, col: 0, value: "A" },
          { row: 0, col: 1, value: "B" },
          { row: 1, col: 0, value: "B" },
          { row: 1, col: 1, value: null },
        ],
      };
      expect(isSudokuCompleteAndValid(grid)).toBe(false);
    });
  });
});
