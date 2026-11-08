import type { ZoneRect } from "./stage-zones.js";

/** Một chip vuông của dải chỉ dẫn, toạ độ tâm. */
export interface StripChip {
  readonly cx: number;
  readonly cy: number;
  readonly size: number;
}

export interface MutedStripLayout {
  readonly chips: readonly StripChip[];
  /** Máy hát thu nhỏ để chừa chỗ cho dải; vẫn là nút nghe lại. */
  readonly gramophone: StripChip;
}

const STRIP_GAP_PX = 4;
const MIN_CHIP_PX = 20;
const MAX_CHIP_PX = 48;
const STRIP_SHARE_OF_FIGURE = 0.36;
const MAX_GRAMOPHONE_PX = 130;

/**
 * Bố cục khi tắt tiếng (`BR-E018-06`): máy hát ở nửa trên khung hình, dải
 * `chipCount` chip vuông ở một hàng ngay dưới, canh giữa. Mọi thứ nằm trong
 * `figure` nên không lấn vào vùng lựa chọn bên dưới. Chip co lại khi nhiều
 * nhưng không dưới `MIN_CHIP_PX`.
 */
export function computeMutedStripLayout(
  figure: ZoneRect,
  chipCount: number
): MutedStripLayout {
  const stripH = Math.min(
    MAX_CHIP_PX,
    Math.max(MIN_CHIP_PX, figure.h * STRIP_SHARE_OF_FIGURE)
  );
  const n = Math.max(1, chipCount);
  const chipSize = Math.max(
    MIN_CHIP_PX,
    Math.min(stripH, (figure.w - (n - 1) * STRIP_GAP_PX) / n)
  );
  const rowW = n * chipSize + (n - 1) * STRIP_GAP_PX;
  const startX = figure.x + (figure.w - rowW) / 2 + chipSize / 2;
  const rowCy = figure.y + figure.h - stripH / 2;
  const chips: StripChip[] = [];
  for (let i = 0; i < chipCount; i++) {
    chips.push({
      cx: startX + i * (chipSize + STRIP_GAP_PX),
      cy: rowCy,
      size: chipSize,
    });
  }
  const gramSize = Math.max(
    MIN_CHIP_PX,
    Math.min(MAX_GRAMOPHONE_PX, figure.w, figure.h - stripH - STRIP_GAP_PX)
  );
  return {
    chips,
    gramophone: {
      cx: figure.x + figure.w / 2,
      cy: figure.y + gramSize / 2,
      size: gramSize,
    },
  };
}
