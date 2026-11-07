/**
 * GT-007 chế độ vật thật (`representation: discrete-object`, `BR-E007-06..09`):
 * ô tổng và hai khay phần, trẻ kéo từng vật (kẹo) từ tổng xuống khay (tách) hoặc
 * từ khay về tổng (gộp). Module này giữ trạng thái đếm, hình học ba vùng và
 * lệnh vẽ — session chỉ nối cử chỉ, phán quyết và telemetry.
 */

import { SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawGhostAssetInSlot,
  drawSlotItem,
  drawWoodenTokenDock,
  type RenderAsset,
  slotAtPoint,
} from "#src/render/index.js";
import type { RenderSystem } from "#src/systems/render-system";

/** Cạnh tối đa của một viên kẹo vẽ trong vùng. */
const CANDY_MAX_PX = 64;
/** Tỉ lệ cạnh kẹo so với ô lưới — chừa khe giữa hai viên. */
const CANDY_FILL_RATIO = 0.86;
/** Bề rộng dải chữ số tổng ở mép phải ô tổng khi thắng. */
const SUM_BADGE_W_PX = 56;
/** Đệm trong của vùng quanh lưới kẹo. */
const REGION_PAD_PX = 10;
/** Sàn cao của khay nằm ngang khi sân khấu cao. */
const STACKED_ASPECT = 1.5;
/** Phần cao ô tổng khi xếp dọc. */
const PLATE_HEIGHT_SHARE = 0.45;
/** Phần rộng ô tổng khi xếp ngang. */
const PLATE_WIDTH_SHARE = 0.34;

export const CANDY_DEFAULT_ASSET: RenderAsset = { kind: "emoji", ref: "🍬" };

export type CandyEndpoint =
  | { readonly kind: "plate" }
  | { readonly kind: "tray"; readonly index: number };

export interface CandyTray {
  readonly id: string;
  /** Khay đã cho: đứng sẵn `initial` vật và khoá. */
  readonly locked: boolean;
  /** Số vật khay đích phải có khi thắng (bỏ qua nếu mọi khay đều khuyết). */
  readonly goal: number;
  readonly initial: number;
}

export type CandyMoveOutcome = "moved" | "locked" | "noop";

export interface CandyStep {
  readonly from: CandyEndpoint;
  readonly to: CandyEndpoint;
}

export class CandySplit {
  readonly whole: number;
  readonly trays: readonly CandyTray[];
  private readonly counts: number[];

  constructor(whole: number, trays: readonly CandyTray[]) {
    this.whole = whole;
    this.trays = trays;
    let budget = whole;
    this.counts = trays.map((tray) => {
      const count = tray.locked ? Math.min(tray.initial, budget) : 0;
      budget -= count;
      return count;
    });
  }

  countOf(trayIndex: number): number {
    return this.counts[trayIndex] ?? 0;
  }

  /** Vật còn ở ô tổng, chưa sang khay nào. */
  get remaining(): number {
    return Math.max(0, this.whole - this.counts.reduce((a, b) => a + b, 0));
  }

  /** Mọi khay đều khuyết: mọi cách chia đều thắng (`BR-E007-06`). */
  private get isFreeSplit(): boolean {
    return this.trays.every((tray) => !tray.locked);
  }

  isWon(): boolean {
    if (this.remaining > 0) {
      return false;
    }
    return this.trays.every((tray, i) => {
      if (tray.locked) {
        return true;
      }
      return this.isFreeSplit
        ? this.countOf(i) >= 1
        : this.countOf(i) === tray.goal;
    });
  }

  /** Kết quả nếu chuyển một vật từ `from` sang `to`; không đổi trạng thái. */
  preview(from: CandyEndpoint, to: CandyEndpoint): CandyMoveOutcome {
    if (from.kind === "plate" && to.kind === "plate") {
      return "noop";
    }
    if (this.isLocked(from) || this.isLocked(to)) {
      return "locked";
    }
    if (from.kind === "tray" && to.kind === "tray" && from.index === to.index) {
      return "noop";
    }
    if (from.kind === "plate") {
      if (this.remaining === 0) {
        return "noop";
      }
      return this.leavesEmptyTray(to) ? "locked" : "moved";
    }
    return this.countOf(from.index) > 0 ? "moved" : "noop";
  }

  move(from: CandyEndpoint, to: CandyEndpoint): CandyMoveOutcome {
    const outcome = this.preview(from, to);
    if (outcome !== "moved") {
      return outcome;
    }
    if (from.kind === "tray") {
      this.counts[from.index] = this.countOf(from.index) - 1;
    }
    if (to.kind === "tray") {
      this.counts[to.index] = this.countOf(to.index) + 1;
    }
    return "moved";
  }

  /**
   * Chia tự do: vật cuối vào một khay trong khi khay kia còn trống thì không
   * thể thắng nữa — báo như thả vào khay khoá (`BR-E007-08`).
   */
  private leavesEmptyTray(to: CandyEndpoint): boolean {
    if (!this.isFreeSplit || to.kind !== "tray") {
      return false;
    }
    const emptyOthers = this.trays.filter(
      (_, i) => i !== to.index && this.countOf(i) === 0
    ).length;
    return this.remaining - 1 < emptyOthers;
  }

