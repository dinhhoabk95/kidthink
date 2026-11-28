/**
 * Ca âm của chấm mốc GT-024 (D-10): lề fit cũ = nửa sàn chạm, đúng bằng bán kính
 * chấm lúc đứng yên, nên chấm đang là đích (phóng 1,12) và nhịp nháy (1,14) tràn
 * ra ngoài slate box. Test kiểm tràn phải báo đỏ với lề này.
 */
export function legacyGT024FitMargin(touchFloorCss: number): number {
  return touchFloorCss / 2;
}
