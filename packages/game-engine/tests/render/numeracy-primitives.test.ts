import { describe, expect, it } from "vitest";
import type { Slot } from "#src/layout/types";
import {
  drawDotPattern,
  drawNumberLine,
  drawNumberRod,
  drawQuantityRepresentation,
  drawRekenrek,
  drawTally,
  drawTenFrameBoard,
  type SceneBox,
} from "#src/render/index.js";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

describe("Numeracy Render Primitives (Task #268 / BR-ERC-13)", () => {
  const getCanvasContext = (): CanvasRenderingContext2D => {
    const fake = createFakeCanvas(960, 540);
    const ctx = fake.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get context from fake canvas");
    }
    return ctx as CanvasRenderingContext2D;
  };

  const defaultBox: SceneBox = {
    x: 100,
    y: 100,
    w: 200,
    h: 120,
  };

  const defaultSlot: Slot = {
    index: 0,
    x: 200,
    y: 160,
    w: 200,
    h: 120,
    hitW: 200,
    hitH: 120,
    page: 0,
    role: "target",
  };

  describe("T4.12 & BR-NRL-10: Finger representation negative test", () => {
    it("throws clear error when kind is finger in Phase 1 (no camera input)", () => {
      const ctx = getCanvasContext();
      const rs = new RenderSystem();

      expect(() => {
        drawQuantityRepresentation(ctx, rs, defaultSlot, {
          kind: "finger",
          count: 3,
        });
      }).toThrow(
        "BR-NRL-10: finger representation must be mapped to tactile/ten-frame in Phase 1 (no camera input allowed)"
      );
    });
  });

  describe("T4.1: drawDotPattern (standard dice pattern 1-6)", () => {
    it("renders valid dot pattern for values 1 through 6 without error", () => {
      const ctx = getCanvasContext();
      for (let val = 1; val <= 6; val++) {
        expect(() => {
          drawDotPattern(ctx, defaultBox, val);
        }).not.toThrow();
      }
    });

    it("clamps value outside 1-6 to bounds", () => {
      const ctx = getCanvasContext();
      expect(() => {
        drawDotPattern(ctx, defaultBox, 0);
        drawDotPattern(ctx, defaultBox, 10);
      }).not.toThrow();
    });
  });

  describe("T3.5 & T3.6: drawTenFrameBoard", () => {
    it("renders ten-frame board with filled count and returns 10 slots", () => {
      const ctx = getCanvasContext();
      const slots = drawTenFrameBoard(ctx, defaultBox, 7);
      expect(slots).toHaveLength(10);
      // Slots must be arranged in 2 rows of 5
      expect(slots[0]?.x).toBeLessThan(slots[4]?.x ?? 0);
      expect(slots[0]?.y).toBeLessThan(slots[5]?.y ?? 0);
    });
  });

  describe("T4.2 & T4.3: drawNumberLine", () => {
    it("renders horizontal number line with tick marks and current value cursor", () => {
      const ctx = getCanvasContext();
      expect(() => {
        drawNumberLine(ctx, defaultBox, {
          min: 0,
          max: 10,
          current: 4,
          interactive: false,
        });
      }).not.toThrow();
    });

    it("supports interactive mode with touch floor spacing", () => {
      const ctx = getCanvasContext();
      expect(() => {
        drawNumberLine(ctx, defaultBox, {
          min: 0,
          max: 5,
          current: 2,
          target: 4,
          interactive: true,
        });
      }).not.toThrow();
    });
  });

  describe("T4.4: drawTally", () => {
    it("renders grouped tallies for arbitrary count", () => {
      const ctx = getCanvasContext();
      expect(() => {
        drawTally(ctx, defaultBox, 7); // 1 full group of 5 + 2 remainder
        drawTally(ctx, defaultBox, 15); // 3 full groups of 5
        drawTally(ctx, defaultBox, 0);
      }).not.toThrow();
    });
  });

  describe("T4.5 & T4.6: drawRekenrek", () => {
    it("renders two-row rekenrek with active beads pushed to left", () => {
      const ctx = getCanvasContext();
      expect(() => {
        drawRekenrek(ctx, defaultBox, 8); // 8 active beads in top row, rest on right
        drawRekenrek(ctx, defaultBox, 14); // 10 on top wire, 4 on bottom wire
      }).not.toThrow();
    });
  });

  describe("T4.7: drawNumberRod", () => {
    it("renders segmented Montessori number rod with alternating colors", () => {
      const ctx = getCanvasContext();
      expect(() => {
        drawNumberRod(ctx, defaultBox, 5, { maxUnits: 10 });
      }).not.toThrow();
    });
  });

  describe("T4.8 & Dispatcher: drawQuantityRepresentation", () => {
    it("dispatches successfully to all implemented quantity representations", () => {
      const ctx = getCanvasContext();
      const rs = new RenderSystem();

      const kinds = [
        "dot-pattern",
        "ten-frame",
        "number-line",
        "tally",
        "rekenrek",
        "number-rod",
        "discrete-object",
      ] as const;

      for (const kind of kinds) {
        expect(() => {
          drawQuantityRepresentation(ctx, rs, defaultSlot, {
            kind,
            count: 4,
            max: 10,
          });
        }).not.toThrow();
      }
    });
  });
});
