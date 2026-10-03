/**
 * Bố cục GT-003 trong khung năm vùng (`play-stage-zones.md`, Task #277 S5):
 * vật nguồn xếp nhiều hàng trong `zones.tray` (`BR-PSZ-13`), rổ đích đứng giữa `zones.stage`.
 * Trẻ kéo từ khay lên sân khấu — hoặc chạm vật rồi chạm rổ (`BR-ENG-06`).
 *
 * Hàm thuần: cùng rect và cùng band cho cùng slot (`BR-PSZ-02`).
 */

import { SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { ContainerBox } from "#src/render/index.js";
import {
  layoutTrayGrid,
  TRAY_LABEL_ROW_PX,
  TRAY_PAD_Y_PX,
  type TrayGrid,
} from "./tray-grid";

/** Cạnh vật tối đa trong khay — cùng cỡ token khay của GT-001. */
const TRAY_ITEM_MAX_PX = 104;

/** Đệm trong của khay và của sân khấu quanh rổ. */
const ZONE_PADDING_PX = SLOT_GAP_PX;

/** Đích chứa phải rộng hơn vật rõ ràng (`GT-003.md` §10, §14). */
export const CONTAINER_WIDTH_PER_ITEM = 2.2;
export const CONTAINER_HEIGHT_PER_ITEM = 1.5;
export const CONTAINER_MIN_W = 260;
export const CONTAINER_MIN_H = 150;

/** Sân khấu và khay shell cấp cho vòng này — đủ cả hai thì engine chơi trong khung. */
export interface TrayZones {
  readonly stage: ZoneRect;
  readonly tray: ZoneRect;
}

/** `null` khi thiếu sân khấu hoặc khay: bề mặt chưa có khung, engine dùng bố cục cũ. */
export function pickTrayZones(
  stage: ZoneRect | undefined,
  tray: ZoneRect | undefined
): TrayZones | null {
  return stage && tray ? { stage, tray } : null;
}

/**
 * Cạnh vật vừa khay: không quá `TRAY_ITEM_MAX_PX`, không chồng sang vật bên
 * cạnh, không cao hơn một hàng của khay (`BR-PSZ-13`).
 */
function trayItemSize(grid: TrayGrid, tray: ZoneRect, labelH: number): number {
  const byWidth =
    (tray.w - 2 * ZONE_PADDING_PX - (grid.perRow - 1) * SLOT_GAP_PX) /
    grid.perRow;
  const byHeight =
    (tray.h - (grid.rows - 1) * SLOT_GAP_PX) / grid.rows -
    2 * TRAY_PAD_Y_PX -
    labelH;
  return Math.max(0, Math.floor(Math.min(TRAY_ITEM_MAX_PX, byWidth, byHeight)));
}

/**
 * Khoảng cách tâm hai vật kề nhau trên một hàng. Chia đều bề ngang khay; nếu
 * chia đều làm hai vùng chạm cách dưới `SLOT_GAP_PX` mà dàn hai đầu sát mép
 * khay thì đủ khe, thì dàn hai đầu sát mép.
 */
function trayPitch(perRow: number, tray: ZoneRect, hit: number): number {
  const avail = tray.w - 2 * ZONE_PADDING_PX;
  const equalPitch = avail / perRow;
  const spreadPitch = perRow > 1 ? (avail - hit) / (perRow - 1) : equalPitch;
  const isSpread =
    equalPitch < hit + SLOT_GAP_PX && spreadPitch >= hit + SLOT_GAP_PX;
  return isSpread ? spreadPitch : equalPitch;
}

/**
 * Slot nguồn: lưới nhiều hàng trong khay, mọi vật hiện cùng lúc, không phân
 * trang (`BR-PSZ-13`). Hàng cuối ít vật hơn thì căn giữa. `firstIndex` là chỉ
 * số của slot đầu khi engine xếp đích trước nguồn.
 */
export function computeTraySourceSlots(
  count: number,
  tray: ZoneRect,
  touchFloor: number,
  firstIndex = 0,
  hasLabels = false
): Slot[] {
  if (count <= 0) {
    return [];
  }
  const grid = layoutTrayGrid(count, tray.w, touchFloor);
  const labelH = hasLabels ? TRAY_LABEL_ROW_PX : 0;
  const size = trayItemSize(grid, tray, labelH);
  const hit = Math.max(touchFloor, size);
  const pitch = trayPitch(grid.perRow, tray, hit);
  const rowH = hit + labelH;
  const blockH = grid.rows * rowH + (grid.rows - 1) * SLOT_GAP_PX;
  // Khối vật cao hơn khay (không đủ chỗ) thì tràn xuống dưới, không tràn lên trên đè vùng khác.
  const top = tray.y + Math.max(0, (tray.h - blockH) / 2);
  const centerX = tray.x + tray.w / 2;
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / grid.perRow);
    const col = index % grid.perRow;
    const inRow = Math.min(grid.perRow, count - row * grid.perRow);
    const x = centerX + (col - (inRow - 1) / 2) * pitch;
    return {
      index: firstIndex + index,
      x: Math.round(x),
      y: Math.round(top + hit / 2 + row * (rowH + SLOT_GAP_PX)),
      w: size,
      h: size,
      hitW: hit,
      hitH: hit,
      page: 0,
      role: "source" as const,
    };
  });
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

/** Cỡ vùng chạm tối thiểu thêm vào slot — bố cục cũ nới rộng hơn thân vẽ. */
export interface MinHitSize {
  readonly w: number;
  readonly h: number;
}

/**
 * Chỉ số (trong `slots`) của slot gần điểm chạm nhất mà vùng chạm cộng
 * `tolerance` chứa điểm; `-1` nếu không có. Khay một hàng ở portrait chứa ít
 * vật hơn số vật nên vùng chạm kề nhau chồng lên; chọn theo tâm gần nhất để
 * hai vật kề nhau không tranh chạm (`BR-ENG-06`).
 */
export function findNearestHitSlot(
  slots: readonly Slot[],
  x: number,
  y: number,
  tolerance: number,
  minSize?: MinHitSize
): number {
  let best = -1;
  let bestDist = Number.POSITIVE_INFINITY;
  slots.forEach((slot, index) => {
    const halfW = Math.max(slot.hitW, slot.w, minSize?.w ?? 0) / 2 + tolerance;
    const halfH = Math.max(slot.hitH, slot.h, minSize?.h ?? 0) / 2 + tolerance;
    if (Math.abs(x - slot.x) > halfW || Math.abs(y - slot.y) > halfH) {
      return;
    }
    const dist = Math.hypot(x - slot.x, y - slot.y);
    if (dist < bestDist) {
      best = index;
      bestDist = dist;
    }
  });
  return best;
}
