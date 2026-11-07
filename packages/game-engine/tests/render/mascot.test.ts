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

  describe("BR-FBK-15 — ba dáng theo tình huống", () => {
    it("freeze đứng hình: không nảy, không nghiêng, không thở ở mọi thời điểm", () => {
      for (const t of [0, 120, 700, 1500]) {
        expect(mascotMotion("freeze", t, false)).toEqual({
          dy: 0,
          tilt: 0,
          scale: 1,
        });
      }
    });

    it("idle thì thở — khác freeze ở chỗ có nhúc nhích", () => {
      expect(mascotMotion("idle", 600, false)).not.toEqual(
        mascotMotion("freeze", 600, false)
      );
    });

    it("wonder nghiêng qua lại hai phía theo thời gian", () => {
      const tilts = [0, 450, 1350].map(
        (t) => mascotMotion("wonder", t, false).tilt
      );

      expect(Math.max(...tilts)).toBeGreaterThan(0);
      expect(Math.min(...tilts)).toBeLessThan(0);
    });

    it("cheer nảy lên (dy âm) và reduced-motion thu về một nhịp scale", () => {
      expect(mascotMotion("cheer", 90, false).dy).toBeLessThan(0);
      const reduced = mascotMotion("cheer", 90, true);

      expect(reduced.dy).toBe(0);
      expect(reduced.scale).toBeGreaterThan(1);
    });

    it("ba dáng mới đều vẽ được bằng primitive khi chưa có sprite", () => {
      const poses: readonly MascotPose[] = ["wonder", "freeze", "cheer"];
      for (const pose of poses) {
        const ctx = fakeContext();
        const drawImage = vi.spyOn(ctx, "drawImage");

        drawMascot(ctx, PLACEMENT, pose, 0);

        expect(drawImage).not.toHaveBeenCalled();
      }
    });
  });
});
