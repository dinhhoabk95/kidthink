import { describe, expect, it } from "vitest";
import {
  type ClientPoint,
  type ElementRect,
  toLogicPoint,
} from "#src/interaction";
import { RoundRunner } from "#src/round-runner";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures";
import { GT001Session } from "#src/templates/GT-001/session";
import type {
  GT001Content,
  GT001Difficulty,
} from "#src/templates/GT-001/template";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures";
import { GT002Session } from "#src/templates/GT-002/session";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures";
import { GT009Session } from "#src/templates/GT-009/session";
import { GT010_FIXTURES } from "#src/templates/GT-010/fixtures";
import { GT010Session } from "#src/templates/GT-010/session";
import { GT011_FIXTURES } from "#src/templates/GT-011/fixtures";
import { GT011Session } from "#src/templates/GT-011/session";
import { GT012_FIXTURES } from "#src/templates/GT-012/fixtures";
import { GT012Session } from "#src/templates/GT-012/session";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures";
import { GT013Session } from "#src/templates/GT-013/session";
import { GT016_FIXTURES } from "#src/templates/GT-016/fixtures";
import { GT016Session } from "#src/templates/GT-016/session";
import { GT017_FIXTURES } from "#src/templates/GT-017/fixtures";
import { GT017Session } from "#src/templates/GT-017/session";
import { GT018_FIXTURES } from "#src/templates/GT-018/fixtures";
import { GT018Session } from "#src/templates/GT-018/session";
import { GT020_FIXTURES } from "#src/templates/GT-020/fixtures";
import { GT020Session } from "#src/templates/GT-020/session";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures";
import { GT022Session } from "#src/templates/GT-022/session";
import { GT025_FIXTURES } from "#src/templates/GT-025/fixtures";
import { GT025Session } from "#src/templates/GT-025/session";

