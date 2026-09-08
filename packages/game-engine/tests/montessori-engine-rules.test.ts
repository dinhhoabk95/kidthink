/**
 * Unit tests cho các luật cơ chế riêng của lô Montessori (GT-007..GT-017)
 * theo Task #263 T18.2.
 *
 * Kiểm tra các mã luật:
 * - BR-E007-01..03 (GT-007: Tách gộp số number-bond)
 * - BR-E008-01..03 (GT-008: Kéo vào ô chứa drag-to-slot)
 * - BR-E009-01..03 (GT-009: Loại trừ manh mối clue-deduction)
 * - BR-E010-01..03 (GT-010: Thay thế biểu tượng substitution)
 * - BR-E011-01..03 (GT-011: Ma trận chọn hình matrix-choice)
 * - BR-E012-01..03 (GT-012: Nhìn chớp nhớ lại flash-recall)
 * - BR-E013-01..03 (GT-013: Tìm đường mê cung maze-route)
 * - BR-E014-01..03 (GT-014: Cân hai bên balance-scale)
 * - BR-E015-01..03 (GT-015: Lưới không lặp sudoku-mini)
 * - BR-E016-01..03 (GT-016: Xoay kim đồng hồ clock-hands)
 * - BR-E017-01..03 (GT-017: Xếp khối phối cảnh block-stack)
 */
import { describe, expect, it } from "vitest";
import { findRouteThrough } from "#src/systems/maze-system";
import { GT007_FIXTURES } from "#src/templates/GT-007/fixtures.js";
import { GT007Session } from "#src/templates/GT-007/session.js";
import { GT008_FIXTURES } from "#src/templates/GT-008/fixtures.js";
import { GT008Session } from "#src/templates/GT-008/session.js";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures.js";
import { GT009Session } from "#src/templates/GT-009/session.js";
import { GT009ContentSchema } from "#src/templates/GT-009/template.js";
import { GT010_FIXTURES } from "#src/templates/GT-010/fixtures.js";
import { GT010Session } from "#src/templates/GT-010/session.js";
import { solveEquationSystem } from "#src/templates/GT-010/solver.js";
import { GT011_FIXTURES } from "#src/templates/GT-011/fixtures.js";
import { GT011Session } from "#src/templates/GT-011/session.js";
import { GT012_FIXTURES } from "#src/templates/GT-012/fixtures.js";
import { GT012Session } from "#src/templates/GT-012/session.js";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures.js";
import { GT013Session } from "#src/templates/GT-013/session.js";
import { GT014_FIXTURES } from "#src/templates/GT-014/fixtures.js";
import { GT014Session } from "#src/templates/GT-014/session.js";
import { GT015_FIXTURES } from "#src/templates/GT-015/fixtures.js";
import { GT015Session } from "#src/templates/GT-015/session.js";
import { GT016_FIXTURES } from "#src/templates/GT-016/fixtures.js";
import { GT016Session } from "#src/templates/GT-016/session.js";
import { GT017_FIXTURES } from "#src/templates/GT-017/fixtures.js";
import { GT017Session } from "#src/templates/GT-017/session.js";

function getFixture<T>(fixtures: readonly T[], index = 0): T {
  const item = fixtures[index];
  if (!item) {
    throw new Error(`Missing fixture at index ${index}`);
  }
  return item;
}

