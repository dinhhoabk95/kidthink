/** Tỉ lệ đường kính xu nhỏ nhất so với cạnh ô chạm (`BR-E031-09`). */
export const MIN_COIN_DIAMETER_RATIO = 0.62;

/** Bậc của một mệnh giá trong tập mệnh giá khác nhau của level. */
export interface CoinTier {
  /** 0 = mệnh giá nhỏ nhất. */
  readonly rank: number;
  /** Số mệnh giá khác nhau trong level. */
  readonly count: number;
}

/** Xếp `value` vào bậc tăng dần của các mệnh giá khác nhau (`BR-E031-09`). */
export function coinTierOf(values: readonly number[], value: number): CoinTier {
  const distinct = [...new Set(values)].sort((a, b) => a - b);
  return {
    rank: Math.max(0, distinct.indexOf(value)),
    count: Math.max(1, distinct.length),
  };
}

/**
 * Đường kính xu theo bậc: tuyến tính từ `max(sàn chạm, tỉ lệ × ô chạm)` tới
 * đúng cạnh ô chạm, nên không bao giờ vượt ô chạm (xu kề nhau không chồng,
 * `BR-E031-11`) và không nhỏ hơn sàn chạm khi ô chạm đủ sàn.
 */
export function coinDiameter(
  rank: number,
  count: number,
  hit: number,
  touchFloor: number
): number {
  const smallest = Math.min(
    hit,
    Math.max(touchFloor, Math.round(hit * MIN_COIN_DIAMETER_RATIO))
  );
  if (count <= 1) {
    return hit;
  }
  const t = Math.min(1, Math.max(0, rank / (count - 1)));
  return Math.round(smallest + (hit - smallest) * t);
}
