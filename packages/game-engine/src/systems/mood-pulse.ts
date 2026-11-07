/**
 * Dáng mascot ngắn hạn của một session (`BR-FBK-15`): đặt một dáng kèm thời
 * lượng, `tick` theo `update(deltaMs)`, hết giờ thì về `null`. Dùng chung cho
 * các trò Phase 5 để không lặp lại bộ đếm ở từng session.
 */

import type { MascotPose } from "#src/render/mascot";

export class MoodPulse {
  private pose: MascotPose | null = null;
  private remainingMs = 0;

  set(pose: MascotPose, ms: number): void {
    this.pose = pose;
    this.remainingMs = ms;
  }

  tick(deltaMs: number): void {
    if (this.remainingMs > 0) {
      this.remainingMs = Math.max(0, this.remainingMs - deltaMs);
    }
  }

  clear(): void {
    this.pose = null;
    this.remainingMs = 0;
  }

  /** Dáng đang hiệu lực, `null` khi đã hết giờ. */
  current(): MascotPose | null {
    return this.remainingMs > 0 ? this.pose : null;
  }
}
