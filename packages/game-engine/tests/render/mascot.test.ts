import { describe, expect, it, vi } from "vitest";
import { drawMascot, type MascotPose, mascotMotion } from "#src/render/mascot";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

const PLACEMENT = { cx: 56, cy: 56, radius: 40 };

function fakeContext(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Cannot get context from fake canvas");
  }
  return ctx as CanvasRenderingContext2D;
}

describe("Mascot (feedback-and-celebration §7.4, BR-PSZ-10)", () => {
  it("happy và idle khác nhau về chuyển động ở cùng thời điểm", () => {
    const idle = mascotMotion("idle", 120, false);
    const happy = mascotMotion("happy", 120, false);

    expect(happy).not.toEqual(idle);
  });

  it("encourage nghiêng đầu — phân biệt được với happy khi tắt tiếng", () => {
    expect(mascotMotion("encourage", 120, false).tilt).not.toBe(0);
    expect(mascotMotion("happy", 120, false).tilt).toBe(0);
  });

  it("BR-FBK-09: reduced-motion bỏ nảy và nghiêng, giữ một nhịp scale", () => {
    const poses: readonly MascotPose[] = ["happy", "encourage", "celebrate"];
    for (const pose of poses) {
      const motion = mascotMotion(pose, 120, true);
      expect(motion.dy).toBe(0);
      expect(motion.tilt).toBe(0);
    }
    expect(mascotMotion("celebrate", 120, true).scale).toBeGreaterThan(1);
  });

  it("có sprite cho dáng thì vẽ sprite", () => {
    const ctx = fakeContext();
    const drawImage = vi.spyOn(ctx, "drawImage");
    const sprite: CanvasImageSource = fakeContext().canvas;

    drawMascot(ctx, PLACEMENT, "happy", 0, { sprites: { happy: sprite } });

    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(drawImage.mock.calls[0]?.[0]).toBe(sprite);
  });

  it("thiếu sprite thì vẽ thay thế bằng primitive, không emoji", () => {
    const ctx = fakeContext();
    const drawImage = vi.spyOn(ctx, "drawImage");
    const fillText = vi.spyOn(ctx, "fillText");
    const ellipse = vi.spyOn(ctx, "ellipse");

    drawMascot(ctx, PLACEMENT, "encourage", 0);

    expect(drawImage).not.toHaveBeenCalled();
    expect(fillText).not.toHaveBeenCalled();
    expect(ellipse).toHaveBeenCalled();
  });
});
