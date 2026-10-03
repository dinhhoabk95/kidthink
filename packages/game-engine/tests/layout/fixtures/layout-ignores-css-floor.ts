import { resolveLayout } from "#src/layout/registry";
import type { LayoutId, LayoutInput, Slot } from "#src/layout/types";

/**
 * Ca âm của `BR-PSZ-04` cho layout: chạy hàm layout nhưng ép `cssPerLogic` = 1
 * — đúng cái sẽ xảy ra nếu một hàm trong `geometry.ts` quay lại tính sàn chạm
 * theo logic px. Ở portrait 390 (`cssPerLogic` ≈ 0,61) vùng chạm band 3-4 chỉ
 * còn 96 × 0,61 ≈ 59 px thật, nên phép kiểm sàn phải báo vi phạm.
 */
export function layoutWithLogicPxFloor(
  id: LayoutId,
  input: LayoutInput
): Slot[] {
  return resolveLayout(id)({ ...input, cssPerLogic: 1 });
}