describe("Feature: Hành vi chạm (tap) của họ engine tap — cham.feature", () => {
  const canvasRect: ElementRect = {
    left: 0,
    top: 0,
    width: 960,
    height: 540,
  };

  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("GT001_FIXTURES[0] must exist");
  }

  describe("Scenario Outline: Chạm nền thì không method nào chạy (Examples: GT-001, GT-002, GT-009, GT-010, GT-011, GT-012, GT-013, GT-016, GT-017)", () => {
    it("GT-001: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const session = new GT001Session(fixture.content, fixture.difficulty);
      session.prepareRound("3-4");

      const pointer: ClientPoint = { x: 50, y: 50 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.selectedItemId).toBeNull();
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
    });

    it("GT-002: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const f2 = GT002_FIXTURES[0];
      if (!f2) {
        throw new Error("GT002_FIXTURES[0] must exist");
      }
      const session = new GT002Session(f2.content, f2.difficulty);
      session.prepareRound("4-5");

      const pointer: ClientPoint = { x: 50, y: 50 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
    });

    it("GT-002: chạm slot để toggle chọn và gửi gesture commit để chốt", () => {
      const f2 = GT002_FIXTURES[0];
      if (!f2) {
        throw new Error("GT002_FIXTURES[0] must exist");
      }
      const session = new GT002Session(f2.content, f2.difficulty);
      session.prepareRound("4-5");

      const firstSlot = session.slots[0];
      if (!firstSlot) {
        throw new Error("firstSlot must exist");
      }

      // Tap slot 1 -> toggle to selected
      session.dispatch({
        type: "tap",
        x: firstSlot.x,
        y: firstSlot.y,
        timeMs: 100,
      });

      const firstItem = f2.content.items[0];
      if (!firstItem) {
        throw new Error("firstItem must exist");
      }
      const view = session.getView();
      const entity = view.entities.find((e) => e.id === firstItem.item_id);
      expect(entity?.state).toBe("selected");

      // Tap slot 1 again -> toggle to idle
      session.dispatch({
        type: "tap",
        x: firstSlot.x,
        y: firstSlot.y,
        timeMs: 200,
      });
      const entityAfterSecondTap = session
        .getView()
        .entities.find((e) => e.id === firstItem.item_id);
      expect(entityAfterSecondTap?.state).toBe("idle");
    });

    it("GT-009: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const f9 = GT009_FIXTURES[0];
      if (!f9) {
        throw new Error("GT009_FIXTURES[0] must exist");
      }
      const session = new GT009Session(f9.content, f9.difficulty);
      session.prepareRound("4-5");

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getRevealedClueIds().length).toBe(0);
    });

    it("GT-009: chạm manh mối để lật và gạch ứng viên vi phạm, rồi chạm đáp án để thắng", () => {
      const f9 = GT009_FIXTURES[0];
      if (!f9) {
        throw new Error("GT009_FIXTURES[0] must exist");
      }
      const session = new GT009Session(f9.content, f9.difficulty);
      session.prepareRound("4-5");

      const clueSlot = session.slots[0];
      if (!clueSlot) {
        throw new Error("clueSlot must exist");
      }
      session.dispatch({
        type: "tap",
        x: clueSlot.x,
        y: clueSlot.y,
        timeMs: 100,
      });

      expect(session.getRevealedClueIds()).toContain("k1");
      expect(session.getEliminatedIds()).toContain("c1");
      expect(session.getEliminatedIds()).toContain("c2");
      expect(session.getEliminatedIds()).toContain("c3");
      expect(session.getSurvivingIds()).toEqual(["c5"]);

      const candIdx = f9.content.candidates.findIndex(
        (c) => c.candidate_id === "c5"
      );
      const candSlot = session.slots[f9.content.clues.length + candIdx];
      if (!candSlot) {
        throw new Error("candSlot must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: candSlot.x,
        y: candSlot.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
    });

    it("GT-010: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const f10 = GT010_FIXTURES[0];
      if (!f10) {
        throw new Error("GT010_FIXTURES[0] must exist");
      }
      const session = new GT010Session(f10.content, f10.difficulty);
      session.prepareRound("4-5");

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getSelectedValue()).toBeNull();
    });

    it("GT-010: chạm vào option đúng commit select_value và win session", () => {
      const f10 = GT010_FIXTURES[0];
      if (!f10) {
        throw new Error("GT010_FIXTURES[0] must exist");
      }
      const session = new GT010Session(f10.content, f10.difficulty);
      session.prepareRound("4-5");

      const optionSlots = session.slots.filter((s) => s.role === "source");
      const correctSlot = optionSlots[1]; // option value 3 (is_correct: true)
      if (!correctSlot) {
        throw new Error("correctSlot must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: correctSlot.x,
        y: correctSlot.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.getSelectedValue()).toBe(3);
      expect(session.checkWinCondition()).toBe(true);
    });

    it("GT-011: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const f11 = GT011_FIXTURES[0];
      if (!f11) {
        throw new Error("GT011_FIXTURES[0] must exist");
      }
      const session = new GT011Session(f11.content, f11.difficulty);
      session.prepareRound("5-6");

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getPreview()).toBeNull();
    });

    it("GT-011: chạm vào option đúng preview và commit select_item, win session", () => {
      const f11 = GT011_FIXTURES[0];
      if (!f11) {
        throw new Error("GT011_FIXTURES[0] must exist");
      }
      const session = new GT011Session(f11.content, f11.difficulty);
      session.prepareRound("5-6");

      const cellCount = f11.content.matrix.rows * f11.content.matrix.cols;
      const optionSlots = session.slots.slice(cellCount);
      const correctIndex = f11.content.options.findIndex((o) => o.is_correct);
      const correctSlot = optionSlots[correctIndex];
      if (!correctSlot) {
        throw new Error("correctSlot must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: correctSlot.x,
        y: correctSlot.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.getPreview()?.option_id).toBe("o1");
      expect(session.checkWinCondition()).toBe(true);
    });

    it("GT-012: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const f12 = GT012_FIXTURES[0];
      if (!f12) {
        throw new Error("GT012_FIXTURES[0] must exist");
      }
      const session = new GT012Session(f12.content, f12.difficulty);
      session.prepareRound("3-4");
      session.update(f12.difficulty.flash_ms + 100);

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getSelectedValue()).toBeNull();
    });

    it("GT-012: chạm vào option đúng commit select_value và win session", () => {
      const f12 = GT012_FIXTURES[0];
      if (!f12) {
        throw new Error("GT012_FIXTURES[0] must exist");
      }
      const session = new GT012Session(f12.content, f12.difficulty);
      session.prepareRound("3-4");
      session.update(f12.difficulty.flash_ms + 100);

      const correctIndex = f12.content.options.findIndex((o) => o.is_correct);
      const correctSlot = session.slots[correctIndex];
      if (!correctSlot) {
        throw new Error("correctSlot must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: correctSlot.x,
        y: correctSlot.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.getSelectedValue()).toBe(3);
      expect(session.checkWinCondition()).toBe(true);
    });

    it("GT-013: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const f13 = GT013_FIXTURES[0];
      if (!f13) {
        throw new Error("GT013_FIXTURES[0] must exist");
      }
      const session = new GT013Session(f13.content, f13.difficulty);
      session.prepareRound("4-5");

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getPath().length).toBe(1); // Chỉ có start cell
    });

    it("GT-013: chạm vào ô liền kề hợp lệ commit tap_cell và mở rộng path", () => {
      const f13 = GT013_FIXTURES[0];
      if (!f13) {
        throw new Error("GT013_FIXTURES[0] must exist");
      }
      const session = new GT013Session(f13.content, f13.difficulty);
      session.prepareRound("4-5");

      // Với f13, start=(0,0), ô kề hợp lệ duy nhất là (1,0).
      // index trong grid 3x3 là 1 * 3 + 0 = 3.
      const nextSlot = session.slots[3];
      if (!nextSlot) {
        throw new Error("nextSlot must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: nextSlot.x,
        y: nextSlot.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.getPath().length).toBe(2);
      expect(session.getPath()[1]).toEqual({ row: 1, col: 0 });
    });

    it("GT-016: khi chạm ngoài vùng slot ở mode read, không commit action và state không đổi", () => {
      const f16 = GT016_FIXTURES[0];
      if (!f16) {
        throw new Error("GT016_FIXTURES[0] must exist");
      }
      const session = new GT016Session(f16.content, f16.difficulty);
      session.prepareRound("5-6");

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
    });

    it("GT-016: chạm vào option đúng commit select_option và win session", () => {
      const f16 = GT016_FIXTURES[0];
      if (!f16) {
        throw new Error("GT016_FIXTURES[0] must exist");
      }
      const session = new GT016Session(f16.content, f16.difficulty);
      session.prepareRound("5-6");

      const correctIndex = f16.content.options.findIndex((o) => o.is_correct);
      const correctSlot = session.slots[correctIndex];
      if (!correctSlot) {
        throw new Error("correctSlot must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: correctSlot.x,
        y: correctSlot.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
    });

    it("GT-016: điều chỉnh kim bằng cử chỉ adjust ở mode set", () => {
      const f16Set = GT016_FIXTURES[1];
      if (!f16Set) {
        throw new Error("GT016_FIXTURES[1] must exist");
      }
      const session = new GT016Session(f16Set.content, f16Set.difficulty);
      session.prepareRound("5-6");

      const result = session.dispatch({
        type: "adjust",
        delta: 1,
        timeMs: 100,
      });

      expect(result?.valid).toBe(true);
      expect(session.getCurrentTime()).toEqual({ hour: 12, minute: 30 });

      const submitWrong = session.dispatch({
        type: "commit",
        timeMs: 200,
      });
      expect(submitWrong?.valid).toBe(false);
    });

    it("GT-017: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const f17 = GT017_FIXTURES[0];
      if (!f17) {
        throw new Error("GT017_FIXTURES[0] must exist");
      }
      const session = new GT017Session(f17.content, f17.difficulty);
      session.prepareRound("5-6");

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getSelectedOptionId()).toBeNull();
    });

    it("GT-017: chạm vào option đúng commit select_option và win session", () => {
      const f17 = GT017_FIXTURES[0];
      if (!f17) {
        throw new Error("GT017_FIXTURES[0] must exist");
      }
      const session = new GT017Session(f17.content, f17.difficulty);
      session.prepareRound("5-6");

      const optionSlots = session.slots.filter((s) => s.role === "source");
      const correctIdx = f17.content.options.findIndex((o) => o.is_correct);
      const targetSlot =
        optionSlots[correctIdx] ?? session.slots[correctIdx + 1];
      if (!targetSlot) {
        throw new Error("targetSlot must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: targetSlot.x,
        y: targetSlot.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
      expect(session.getSelectedOptionId()).toBe("opt_4");
    });

    it("GT-017: cử chỉ adjust xoay mô hình 3D góc 90 độ", () => {
      const f17 = GT017_FIXTURES[0];
      if (!f17) {
        throw new Error("GT017_FIXTURES[0] must exist");
      }
      const session = new GT017Session(f17.content, f17.difficulty);
      session.prepareRound("5-6");

      const result = session.dispatch({
        type: "adjust",
        delta: 1,
        timeMs: 100,
      });

      expect(result?.valid).toBe(true);
      expect(session.getCurrentRotation()).toBe(90);
    });

    it("GT-018: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const f18 = GT018_FIXTURES[0];
      if (!f18) {
        throw new Error("GT018_FIXTURES[0] must exist");
      }
      const session = new GT018Session(f18.content, f18.difficulty);
      session.prepareRound("4-5");

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.selectedItemId).toBeNull();
    });

    it("GT-018: chạm vào option đúng commit tap_option và win session", () => {
      const f18 = GT018_FIXTURES[0];
      if (!f18) {
        throw new Error("GT018_FIXTURES[0] must exist");
      }
      const session = new GT018Session(f18.content, f18.difficulty);
      session.prepareRound("4-5");

      const correctIdx = f18.content.options.findIndex((o) => o.is_correct);
      const targetSlot = session.slots[correctIdx];
      if (!targetSlot) {
        throw new Error("targetSlot must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: targetSlot.x,
        y: targetSlot.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
      expect(session.selectedItemId).toBe("cat");
    });

    it("GT-020: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const f20 = GT020_FIXTURES[0];
      if (!f20) {
        throw new Error("GT020_FIXTURES[0] must exist");
      }
      const session = new GT020Session(f20.content, f20.difficulty);
      session.prepareRound("3-4");

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
    });

    it("GT-020: chạm vào card slot lật thẻ thành công (tap_card)", () => {
      const f20 = GT020_FIXTURES[0];
      if (!f20) {
        throw new Error("GT020_FIXTURES[0] must exist");
      }
      const session = new GT020Session(f20.content, f20.difficulty);
      session.prepareRound("3-4");

      const firstSlot = session.slots[0];
      const firstCard = session.displayCards[0];
      if (!(firstSlot && firstCard)) {
        throw new Error("firstSlot and firstCard must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: firstSlot.x,
        y: firstSlot.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.cardSystem.getCard(firstCard.cardId)?.state).toBe(
        "face_up"
      );
    });

    it("GT-022: khi chạm ngoài vùng object, không commit action và state không đổi", () => {
      const f22 = GT022_FIXTURES[0];
      if (!f22) {
        throw new Error("GT022_FIXTURES[0] must exist");
      }
      const session = new GT022Session(f22.content, f22.difficulty);
      session.prepareRound("4-5");

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.sceneSystem.getFoundCount()).toBe(0);
    });

    it("GT-022: chạm vào target scene object commit tap_object và win session", () => {
      const f22 = GT022_FIXTURES[0];
      if (!f22) {
        throw new Error("GT022_FIXTURES[0] must exist");
      }
      const session = new GT022Session(f22.content, f22.difficulty);
      session.prepareRound("4-5");

      const targetObj = session.resolvedObjects.find((o) => o.isTarget);
      if (!targetObj) {
        throw new Error("targetObj must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: targetObj.x,
        y: targetObj.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
      expect(session.sceneSystem.getFoundCount()).toBe(1);
    });

    it("GT-025: khi chạm ngoài vùng object, không commit action và state không đổi", () => {
      const f25 = GT025_FIXTURES[0];
      if (!f25) {
        throw new Error("GT025_FIXTURES[0] must exist");
      }
      const session = new GT025Session(f25.content, f25.difficulty);
      session.prepareRound("4-5");

      const pointer: ClientPoint = { x: 10, y: 10 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getFoundCount()).toBe(0);
    });

    it("GT-025: chạm vào difference object commit tap_object và win session", () => {
      const f25 = GT025_FIXTURES[0];
      if (!f25) {
        throw new Error("GT025_FIXTURES[0] must exist");
      }
      const session = new GT025Session(f25.content, f25.difficulty);
      session.prepareRound("4-5");

      // left-cat là difference item, toạ độ x: 200, y: 300
      const diffObj = session.resolvedObjects.find((o) => o.id === "left-cat");
      if (!diffObj) {
        throw new Error("diffObj must exist");
      }

      const result = session.dispatch({
        type: "tap",
        x: diffObj.x,
        y: diffObj.y,
        timeMs: 200,
      });

      expect(result?.valid).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
      expect(session.getFoundCount()).toBe(1);
    });
  });

  describe("Scenario Outline: Chạm lại vào đích đã chọn thì giữ (Examples: GT-001)", () => {
    it("GT-001: chạm lại vào slot đã chọn thì giữ nguyên lựa chọn", () => {
      const session = new GT001Session(fixture.content, fixture.difficulty);
      session.prepareRound("3-4");

      const firstSlot = session.slots[0];
      if (!firstSlot) {
        throw new Error("firstSlot must exist");
      }

      const pointer1: ClientPoint = { x: firstSlot.x, y: firstSlot.y };
      const logicPt1 = toLogicPoint(pointer1, canvasRect);

      // Chạm lần 1
      session.dispatch({
        type: "tap",
        x: logicPt1.x,
        y: logicPt1.y,
        timeMs: 100,
      });

      const selectedId = session.selectedItemId;
      expect(selectedId).toBeTruthy();

      // Chạm lần 2 vào cùng toạ độ
      session.dispatch({
        type: "tap",
        x: logicPt1.x,
        y: logicPt1.y,
        timeMs: 200,
      });

      expect(session.selectedItemId).toBe(selectedId);
    });
  });

  describe("Scenario Outline: Vòng hai dùng hình học vòng hai (Examples: GT-001)", () => {
    it("GT-001: vòng hai n=4 có ô thứ 4 nhận diện đúng toạ độ mà vòng 1 không có", () => {
      const round1Content: GT001Content = {
        ...fixture.content,
        options: fixture.content.options.slice(0, 3),
      };
      const round2Content: GT001Content = {
        ...fixture.content,
        options: [
          ...fixture.content.options.slice(0, 3),
          {
            item_id: "extra_opt_4",
            asset: { kind: "emoji", ref: "🍇" },
            is_correct: false,
          },
        ],
      };

      const difficultyNoShuffle: GT001Difficulty = {
        ...fixture.difficulty,
        shuffle_items: false,
      };

      const runner = new RoundRunner({
        ageBand: "3-4",
        rounds: [
          {
            round_index: 0,
            content_pack: round1Content,
            difficulty_params: difficultyNoShuffle,
          },
          {
            round_index: 1,
            content_pack: round2Content,
            difficulty_params: difficultyNoShuffle,
          },
        ],
        sessionFactory: (content, difficulty, seed) => {
          return new GT001Session(
            content as GT001Content,
            difficulty as GT001Difficulty,
            seed
          );
        },
        layoutSeed: 42,
      });

      runner.startFirstRound();
      const session1 = runner.getCurrentSession() as GT001Session;
      expect(session1.slots.length).toBe(3);

      // Hoàn thành vòng 1 để chuyển sang vòng 2
      session1.onItemLocked("apple_opt");
      runner.completeCurrentRound();

      const session2 = runner.getCurrentSession() as GT001Session;
      expect(session2.slots.length).toBe(4);

      // Slot thứ tư của vòng 2
      const slot4 = session2.slots[3];
      if (!slot4) {
        throw new Error("slot4 must exist");
      }

      const pointer: ClientPoint = { x: slot4.x, y: slot4.y };
      const logicPt = toLogicPoint(pointer, canvasRect);

      session2.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 300,
      });

      expect(session2.selectedItemId).toBe("extra_opt_4");
    });
  });
});
