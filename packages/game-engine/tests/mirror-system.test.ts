import { describe, expect, it } from "vitest";
import {
  computeMirroredPoint,
  getSymmetricGridPosition,
  isMirroredPointMatch,
  MirrorSystem,
} from "../src/systems/mirror-system.js";

describe("mirrorSystem (BR-LVB-12 — independent test suite)", () => {
  it("computes mirrored point across vertical axis (x = 480)", () => {
    const pt = { x: 300, y: 200 };
    const mirrored = computeMirroredPoint(pt, "vertical", 480);
    expect(mirrored).toEqual({ x: 660, y: 200 });

    expect(isMirroredPointMatch(pt, { x: 660, y: 200 }, "vertical", 480)).toBe(
      true
    );
    expect(
      isMirroredPointMatch(pt, { x: 650, y: 200 }, "vertical", 480, 15)
    ).toBe(true);
    expect(
      isMirroredPointMatch(pt, { x: 500, y: 200 }, "vertical", 480, 15)
    ).toBe(false);
  });

  it("computes mirrored point across horizontal axis (y = 270)", () => {
    const pt = { x: 400, y: 100 };
    const mirrored = computeMirroredPoint(pt, "horizontal", 270);
    expect(mirrored).toEqual({ x: 400, y: 440 });
  });

  it("calculates symmetric grid position", () => {
    const coord = { col: 0, row: 1 };
    const sym = getSymmetricGridPosition(coord, 4, 3, "vertical");
    expect(sym).toEqual({ col: 3, row: 1 });
  });

  it("tracks placements and verifies completion correctly", () => {
    const sys = new MirrorSystem();
    sys.init([
      {
        referenceSlotId: "ref-1",
        targetSlotId: "target-1",
        expectedAssetRef: "red-circle",
      },
      {
        referenceSlotId: "ref-2",
        targetSlotId: "target-2",
        expectedAssetRef: "blue-square",
      },
    ]);

    expect(sys.isComplete()).toBe(false);

    // Place wrong asset
    const wrong = sys.place("target-1", "blue-square");
    expect(wrong).toBe(false);
    expect(sys.isComplete()).toBe(false);

    // Correct target-1
    sys.place("target-1", "red-circle");
    expect(sys.isComplete()).toBe(false);

    // Correct target-2
    sys.place("target-2", "blue-square");
    expect(sys.isComplete()).toBe(true);
  });
});
