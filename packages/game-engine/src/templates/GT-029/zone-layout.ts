import type { AgeBand } from "#src/contracts/types";
import {
  type LogicSpace,
  resolveTouchFloor,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import { DOCK_PADDING_PX, DOCK_SLAB_ALLOWANCE_PX } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";

/**
 * Chia sân khấu của GT-029 (`BR-PSZ-01`): tập vật ở một bên, dock chứa các
 * phương án đáp số ở bên kia. Cả hai cùng hiện khi bớt đủ, nên chúng không được
 * dùng chung chỗ (trước đây cả hai gọi layout trên toàn canvas và đè lên nhau).
 * Portrait xếp tập trên, dock dưới; ngang xếp tập trái, dock phải.
 */

/** Phần sân khấu cho phép thử đặt dock — dock ôm sát slot nên thường nhỏ hơn. */
const OPTIONS_CANDIDATE_SHARE = 0.5;

export interface ItemsAndOptionsAreas {
  /** Vùng cho lưới vật. */
  readonly items: ZoneRect;
  /** Vùng cho hàng phương án (không gồm lề dock). */
  readonly options: ZoneRect;
}

interface LayoutParams {
  readonly ageBand: AgeBand;
  readonly logic: LogicSpace;
  readonly cssPerLogic?: number;
}

function layoutOptions(
  region: ZoneRect,
  count: number,
  params: LayoutParams
): Slot[] {
  return resolveLayout("flex-wrap")({
    slotCount: count,
    ageBand: params.ageBand,
    logic: params.logic,
    stage: region,
    cssPerLogic: params.cssPerLogic,
  });
}

function footprintOf(slots: readonly Slot[]): ZoneRect {
  const left = Math.min(...slots.map((s) => s.x - s.hitW / 2));
  const right = Math.max(...slots.map((s) => s.x + s.hitW / 2));
  const top = Math.min(...slots.map((s) => s.y - s.hitH / 2));
  const bottom = Math.max(...slots.map((s) => s.y + s.hitH / 2));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export function splitItemsAndOptions(
  stage: ZoneRect,
  optionCount: number,
  params: LayoutParams
): ItemsAndOptionsAreas {
  const isLandscape = stage.w > stage.h;
  // Ngang: dock chỉ rộng vừa một hàng ô ở sàn chạm — dock rộng hơn lấy chỗ của
  // tập vật, mà tập vật mới là thứ cần nhiều ô nhất.
  const oneRowW =
    optionCount *
      (resolveTouchFloor(params.ageBand, params.cssPerLogic) + SLOT_GAP_PX) -
    SLOT_GAP_PX;
  const candidateW = Math.min(
    Math.round(stage.w * OPTIONS_CANDIDATE_SHARE),
    oneRowW
  );
  const candidate: ZoneRect = isLandscape
    ? {
        x: stage.x + stage.w - candidateW,
        y: stage.y,
        w: candidateW,
        h: stage.h,
      }
    : {
        x: stage.x,
        y: stage.y + Math.round(stage.h * (1 - OPTIONS_CANDIDATE_SHARE)),
        w: stage.w,
        h: Math.round(stage.h * OPTIONS_CANDIDATE_SHARE),
      };
  const probe = layoutOptions(candidate, optionCount, params);
  if (probe.length === 0) {
    return { items: stage, options: candidate };
  }
  const foot = footprintOf(probe);
  const dockW = Math.round(foot.w + 2 * DOCK_PADDING_PX);
  const dockH = Math.round(
    foot.h + 2 * DOCK_PADDING_PX + DOCK_SLAB_ALLOWANCE_PX
  );
  const dock: ZoneRect = isLandscape
    ? { x: stage.x + stage.w - dockW, y: stage.y, w: dockW, h: stage.h }
    : { x: stage.x, y: stage.y + stage.h - dockH, w: stage.w, h: dockH };
  const options: ZoneRect = {
    x: dock.x + DOCK_PADDING_PX,
    y: dock.y + DOCK_PADDING_PX,
    w: dock.w - 2 * DOCK_PADDING_PX,
    h: dock.h - 2 * DOCK_PADDING_PX - DOCK_SLAB_ALLOWANCE_PX,
  };
  const items: ZoneRect = isLandscape
    ? { ...stage, w: Math.max(0, dock.x - SLOT_GAP_PX - stage.x) }
    : { ...stage, h: Math.max(0, dock.y - SLOT_GAP_PX - stage.y) };
  return { items, options };
}

export function layoutOptionSlots(
  areas: ItemsAndOptionsAreas,
  count: number,
  params: LayoutParams
): Slot[] {
  return layoutOptions(areas.options, count, params);
}
