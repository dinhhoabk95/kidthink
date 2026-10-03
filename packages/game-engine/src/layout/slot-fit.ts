/**
 * Đặt vật vẽ và dock gỗ vào trọn `zones.stage` (`BR-PSZ-01`, Task #283 B1).
 *
 * Hai việc, cùng một lý do — vùng chạm nằm trong stage chưa đủ, nét vẽ cũng phải
 * nằm trong stage: `dockRectAroundSlots` (dock ôm quanh slot) và
 * `insetDrawSize` (thân đất sét vẽ tràn xuống dưới ô một đoạn).
 *
 * Dock gỗ ôm quanh một nhóm slot trong `zones.stage`.

 * Engine không có khay riêng (`needsTray` là `false`) mà vẫn đặt vật lựa chọn
 * trên một dock gỗ: dock là phần trang trí, nên rect của nó suy từ chính các
 * slot đã tính, không phải toạ độ cứng ở đáy canvas. Không có `stage` thì trả
 * `undefined` để `drawWoodenTokenDock` rơi về toạ độ cũ (`BR-LAY-10`).
 */

import {
  CONTENT_TOP_PX,
  type LogicSpace,
  SAFE_MARGIN_PX,
} from "./constants.js";
import type { ZoneRect } from "./stage-zones.js";
import type { Slot } from "./types.js";

/** Lề từ mép vùng chạm ngoài cùng tới mép dock. */
export const DOCK_PADDING_PX = 16;

/**
 * Tấm gỗ đáy hắt xuống dưới mặt dock — `drawWoodenTokenDock` cộng nó vào đáy
 * rect, nên rect phải cao thêm đúng ngần này để mặt dock ôm trọn slot.
 */
export const DOCK_SLAB_ALLOWANCE_PX = 4;

function clampToStage(rect: ZoneRect, stage: ZoneRect): ZoneRect {
  const left = Math.max(stage.x, rect.x);
  const top = Math.max(stage.y, rect.y);
  const right = Math.min(stage.x + stage.w, rect.x + rect.w);
  const bottom = Math.min(stage.y + stage.h, rect.y + rect.h);
  return {
    x: left,
    y: top,
    w: Math.max(0, right - left),
    h: Math.max(0, bottom - top),
  };
}

export function dockRectAroundSlots(
  slots: readonly Slot[],
  stage: ZoneRect | undefined
): ZoneRect | undefined {
  if (!stage) {
    return undefined;
  }
  const first = slots[0];
  if (!first) {
    return undefined;
  }
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (const slot of slots) {
    left = Math.min(left, slot.x - Math.max(slot.w, slot.hitW) / 2);
    right = Math.max(right, slot.x + Math.max(slot.w, slot.hitW) / 2);
    top = Math.min(top, slot.y - Math.max(slot.h, slot.hitH) / 2);
    bottom = Math.max(bottom, slot.y + Math.max(slot.h, slot.hitH) / 2);
  }
  return clampToStage(
    {
      x: Math.round(left - DOCK_PADDING_PX),
      y: Math.round(top - DOCK_PADDING_PX),
      w: Math.round(right - left + 2 * DOCK_PADDING_PX),
      h: Math.round(
        bottom - top + 2 * DOCK_PADDING_PX + DOCK_SLAB_ALLOWANCE_PX
      ),
    },
    stage
  );
}

/**
 * Thân đất sét (`RenderSystem.drawClayBody`) có tấm đáy 3D tịnh tiến xuống 5 px
 * dưới bán kính, nên vật vẽ ở slot sát mép stage tràn ra ngoài.
 */
export const CLAY_SLAB_DEPTH_PX = 5;

/**
 * Thu cạnh **vẽ** của slot để thân đất sét cộng tấm đáy nằm trong vùng chạm.
 * Vùng chạm (`hitW`/`hitH`) giữ nguyên nên sàn chạm vẫn đạt (`BR-PSZ-04`).
 * Không có `stage` thì giữ nguyên slot (`BR-LAY-10`).
 */
export function insetDrawSize(
  slots: readonly Slot[],
  stage: ZoneRect | undefined
): readonly Slot[] {
  if (!stage) {
    return slots;
  }
  return slots.map((slot) => ({
    ...slot,
    w: Math.max(0, slot.w - 2 * CLAY_SLAB_DEPTH_PX),
    h: Math.max(0, slot.h - 2 * CLAY_SLAB_DEPTH_PX),
  }));
}

/**
 * Vùng nội dung mà layout dùng khi bề mặt chưa cấp `zones.stage` (`BR-LAY-10`):
 * lề `SAFE_MARGIN_PX` hai bên và dưới, `CONTENT_TOP_PX` phía trên.
 */
export function legacyStageArea(space: LogicSpace): ZoneRect {
  return {
    x: SAFE_MARGIN_PX,
    y: CONTENT_TOP_PX,
    w: space.w - 2 * SAFE_MARGIN_PX,
    h: space.h - CONTENT_TOP_PX - SAFE_MARGIN_PX,
  };
}

/**
 * Lề mà `drawShapeTray` vẽ tràn quanh hộp ô (22 ngang, 16 dọc) cộng 4 px gờ gỗ
 * đáy. Engine đưa layout một stage đã co đúng ngần này thì khay vẽ vẫn nằm
 * trong stage thật.
 */
export const TRAY_DECOR_PAD_X_PX = 22;
export const TRAY_DECOR_PAD_Y_PX = 20;

/** Co `rect` vào trong `padX` ngang và `padY` dọc, mỗi phía. */
export function insetRect(
  rect: ZoneRect,
  padX: number,
  padY: number
): ZoneRect {
  return {
    x: rect.x + padX,
    y: rect.y + padY,
    w: Math.max(0, rect.w - 2 * padX),
    h: Math.max(0, rect.h - 2 * padY),
  };
}

/** Gờ gỗ đáy của `drawShapeTray`, tịnh tiến xuống dưới mép khay. */
const TRAY_DECOR_RIM_PX = 4;
const TRAY_DECOR_DRAW_PAD_X_PX = 22;
const TRAY_DECOR_DRAW_PAD_Y_PX = 16;

/**
 * Hộp để truyền cho `drawShapeTray` sao cho khay vẽ (hộp cộng lề vẽ cứng) nằm
 * trong `stage`. Hộp ô còn chỗ thì giữ nguyên; sát mép (ô đã ở sàn chạm) thì
 * hộp co lại — khay mất lề chứ không tràn ra ngoài (`BR-PSZ-01`).
 */
export function trayBoxWithin(
  box: ZoneRect,
  stage: ZoneRect | undefined
): ZoneRect {
  if (!stage) {
    return box;
  }
  const roomX = Math.min(box.x - stage.x, stage.x + stage.w - (box.x + box.w));
  const roomTop = box.y - stage.y;
  const roomBottom = stage.y + stage.h - (box.y + box.h) - TRAY_DECOR_RIM_PX;
  const padX = Math.max(0, Math.min(TRAY_DECOR_DRAW_PAD_X_PX, roomX));
  const padY = Math.max(
    0,
    Math.min(TRAY_DECOR_DRAW_PAD_Y_PX, roomTop, roomBottom)
  );
  return insetRect(
    box,
    TRAY_DECOR_DRAW_PAD_X_PX - padX,
    TRAY_DECOR_DRAW_PAD_Y_PX - padY
  );
}
