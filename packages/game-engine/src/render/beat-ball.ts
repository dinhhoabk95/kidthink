/**
 * Bóng nảy theo phách của GT-034 (`BR-E034-12`): hình học thuần theo pha trong
 * phách; không đọc đồng hồ nào — pha do session tính từ đồng hồ khung. Phần vẽ
 * (`drawBeatBall`) nằm ở `montessori-feedback.ts`, file thư viện vẽ được phép
 * chạm `ctx` (`BR-ERC-05`).
 */

export interface BallPoint {
  readonly x: number;
  readonly y: number;
}

export interface BeatBallInput {
  /** Pha trong phách, 0 = đầu phách (chạm đáy), 0.5 = đỉnh, 1 = phách kế. */
  readonly phase: number;
  /** Ô đang sáng — nơi bóng chạm đáy ở đầu phách. */
  readonly from: BallPoint;
  /** Ô kế — nơi bóng chạm đáy ở cuối phách; null thì nảy tại chỗ. */
  readonly to: BallPoint | null;
  /** Toạ độ y của tâm bóng khi chạm đáy. */
  readonly floorY: number;
  /** Độ cao đỉnh nảy so với đáy (px logic). */
  readonly hopPx: number;
  /** Bật thì bóng không nảy, đứng ở đáy trên ô đang sáng. */
  readonly reducedMotion: boolean;
}

/** Bán kính bóng theo ô bước: 16% cạnh ngắn, không dưới 10 px logic. */
export function beatBallRadius(slotW: number, slotH: number): number {
  return Math.max(10, Math.min(slotW, slotH) * 0.16);
}

/** Tâm bóng: parabol chạm đáy ở pha 0 và 1, đỉnh ở pha 0.5. */
export function beatBallPose(input: BeatBallInput): BallPoint {
  if (input.reducedMotion) {
    return { x: input.from.x, y: input.floorY };
  }
  const p = Math.min(1, Math.max(0, input.phase));
  const lift = 4 * p * (1 - p) * input.hopPx;
  const x = input.to
    ? input.from.x + (input.to.x - input.from.x) * p
    : input.from.x;
  return { x, y: input.floorY - lift };
}
