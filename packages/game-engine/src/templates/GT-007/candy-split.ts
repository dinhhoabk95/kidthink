import { formatSpokenLabel } from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import type { GameAction, GameActionValue } from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import {
  CONTENT_TOP_PX,
  type LogicSpace,
  resolveTouchFloor,
  SAFE_MARGIN_PX,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { ZoneRect } from "#src/layout/stage-zones";
import { findNearestHitSlot } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawGT007CandyPlateFrame,
  drawGT007CandyTrayFrame,
} from "#src/render/gt-007-shapes";
import {
  drawGhostAssetInSlot,
  drawSlotItem,
  drawWoodenTokenDock,
  type RenderAsset,
  slotAtPoint,
} from "#src/render/index.js";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT007Content } from "#src/templates/GT-007/template";

const CANDY_MAX_PX = 64;
const CANDY_FILL_RATIO = 0.86;
const SUM_BADGE_W_PX = 56;
const REGION_PAD_PX = 10;
const STACKED_ASPECT = 1.5;
const PLATE_HEIGHT_SHARE = 0.45;
const PLATE_WIDTH_SHARE = 0.34;

export const CANDY_DEFAULT_ASSET: RenderAsset = { kind: "emoji", ref: "🍬" };

export type CandyEndpoint =
  | { readonly kind: "plate" }
  | { readonly kind: "tray"; readonly index: number };

