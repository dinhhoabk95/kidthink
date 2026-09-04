import { describe, expect, it } from "vitest";
import { GT033_FIXTURES } from "#src/templates/GT-033/fixtures";
import { GT033Session } from "#src/templates/GT-033/session";
import template, {
  GT033ContentSchema,
  GT033DifficultySchema,
} from "#src/templates/GT-033/template";

const RE_CELL_COUNT = /Số ô trong cells phải bằng rows \* cols/;
const RE_PALETTE_MATCH = /Mọi màu trong cells phải tồn tại trong bảng palette/;
const RE_HAS_NULL = /Phải có ít nhất 1 ô trống/;

function getFixture(index: number) {
  const fixture = GT033_FIXTURES[index];
  if (!fixture) {
    throw new Error(`Fixture at index ${index} is missing`);
  }
  return fixture;
}

describe("GT-033: Dệt hoa văn lưới (weave-grid)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-033");
      expect(template.name).toBe("Dệt hoa văn lưới");
      expect(template.mechanic).toBe("weave-grid");
      expect(template.layouts).toContain("weave-grid");
      expect(template.age_min).toBe(5);
      expect(template.age_max).toBe(6);
      expect(template.banned_age_bands).toEqual(["3-4", "4-5"]);
      expect(template.requires_tap_fallback).toBe(true);
      expect(template.events).toEqual([
        "game_started",
        "yarn_placed",
        "yarn_removed",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation (BR-E033-01..04)", () => {
    it("parses all sample fixtures successfully", () => {
      for (const fixture of GT033_FIXTURES) {
        const parsedContent = GT033ContentSchema.parse(fixture.content);
        const parsedDiff = GT033DifficultySchema.parse(fixture.difficulty);
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects when cells length does not match grid.rows * grid.cols", () => {
      const invalid = {
        prompt: "Bé chọn sợi len dệt nhé!",
        grid: { rows: 2, cols: 2 },
        palette: [
          {
            color_id: "red",
            asset: { kind: "emoji" as const, ref: "🧶" },
          },
          {
            color_id: "blue",
            asset: { kind: "emoji" as const, ref: "🧶" },
          },
        ],
        cells: ["red", "blue", "red"], // only 3 cells for 2x2!
      };
      expect(() => GT033ContentSchema.parse(invalid)).toThrow(RE_CELL_COUNT);
    });

    it("rejects when cells contain color not in palette", () => {
      const invalid = {
        prompt: "Bé chọn sợi len dệt nhé!",
        grid: { rows: 2, cols: 2 },
        palette: [
          {
            color_id: "red",
            asset: { kind: "emoji" as const, ref: "🧶" },
          },
          {
            color_id: "blue",
            asset: { kind: "emoji" as const, ref: "🧶" },
          },
        ],
        cells: ["red", "yellow", "blue", null], // yellow not in palette!
      };
      expect(() => GT033ContentSchema.parse(invalid)).toThrow(RE_PALETTE_MATCH);
    });

    it("rejects when there are no blank cells to fill", () => {
      const invalid = {
        prompt: "Bé chọn sợi len dệt nhé!",
        grid: { rows: 2, cols: 2 },
        palette: [
          {
            color_id: "red",
            asset: { kind: "emoji" as const, ref: "🧶" },
          },
          {
            color_id: "blue",
            asset: { kind: "emoji" as const, ref: "🧶" },
          },
        ],
        cells: ["red", "blue", "blue", "red"], // no null cells!
      };
      expect(() => GT033ContentSchema.parse(invalid)).toThrow(RE_HAS_NULL);
    });
  });

  describe("Session Gameplay & 2D Pattern Weaving", () => {
    it("sets up slots properly with target grid and source palette", () => {
      const f = getFixture(0); // 2x2 grid (4 cells) + 2 palette items = 6 slots
      const session = new GT033Session(f.content, f.difficulty);
      session.prepareRound("5-6");

      expect(session.slots.length).toBe(6);
      expect(session.slots.slice(0, 4).every((s) => s.role === "target")).toBe(
        true
      );
      expect(session.slots.slice(4).every((s) => s.role === "source")).toBe(
        true
      );
    });

    it("selects color from palette", () => {
      const f = getFixture(0);
      const session = new GT033Session(f.content, f.difficulty);
      session.setupEntities();

      const res = session.validateAction({
        type: "select_palette",
        data: { color_id: "blue" },
      });
      expect(res.valid).toBe(true);
      expect(session.selectedColorId).toBe("blue");

      const invalid = session.validateAction({
        type: "select_palette",
        data: { color_id: "nonexistent" },
      });
      expect(invalid.valid).toBe(false);
    });

    it("refuses to place yarn into original pre-filled cell", () => {
      const f = getFixture(0); // index 0 is "red" originally
      const session = new GT033Session(f.content, f.difficulty);
      session.setupEntities();

      const res = session.validateAction({
        type: "place_yarn",
        data: { cell_index: 0, color_id: "blue" },
      });
      expect(res.valid).toBe(false);
      expect(session.placedCells[0]).toBe("red");
    });

    it("places wrong yarn, flags broken dimension, allows undo and placement of correct yarn", () => {
      const f = getFixture(0); // blank is index 3, solution is "red"
      const session = new GT033Session(f.content, f.difficulty);
      session.setupEntities();

      // Wrong placement: "blue" at index 3
      const wrong = session.validateAction({
        type: "place_yarn",
        data: { cell_index: 3, color_id: "blue" },
      });
      expect(wrong.valid).toBe(false);
      expect(session.brokenRowIndex).toBe(1);
      expect(session.brokenColIndex).toBe(1);
      expect(session.checkWinCondition()).toBe(false);

      // Remove yarn
      const undo = session.validateAction({
        type: "remove_yarn",
        data: { cell_index: 3 },
      });
      expect(undo.valid).toBe(true);
      expect(session.placedCells[3]).toBeNull();
      expect(session.brokenRowIndex).toBeNull();

      // Correct placement: "red" at index 3
      const correct = session.validateAction({
        type: "place_yarn",
        data: { cell_index: 3, color_id: "red" },
      });
      expect(correct.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
    });

    it("refuses to remove pre-filled original cell", () => {
      const f = getFixture(0);
      const session = new GT033Session(f.content, f.difficulty);
      session.setupEntities();

      const res = session.validateAction({
        type: "remove_yarn",
        data: { cell_index: 0 },
      });
      expect(res.valid).toBe(false);
      expect(session.placedCells[0]).toBe("red");
    });

    it("maintains win condition purity across 100 consecutive calls", () => {
      const f = getFixture(0);
      const session = new GT033Session(f.content, f.difficulty);
      session.setupEntities();

      session.validateAction({
        type: "place_yarn",
        data: { cell_index: 3, color_id: "red" },
      });
      expect(session.checkWinCondition()).toBe(true);

      for (let i = 0; i < 100; i++) {
        expect(session.checkWinCondition()).toBe(true);
      }
    });

    it("emits proper telemetry events during gameplay", () => {
      const f = getFixture(0);
      const session = new GT033Session(f.content, f.difficulty);
      session.setupEntities();

      session.validateAction({
        type: "place_yarn",
        data: { cell_index: 3, color_id: "red" },
      });
      session.completeSession();

      const telemetry = session.getTelemetry();
      const eventNames = telemetry.events.map((e) => e.event_name);
      expect(eventNames).toContain("game_started");
      expect(eventNames).toContain("yarn_placed");
      expect(eventNames).toContain("game_completed");
    });

    it("ignores unknown actions cleanly", () => {
      const f = getFixture(0);
      const session = new GT033Session(f.content, f.difficulty);
      session.setupEntities();

      const invalid = session.validateAction({
        type: "unknown_action",
        data: {},
      });
      expect(invalid.valid).toBe(false);
    });
  });
});
