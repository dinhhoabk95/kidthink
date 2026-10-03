/**
 * Bố cục GT-003 trong khung năm vùng (`play-stage-zones.md`, Task #277 S5):
 * vật nguồn xếp một hàng trong `zones.tray`, rổ đích đứng giữa `zones.stage`.
 * Trẻ kéo từ khay lên sân khấu — hoặc chạm vật rồi chạm rổ (`BR-ENG-06`).
 *
 * Hàm thuần: cùng rect và cùng band cho cùng slot (`BR-PSZ-02`).
 */

import { SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { ContainerBox } from "#src/render/index.js";

/** Cạnh vật tối đa trong khay — cùng cỡ token khay của GT-001. */
const TRAY_ITEM_MAX_PX = 104;

/** Đệm trong của khay và của sân khấu quanh rổ. */
const ZONE_PADDING_PX = SLOT_GAP_PX;

/** Đích chứa phải rộng hơn vật rõ ràng (`GT-003.md` §10, §14). */
export const CONTAINER_WIDTH_PER_ITEM = 2.2;
export const CONTAINER_HEIGHT_PER_ITEM = 1.5;
export const CONTAINER_MIN_W = 260;
export const CONTAINER_MIN_H = 150;

/** Cạnh vật vừa khay: không quá cao khay, không chồng sang vật bên cạnh. */
function trayItemSize(count: number, tray: ZoneRect): number {
  const pitch = (tray.w - 2 * ZONE_PADDING_PX) / count;
  const byWidth = pitch - SLOT_GAP_PX;
  const byHeight = tray.h - 2 * ZONE_PADDING_PX;
  return Math.max(0, Math.floor(Math.min(TRAY_ITEM_MAX_PX, byWidth, byHeight)));
}

/** Slot nguồn: một hàng chia đều bề ngang khay, tâm theo giữa chiều cao khay. */
export function computeTraySourceSlots(
  count: number,
  tray: ZoneRect,
  touchFloor: number
): Slot[] {
  if (count <= 0) {
    return [];
  }
  const size = trayItemSize(count, tray);
  const pitch = (tray.w - 2 * ZONE_PADDING_PX) / count;
  const hit = Math.max(touchFloor, size);
  return Array.from({ length: count }, (_, index) => ({
    index,
    x: Math.round(tray.x + ZONE_PADDING_PX + pitch * (index + 0.5)),
    y: Math.round(tray.y + tray.h / 2),
    w: size,
    h: size,
    hitW: hit,
    hitH: hit,
    page: 0,
    role: "source" as const,
  }));
}

/** Slot đích: giữa sân khấu, cùng cỡ vật nguồn — hộp rổ nở ra từ tâm này. */
export function computeStageTargetSlot(
  stage: ZoneRect,
  itemSize: number,
  touchFloor: number,
  index: number
): Slot {
  const hit = Math.max(touchFloor, itemSize);
  return {
    index,
    x: Math.round(stage.x + stage.w / 2),
    y: Math.round(stage.y + stage.h / 2),
    w: itemSize,
    h: itemSize,
    hitW: hit,
    hitH: hit,
    page: 0,
    role: "target",
  };
}

/**
 * Hộp rổ trên sân khấu: rộng hơn vật rõ ràng nhưng cấm — NEVER tràn khỏi sân
 * khấu, vì ngoài sân khấu là khay và vùng lời dẫn (`BR-PSZ-01`).
 */
export function computeStageContainerBox(
  target: Slot,
  stage: ZoneRect
): ContainerBox {
  const maxW = stage.w - 2 * ZONE_PADDING_PX;
  const maxH = stage.h - 2 * ZONE_PADDING_PX;
  const w = Math.max(
    target.hitW,
    Math.min(
      Math.max(CONTAINER_MIN_W, target.w * CONTAINER_WIDTH_PER_ITEM),
      maxW
    )
  );
  const h = Math.max(
    target.hitH,
    Math.min(
      Math.max(CONTAINER_MIN_H, target.h * CONTAINER_HEIGHT_PER_ITEM),
      maxH
    )
  );
  return { x: target.x, y: target.y, w, h };
}