export interface CandyTray {
  readonly id: string;
  readonly locked: boolean;
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
    this.counts = trays.map((t) => {
      const c = t.locked ? Math.min(t.initial, budget) : 0;
      budget -= c;
      return c;
    });
  }

  countOf(trayIndex: number): number {
    return this.counts[trayIndex] ?? 0;
  }

  get remaining(): number {
    return Math.max(0, this.whole - this.counts.reduce((a, b) => a + b, 0));
  }

  private get isFreeSplit(): boolean {
    return this.trays.every((t) => !t.locked);
  }

  isTraySatisfied(i: number): boolean {
    const t = this.trays[i];
    if (!t) {
      return false;
    }
    if (t.locked) {
      return true;
    }
    return this.isFreeSplit
      ? this.isWon() && this.countOf(i) >= 1
      : this.countOf(i) === t.goal;
  }

  isWon(): boolean {
    return (
      this.remaining === 0 &&
      this.trays.every((t, i) => {
        if (t.locked) {
          return true;
        }
        return this.isFreeSplit
          ? this.countOf(i) >= 1
          : this.countOf(i) === t.goal;
      })
    );
  }

  canStage(pt: CandyEndpoint): boolean {
    return pt.kind === "plate"
      ? this.remaining > 0
      : !this.trays[pt.index]?.locked && this.countOf(pt.index) > 0;
  }

  preview(from: CandyEndpoint, to: CandyEndpoint): CandyMoveOutcome {
    if (from.kind === "plate" && to.kind === "plate") {
      return "noop";
    }
    // Thả lại đúng khay vừa nhấc là không làm gì, kể cả khay đã khoá —
    // Cấm tính một lần sai.
    if (from.kind === "tray" && to.kind === "tray" && from.index === to.index) {
      return "noop";
    }
    if (this.isLocked(from) || this.isLocked(to)) {
      return "locked";
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

  private leavesEmptyTray(to: CandyEndpoint): boolean {
    if (!this.isFreeSplit || to.kind !== "tray") {
      return false;
    }
    const empty = this.trays.filter(
      (_, i) => i !== to.index && this.countOf(i) === 0
    ).length;
    return this.remaining - 1 < empty;
  }

  private isLocked(pt: CandyEndpoint): boolean {
    return pt.kind === "tray" && this.trays[pt.index]?.locked === true;
  }

  nextStep(): CandyStep | null {
    if (this.isWon()) {
      return null;
    }
    const open = this.trays.flatMap((t, i) =>
      t.locked ? [] : [{ tray: t, index: i }]
    );
    if (this.remaining > 0) {
      const byCnt = [...open].sort(
        (a, b) => this.countOf(a.index) - this.countOf(b.index)
      );
      const needy = this.isFreeSplit
        ? byCnt[0]
        : open.find(({ tray, index }) => this.countOf(index) < tray.goal);
      return needy
        ? { from: { kind: "plate" }, to: { kind: "tray", index: needy.index } }
        : null;
    }
    const minG = (t: CandyTray): number => (this.isFreeSplit ? 1 : t.goal);
    const sur = open.find((e) => this.countOf(e.index) > minG(e.tray));
    const sh = open.find((e) => this.countOf(e.index) < minG(e.tray));
    return sur && sh
      ? {
          from: { kind: "tray", index: sur.index },
          to: { kind: "tray", index: sh.index },
        }
      : null;
  }
}

export function createCandySplit(c: GT007Content): CandySplit | null {
  if (c.representation !== "discrete-object") {
    return null;
  }
  return new CandySplit(
    c.whole.value,
    c.parts.map((p) => ({
      id: p.id,
      locked: !p.is_target,
      goal: p.value,
      initial: p.value,
    }))
  );
}

export function isCandyEndpoint(
  v: object | string | number | boolean | null | undefined
): v is CandyEndpoint {
  if (typeof v !== "object" || v === null) {
    return false;
  }
  const k = Reflect.get(v, "kind");
  return (
    k === "plate" ||
    (k === "tray" && typeof Reflect.get(v, "index") === "number")
  );
}

export function computeCandyStageSlots(
  candy: CandySplit,
  ageBand: AgeBand,
  cssPerLogic: number | undefined,
  logic: LogicSpace,
  stageRect?: ZoneRect | null
): Slot[] {
  const touchFloor = resolveTouchFloor(ageBand, cssPerLogic);
  const stage = stageRect ?? {
    x: SAFE_MARGIN_PX,
    y: CONTENT_TOP_PX,
    w: logic.w - 2 * SAFE_MARGIN_PX,
    h: logic.h - CONTENT_TOP_PX - SAFE_MARGIN_PX,
  };
  return computeCandySlots(stage, touchFloor, candy.trays.length);
}

export function parseCandyMoveData(
  d: GameActionValue
): { from: CandyEndpoint; to: CandyEndpoint } | null {
  const f = typeof d === "object" && d !== null ? Reflect.get(d, "from") : null;
  const t = typeof d === "object" && d !== null ? Reflect.get(d, "to") : null;
  return isCandyEndpoint(f) && isCandyEndpoint(t) ? { from: f, to: t } : null;
}

export function candySlotIndex(
  slots: readonly Slot[],
  pt: CandyEndpoint
): number | null {
  const s = slots[pt.kind === "plate" ? 0 : pt.index + 1];
  return s ? slots.indexOf(s) : null;
}

export function candyEndpointAt(
  slots: readonly Slot[],
  x: number,
  y: number
): CandyEndpoint | null {
  const idx = findNearestHitSlot(slots, x, y, TAP_TOLERANCE_PX);
  if (idx < 0) {
    return null;
  }
  return idx === 0 ? { kind: "plate" } : { kind: "tray", index: idx - 1 };
}

export interface CandyGestureStep {
  readonly action: GameAction | null;
  readonly stagedSlot: number | null;
  readonly clearWrong: boolean;
}

export function resolveCandyGesture(
  candy: CandySplit,
  slots: readonly Slot[],
  g: Gesture,
  stagedSlot: number | null
): CandyGestureStep {
  if (g.type === "drop") {
    const from = candyEndpointAt(slots, g.fromX, g.fromY);
    const to = candyEndpointAt(slots, g.toX, g.toY);
    const action =
      from && to ? { type: "move_candy", data: { from, to } } : null;
    return { action, stagedSlot, clearWrong: false };
  }
  const tapped = g.type === "tap" ? candyEndpointAt(slots, g.x, g.y) : null;
  if (!tapped) {
    return { action: null, stagedSlot, clearWrong: false };
  }
  const slot = tapped.kind === "plate" ? 0 : tapped.index + 1;
  if (stagedSlot === null) {
    const next = candy.canStage(tapped) ? slot : null;
    return { action: null, stagedSlot: next, clearWrong: true };
  }
  if (stagedSlot === slot) {
    return { action: null, stagedSlot: null, clearWrong: true };
  }
  const from: CandyEndpoint =
    stagedSlot === 0
      ? { kind: "plate" }
      : { kind: "tray", index: stagedSlot - 1 };
  return {
    action: { type: "move_candy", data: { from, to: tapped } },
    stagedSlot,
    clearWrong: true,
  };
}

const snap = (v: number): number => Math.round(v);

function regionSlot(
  index: number,
  role: Slot["role"],
  r: ZoneRect,
  floor: number
): Slot {
  const w = Math.max(floor, Math.floor(r.w / 2) * 2);
  const h = Math.max(floor, Math.floor(r.h / 2) * 2);
  const x = snap(r.x) + w / 2;
  const y = snap(r.y) + h / 2;
  return { index, x, y, w, h, hitW: w, hitH: h, page: 0, role };
}

export function computeCandySlots(
  stage: ZoneRect,
  floor: number,
  n: number
): Slot[] {
  const inner: ZoneRect = {
    x: stage.x + SLOT_GAP_PX,
    y: stage.y + SLOT_GAP_PX,
    w: Math.max(0, stage.w - 2 * SLOT_GAP_PX),
    h: Math.max(0, stage.h - 2 * SLOT_GAP_PX),
  };
  const gaps = (n - 1) * SLOT_GAP_PX;
  const side = inner.h * STACKED_ASPECT < inner.w;
  const rects = side
    ? sideBySideRects(inner, n, gaps, floor)
    : stackedRects(inner, n, gaps, floor);
  return rects.map((r, i) =>
    regionSlot(i, i === 0 ? "source" : "target", r, floor)
  );
}

function sideBySideRects(
  r: ZoneRect,
  n: number,
  gaps: number,
  fl: number
): ZoneRect[] {
  const pW = Math.max(fl, snap((r.w - SLOT_GAP_PX) * PLATE_WIDTH_SHARE));
  const tW = Math.max(fl, snap((r.w - pW - SLOT_GAP_PX - gaps) / n));
  const x0 = r.x + pW + SLOT_GAP_PX;
  return [
    { ...r, w: pW },
    ...Array.from({ length: n }, (_, i) => ({
      x: x0 + i * (tW + SLOT_GAP_PX),
      y: r.y,
      w: tW,
      h: r.h,
    })),
  ];
}

function stackedRects(
  r: ZoneRect,
  n: number,
  gaps: number,
  fl: number
): ZoneRect[] {
  const tW = snap((r.w - gaps) / n);
  if (tW < fl) {
    const rowH = Math.max(fl, snap((r.h - n * SLOT_GAP_PX) / (n + 1)));
    return Array.from({ length: n + 1 }, (_, i) => ({
      x: r.x,
      y: r.y + i * (rowH + SLOT_GAP_PX),
      w: r.w,
      h: rowH,
    }));
  }
  const pH = Math.max(fl, snap((r.h - SLOT_GAP_PX) * PLATE_HEIGHT_SHARE));
  const tH = Math.max(fl, snap(r.h - pH - SLOT_GAP_PX));
  const y0 = r.y + pH + SLOT_GAP_PX;
  return [
    { ...r, h: pH },
    ...Array.from({ length: n }, (_, i) => ({
      x: r.x + i * (tW + SLOT_GAP_PX),
      y: y0,
      w: tW,
      h: tH,
    })),
  ];
}

export interface CandyGrid {
  readonly cols: number;
  readonly size: number;
}

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

export interface CandyPoints {
  readonly points: readonly { x: number; y: number }[];
  readonly size: number;
}

export function candyCenters(count: number, area: ZoneRect): CandyPoints {
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

function inset(s: Slot, padR = 0): ZoneRect {
  return {
    x: s.x - s.w / 2 + REGION_PAD_PX,
    y: s.y - s.h / 2 + REGION_PAD_PX,
    w: Math.max(0, s.w - 2 * REGION_PAD_PX - padR),
    h: Math.max(0, s.h - 2 * REGION_PAD_PX),
  };
}

function dockRect(s: Slot): ZoneRect {
  return { x: s.x - s.w / 2, y: s.y - s.h / 2, w: s.w, h: s.h };
}

export interface CandyRenderSpec {
  readonly state: CandySplit;
  readonly slots: readonly Slot[];
  readonly asset: RenderAsset;
  readonly won: boolean;
  readonly wrongProgress?: number | null;
  readonly stagedSlot?: number | null;
  readonly touchingSlot?: number | null;
  readonly hoveredSlot?: number | null;
}

function resolvePlateStatus(s: CandyRenderSpec): "idle" | "selected" | "won" {
  if (s.won) {
    return "won";
  }
  return s.stagedSlot === 0 || s.touchingSlot === 0 ? "selected" : "idle";
}

function resolveTrayStatus(
  s: CandyRenderSpec,
  i: number
): "idle" | "active" | "done" {
  if (s.won || s.state.isTraySatisfied(i)) {
    return "done";
  }
  const idx = i + 1;
  return s.stagedSlot === idx || s.hoveredSlot === idx || s.touchingSlot === idx
    ? "active"
    : "idle";
}

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
  const wp = spec.wrongProgress ?? null;
  drawGT007CandyPlateFrame(ctx, rs, plate, wp, resolvePlateStatus(spec));
  const badgeW = Math.min(SUM_BADGE_W_PX, plate.w * 0.2);
  const pC = candyCenters(state.whole, inset(plate, badgeW));
  pC.points.forEach((pt, i) => {
    const s = slotAtPoint(pt.x, pt.y, pC.size);
    if (i < state.remaining) {
      drawSlotItem(ctx, rs, s, { id: `plate_${i}`, asset });
    } else {
      drawGhostAssetInSlot(ctx, asset, s);
    }
  });
  if (spec.won) {
    const sz = Math.min(badgeW, plate.h * 0.5);
    const bx = plate.x + plate.w / 2 - REGION_PAD_PX - sz / 2;
    drawSlotItem(ctx, rs, slotAtPoint(bx, plate.y, sz), {
      id: "sum",
      text: String(state.whole),
      state: "correct",
    });
  }
  trays.forEach((tray, i) => {
    drawWoodenTokenDock(ctx, rs, dockRect(tray));
    const locked = state.trays[i]?.locked === true;
    drawGT007CandyTrayFrame(ctx, tray, i, locked, resolveTrayStatus(spec, i));
    const c = candyCenters(state.countOf(i), inset(tray));
    const st = locked ? "locked" : "idle";
    c.points.forEach((pt, k) => {
      drawSlotItem(ctx, rs, slotAtPoint(pt.x, pt.y, c.size), {
        id: `tray_${i}_${k}`,
        asset,
        state: st,
      });
    });
  });
}

function candyEntityId(c: GT007Content, i: number, pfx: boolean): string {
  const base = i === 0 ? c.whole.id : (c.parts[i - 1]?.id ?? `tray_${i}`);
  if (!pfx) {
    return base;
  }
  return i === 0 ? `plate:${base}` : `tray:${base}`;
}

export function buildGT007CandyView(
  candy: CandySplit,
  c: GT007Content,
  slots: readonly Slot[],
  isWrong: boolean,
  stagedSlot: number | null
): EngineView {
  const raw = [c.whole.id, ...c.parts.map((p) => p.id)];
  const pfx = new Set(raw).size !== raw.length;
  const entities: ViewEntity[] = slots.map((s, i) => {
    const isP = i === 0;
    const label = String(isP ? candy.whole : candy.countOf(i - 1));
    const sel: ViewEntity["state"] = stagedSlot === i ? "selected" : "idle";
    return {
      id: candyEntityId(c, i, pfx),
      slotIndex: i,
      role: isP ? "source" : "target",
      state: isP && isWrong ? "incorrect" : sel,
      x: s.x,
      y: s.y,
      w: Math.max(s.hitW, s.w),
      h: Math.max(s.hitH, s.h),
      hitShape: "square",
      label,
      spokenLabel: formatSpokenLabel(label),
    };
  });
  return { entities, activePrompt: c.prompt };
}
