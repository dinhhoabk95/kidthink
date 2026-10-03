/**
 * Đặt một layout vào `zones.stage` (`BR-PSZ-01`, `game-layout-engine.md` mục 7.2).
 *
 * Mọi hàm trong `geometry.ts` tính trên khung có lề `SAFE_MARGIN_PX` hai bên,
 * `CONTENT_TOP_PX` phía trên và `SAFE_MARGIN_PX` phía dưới. Khi có `stage`, ta
 * dựng một khung ảo sao cho vùng nội dung của nó đúng bằng kích thước `stage`,
 * chạy hàm gốc trên khung ảo đó, rồi tịnh tiến slot về góc trên trái của
 * `stage`. Không sửa từng hàm hình học nên không hàm nào quên lề; không có
 * `stage` thì đi thẳng vào hàm gốc, kết quả giữ nguyên (`BR-LAY-10`).
 */

import { CONTENT_TOP_PX, SAFE_MARGIN_PX } from "./constants.js";
import type { LayoutFn, LayoutInput, Slot } from "./types.js";

function translate(slot: Slot, dx: number, dy: number): Slot {
  return { ...slot, x: slot.x + dx, y: slot.y + dy };
}

export function placeInStage(layoutFn: LayoutFn): LayoutFn {
  return (input: LayoutInput): Slot[] => {
    const { stage, ...rest } = input;
    if (!stage) {
      return layoutFn(input);
    }
    const virtual: LayoutInput = {
      ...rest,
      logic: {
        w: Math.max(0, stage.w) + 2 * SAFE_MARGIN_PX,
        h: Math.max(0, stage.h) + CONTENT_TOP_PX + SAFE_MARGIN_PX,
      },
    };
    const dx = stage.x - SAFE_MARGIN_PX;
    const dy = stage.y - CONTENT_TOP_PX;
    return layoutFn(virtual).map((slot) => translate(slot, dx, dy));
  };
}