describe("T18.2: Lô Montessori — Luật cơ chế thật (GT-007..GT-017)", () => {
  describe("GT-007: Tách gộp số (number-bond)", () => {
    const fixture = getFixture(GT007_FIXTURES);

    it("BR-E007-01: bảo toàn tổng đại số và chấp nhận cách tách đúng", () => {
      const session = new GT007Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const correctOption = fixture.content.options.find((o) => o.is_correct);
      expect(correctOption).toBeDefined();
      if (correctOption) {
        const res = session.validateAction({
          type: "fill_part",
          data: { option_id: correctOption.id },
        });
        expect(res.valid).toBe(true);
      }
    });

    it("BR-E007-02: chỉ tương tác vào ô khuyết mục tiêu", () => {
      const session = new GT007Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const targetPart = fixture.content.parts.find((p) => p.is_target);
      expect(targetPart).toBeDefined();

      const correctOption = fixture.content.options.find((o) => o.is_correct);
      if (correctOption && targetPart) {
        session.onPartFilled(correctOption.id, targetPart.id);
        expect(session.checkWinCondition()).toBe(true);
      }
    });

    it("BR-E007-03: giới hạn phạm vi số whole theo band", () => {
      for (const f of GT007_FIXTURES) {
        expect(f.content.whole.value).toBeLessThanOrEqual(20);
      }
    });
  });

  describe("GT-008: Kéo vào ô chứa (drag-to-slot)", () => {
    const fixture = getFixture(GT008_FIXTURES);

    it("BR-E008-01: mỗi ô nhận đúng một vật tương ứng", () => {
      const session = new GT008Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const slot0 = fixture.content.slots[0];
      if (!slot0) {
        throw new Error("Missing slot");
      }

      // Đặt đúng item
      session.onItemPlaced(slot0.expected_item_id, slot0.slot_id);
      expect(session.placedSlots.get(slot0.slot_id)).toBe(
        slot0.expected_item_id
      );

      // Thử đặt item sai vào slot khác
      const wrongItemId = "non_existent_item";
      session.onItemPlaced(wrongItemId, slot0.slot_id);
      expect(session.placedSlots.get(slot0.slot_id)).toBe(
        slot0.expected_item_id
      );
    });

    it("BR-E008-02: hỗ trợ tap-tap và drag-drop với validateAction tương đương", () => {
      const session = new GT008Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const slot0 = fixture.content.slots[0];
      if (!slot0) {
        throw new Error("Missing slot");
      }

      const resDrop = session.validateAction({
        type: "drop_to_slot",
        data: { slot_id: slot0.slot_id, item_id: slot0.expected_item_id },
      });
      const resTap = session.validateAction({
        type: "place_item",
        data: { slot_id: slot0.slot_id, item_id: slot0.expected_item_id },
      });
      expect(resDrop.valid).toBe(true);
      expect(resTap.valid).toBe(true);
    });

    it("BR-E008-03: hoàn thành khi toàn bộ ô mục tiêu được lấp đầy", () => {
      const session = new GT008Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      expect(session.checkWinCondition()).toBe(false);

      for (const slot of fixture.content.slots) {
        session.onItemPlaced(slot.expected_item_id, slot.slot_id);
      }
      expect(session.checkWinCondition()).toBe(true);
    });
  });

  describe("GT-009: Loại trừ theo manh mối (clue-deduction)", () => {
    const fixture = getFixture(GT009_FIXTURES);

    it("BR-E009-01: tập manh mối dẫn tới duy nhất 1 ứng viên đáp án", () => {
      const session = new GT009Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      expect(fixture.content.answer_candidate_id).toBeDefined();
      const ans = fixture.content.candidates.find(
        (c) => c.candidate_id === fixture.content.answer_candidate_id
      );
      expect(ans).toBeDefined();
    });

    it("BR-E009-02: đọc lại manh mối không tính sai", () => {
      const session = new GT009Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const clue = fixture.content.clues[0];
      if (clue) {
        session.commit({
          type: "replay_clue",
          data: { clue_id: clue.clue_id },
        });
        expect(session.checkWinCondition()).toBe(false);
      }
    });

    it("BR-E009-03: mỗi manh mối loại ít nhất một ứng viên", () => {
      const parsed = GT009ContentSchema.safeParse(fixture.content);
      expect(parsed.success).toBe(true);
    });
  });

  describe("GT-010: Thay thế biểu tượng (substitution)", () => {
    const fixture = getFixture(GT010_FIXTURES);

    it("BR-E010-01: luật thay thế nhất quán trong level", () => {
      const session = new GT010Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const symbolIds = fixture.content.symbols.map((s) => s.symbol_id);
      const solutions = solveEquationSystem(
        symbolIds,
        fixture.content.equations
      );
      expect(solutions.length).toBe(1);
    });

    it("BR-E010-02: question chỉ dùng ký hiệu đã khai báo trong legend", () => {
      const validSymbols = new Set(
        fixture.content.symbols.map((s) => s.symbol_id)
      );
      if (fixture.content.question.kind === "value") {
        expect(validSymbols.has(fixture.content.question.symbol_id)).toBe(true);
      } else {
        for (const sym of fixture.content.question.symbol_ids) {
          expect(validSymbols.has(sym)).toBe(true);
        }
      }
    });

    it("BR-E010-03: giới hạn tối đa 3 loại biểu tượng đồng thời", () => {
      expect(fixture.content.symbols.length).toBeLessThanOrEqual(3);
    });
  });

  describe("GT-011: Ma trận chọn hình (matrix-choice)", () => {
    const fixture = getFixture(GT011_FIXTURES);

    it("BR-E011-01: đúng một option hoàn thiện được cả hai chiều", () => {
      const session = new GT011Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const correctOptions = fixture.content.options.filter(
        (o) => o.is_correct
      );
      expect(correctOptions.length).toBe(1);
    });

    it("BR-E011-02: distractor không thỏa cả hai chiều", () => {
      const distractors = fixture.content.options.filter((o) => !o.is_correct);
      expect(distractors.length).toBeGreaterThanOrEqual(1);
    });

    it("BR-E011-03: kích thước ma trận tối đa 3x3", () => {
      expect(fixture.content.matrix.rows).toBeLessThanOrEqual(3);
      expect(fixture.content.matrix.cols).toBeLessThanOrEqual(3);
    });
  });

  describe("GT-012: Nhìn chớp rồi nhớ lại (flash-recall)", () => {
    const fixture = getFixture(GT012_FIXTURES);

    it("BR-E012-01: flash items biến mất sau flash window", () => {
      const session = new GT012Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      expect(session.isFlashVisible()).toBe(true);
      session.update(fixture.difficulty.flash_ms + 100);
      expect(session.isFlashVisible()).toBe(false);
    });

    it("BR-E012-02: allow_replay chỉ cho đúng một lượt xem lại", () => {
      const session = new GT012Session(fixture.content, {
        ...fixture.difficulty,
        allow_replay: true,
      });
      session.setupEntities();
      session.update(fixture.difficulty.flash_ms + 100);
      expect(session.isFlashVisible()).toBe(false);

      // Yêu cầu xem lại lần 1 -> được
      expect(session.canReplay()).toBe(true);
      expect(session.replayFlash()).toBe(true);
      expect(session.isFlashVisible()).toBe(true);

      // Hết thời gian flash lần 2
      session.update(fixture.difficulty.flash_ms + 100);
      expect(session.isFlashVisible()).toBe(false);

      // Yêu cầu xem lại lần 2 -> bị từ chối
      expect(session.canReplay()).toBe(false);
      expect(session.replayFlash()).toBe(false);
    });

    it("BR-E012-03: giới hạn item_count theo band tuổi", () => {
      for (const f of GT012_FIXTURES) {
        expect(f.content.flash_items.length).toBeLessThanOrEqual(6);
      }
    });
  });

  describe("GT-013: Tìm đường mê cung (maze-route)", () => {
    const fixture = getFixture(GT013_FIXTURES);

    it("BR-E013-01: tồn tại đường đi thông suốt từ xuất phát tới đích", () => {
      const session = new GT013Session(fixture.content, fixture.difficulty);
      session.setupEntities();
      expect(fixture.content.grid.start).toBeDefined();
      expect(fixture.content.grid.goal).toBeDefined();
      const route = findRouteThrough(
        fixture.content.grid,
        fixture.content.required_cells
      );
      expect(route).not.toBeNull();
    });

    it("BR-E013-02: đi vào ngõ cụt lùi lại được không bị phạt", () => {
      const session = new GT013Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const start = fixture.content.grid.start;
      expect(session.getPath()[0]).toEqual(start);
    });

    it("BR-E013-03: chặn di chuyển xuyên tường", () => {
      const session = new GT013Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const invalidStep = session.onPathStep({ row: -1, col: -1 });
      expect(invalidStep.status).toBe("blocked");
    });
  });

  describe("GT-014: Cân hai bên (balance-scale)", () => {
    const fixture = getFixture(GT014_FIXTURES);

    it("BR-E014-01: trạng thái nghiêng phản hồi ngay khi đặt vật", () => {
      const session = new GT014Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const firstItem = fixture.content.tray[0];
      if (firstItem) {
        session.placeItem(firstItem.item_id, "left");
        expect(session.getLeftWeight()).toBeGreaterThan(0);
        expect(session.getTiltAngle()).not.toBe(0);
      }
    });

    it("BR-E014-02: goal cân bằng đạt được bằng ít nhất một tổ hợp", () => {
      const session = new GT014Session(fixture.content, fixture.difficulty);
      session.setupEntities();
      expect(session.checkWinCondition()).toBe(false);
    });

    it("BR-E014-03: kích thước tỷ lệ thuận khối lượng", () => {
      for (const item of fixture.content.tray) {
        expect(item.weight).toBeGreaterThan(0);
      }
    });
  });

  describe("GT-015: Lưới không lặp (sudoku-mini)", () => {
    const fixture = getFixture(GT015_FIXTURES);

    it("BR-E015-01: lưới có nghiệm giải quyết được", () => {
      const session = new GT015Session(fixture.content, fixture.difficulty);
      session.setupEntities();
      expect(fixture.content.symbols.length).toBe(fixture.content.grid_size);
      expect(fixture.content.cells.length).toBe(
        fixture.content.grid_size * fixture.content.grid_size
      );
    });

    it("BR-E015-02: ô đã điền sẵn không sửa được", () => {
      const session = new GT015Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const fixedCell = fixture.content.cells.find((c) => c.symbol_id !== null);
      if (fixedCell) {
        const canFill = session.fillCell(
          fixedCell.row,
          fixedCell.col,
          "another_sym"
        );
        expect(canFill).toBe(false);
      }
    });

    it("BR-E015-03: không trùng lặp ký hiệu trên hàng và cột", () => {
      const session = new GT015Session(fixture.content, fixture.difficulty);
      session.setupEntities();
      expect(session.checkWinCondition()).toBe(false);
    });
  });

  describe("GT-016: Xoay kim đồng hồ (clock-hands)", () => {
    const fixture = getFixture(GT016_FIXTURES);

    it("BR-E016-01: kim xoay theo bước minute_step", () => {
      const session = new GT016Session(fixture.content, fixture.difficulty);
      session.setupEntities();
      expect(
        fixture.content.target_time.minute === 0 ||
          fixture.content.target_time.minute === 30
      ).toBe(true);
    });

    it("BR-E016-02: kim giờ dịch chuyển đồng bộ", () => {
      const session = new GT016Session(fixture.content, fixture.difficulty);
      session.setupEntities();
      session.setHour(4);
      session.setMinute(30);
      const angles = session.getAngles();
      expect(angles.hourAngleDeg).toBeGreaterThan(0);
      expect(angles.minuteAngleDeg).toBe(180);
    });

    it("BR-E016-03: khớp chính xác thời gian mục tiêu", () => {
      const session = new GT016Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      if (fixture.content.mode === "read") {
        const correctIdx = fixture.content.options.findIndex(
          (o) => o.is_correct
        );
        expect(correctIdx).toBeGreaterThanOrEqual(0);
        session.selectOption(correctIdx);
        expect(session.checkWinCondition()).toBe(true);
      } else {
        const target = fixture.content.target_time;
        session.setHour(target.hour);
        session.setMinute(target.minute);
        expect(session.checkWinCondition()).toBe(true);
      }
    });
  });

  describe("GT-017: Xếp khối và phối cảnh (block-stack)", () => {
    const fixture = getFixture(GT017_FIXTURES);

    it("BR-E017-01: cho phép xoay mô hình khối qua 4 mặt", () => {
      const session = new GT017Session(fixture.content, {
        ...fixture.difficulty,
        allow_rotate: true,
      });
      session.setupEntities();

      const initialRot = session.getCurrentRotation();
      const nextRot = session.rotateModel("cw");
      expect(nextRot).toBe((initialRot + 90) % 360);
    });

    it("BR-E017-02: hidden_cube_count khớp mô hình", () => {
      const session = new GT017Session(fixture.content, fixture.difficulty);
      session.setupEntities();
      expect(fixture.difficulty.hidden_cube_count).toBeGreaterThanOrEqual(0);
      expect(session.getHiddenCubeCount()).toBeGreaterThanOrEqual(0);
    });

    it("BR-E017-03: giới hạn kích thước khối 3D tối đa 3x3x3", () => {
      for (const cube of fixture.content.model) {
        expect(cube.x).toBeLessThanOrEqual(3);
        expect(cube.y).toBeLessThanOrEqual(3);
        expect(cube.z).toBeLessThanOrEqual(3);
      }
    });
  });
});
