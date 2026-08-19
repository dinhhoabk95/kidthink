import { describe, expect, it } from "vitest";
import {
  OrderingMechanic,
  PairingMechanic,
  PlacementMechanic,
  SelectionMechanic,
} from "../src/index.js";

describe("WP97.2 — Mechanism Primitives (BR-TAK-05, BR-TAK-06)", () => {
  describe("SelectionMechanic", () => {
    it("handles single selection mode correctly", () => {
      const mechanic = new SelectionMechanic({ mode: "single" });
      mechanic.select("opt_1");
      expect(mechanic.getSelectedIds()).toEqual(["opt_1"]);

      mechanic.select("opt_2");
      expect(mechanic.getSelectedIds()).toEqual(["opt_2"]);

      const items = [
        { id: "opt_1", isCorrect: false },
        { id: "opt_2", isCorrect: true },
      ];

      expect(mechanic.isSelectionComplete(items)).toBe(true);
    });

    it("handles multi-selection toggle and submit validation", () => {
      const mechanic = new SelectionMechanic({ mode: "multi" });
      mechanic.toggle("i1");
      mechanic.toggle("i2");
      expect(mechanic.getSelectedIds()).toEqual(["i1", "i2"]);

      mechanic.toggle("i1");
      expect(mechanic.getSelectedIds()).toEqual(["i2"]);

      mechanic.toggle("i1");

      const items = [
        { id: "i1", isCorrect: true },
        { id: "i2", isCorrect: true },
        { id: "i3", isCorrect: false },
      ];

      const res = mechanic.validate(
        { type: "submit_selection", data: {} },
        items
      );
      expect(res.valid).toBe(true);
      expect(mechanic.isSelectionComplete(items)).toBe(true);
    });
  });

  describe("PlacementMechanic", () => {
    it("handles drag drop and tap-tap placement staging", () => {
      const mechanic = new PlacementMechanic();
      mechanic.stageItem("item_1");
      expect(mechanic.getStagedItemId()).toBe("item_1");

      mechanic.place("item_1", "bin_a");
      expect(mechanic.getStagedItemId()).toBeNull();
      expect(mechanic.getPlacedContainer("item_1")).toBe("bin_a");

      const items = [
        { id: "item_1", targetId: "bin_a", isCorrect: true },
        { id: "item_2", targetId: "bin_b", isCorrect: true },
      ];

      expect(mechanic.isPlacementComplete(items)).toBe(false);

      mechanic.place("item_2", "bin_b");
      expect(mechanic.isPlacementComplete(items)).toBe(true);
    });

    it("pure validation rejects incorrect target or container", () => {
      const mechanic = new PlacementMechanic();
      const items = [{ id: "item_1", targetId: "bin_a", isCorrect: true }];

      const wrong = mechanic.validate(
        {
          type: "drop_item",
          data: { item_id: "item_1", container_id: "bin_wrong" },
        },
        items
      );
      expect(wrong.valid).toBe(false);

      const right = mechanic.validate(
        {
          type: "drop_item",
          data: { item_id: "item_1", container_id: "bin_a" },
        },
        items
      );
      expect(right.valid).toBe(true);
    });
  });

  describe("PairingMechanic", () => {
    it("matches pairs and tracks complete bipartite matching", () => {
      const mechanic = new PairingMechanic();
      const pairs = [
        { leftId: "l1", rightId: "r1" },
        { leftId: "l2", rightId: "r2" },
      ];

      mechanic.match("l1", "r1");
      expect(mechanic.isLeftMatched("l1")).toBe(true);
      expect(mechanic.isRightMatched("r1")).toBe(true);
      expect(mechanic.isPairingComplete(pairs)).toBe(false);

      mechanic.match("l2", "r2");
      expect(mechanic.isPairingComplete(pairs)).toBe(true);
    });
  });

  describe("OrderingMechanic", () => {
    it("handles reordering and sequence verification", () => {
      const mechanic = new OrderingMechanic();
      mechanic.setInitialSequence(["s2", "s1", "s3"]);

      expect(mechanic.isSequenceCorrect(["s1", "s2", "s3"])).toBe(false);

      mechanic.swap(0, 1);
      expect(mechanic.getCurrentSequence()).toEqual(["s1", "s2", "s3"]);
      expect(mechanic.isSequenceCorrect(["s1", "s2", "s3"])).toBe(true);
    });
  });
});
