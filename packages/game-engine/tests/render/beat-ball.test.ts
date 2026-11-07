import { describe, expect, it } from "vitest";
import { beatBallPose } from "#src/render/beat-ball";

/** `BR-E034-12`: hình học của bóng nảy, thuần hàm của pha trong phách. */
const FROM = { x: 100, y: 300 } as const;
const TO = { x: 200, y: 300 } as const;
const BASE = { from: FROM, to: TO, floorY: 280, hopPx: 80 } as const;

describe("beatBallPose (BR-E034-12)", () => {
  it("đầu phách: bóng chạm đáy, ngay trên ô đang sáng", () => {
    const pose = beatBallPose({ ...BASE, phase: 0, reducedMotion: false });
    expect(pose.y).toBe(280);
    expect(pose.x).toBe(100);
  });

  it("giữa phách: bóng ở đỉnh, nửa đường tới ô kế", () => {
    const pose = beatBallPose({ ...BASE, phase: 0.5, reducedMotion: false });
    expect(pose.y).toBe(200);
    expect(pose.x).toBe(150);
  });

  it("cuối phách: bóng lại chạm đáy, tới ô kế", () => {
    const pose = beatBallPose({ ...BASE, phase: 1, reducedMotion: false });
    expect(pose.y).toBe(280);
    expect(pose.x).toBe(200);
  });

  it("không có ô kế (nảy tại chỗ): x giữ nguyên", () => {
    const pose = beatBallPose({
      ...BASE,
      to: null,
      phase: 0.5,
      reducedMotion: false,
    });
    expect(pose.x).toBe(100);
    expect(pose.y).toBe(200);
  });

  it("reduced_motion: bóng đứng ở đáy trên ô đang sáng, mọi pha như nhau", () => {
    const a = beatBallPose({ ...BASE, phase: 0.5, reducedMotion: true });
    const b = beatBallPose({ ...BASE, phase: 0.9, reducedMotion: true });
    expect(a).toEqual(b);
    expect(a.y).toBe(280);
    expect(a.x).toBe(100);
  });

  it("pha ngoài [0, 1] bị kẹp, không bay khỏi đáy", () => {
    const pose = beatBallPose({ ...BASE, phase: 1.7, reducedMotion: false });
    expect(pose.y).toBe(280);
  });
});
