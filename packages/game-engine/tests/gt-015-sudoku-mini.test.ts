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
          { symbol_id: "s1", asset: { kind: "emoji", ref: "🍎" } },
          { symbol_id: "s2", asset: { kind: "emoji", ref: "🍌" } },
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

      expect(session.getGridSize()).toBe(3);
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

      // Fill (1,1) with "bird" -> complete puzzle
      session.fillCell(1, 1, "bird");
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
        "control_of_error",
        "cell_filled",
        "cell_filled",
        "game_completed",
      ]);
    });

    it("transitions Explore -> Challenge after 2 actions and activates Control of Error + Micro-Sandbox on 2 consecutive wrong fills", () => {
      const session = new SudokuMiniSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();
      session.startExplorePhase();
      expect(session.getExploreTracker().getPhase()).toBe("explore");

      session.selectSymbol("dog");
      expect(session.getExploreTracker().getPhase()).toBe("explore");
      expect(session.getExploreTracker().getExploreActionsCount()).toBe(1);

      // Điền hợp lệ ô (0, 1) với "dog" -> đạt 2 thao tác, chuyển sang challenge
      session.fillCell(0, 1, "dog");
      expect(session.getExploreTracker().getPhase()).toBe("challenge");
      expect(session.getExploreTracker().getExploreActionsCount()).toBe(2);

      // Lần sai 1: điền "cat" vào (1, 1) gây trùng hàng 2 (với (1,2)) và cột 2 (với (2,1))
      session.fillCell(1, 1, "cat");
      expect(session.getControlOfError()?.reasonVi).toBe(
        "Trùng hình trên hàng 2 hoặc cột 2"
      );
      expect(session.getControlOfError()?.targetId).toBe("1:1");
      expect(session.getControlOfError()?.actualValue).toBe("cat");
      expect(session.isMicroSandboxActive()).toBe(false);

      // Lần sai 2 liên tiếp: điền "cat" vào (0, 1) -> bật Micro-Sandbox
      session.fillCell(0, 1, "cat");
      expect(session.isMicroSandboxActive()).toBe(true);
      expect(session.getControlOfError()?.reasonVi).toBe(
        "Trùng hình trên hàng 1 hoặc cột 2"
      );

      // Sửa lại cả 2 ô đúng -> hoàn thành và tắt Micro-Sandbox
      session.fillCell(0, 1, "dog");
      session.fillCell(1, 1, "bird");
      expect(session.checkWinCondition()).toBe(true);
      expect(session.isMicroSandboxActive()).toBe(false);
      expect(session.getControlOfError()).toBeNull();
    });

    it("provides spokenLabel, unique id, square hitShape on cells, and 24px tap tolerance", () => {
      const session = new SudokuMiniSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.prepareRound("5-6");

      const view = session.getView();
      const ids = view.entities.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const entity of view.entities) {
        expect(entity.spokenLabel).toBeTruthy();
        if (entity.role === "target") {
          expect(entity.hitShape).toBe("square");
        }
      }

      // BR-E015-08: nguồn là ký hiệu đúng trong khay (dog = slot 9 + 1), đích là ô trống đầu (index 1).
      expect(session.getHintTargetIndex()).toBe(10);
      expect(session.getHintDestinationIndex()).toBe(1);

      // Tap palette symbol "dog" (index 1 -> slotIndex 9 + 1 = 10) near edge (+18px tolerance)
      const dogSlot = session.slots[10];
      expect(dogSlot).toBeDefined();
      if (!dogSlot) {
        return;
      }
      const dogR = (dogSlot.hitH ?? dogSlot.h) / 2;
      // Lệch theo chiều dọc: ba ký hiệu xếp một hàng ngang, lệch ngang 18px đã
      // rơi vào vùng chạm của ký hiệu kế bên.
      session.dispatch({
        type: "tap",
        x: dogSlot.x,
        y: dogSlot.y + dogR + 18,
        timeMs: 10,
      });
      expect(session.getSelectedSymbolId()).toBe("dog");

      // Tap empty cell (0,1) (slotIndex 1) near edge (18px tolerance)
      const cellSlot = session.slots[1];
      expect(cellSlot).toBeDefined();
      if (!cellSlot) {
        return;
      }
      const cellHalfH = (cellSlot.hitH ?? cellSlot.h) / 2;
      // Lệch lên trên (hàng 0): hai bên và phía dưới là ô lân cận cách 16px.
      const verdict = session.dispatch({
        type: "tap",
        x: cellSlot.x,
        y: cellSlot.y - cellHalfH - 18,
        timeMs: 20,
      });
      expect(verdict?.valid).toBe(true);
      expect(session.getCellState(0, 1)?.value).toBe("dog");
    });

    it("bố cục khung không stage: ma trận đúng 3×3 và ba ký hiệu không chồng ô nào", () => {
      const session = new SudokuMiniSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.prepareRound("5-6");
      expect(session.slots).toHaveLength(12);
      const cells = session.slots.slice(0, 9);
      expect(new Set(cells.map((s) => s.y)).size).toBe(3);
      expect(new Set(cells.map((s) => s.x)).size).toBe(3);
      for (let i = 0; i < session.slots.length; i++) {
        for (let j = i + 1; j < session.slots.length; j++) {
          const a = session.slots[i];
          const b = session.slots[j];
          if (a && b) {
            const hit =
              Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
              Math.abs(a.y - b.y) < (a.h + b.h) / 2;
            expect(hit, `${i} chồng ${j}`).toBe(false);
          }
        }
      }
    });

    it("supports 4x4 grid with row_col_box regions (2x2 sub-boxes) and unique solution", () => {
      const pack4x4 = {
        prompt:
          "Điền hình vào lưới 4×4 sao cho hàng, cột và ô 2×2 không trùng nhé!",
        grid_size: 4 as const,
        regions: "row_col_box" as const,
        symbols: [
          { symbol_id: "s0", asset: { kind: "emoji" as const, ref: "🍎" } },
          { symbol_id: "s1", asset: { kind: "emoji" as const, ref: "🍌" } },
          { symbol_id: "s2", asset: { kind: "emoji" as const, ref: "🍇" } },
          { symbol_id: "s3", asset: { kind: "emoji" as const, ref: "🍊" } },
        ],
        // Canonical 4x4 Sudoku solution with 2x2 boxes:
        // Row 0: s0, s1 | s2, s3
        // Row 1: s2, s3 | s0, s1
        // Row 2: s1, s0 | s3, s2
        // Row 3: s3, s2 | s1, s0
        cells: [
          { row: 0, col: 0, symbol_id: "s0" },
          { row: 0, col: 1, symbol_id: null }, // s1
          { row: 0, col: 2, symbol_id: "s2" },
          { row: 0, col: 3, symbol_id: "s3" },
          { row: 1, col: 0, symbol_id: "s2" },
          { row: 1, col: 1, symbol_id: "s3" },
          { row: 1, col: 2, symbol_id: null }, // s0
          { row: 1, col: 3, symbol_id: "s1" },
          { row: 2, col: 0, symbol_id: "s1" },
          { row: 2, col: 1, symbol_id: "s0" },
          { row: 2, col: 2, symbol_id: "s3" },
          { row: 2, col: 3, symbol_id: null }, // s2
          { row: 3, col: 0, symbol_id: null }, // s3
          { row: 3, col: 1, symbol_id: "s2" },
          { row: 3, col: 2, symbol_id: "s1" },
          { row: 3, col: 3, symbol_id: "s0" },
        ],
      };
      const diff4x4 = {
        item_count: 4,
        blank_count: 4,
        hint_after_ms: 8000,
        allow_retry: true,
      };
      const parsedContent = GT015ContentSchema.parse(pack4x4);
      const parsedDiff = GT015DifficultySchema.parse(diff4x4);
      const session = new SudokuMiniSession(parsedContent, parsedDiff);
      session.setupEntities();

      expect(session.getGridSize()).toBe(4);
      expect(session.checkWinCondition()).toBe(false);

      // Fill (0, 1) with "s2" -> conflicts with (1, 0) in top-left 2x2 box and (0, 2) in row 0
      session.fillCell(0, 1, "s2");
      expect(session.isConflicted(0, 1)).toBe(true);
      expect(session.getViolations().some((v) => v.kind === "box")).toBe(true);

      // Fill all 4 blanks with unique solution
      session.fillCell(0, 1, "s1");
      session.fillCell(1, 2, "s0");
      session.fillCell(2, 3, "s2");
      session.fillCell(3, 0, "s3");
      expect(session.getViolations()).toHaveLength(0);
      expect(session.checkWinCondition()).toBe(true);
    });

    it("verdict of validateAction matches what commit records (a valid fill is never flagged wrong because of another cell)", () => {
      const session = new SudokuMiniSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();

      const wrong = {
        type: "fill_cell",
        data: { row: 0, col: 1, symbol_id: "cat" },
      };
      expect(session.validateAction(wrong).valid).toBe(false);
      session.commit(wrong);

      // (1,1)=bird khong trung hang/cot nao: validateAction chap nhan,
      // commit khong duoc ghi them mot lan sai chi vi o (0,1) dang sai.
      const fine = {
        type: "fill_cell",
        data: { row: 1, col: 1, symbol_id: "bird" },
      };
      expect(session.validateAction(fine).valid).toBe(true);
      session.commit(fine);

      const flagged = session
        .getTelemetry()
        .events.filter((e) => e.event_name === "control_of_error");
      expect(flagged).toHaveLength(1);
    });

    it("hint never dead-ends: full but conflicted grid points at a cell the child can change", () => {
      const session = new SudokuMiniSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();
      session.fillCell(0, 1, "cat");
      session.fillCell(1, 1, "cat");
      expect(session.checkWinCondition()).toBe(false);
      const hint = session.getHintDestinationIndex();
      expect(hint).not.toBeNull();
      expect([1, 4]).toContain(hint);
      // BR-E015-08: nguồn là ký hiệu đúng của ô đó (ô 1 = dog, ô 4 = bird).
      expect(session.getHintTargetIndex()).toBe(hint === 1 ? 10 : 11);
    });
  });
});
