import { beforeEach, describe, expect, it, vi } from "vitest";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas, type FakeCanvas } from "./fake-canvas.ts";
import { probeViewport } from "./render-viewport.ts";

/** `setupCanvas` đọc `window.devicePixelRatio`; test chạy ở env node. */
function withDpr(dpr: number): void {
  vi.stubGlobal("window", { devicePixelRatio: dpr });
}

/** Ép kiểu tại đúng một chỗ: canvas giả không cài đủ mặt DOM. */
function asCanvas(fake: FakeCanvas): HTMLCanvasElement {
  return fake as HTMLCanvasElement;
}

describe("cổng hình học khung vẽ (game-engine-runtime.md §7.1)", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("lấp trọn khung khi hộp đúng tỉ lệ 16:9", () => {
    withDpr(2);
    const canvas = createFakeCanvas(1440, 810);
    const rs = new RenderSystem();

    const viewport = rs.setupCanvas(asCanvas(canvas));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("canvas giả phải trả ngữ cảnh");
    }
    const probe = probeViewport(ctx.transform, 1440, 810, 2);

    expect(viewport.scale).toBeCloseTo(1.5, 5);
    expect(probe.originX).toBeCloseTo(0, 5);
    expect(probe.originY).toBeCloseTo(0, 5);
    expect(probe.fillX).toBeCloseTo(1, 5);
    expect(probe.fillY).toBeCloseTo(1, 5);
  });

  it("thu cảnh vừa bề rộng và căn giữa theo chiều dọc trên màn dọc", () => {
    withDpr(2);
    const canvas = createFakeCanvas(390, 844);
    const rs = new RenderSystem();

    rs.setupCanvas(asCanvas(canvas));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("canvas giả phải trả ngữ cảnh");
    }
    const probe = probeViewport(ctx.transform, 390, 844, 2);

    // Đây là con số mà bản lỗi làm sai: nó vẽ 246% bề rộng hộp.
    expect(probe.fillX).toBeCloseTo(1, 5);
    expect(probe.originX).toBeCloseTo(0, 5);
    expect(probe.originY).toBeGreaterThan(0);
    expect(probe.farY).toBeLessThanOrEqual(844 * 2 + 1e-6);
  });

  it("đặt backing store theo DPR và giữ transform tuyệt đối khi dựng lại", () => {
    withDpr(3);
    const canvas = createFakeCanvas(960, 540);
    const rs = new RenderSystem();

    rs.setupCanvas(asCanvas(canvas));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("canvas giả phải trả ngữ cảnh");
    }
    const once = { ...ctx.transform };

    // Dựng lại nhiều lần phải ra đúng cùng ma trận — cấm cộng dồn.
    rs.setupCanvas(asCanvas(canvas));
    rs.setupCanvas(asCanvas(canvas));

    expect(canvas.width).toBe(2880);
    expect(canvas.height).toBe(1620);
    expect(ctx.transform).toEqual(once);
    expect(ctx.transform.a).toBeCloseTo(3, 5);
  });

  it("xoá hết backing store, không chỉ hình chữ nhật logic", () => {
    withDpr(2);
    const canvas = createFakeCanvas(1440, 810);
    const rs = new RenderSystem();
    rs.setupCanvas(asCanvas(canvas));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("canvas giả phải trả ngữ cảnh");
    }

    rs.clear(ctx as CanvasRenderingContext2D);

    const last = ctx.clears.at(-1);
    expect(last).toEqual({ h: 1620, w: 2880, x: 0, y: 0 });
  });

  it("hit-test đọc đúng hình học đang vẽ, khứ hồi không lệch", () => {
    withDpr(2);
    const canvas = createFakeCanvas(390, 844);
    const rs = new RenderSystem();
    const viewport = rs.setupCanvas(asCanvas(canvas));

    // Tâm cảnh ở toạ độ logic phải khứ hồi về đúng tâm hộp theo pixel CSS.
    const boxX = viewport.offsetX + 480 * viewport.scale;
    const boxY = viewport.offsetY + 270 * viewport.scale;

    const logic = rs.toLogicPoint(boxX, boxY);

    expect(logic.x).toBeCloseTo(480, 5);
    expect(logic.y).toBeCloseTo(270, 5);
  });

  // Ca âm: một RenderSystem bỏ bước scale logic — đúng bản lỗi đã sửa — phải
  // làm cổng đỏ. Không có ca này thì cổng chỉ là lời khuyên.
  it("ca âm — bản chỉ scale theo DPR phải trượt", () => {
    withDpr(2);
    const canvas = createFakeCanvas(1440, 810);

    class BrokenRenderSystem extends RenderSystem {
      override setupCanvas(target: HTMLCanvasElement) {
        const dpr = 2;
        const rect = target.getBoundingClientRect();
        target.width = Math.round(rect.width * dpr);
        target.height = Math.round(rect.height * dpr);
        const ctx = target.getContext("2d");
        // Đây là dòng đã gây lỗi: chỉ DPR, không có scale logic.
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
        return {
          cssHeight: rect.height,
          cssWidth: rect.width,
          dpr,
          offsetX: 0,
          offsetY: 0,
          scale: 1,
        };
      }
    }

    new BrokenRenderSystem().setupCanvas(asCanvas(canvas));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("canvas giả phải trả ngữ cảnh");
    }
    const probe = probeViewport(ctx.transform, 1440, 810, 2);

    expect(probe.fillX).not.toBeCloseTo(1, 2);
    expect(probe.fillX).toBeCloseTo(960 / 1440, 5);
  });
});
