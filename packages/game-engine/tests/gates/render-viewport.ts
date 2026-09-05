/**
 * Cổng hình học khung vẽ — `BR-ENG` §7.1 của `game-engine-runtime.md`.
 *
 * Luật: "Logic cố định 960x540, scale theo DPR. Mọi toạ độ trong Session class
 * là toạ độ logic — cấm dùng pixel thiết bị."
 *
 * Mã từng vi phạm chính luật này: `setupCanvas` tính hệ số scale rồi trả về mà
 * không áp dụng, nơi gọi thì vứt giá trị trả về. Đo ngày 2026-09-01 bằng trình
 * duyệt thật: cảnh lấp 67%x60% khung ở `1440x900`, tràn 246% ở `390x844`.
 * Không test nào chạm đường vẽ nên lỗi lọt qua mọi cổng.
 *
 * `vitest` chạy `environment: "node"`. Cấm — NEVER đổi env cho cả project chỉ
 * vì một cổng; dùng canvas giả ghi lại lời gọi `setTransform`.
 */

import type { FakeMatrix } from "./fake-canvas.ts";

export interface ViewportProbe {
  /** Phần hộp mà cảnh logic lấp được, theo mỗi chiều. 1 là vừa khít. */
  fillX: number;
  fillY: number;
  /** Góc phải-dưới của cảnh, tính bằng pixel thiết bị. */
  farX: number;
  farY: number;
  /** Góc trái-trên của cảnh, tính bằng pixel thiết bị. */
  originX: number;
  originY: number;
}

/**
 * Đưa hai góc của không gian logic qua ma trận transform, rồi so với hộp thật.
 * Đây là phép đo, không phải đọc lại hằng số của mã đang kiểm.
 */
export function probeViewport(
  matrix: FakeMatrix,
  cssWidth: number,
  cssHeight: number,
  dpr: number,
  logicWidth = 960,
  logicHeight = 540
): ViewportProbe {
  const originX = matrix.e;
  const originY = matrix.f;
  const farX = matrix.a * logicWidth + matrix.e;
  const farY = matrix.d * logicHeight + matrix.f;
  return {
    farX,
    farY,
    fillX: (farX - originX) / (cssWidth * dpr),
    fillY: (farY - originY) / (cssHeight * dpr),
    originX,
    originY,
  };
}
