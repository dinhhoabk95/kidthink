import type { ZoneRect } from "#src/layout/stage-zones";

/**
 * Toạ độ waypoint của nội dung nằm trong khung 960x540 (`GT024ContentSchema`).
 * Trong khung năm vùng, hộp bao của các waypoint được co hoặc phóng đều (giữ tỉ
 * lệ hình) vào `zones.stage` đã trừ lề chạm — bead và vùng chạm của waypoint
 * không bao giờ ra ngoài sân khấu (`BR-PSZ-01`) và hình tận dụng hết chỗ để các
 * waypoint cách xa nhau nhất có thể (`BR-LAY-05`). Không có `stage` thì giữ
 * nguyên toạ độ (`BR-LAY-10`).
 */
export interface StageFit {
  /** Hệ số co từ toạ độ nội dung sang toạ độ logic. */
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export interface FitPoint {
  readonly x: number;
  readonly y: number;
}

/** `margin` là nửa vùng chạm của waypoint: tâm waypoint cách mép stage ít nhất ngần đó. */
export function fitContentToStage(
  stage: ZoneRect,
  margin: number,
  points: readonly FitPoint[]
): StageFit {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const boxW = Math.max(1, Math.max(...xs) - minX);
  const boxH = Math.max(1, Math.max(...ys) - minY);
  const innerW = Math.max(1, stage.w - 2 * margin);
  const innerH = Math.max(1, stage.h - 2 * margin);
  const scale = Math.min(innerW / boxW, innerH / boxH);
  return {
    scale,
    offsetX: stage.x + margin + (innerW - boxW * scale) / 2 - minX * scale,
    offsetY: stage.y + margin + (innerH - boxH * scale) / 2 - minY * scale,
  };
}

export function applyStageFit<T extends FitPoint>(point: T, fit: StageFit): T {
  return {
    ...point,
    x: Math.round(fit.offsetX + point.x * fit.scale),
    y: Math.round(fit.offsetY + point.y * fit.scale),
  };
}

/** Điểm nằm trong rect (kể cả mép). */
export function isPointInStage(
  x: number,
  y: number,
  stage: ZoneRect | undefined
): boolean {
  return (
    stage === undefined ||
    (x >= stage.x &&
      x <= stage.x + stage.w &&
      y >= stage.y &&
      y <= stage.y + stage.h)
  );
}