  private isLocked(point: CandyEndpoint): boolean {
    return point.kind === "tray" && this.trays[point.index]?.locked === true;
  }

  /** Bước đúng kế tiếp cho gợi ý; `null` khi đã thắng hoặc không còn bước. */
  nextStep(): CandyStep | null {
    if (this.isWon()) {
      return null;
    }
    const open = this.trays.flatMap((tray, index) =>
      tray.locked ? [] : [{ tray, index }]
    );
    if (this.remaining > 0) {
      const needy = this.isFreeSplit
        ? [...open].sort(
            (a, b) => this.countOf(a.index) - this.countOf(b.index)
          )[0]
        : open.find(({ tray, index }) => this.countOf(index) < tray.goal);
      return needy
        ? { from: { kind: "plate" }, to: { kind: "tray", index: needy.index } }
        : null;
    }
    // Ô tổng đã hết vật mà chưa thắng: dời từ khay nhiều sang khay thiếu.
    const surplus = open.find(({ tray, index }) =>
      this.isFreeSplit
        ? this.countOf(index) > 1
        : this.countOf(index) > tray.goal
    );
    const short = open.find(({ tray, index }) =>
      this.isFreeSplit
        ? this.countOf(index) < 1
        : this.countOf(index) < tray.goal
    );
    return surplus && short
      ? {
          from: { kind: "tray", index: surplus.index },
          to: { kind: "tray", index: short.index },
        }
      : null;
  }
}

function snap(value: number): number {
  return Math.round(value);
}

/** Cạnh chẵn: tâm là số nguyên nên khe giữa hai vùng không lẻ nửa điểm ảnh. */
function evenSide(side: number, touchFloor: number): number {
  return Math.max(touchFloor, Math.floor(side / 2) * 2);
}

function regionSlot(
  index: number,
  role: Slot["role"],
  rect: ZoneRect,
  touchFloor: number
): Slot {
  const w = evenSide(rect.w, touchFloor);
  const h = evenSide(rect.h, touchFloor);
  return {
    index,
    x: snap(rect.x) + w / 2,
    y: snap(rect.y) + h / 2,
    w,
    h,
    hitW: w,
    hitH: h,
    page: 0,
    role,
  };
}

/**
 * Ba (hoặc hơn) vùng chạm lớn trong `zones.stage`: ô tổng chỉ số 0 (`source`),
 * các khay chỉ số 1… (`target`). Sân khấu cao xếp dọc (tổng trên, khay dưới);
 * sân khấu thấp xếp ngang (tổng trái, khay phải). Hàm thuần (`BR-PSZ-02`).
 */
export function computeCandySlots(
  stage: ZoneRect,
  touchFloor: number,
  trayCount: number
): Slot[] {
  const inner: ZoneRect = {
    x: stage.x + SLOT_GAP_PX,
    y: stage.y + SLOT_GAP_PX,
    w: Math.max(0, stage.w - 2 * SLOT_GAP_PX),
    h: Math.max(0, stage.h - 2 * SLOT_GAP_PX),
  };
  const gaps = (trayCount - 1) * SLOT_GAP_PX;
  const rects: ZoneRect[] =
    inner.h * STACKED_ASPECT < inner.w
      ? sideBySideRects(inner, trayCount, gaps, touchFloor)
      : stackedRects(inner, trayCount, gaps, touchFloor);
  return rects.map((rect, i) =>
    regionSlot(i, i === 0 ? "source" : "target", rect, touchFloor)
  );
}

/** Sân khấu thấp: ô tổng bên trái, các khay chia đều bên phải. */
function sideBySideRects(
  inner: ZoneRect,
  trayCount: number,
  gaps: number,
  touchFloor: number
): ZoneRect[] {
  const plateW = Math.max(
    touchFloor,
    snap((inner.w - SLOT_GAP_PX) * PLATE_WIDTH_SHARE)
  );
  const trayW = Math.max(
    touchFloor,
    snap((inner.w - plateW - SLOT_GAP_PX - gaps) / trayCount)
  );
  return [
    { ...inner, w: plateW },
    ...Array.from({ length: trayCount }, (_, i) => ({
      x: inner.x + plateW + SLOT_GAP_PX + i * (trayW + SLOT_GAP_PX),
      y: inner.y,
      w: trayW,
      h: inner.h,
    })),
  ];
}

/**
 * Sân khấu cao: ô tổng trên, khay dưới. Khay không xếp ngang vừa sàn chạm
 * (màn dọc hẹp) thì cả ba vùng xếp thành ba hàng.
 */
