import { describe, expect, it } from "vitest";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures";
import { GT003Session } from "#src/templates/GT-003/session";

describe("Feature: Hành vi kéo thả (drop) và fallback chạm-chạm — tha.feature", () => {
  const f3 = GT003_FIXTURES[0];
  if (!f3) {
    throw new Error("GT003_FIXTURES[0] must exist");
  }

  describe("Scenario Outline: Kéo thả trúng đích thì commit action tương ứng (Examples: GT-003)", () => {
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
  });

  describe("Scenario Outline: Thả ngoài mọi đích thì không commit và vật về chỗ cũ (Examples: GT-003)", () => {
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
  });

  describe("Scenario Outline: Fallback chạm-chạm (tap-tap fallback) (Examples: GT-003)", () => {
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
  });
});
