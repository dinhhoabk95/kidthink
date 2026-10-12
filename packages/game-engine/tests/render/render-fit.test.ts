import { describe, expect, it } from "vitest";
import type { Slot } from "#src/layout/types";
import { drawSceneBackground } from "#src/render/scene-background";
import {
  drawPromptText,
  drawTextInSlot,
  graphemes,
} from "#src/render/shared-render";
import { RenderSystem } from "#src/systems/render-system";

/**
 * Chữ và nền vẽ vừa khung: nền phủ kín máy dọc, chữ không tràn ô/khung,
 * cắt chuỗi không tách đôi emoji hay dấu tiếng Việt tổ hợp.
 */

const ELLIPSIS_END_RE = /…$/;

interface Call {
  readonly name: string;
  readonly args: readonly unknown[];
}

function recordingContext(): {
  ctx: CanvasRenderingContext2D;
  calls: Call[];
} {
  const calls: Call[] = [];
  const gradient: Pick<CanvasGradient, "addColorStop"> = {
    addColorStop: (): void => undefined,
  };
  const known: Partial<CanvasRenderingContext2D> = {
    measureText: (text: string) =>
      ({ width: graphemes(text).length * 12 }) as TextMetrics,
    createLinearGradient: () => gradient as CanvasGradient,
    createRadialGradient: () => gradient as CanvasGradient,
  };
  const proxy = new Proxy(known, {
    get(obj, key: string | symbol) {
      if (typeof key === "string" && key in obj) {
        return Reflect.get(obj, key);
      }
      return (...args: readonly unknown[]): void => {
        calls.push({ name: String(key), args });
      };
    },
    set(obj, key: string | symbol, value: unknown) {
      return Reflect.set(obj, key, value);
    },
  });
  return { ctx: proxy as CanvasRenderingContext2D, calls };
}

function renderSystem(w: number, h: number): RenderSystem {
  const rs = new RenderSystem();
  rs.logicSpace = { w, h };
  return rs;
}

describe("drawSceneBackground — máy dọc phủ kín theo chiều cao", () => {
  it("máy dọc: vẽ trong khung thiết kế với tỉ lệ đều h/540", () => {
    const { ctx, calls } = recordingContext();
    drawSceneBackground(ctx, renderSystem(540, 1168), "farm");
    const scale = calls.find((c) => c.name === "scale");
    expect(scale?.args).toEqual([1168 / 540, 1168 / 540]);
  });

  it("máy ngang: không đổi tỉ lệ", () => {
    const { ctx, calls } = recordingContext();
    drawSceneBackground(ctx, renderSystem(960, 540), "farm");
    expect(calls.some((c) => c.name === "scale")).toBe(false);
  });
});

describe("chữ không tràn khung", () => {
  it("drawTextInSlot truyền maxWidth 85% bề ngang ô", () => {
    const { ctx, calls } = recordingContext();
    const slot = { x: 100, y: 100, w: 80, h: 80, hitW: 80, hitH: 80 } as Slot;
    drawTextInSlot(ctx, "04:30", slot);
    const text = calls.find((c) => c.name === "fillText");
    expect(text?.args[3]).toBe(80 * 0.85);
  });

  it("drawPromptText giữ tối đa 2 dòng, dòng cuối kết thúc bằng …", () => {
    const { ctx, calls } = recordingContext();
    const long = "Bé hãy tìm tất cả những con vật sống dưới nước ".repeat(6);
    drawPromptText(ctx, renderSystem(960, 540), long);
    const lines = calls.filter((c) => c.name === "fillText");
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(String(lines.at(-1)?.args[0])).toMatch(ELLIPSIS_END_RE);
  });
});

describe("graphemes()", () => {
  it("không tách emoji ghép hay dấu tổ hợp NFD", () => {
    expect(graphemes("👨‍👩‍👧")).toHaveLength(1);
    expect(graphemes("ệ".normalize("NFD"))).toHaveLength(1);
  });
});