function stackedRects(
  inner: ZoneRect,
  trayCount: number,
  gaps: number,
  touchFloor: number
): ZoneRect[] {
  const trayW = snap((inner.w - gaps) / trayCount);
  if (trayW < touchFloor) {
    const rowH = Math.max(
      touchFloor,
      snap((inner.h - trayCount * SLOT_GAP_PX) / (trayCount + 1))
    );
    return Array.from({ length: trayCount + 1 }, (_, i) => ({
      x: inner.x,
      y: inner.y + i * (rowH + SLOT_GAP_PX),
      w: inner.w,
      h: rowH,
    }));
  }
  const plateH = Math.max(
    touchFloor,
    snap((inner.h - SLOT_GAP_PX) * PLATE_HEIGHT_SHARE)
  );
  const trayH = Math.max(touchFloor, snap(inner.h - plateH - SLOT_GAP_PX));
  return [
    { ...inner, h: plateH },
    ...Array.from({ length: trayCount }, (_, i) => ({
      x: inner.x + i * (trayW + SLOT_GAP_PX),
      y: inner.y + plateH + SLOT_GAP_PX,
      w: trayW,
      h: trayH,
    })),
  ];
}

interface CandyGrid {
  readonly cols: number;
  readonly size: number;
}

/** Số cột cho ra viên kẹo lớn nhất vừa `w`×`h`. */
export function fitCandyGrid(count: number, w: number, h: number): CandyGrid {
  let best: CandyGrid = { cols: 1, size: 0 };
  for (let cols = 1; cols <= Math.max(1, count); cols++) {
    const rows = Math.ceil(count / cols);
    const size = Math.min(w / cols, h / rows, CANDY_MAX_PX / CANDY_FILL_RATIO);
    if (size > best.size) {
      best = { cols, size };
    }
  }
  return best;
}

/** Tâm từng viên kẹo trong vùng — dòng cuối căn giữa. */
export function candyCenters(
  count: number,
  area: ZoneRect
): {
  readonly points: readonly { x: number; y: number }[];
  readonly size: number;
} {
  if (count <= 0) {
    return { points: [], size: 0 };
  }
  const grid = fitCandyGrid(count, area.w, area.h);
  const rows = Math.ceil(count / grid.cols);
  const top = area.y + (area.h - rows * grid.size) / 2;
  const points = Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / grid.cols);
    const inRow = Math.min(grid.cols, count - row * grid.cols);
    const col = i % grid.cols;
    return {
      x: area.x + area.w / 2 + (col - (inRow - 1) / 2) * grid.size,
      y: top + grid.size / 2 + row * grid.size,
    };
  });
  return { points, size: Math.floor(grid.size * CANDY_FILL_RATIO) };
}

function inset(slot: Slot, padRight = 0): ZoneRect {
  return {
    x: slot.x - slot.w / 2 + REGION_PAD_PX,
    y: slot.y - slot.h / 2 + REGION_PAD_PX,
    w: Math.max(0, slot.w - 2 * REGION_PAD_PX - padRight),
    h: Math.max(0, slot.h - 2 * REGION_PAD_PX),
  };
}

function dockRect(slot: Slot): ZoneRect {
  return {
    x: slot.x - slot.w / 2,
    y: slot.y - slot.h / 2,
    w: slot.w,
    h: slot.h,
  };
}

export interface CandyRenderSpec {
  readonly state: CandySplit;
  readonly slots: readonly Slot[];
  readonly asset: RenderAsset;
  readonly won: boolean;
}

/** Vẽ ô tổng, các khay và kẹo; chữ số tổng chỉ hiện khi thắng (`BR-E007-09`). */
export function drawCandySplit(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  spec: CandyRenderSpec
): void {
  const { state, slots, asset } = spec;
  const [plate, ...trays] = slots;
  if (!plate) {
    return;
  }
  drawWoodenTokenDock(ctx, rs, dockRect(plate));
  const badgeW = Math.min(SUM_BADGE_W_PX, plate.w * 0.2);
  const plateCandies = candyCenters(state.whole, inset(plate, badgeW));
  const bright = state.remaining;
  plateCandies.points.forEach((point, i) => {
    const slot = slotAtPoint(point.x, point.y, plateCandies.size);
    if (i < bright) {
      drawSlotItem(ctx, rs, slot, { id: `plate_${i}`, asset });
    } else {
      drawGhostAssetInSlot(ctx, asset, slot);
    }
  });
  if (spec.won) {
    const size = Math.min(badgeW, plate.h * 0.5);
    drawSlotItem(
      ctx,
      rs,
      slotAtPoint(
        plate.x + plate.w / 2 - REGION_PAD_PX - size / 2,
        plate.y,
        size
      ),
      { id: "sum", text: String(state.whole), state: "correct" }
    );
  }
  trays.forEach((tray, i) => {
    drawWoodenTokenDock(ctx, rs, dockRect(tray));
    const candies = candyCenters(state.countOf(i), inset(tray));
    candies.points.forEach((point, k) => {
      drawSlotItem(ctx, rs, slotAtPoint(point.x, point.y, candies.size), {
        id: `tray_${i}_${k}`,
        asset,
        state: state.trays[i]?.locked ? "locked" : "idle",
      });
    });
  });
}
