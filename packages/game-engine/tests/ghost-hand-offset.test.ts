import { describe, expect, it } from "vitest";
import {
  GHOST_HAND_OFFSET_X,
  GHOST_HAND_OFFSET_Y,
  RenderSystem,
} from "#src/systems/render-system";

interface Point {
  readonly x: number;
  readonly y: number;
}

/** Ghi lại mọi điểm tâm của hình tròn đã `arc` (đệm tay) và chữ emoji đã vẽ. */
function recordingCtx(): {
  ctx: CanvasRenderingContext2D;
  arcs: Point[];
  texts: Point[];
} {
  const arcs: Point[] = [];
  const texts: Point[] = [];
  const noop = (): void => undefined;
  const target = {
    arc: (x: number, y: number): void => {
      arcs.push({ x, y });
    },
    fillText: (_t: string, x: number, y: number): void => {
      texts.push({ x, y });
    },
    drawImage: (_i: unknown, x: number, y: number, w: number): void => {
      texts.push({ x: x + w / 2, y });
    },
  };
  const ctx = new Proxy(target, {
    get: (t, key: string) => (key in t ? t[key as keyof typeof t] : noop),
    set: () => true,
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, arcs, texts };
}

describe("bàn tay ma đặt lệch khỏi điểm đích (BR-SCF-12)", () => {
  it("đầu ngón tay nằm dưới-phải điểm đích, không đè lên nhãn ở tâm", () => {
    const rs = new RenderSystem();
    const { ctx, texts } = recordingCtx();
    const from = { x: 400, y: 300 };

    rs.renderGhostHand(ctx, from, null, 0.5);

    const hand = texts.at(-1);
    expect(hand).toBeDefined();
    expect(hand?.x).toBe(from.x + GHOST_HAND_OFFSET_X);
    expect(hand?.y).toBe(from.y + GHOST_HAND_OFFSET_Y);
    // Nhãn số/chữ ở tâm cao ~32px: đầu tay phải nằm dưới nửa chiều cao nhãn.
    expect((hand?.y ?? 0) - from.y).toBeGreaterThanOrEqual(24);
  });
});
