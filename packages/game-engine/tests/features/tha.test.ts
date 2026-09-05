import { describe, expect, it } from "vitest";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures";
import { GT003Session } from "#src/templates/GT-003/session";
import { GT004_FIXTURES } from "#src/templates/GT-004/fixtures";
import { GT004Session } from "#src/templates/GT-004/session";
import { GT005_FIXTURES } from "#src/templates/GT-005/fixtures";
import { GT005Session } from "#src/templates/GT-005/session";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures";
import { GT006Session } from "#src/templates/GT-006/session";
import { GT007_FIXTURES } from "#src/templates/GT-007/fixtures";
import { GT007Session } from "#src/templates/GT-007/session";
import { GT008_FIXTURES } from "#src/templates/GT-008/fixtures";
import { GT008Session } from "#src/templates/GT-008/session";
import { GT014_FIXTURES } from "#src/templates/GT-014/fixtures";
import { GT014Session } from "#src/templates/GT-014/session";
import { GT015_FIXTURES } from "#src/templates/GT-015/fixtures";
import { GT015Session } from "#src/templates/GT-015/session";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures";
import { GT019Session } from "#src/templates/GT-019/session";
import { GT021_FIXTURES } from "#src/templates/GT-021/fixtures";
import { GT021Session } from "#src/templates/GT-021/session";

