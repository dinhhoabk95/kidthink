import { describe, expect, it } from "vitest";
import type { Slot } from "#src/layout/types";
import {
  computeDicePositions,
  drawDotPattern,
  drawNumberLine,
  drawNumberRod,
  drawQuantityRepresentation,
  drawRekenrek,
  drawTally,
  drawTenFrameBoard,
  numberLineStepPx,
  type QuantityRepConfig,
  type SceneBox,
} from "#src/render/index.js";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

const sharedSlot: Slot = {
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

/**
 * Phép đo hình học thật cho bốn nghĩa vụ mà spec nêu bằng **vị trí**, không
 * bằng "không ném lỗi": bố cục xúc xắc cố định, bước mốc chạm được, nhóm tally
 * tách rời, hạt rekenrek phân biệt bằng toạ độ x.
 */
describe("Numeracy primitives — hình học (BR-NRL-05/07/08)", () => {
  const box: SceneBox = { x: 0, y: 0, w: 400, h: 200 };

  interface DrawRecorder {
    readonly ctx: CanvasRenderingContext2D;
    readonly ellipses: { x: number; y: number }[];
    readonly moveTos: { x: number; y: number }[];
    readonly fonts: string[];
  }

  const recordingCanvas = (w = 960, h = 540): DrawRecorder => {
    const fake = createFakeCanvas(w, h);
    const raw = fake.getContext("2d");
    if (!raw) {
      throw new Error("Cannot get context from fake canvas");
    }
    const ctx = raw as unknown as CanvasRenderingContext2D;
    const ellipses: { x: number; y: number }[] = [];
    const moveTos: { x: number; y: number }[] = [];
    const fonts: string[] = [];
    ctx.ellipse = (x: number, y: number) => {
      ellipses.push({ x, y });
    };
    ctx.moveTo = (x: number, y: number) => {
      moveTos.push({ x, y });
    };
    ctx.fillText = () => {
      fonts.push(ctx.font);
    };
    return { ctx, ellipses, moveTos, fonts };
  };

  it("T4.1: bố cục chấm xúc xắc cố định và lặp lại y hệt giữa hai lần vẽ", () => {
    for (let value = 1; value <= 6; value++) {
      const first = computeDicePositions(box, value);
      const second = computeDicePositions(box, value);
      expect(first).toHaveLength(value);
      expect(second).toEqual(first);
    }

    // Mặt 1 nằm đúng tâm; mặt 2 nằm trên đường chéo; mặt 6 là hai cột ba chấm.
    expect(computeDicePositions(box, 1)[0]).toEqual({ x: 200, y: 100 });
    const two = computeDicePositions(box, 2);
    expect(two[0]?.x).toBeLessThan(two[1]?.x ?? 0);
    expect(two[0]?.y).toBeLessThan(two[1]?.y ?? 0);
    const sixColumns = new Set(computeDicePositions(box, 6).map((d) => d.x));
    expect(sixColumns.size).toBe(2);
  });

  it("T4.3: mốc chạm được thì bước giữa hai mốc ≥ sàn chạm 64 px", () => {
    // Hộp hẹp: chia đều sẽ ra 33 px một bước, dưới sàn chạm.
    const narrowW = 400 - 72;
    expect(narrowW / 10).toBeLessThan(64);

    expect(numberLineStepPx(narrowW, 10, true)).toBeGreaterThanOrEqual(64);
    // Không chạm được thì giữ bước chia đều, chỉ cần đủ chỗ cho nhãn.
    expect(numberLineStepPx(narrowW, 10, false)).toBeCloseTo(narrowW / 10, 5);
  });

  it("T4.4: hai nhóm tally cách nhau ≥ một bề rộng gạch", () => {
    const rec = recordingCanvas();
    drawTally(rec.ctx, box, 10, { strokeWidth: 4 });

    const topY = Math.min(...rec.moveTos.map((m) => m.y));
    const stickXs = rec.moveTos
      .filter((m) => m.y === topY)
      .map((m) => m.x)
      .sort((a, b) => a - b);
    expect(stickXs).toHaveLength(8); // 2 nhóm × 4 gạch đứng

    const withinGroupGap = (stickXs[1] ?? 0) - (stickXs[0] ?? 0);
    const betweenGroupGap = (stickXs[4] ?? 0) - (stickXs[3] ?? 0);
    expect(betweenGroupGap).toBeGreaterThanOrEqual(withinGroupGap + 4);
  });

  it("T4.6: hạt rekenrek đã đẩy và chưa đẩy khác nhau về toạ độ x", () => {
    const rec = recordingCanvas();
    drawRekenrek(rec.ctx, box, 3, { rows: 1 });

    const xs = rec.ellipses.map((e) => e.x).sort((a, b) => a - b);
    expect(xs).toHaveLength(10);

    const pushed = xs.slice(0, 3);
    const idle = xs.slice(3);
    expect(Math.max(...pushed)).toBeLessThan(Math.min(...idle));

    // Cùng một hạt đổi trạng thái thì đổi CHỖ, không chỉ đổi màu.
    const none = recordingCanvas();
    drawRekenrek(none.ctx, box, 0, { rows: 1 });
    const idleFirstX = Math.min(...none.ellipses.map((e) => e.x));
    expect(pushed[0]).toBeLessThan(idleFirstX);
  });

  it("BR-NRL-10: kind chưa hiện thực thì ném lỗi, không vẽ vật rời thay", () => {
    const rec = recordingCanvas();
    const rs = new RenderSystem();
    expect(() => {
      drawQuantityRepresentation(rec.ctx, rs, sharedSlot, {
        kind: "chua-ho-tro" as QuantityRepConfig["kind"],
        count: 3,
      });
    }).toThrow("BR-NRL-10");
  });

  it("discrete-object trả false để nơi gọi vẽ asset thật, không vẽ ô giữ chỗ", () => {
    const rec = recordingCanvas();
    const rs = new RenderSystem();
    expect(
      drawQuantityRepresentation(rec.ctx, rs, sharedSlot, {
        kind: "discrete-object",
        count: 3,
      })
    ).toBe(false);
  });
});