describe("Feature: Hành vi kéo thả (drop) và fallback chạm-chạm — tha.feature", () => {
  const f3 = GT003_FIXTURES[0];
  if (!f3) {
    throw new Error("GT003_FIXTURES[0] must exist");
  }
  const f4 = GT004_FIXTURES[2];
  if (!f4) {
    throw new Error("GT004_FIXTURES[2] must exist");
  }
  const f5 = GT005_FIXTURES[1];
  if (!f5) {
    throw new Error("GT005_FIXTURES[1] must exist");
  }
  const f6 = GT006_FIXTURES[2];
  if (!f6) {
    throw new Error("GT006_FIXTURES[2] must exist");
  }
  const f7 = GT007_FIXTURES[0];
  if (!f7) {
    throw new Error("GT007_FIXTURES[0] must exist");
  }
  const f8 = GT008_FIXTURES[0];
  if (!f8) {
    throw new Error("GT008_FIXTURES[0] must exist");
  }
  const f14 = GT014_FIXTURES[1];
  if (!f14) {
    throw new Error("GT014_FIXTURES[1] must exist");
  }
  const f15 = GT015_FIXTURES[0];
  if (!f15) {
    throw new Error("GT015_FIXTURES[0] must exist");
  }
  const f19 = GT019_FIXTURES[0];
  if (!f19) {
    throw new Error("GT019_FIXTURES[0] must exist");
  }
  const f21 = GT021_FIXTURES[0];
  if (!f21) {
    throw new Error("GT021_FIXTURES[0] must exist");
  }

  describe("Scenario Outline: Kéo thả trúng đích thì commit action tương ứng (Examples: GT-003, GT-004, GT-005, GT-006, GT-007, GT-008, GT-014, GT-015, GT-019, GT-021)", () => {
    it("GT-003: kéo từ slot nguồn và thả vào container slot commit drop_item thành công", () => {
      const session = new GT003Session(f3.content, f3.difficulty);
      session.prepareRound("3-4");

      const sourceSlot = session.slots[0];
      const targetSlot = session.slots.at(-1);
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: targetSlot.x,
        toY: targetSlot.y,
        timeMs: 200,
      });

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(session.getTelemetry().events.length).toBeGreaterThan(
        eventsBefore
      );

      const firstItem = f3.content.items[0];
      if (!firstItem) {
        throw new Error("firstItem must exist");
      }
      expect(session.getPlacements().get(firstItem.item_id)).toBe(
        f3.content.container.container_id
      );
    });

    it("GT-004: kéo từ slot nguồn và thả vào target group slot commit sort_item thành công", () => {
      const session = new GT004Session(f4.content, f4.difficulty);
      session.prepareRound("5-6");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      const targetSlot = session.slots.find((s) => s.role === "target");
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: targetSlot.x,
        toY: targetSlot.y,
        timeMs: 200,
      });

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(session.getTelemetry().events.length).toBeGreaterThan(
        eventsBefore
      );
      expect(session.getPlacements().get("car")).toBe("g1");
    });

    it("GT-005: kéo từ slot nguồn bên trái và thả vào target slot bên phải commit match_pair thành công", () => {
      const session = new GT005Session(f5.content, f5.difficulty);
      session.prepareRound("3-4");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      const targetSlot = session.slots.find((s) => s.role === "target");
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: targetSlot.x,
        toY: targetSlot.y,
        timeMs: 200,
      });

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(session.getTelemetry().events.length).toBeGreaterThan(
        eventsBefore
      );
      expect(session.getMatchedPairs().get("num_1")).toBe("dot_1");
    });

    it("GT-006: kéo từ slot cuối và thả vào slot đầu commit reorder_step thành công", () => {
      const session = new GT006Session(f6.content, f6.difficulty);
      session.prepareRound("5-6");
      session.reorderSteps(0, 2);

      const sourceSlot = session.slots[2];
      const targetSlot = session.slots[0];
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: targetSlot.x,
        toY: targetSlot.y,
        timeMs: 200,
      });

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(session.getTelemetry().events.length).toBeGreaterThan(
        eventsBefore
      );
      expect(session.getCurrentSequence()).toEqual(["s1", "s2", "s3"]);
    });

    it("GT-007: kéo từ option nguồn và thả vào part đích commit place_number thành công", () => {
      const session = new GT007Session(f7.content, f7.difficulty);
      session.prepareRound("3-4");

      const sourceSlots = session.slots.filter((s) => s.role === "source");
      const targetSlots = session.slots.filter((s) => s.role === "target");
      const sourceSlot = sourceSlots[1];
      const targetSlot = targetSlots[2];
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: targetSlot.x,
        toY: targetSlot.y,
        timeMs: 200,
      });

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(session.getTelemetry().events.length).toBeGreaterThan(
        eventsBefore
      );
      expect(session.filledParts.get("p2")).toBe(2);
    });

    it("GT-008: kéo từ item nguồn và thả vào target slot commit place_item thành công", () => {
      const session = new GT008Session(f8.content, f8.difficulty);
      session.prepareRound("3-4");

      const sourceSlots = session.slots.filter((s) => s.role === "source");
      const targetSlots = session.slots.filter((s) => s.role === "target");
      const sourceSlot = sourceSlots[1]; // car_1
      const targetSlot = targetSlots[0]; // s1 (expected car_1)
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: targetSlot.x,
        toY: targetSlot.y,
        timeMs: 200,
      });

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(session.getTelemetry().events.length).toBeGreaterThan(
        eventsBefore
      );
      expect(session.placedSlots.get("s1")).toBe("car_1");
    });

    it("GT-014: kéo từ quả cân ở khay và thả vào đĩa phải commit place_item và cân bằng", () => {
      const session = new GT014Session(f14.content, f14.difficulty);
      session.prepareRound("5-6");

      const sourceSlots = session.slots.filter((s) => s.role === "source");
      const targetSlots = session.slots
        .filter((s) => s.role === "target")
        .slice()
        .sort((a, b) => a.x - b.x);
      const sourceSlot = sourceSlots[1]; // opt_3 (weight 3)
      const rightPanSlot = targetSlots[1]; // đĩa phải
      if (!(sourceSlot && rightPanSlot)) {
        throw new Error("slots must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: rightPanSlot.x,
        toY: rightPanSlot.y,
        timeMs: 200,
      });

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(session.getTelemetry().events.length).toBeGreaterThan(
        eventsBefore
      );
      expect(session.getRightWeight()).toBe(8);
      expect(session.checkWinCondition()).toBe(true);
    });

    it("GT-015: kéo symbol từ palette và thả vào ô trống commit fill_cell thành công", () => {
      const session = new GT015Session(f15.content, f15.difficulty);
      session.prepareRound("4-5");

      const cellCount = f15.content.grid_size * f15.content.grid_size;
      const cellSlots = session.slots.slice(0, cellCount);
      const paletteSlots = session.slots.slice(cellCount);
      const dogSlot = paletteSlots[1]; // dog
      const targetCellSlot = cellSlots[1]; // row 0, col 1 (blank)
      if (!(dogSlot && targetCellSlot)) {
        throw new Error("slots must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: dogSlot.x,
        fromY: dogSlot.y,
        toX: targetCellSlot.x,
        toY: targetCellSlot.y,
        timeMs: 200,
      });

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(session.getTelemetry().events.length).toBeGreaterThan(
        eventsBefore
      );
      expect(session.getCellState(0, 1)?.value).toBe("dog");
    });

    it("GT-019: kéo từ piece nguồn và thả vào target slot commit drop_item thành công", () => {
      const session = new GT019Session(f19.content, f19.difficulty);
      session.prepareRound("4-5");

      // Xoay mảnh arrow-1 về 0 độ khớp slot-1
      session.onRotatePiece("arrow-1", "cw");
      session.onRotatePiece("arrow-1", "cw");
      session.onRotatePiece("arrow-1", "cw");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      const targetSlot = session.slots.find((s) => s.role === "target");
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: targetSlot.x,
        toY: targetSlot.y,
        timeMs: 200,
      });

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(session.getTelemetry().events.length).toBeGreaterThan(
        eventsBefore
      );
      expect(session.getPlacements().get("arrow-1")).toBe("slot-1");
    });

    it("GT-021: kéo từ option nguồn và thả vào target slot commit drop_item thành công", () => {
      const session = new GT021Session(f21.content, f21.difficulty);
      session.prepareRound("4-5");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      const targetSlot = session.slots.find((s) => s.role === "target");
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: targetSlot.x,
        toY: targetSlot.y,
        timeMs: 200,
      });

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(session.getTelemetry().events.length).toBeGreaterThan(
        eventsBefore
      );
      expect(session.getPlacements().get("opt-wing")).toBe("right-wing");
      expect(session.checkWinCondition()).toBe(true);
    });
  });

  describe("Scenario Outline: Thả ngoài mọi đích thì không commit và vật về chỗ cũ (Examples: GT-003, GT-004, GT-005, GT-006, GT-007, GT-008, GT-014, GT-015, GT-019, GT-021)", () => {
    it("GT-003: kéo từ slot nguồn và thả ra ngoài toạ độ container thì không commit", () => {
      const session = new GT003Session(f3.content, f3.difficulty);
      session.prepareRound("3-4");

      const sourceSlot = session.slots[0];
      if (!sourceSlot) {
        throw new Error("sourceSlot must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: 50,
        toY: 50, // ngoài vùng container
        timeMs: 200,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getPlacements().size).toBe(0);
    });

    it("GT-004: kéo từ slot nguồn và thả ra ngoài toạ độ các group thì không commit", () => {
      const session = new GT004Session(f4.content, f4.difficulty);
      session.prepareRound("5-6");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      if (!sourceSlot) {
        throw new Error("sourceSlot must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: 50,
        toY: 50,
        timeMs: 200,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getPlacements().size).toBe(0);
    });

    it("GT-005: kéo từ slot nguồn bên trái và thả ra ngoài toạ độ các slot phải thì không commit", () => {
      const session = new GT005Session(f5.content, f5.difficulty);
      session.prepareRound("3-4");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      if (!sourceSlot) {
        throw new Error("sourceSlot must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: 50,
        toY: 50,
        timeMs: 200,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getMatchedPairs().size).toBe(0);
    });

    it("GT-006: kéo từ slot toa và thả ra ngoài toạ độ các toa thì không commit", () => {
      const session = new GT006Session(f6.content, f6.difficulty);
      session.prepareRound("5-6");
      session.reorderSteps(0, 2);

      const sourceSlot = session.slots[2];
      if (!sourceSlot) {
        throw new Error("sourceSlot must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: 50,
        toY: 50,
        timeMs: 200,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getCurrentSequence()).toEqual(["s2", "s3", "s1"]);
    });

    it("GT-007: kéo từ slot nguồn và thả ra ngoài part đích thì không commit", () => {
      const session = new GT007Session(f7.content, f7.difficulty);
      session.prepareRound("3-4");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      if (!sourceSlot) {
        throw new Error("sourceSlot must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: 50,
        toY: 50,
        timeMs: 200,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.filledParts.size).toBe(0);
    });

    it("GT-008: kéo từ item nguồn và thả ra ngoài target slot thì không commit", () => {
      const session = new GT008Session(f8.content, f8.difficulty);
      session.prepareRound("3-4");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      if (!sourceSlot) {
        throw new Error("sourceSlot must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: 50,
        toY: 50,
        timeMs: 200,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.placedSlots.size).toBe(0);
    });

    it("GT-014: kéo từ item nguồn và thả ra ngoài đĩa cân thì không commit", () => {
      const session = new GT014Session(f14.content, f14.difficulty);
      session.prepareRound("5-6");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      if (!sourceSlot) {
        throw new Error("sourceSlot must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: 50,
        toY: 50,
        timeMs: 200,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getRightWeight()).toBe(5);
    });

    it("GT-015: kéo symbol từ palette và thả ra ngoài lưới thì không commit", () => {
      const session = new GT015Session(f15.content, f15.difficulty);
      session.prepareRound("4-5");

      const cellCount = f15.content.grid_size * f15.content.grid_size;
      const paletteSlots = session.slots.slice(cellCount);
      const dogSlot = paletteSlots[1]; // dog
      if (!dogSlot) {
        throw new Error("dogSlot must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: dogSlot.x,
        fromY: dogSlot.y,
        toX: 50,
        toY: 50,
        timeMs: 200,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getCellState(0, 1)?.value).toBeNull();
    });

    it("GT-019: kéo piece từ nguồn và thả ra ngoài mọi slot đích thì không commit", () => {
      const session = new GT019Session(f19.content, f19.difficulty);
      session.prepareRound("4-5");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      if (!sourceSlot) {
        throw new Error("sourceSlot must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: 50,
        toY: 50,
        timeMs: 200,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getPlacements().size).toBe(0);
    });

    it("GT-021: kéo option từ nguồn và thả ra ngoài mọi slot đích thì không commit", () => {
      const session = new GT021Session(f21.content, f21.difficulty);
      session.prepareRound("4-5");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      if (!sourceSlot) {
        throw new Error("sourceSlot must exist");
      }

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "drop",
        fromX: sourceSlot.x,
        fromY: sourceSlot.y,
        toX: 50,
        toY: 50,
        timeMs: 200,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
      expect(session.getPlacements().size).toBe(0);
    });
  });

  describe("Scenario Outline: Fallback chạm-chạm (tap-tap fallback) (Examples: GT-003, GT-004, GT-005, GT-006, GT-007, GT-008, GT-014, GT-015, GT-019, GT-021)", () => {
    it("GT-003: chạm nguồn lần 1 để nhắm, chạm container lần 2 để thả", () => {
      const session = new GT003Session(f3.content, f3.difficulty);
      session.prepareRound("3-4");

      const sourceSlot = session.slots[0];
      const targetSlot = session.slots.at(-1);
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      const firstItem = f3.content.items[0];
      if (!firstItem) {
        throw new Error("firstItem must exist");
      }

      // Tap 1: chạm nguồn
      const tap1Result = session.dispatch({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y,
        timeMs: 100,
      });
      expect(tap1Result).toEqual({ valid: false, feedback: "none" });
      expect(session.getStagedItemId()).toBe(firstItem.item_id);

      // Tap 2: chạm container đích
      const tap2Result = session.dispatch({
        type: "tap",
        x: targetSlot.x,
        y: targetSlot.y,
        timeMs: 300,
      });
      expect(tap2Result?.valid).toBe(true);
      expect(session.getStagedItemId()).toBeNull();
      expect(session.getPlacements().get(firstItem.item_id)).toBe(
        f3.content.container.container_id
      );
    });

    it("GT-004: chạm nguồn lần 1 để nhắm, chạm group đích lần 2 để phân loại", () => {
      const session = new GT004Session(f4.content, f4.difficulty);
      session.prepareRound("5-6");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      const targetSlot = session.slots.find((s) => s.role === "target");
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      // Tap 1: chạm nguồn (car)
      const tap1Result = session.dispatch({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y,
        timeMs: 100,
      });
      expect(tap1Result).toEqual({ valid: false, feedback: "none" });
      expect(session.getStagedItemId()).toBe("car");

      // Tap 2: chạm group đích (g1)
      const tap2Result = session.dispatch({
        type: "tap",
        x: targetSlot.x,
        y: targetSlot.y,
        timeMs: 300,
      });
      expect(tap2Result?.valid).toBe(true);
      expect(session.getStagedItemId()).toBeNull();
      expect(session.getPlacements().get("car")).toBe("g1");
    });

    it("GT-005: chạm nguồn trái lần 1 để nhắm, chạm target phải lần 2 để ghép đôi", () => {
      const session = new GT005Session(f5.content, f5.difficulty);
      session.prepareRound("3-4");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      const targetSlot = session.slots.find((s) => s.role === "target");
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      // Tap 1: chạm nguồn trái (num_1)
      const tap1Result = session.dispatch({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y,
        timeMs: 100,
      });
      expect(tap1Result).toEqual({ valid: false, feedback: "none" });
      expect(session.getStagedLeftId()).toBe("num_1");

      // Tap 2: chạm đích phải (dot_1)
      const tap2Result = session.dispatch({
        type: "tap",
        x: targetSlot.x,
        y: targetSlot.y,
        timeMs: 300,
      });
      expect(tap2Result?.valid).toBe(true);
      expect(session.getStagedLeftId()).toBeNull();
      expect(session.getMatchedPairs().get("num_1")).toBe("dot_1");
    });

    it("GT-006: chạm toa lần 1 để nhắm, chạm toa lần 2 để đổi chỗ", () => {
      const session = new GT006Session(f6.content, f6.difficulty);
      session.prepareRound("5-6");
      session.reorderSteps(0, 2);

      const sourceSlot = session.slots[2];
      const targetSlot = session.slots[0];
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      // Tap 1: chạm toa cuối (s1)
      const tap1Result = session.dispatch({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y,
        timeMs: 100,
      });
      expect(tap1Result).toEqual({ valid: false, feedback: "none" });
      expect(session.getStagedIndex()).toBe(2);

      // Tap 2: chạm toa đầu
      const tap2Result = session.dispatch({
        type: "tap",
        x: targetSlot.x,
        y: targetSlot.y,
        timeMs: 300,
      });
      expect(tap2Result?.valid).toBe(true);
      expect(session.getStagedIndex()).toBeNull();
      expect(session.getCurrentSequence()).toEqual(["s1", "s2", "s3"]);
    });

    it("GT-007: chạm option lần 1 để nhắm, chạm part đích lần 2 để điền", () => {
      const session = new GT007Session(f7.content, f7.difficulty);
      session.prepareRound("3-4");

      const sourceSlots = session.slots.filter((s) => s.role === "source");
      const targetSlots = session.slots.filter((s) => s.role === "target");
      const sourceSlot = sourceSlots[1];
      const targetSlot = targetSlots[2];
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      // Tap 1: chạm option o2
      const tap1Result = session.dispatch({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y,
        timeMs: 100,
      });
      expect(tap1Result).toEqual({ valid: false, feedback: "none" });
      expect(session.getStagedOptionId()).toBe("o2");

      // Tap 2: chạm part p2
      const tap2Result = session.dispatch({
        type: "tap",
        x: targetSlot.x,
        y: targetSlot.y,
        timeMs: 300,
      });
      expect(tap2Result?.valid).toBe(true);
      expect(session.getStagedOptionId()).toBeNull();
      expect(session.filledParts.get("p2")).toBe(2);
    });

    it("GT-008: chạm item lần 1 để nhắm, chạm slot đích lần 2 để đặt", () => {
      const session = new GT008Session(f8.content, f8.difficulty);
      session.prepareRound("3-4");

      const sourceSlots = session.slots.filter((s) => s.role === "source");
      const targetSlots = session.slots.filter((s) => s.role === "target");
      const sourceSlot = sourceSlots[1]; // car_1
      const targetSlot = targetSlots[0]; // s1
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      // Tap 1: chạm item car_1
      const tap1Result = session.dispatch({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y,
        timeMs: 100,
      });
      expect(tap1Result).toEqual({ valid: false, feedback: "none" });
      expect(session.getStagedItemId()).toBe("car_1");

      // Tap 2: chạm slot đích s1
      const tap2Result = session.dispatch({
        type: "tap",
        x: targetSlot.x,
        y: targetSlot.y,
        timeMs: 300,
      });
      expect(tap2Result?.valid).toBe(true);
      expect(session.getStagedItemId()).toBeNull();
      expect(session.placedSlots.get("s1")).toBe("car_1");
    });

    it("GT-014: chạm quả cân lần 1 để nhắm, chạm đĩa cân lần 2 để đặt", () => {
      const session = new GT014Session(f14.content, f14.difficulty);
      session.prepareRound("5-6");

      const sourceSlots = session.slots.filter((s) => s.role === "source");
      const targetSlots = session.slots
        .filter((s) => s.role === "target")
        .slice()
        .sort((a, b) => a.x - b.x);
      const sourceSlot = sourceSlots[1]; // opt_3
      const rightPanSlot = targetSlots[1]; // đĩa phải
      if (!(sourceSlot && rightPanSlot)) {
        throw new Error("slots must exist");
      }

      // Tap 1: chạm quả cân opt_3
      const tap1Result = session.dispatch({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y,
        timeMs: 100,
      });
      expect(tap1Result).toEqual({ valid: false, feedback: "none" });
      expect(session.getStagedItemId()).toBe("opt_3");

      // Tap 2: chạm đĩa phải
      const tap2Result = session.dispatch({
        type: "tap",
        x: rightPanSlot.x,
        y: rightPanSlot.y,
        timeMs: 300,
      });
      expect(tap2Result?.valid).toBe(true);
      expect(session.getStagedItemId()).toBeNull();
      expect(session.getRightWeight()).toBe(8);
      expect(session.checkWinCondition()).toBe(true);
    });

    it("GT-015: chạm symbol ở palette lần 1 để nhắm, chạm ô trống lần 2 để điền", () => {
      const session = new GT015Session(f15.content, f15.difficulty);
      session.prepareRound("4-5");

      const cellCount = f15.content.grid_size * f15.content.grid_size;
      const cellSlots = session.slots.slice(0, cellCount);
      const paletteSlots = session.slots.slice(cellCount);
      const dogSlot = paletteSlots[1]; // dog
      const targetCellSlot = cellSlots[1]; // row 0, col 1 (blank)
      if (!(dogSlot && targetCellSlot)) {
        throw new Error("slots must exist");
      }

      // Tap 1: chạm symbol dog ở palette
      const tap1Result = session.dispatch({
        type: "tap",
        x: dogSlot.x,
        y: dogSlot.y,
        timeMs: 100,
      });
      expect(tap1Result).toEqual({ valid: false, feedback: "none" });
      expect(session.getStagedItemId()).toBe("dog");

      // Tap 2: chạm ô trống (row 0, col 1)
      const tap2Result = session.dispatch({
        type: "tap",
        x: targetCellSlot.x,
        y: targetCellSlot.y,
        timeMs: 300,
      });
      expect(tap2Result?.valid).toBe(true);
      expect(session.getStagedItemId()).toBeNull();
      expect(session.getCellState(0, 1)?.value).toBe("dog");
    });

    it("GT-019: chạm piece nguồn lần 1 để nhắm, chạm target slot lần 2 để đặt", () => {
      const session = new GT019Session(f19.content, f19.difficulty);
      session.prepareRound("4-5");

      // Xoay mảnh arrow-1 về 0 độ khớp slot-1
      session.onRotatePiece("arrow-1", "cw");
      session.onRotatePiece("arrow-1", "cw");
      session.onRotatePiece("arrow-1", "cw");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      const targetSlot = session.slots.find((s) => s.role === "target");
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      // Tap 1: chạm piece nguồn
      const tap1Result = session.dispatch({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y,
        timeMs: 100,
      });
      expect(tap1Result).toEqual({ valid: false, feedback: "none" });
      expect(session.getStagedItemId()).toBe("arrow-1");

      // Tap 2: chạm target slot
      const tap2Result = session.dispatch({
        type: "tap",
        x: targetSlot.x,
        y: targetSlot.y,
        timeMs: 300,
      });
      expect(tap2Result?.valid).toBe(true);
      expect(session.getStagedItemId()).toBeNull();
      expect(session.getPlacements().get("arrow-1")).toBe("slot-1");
      expect(session.checkWinCondition()).toBe(true);
    });

    it("GT-021: chạm option nguồn lần 1 để nhắm, chạm target slot lần 2 để đặt", () => {
      const session = new GT021Session(f21.content, f21.difficulty);
      session.prepareRound("4-5");

      const sourceSlot = session.slots.find((s) => s.role === "source");
      const targetSlot = session.slots.find((s) => s.role === "target");
      if (!(sourceSlot && targetSlot)) {
        throw new Error("slots must exist");
      }

      // Tap 1: chạm option nguồn
      const tap1Result = session.dispatch({
        type: "tap",
        x: sourceSlot.x,
        y: sourceSlot.y,
        timeMs: 100,
      });
      expect(tap1Result).toEqual({ valid: false, feedback: "none" });
      expect(session.getStagedItemId()).toBe("opt-wing");

      // Tap 2: chạm target slot
      const tap2Result = session.dispatch({
        type: "tap",
        x: targetSlot.x,
        y: targetSlot.y,
        timeMs: 300,
      });
      expect(tap2Result?.valid).toBe(true);
      expect(session.getStagedItemId()).toBeNull();
      expect(session.getPlacements().get("opt-wing")).toBe("right-wing");
      expect(session.checkWinCondition()).toBe(true);
    });
  });
});
