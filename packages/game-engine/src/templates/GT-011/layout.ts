import type { AgeBand } from "#src/contracts/types";
import type { HintDemoStep, HintLevel, HintTarget } from "#src/game-session";
import type { ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import {
  type LogicSpace,
  resolveTouchFloor,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import {
  insetDrawSize,
  insetRect,
  TRAY_DECOR_PAD_X_PX,
  TRAY_DECOR_PAD_Y_PX,
} from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { GT011InspectRenderState } from "#src/render/gt-011-shapes";
import {
  prefersReducedMotion,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/particles";
import type { ItemVisualState, SceneBox } from "#src/render/types";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { Particle } from "#src/systems/render-system";
import { WRONG_FLASH_MS, type WrongFlash } from "#src/systems/wrong-flash";
import type { GT011Content } from "./template.js";

export type GT011OptionItem = GT011Content["options"][number];
export type GT011CellItem = GT011Content["matrix"]["cells"][number];

export const GT011_INSPECT_MS = 420;
export const GT011_WAVE_MS = 900;

export interface GT011ClockState {
  logicMs: number;
  wrongTriggerSeq: number;
  winLogicMs: number | null;
  previewLogicMs: number | null;
  inspectSlotIndex: number | null;
  inspectLogicMs: number | null;
  hoveredSlotIndex: number | null;
  touchingSlotIndex: number | null;
  particles: Particle[];
}

const SESSION_CLOCKS = new WeakMap<object, GT011ClockState>();
const RENDER_ANCHORS = new WeakMap<object, { seq: number; anchorMs: number }>();
type Clk = GT011ClockState;
type Insp = GT011InspectRenderState | null;
type Opt = GT011OptionItem;

function createEmptyClock(): Clk {
  return {
    logicMs: 0,
    wrongTriggerSeq: 0,
    winLogicMs: null,
    previewLogicMs: null,
    inspectSlotIndex: null,
    inspectLogicMs: null,
    hoveredSlotIndex: null,
    touchingSlotIndex: null,
    particles: [],
  };
}

export function getGT011Clock(session: object): Clk {
  let state = SESSION_CLOCKS.get(session);
  if (!state) {
    state = createEmptyClock();
    SESSION_CLOCKS.set(session, state);
  }
  return state;
}

export function resetGT011Clock(session: object): Clk {
  const fresh = createEmptyClock();
  SESSION_CLOCKS.set(session, fresh);
  RENDER_ANCHORS.delete(session);
  return fresh;
}

export function resolveGT011WrongElapsedMs(
  s: object,
  wf: WrongFlash,
  t: number
): number {
  if (!wf.started) {
    return WRONG_FLASH_MS;
  }
  const clk = getGT011Clock(s);
  let a = RENDER_ANCHORS.get(s);
  if (!a || a.seq !== clk.wrongTriggerSeq) {
    a = { seq: clk.wrongTriggerSeq, anchorMs: t };
    RENDER_ANCHORS.set(s, a);
  }
  return Math.max(0, wf.elapsedMs(clk.logicMs), t - a.anchorMs);
}

export function resolveGT011InspectState(clk: Clk): Insp {
  if (clk.inspectSlotIndex === null || clk.inspectLogicMs === null) {
    return null;
  }
  const el = clk.logicMs - clk.inspectLogicMs;
  if (el < 0 || el >= GT011_INSPECT_MS) {
    return null;
  }
  return {
    slotIndex: clk.inspectSlotIndex,
    progress: Math.min(1, el / GT011_INSPECT_MS),
  };
}

export function resolveGT011WaveProgress(
  clk: Clk,
  solved: boolean,
  red: boolean
): number | null {
  if (!solved || clk.winLogicMs === null) {
    return null;
  }
  if (red) {
    return 0.25;
  }
  const el = Math.max(0, clk.logicMs - clk.winLogicMs);
  return el >= GT011_WAVE_MS ? null : el / GT011_WAVE_MS;
}

export function resolveGT011DisplayOptions(
  opts: readonly Opt[],
  seed: number
): readonly Opt[] {
  if (seed === 0 || opts.length < 2) {
    return [...opts];
  }
  const rng = deriveStream(seed, "items");
  for (let i = 0; i < 4; i++) {
    const c = shuffle(opts, rng);
    if (c.some((o, idx) => o.option_id !== opts[idx]?.option_id)) {
      return c;
    }
  }
  const f = opts[0];
  return f ? [...opts.slice(1), f] : [...opts];
}

function allSlotsFitInSpace(slots: readonly Slot[], sp: LogicSpace): boolean {
  return slots.every((s) => {
    const hw = Math.max(s.w, s.hitW) / 2;
    const hh = Math.max(s.h, s.hitH) / 2;
    return s.x >= hw && s.x + hw <= sp.w && s.y >= hh && s.y + hh <= sp.h;
  });
}

function makeSqSlot(
  index: number,
  x: number,
  y: number,
  c: number,
  role: "target" | "source"
): Slot {
  const rx = Math.round(x);
  const ry = Math.round(y);
  return { index, x: rx, y: ry, w: c, h: c, hitW: c, hitH: c, page: 0, role };
}

export interface GT011SlotComputeParams {
  readonly optionCount: number;
  readonly matrixRows: number;
  readonly matrixCols: number;
  readonly ageBand: AgeBand;
  readonly logicSpace: LogicSpace;
  readonly stageRect?: ZoneRect;
  readonly cssPerLogic?: number;
}

export function computeGT011Slots(p: GT011SlotComputeParams): readonly Slot[] {
  const stage = p.stageRect
    ? insetRect(p.stageRect, TRAY_DECOR_PAD_X_PX, TRAY_DECOR_PAD_Y_PX)
    : undefined;
  const base = resolveLayout("matrix-3x3")({
    slotCount: p.optionCount,
    targetCount: p.matrixRows * p.matrixCols,
    ageBand: p.ageBand,
    logic: p.logicSpace,
    stage,
    cssPerLogic: p.cssPerLogic,
  });
  const baseSlots = insetDrawSize(base, p.stageRect);
  if (!p.stageRect || allSlotsFitInSpace(baseSlots, p.logicSpace)) {
    return baseSlots;
  }
  const { optionCount: nOpt, matrixRows: nRow, matrixCols: nCol } = p;
  const cell = resolveTouchFloor(p.ageBand, p.cssPerLogic);
  const inner = insetRect(p.stageRect, TRAY_DECOR_PAD_X_PX, 0);
  const tCols = Math.max(
    1,
    Math.min(nOpt, Math.floor((inner.w + 4) / (cell + 4)))
  );
  const totRows = nRow + Math.max(1, Math.ceil(nOpt / tCols));
  if (
    nCol * cell + (nCol - 1) * 4 > inner.w ||
    p.stageRect.y + totRows * cell + 20 > p.logicSpace.h
  ) {
    return baseSlots;
  }
  const slack = p.logicSpace.h - 4 - p.stageRect.y - totRows * cell;
  const steps = Math.max(1, totRows - 2);
  const secGap = Math.min(52, Math.max(20, slack - steps * 2));
  const gapY = Math.max(0, Math.floor((slack - secGap) / steps));
  const gapX = (k: number): number =>
    Math.max(
      4,
      Math.min(
        SLOT_GAP_PX,
        Math.floor((inner.w - k * cell) / Math.max(1, k - 1))
      )
    );
  const mGap = gapX(nCol);
  const mX0 = inner.x + (inner.w - (nCol * cell + (nCol - 1) * mGap)) / 2;
  const y0 = p.stageRect.y + cell / 2;
  const out: Slot[] = [];
  for (let i = 0; i < nRow * nCol; i++) {
    const r = Math.floor(i / nCol);
    const c = i % nCol;
    const x = mX0 + c * (cell + mGap) + cell / 2;
    out.push(makeSqSlot(i, x, y0 + r * (cell + gapY), cell, "target"));
  }
  const optY0 = y0 + (nRow - 1) * (cell + gapY) + cell + secGap;
  const oGap = gapX(tCols);
  for (let o = 0; o < nOpt; o++) {
    const r = Math.floor(o / tCols);
    const c = o % tCols;
    const inR = Math.min(tCols, nOpt - r * tCols);
    const rW = inR * cell + (inR - 1) * oGap;
    const x = inner.x + (inner.w - rW) / 2 + c * (cell + oGap) + cell / 2;
    const y = optY0 + r * (cell + gapY);
    out.push(makeSqSlot(nRow * nCol + o, x, y, cell, "source"));
  }
  return insetDrawSize(out, p.stageRect);
}

function toViewOptionState(
  isSel: boolean,
  isCorrect: boolean,
  isPrev: boolean
): ViewEntity["state"] {
  if (isSel) {
    return isCorrect ? "correct" : "incorrect";
  }
  return isPrev ? "selected" : "idle";
}

export interface GT011ViewEntityParams {
  readonly cells: readonly GT011CellItem[];
  readonly displayOptions: readonly GT011OptionItem[];
  readonly cellSlots: readonly Slot[];
  readonly optionSlots: readonly Slot[];
  readonly cols: number;
  readonly cellCount: number;
  readonly previewOptionId: string | null;
  readonly isOptionSelected: (optionId: string) => boolean;
}

export function buildGT011ViewEntities(p: GT011ViewEntityParams): ViewEntity[] {
  const entities: ViewEntity[] = [];
  for (const cell of p.cells) {
    const slotIndex = cell.row * p.cols + cell.col;
    const slot = p.cellSlots[slotIndex];
    if (!slot) {
      continue;
    }
    const isBlank = cell.asset === null;
    const labels =
      cell.asset === null
        ? { label: "Ô trống", spokenLabel: "Ô trống" }
        : resolveAssetLabels(cell.asset);
    entities.push({
      id: isBlank ? "matrix_blank" : `c${cell.row}-${cell.col}`,
      slotIndex,
      role: "neutral",
      state: isBlank && p.previewOptionId !== null ? "active" : "idle",
      x: slot.x,
      y: slot.y,
      w: Math.max(slot.hitW, slot.w),
      h: Math.max(slot.hitH, slot.h),
      hitShape: "square",
      ...labels,
    });
  }
  p.displayOptions.forEach((opt, i) => {
    const slot = p.optionSlots[i];
    if (!slot) {
      return;
    }
    const state = toViewOptionState(
      p.isOptionSelected(opt.option_id),
      opt.is_correct,
      p.previewOptionId === opt.option_id
    );
    entities.push({
      id: opt.option_id,
      slotIndex: p.cellCount + i,
      role: "source",
      state,
      x: slot.x,
      y: slot.y,
      w: Math.max(slot.hitW, slot.w),
      h: Math.max(slot.hitH, slot.h),
      hitShape: "circle",
      ...resolveAssetLabels(opt.asset),
    });
  });
  return entities;
}

export interface GT011HintResolveContext {
  readonly level: HintLevel;
  readonly accepting: boolean;
  readonly cells: readonly GT011CellItem[];
  readonly rows: number;
  readonly cols: number;
  readonly blank: { readonly row: number; readonly col: number };
  readonly correctIdx: number | null;
  readonly fallback: HintTarget | null;
}

type HCtx = GT011HintResolveContext;
type Steps = readonly HintDemoStep[] | null;

export function resolveGT011HintTargetForLevel(h: HCtx): HintTarget | null {
  if (!h.accepting) {
    return null;
  }
  const toId = (c: GT011CellItem): string =>
    c.asset === null ? "matrix_blank" : `c${c.row}-${c.col}`;
  const rowIds = h.cells.filter((c) => c.row === h.blank.row).map(toId);
  if (h.level === 1) {
    return { kind: "region", ids: rowIds };
  }
  if (h.level === 2) {
    const colIds = h.cells
      .filter((c) => c.col === h.blank.col && c.row !== h.blank.row)
      .map(toId);
    return { kind: "region", ids: [...rowIds, ...colIds] };
  }
  return h.fallback;
}

export function resolveGT011HintDemoSequence(h: HCtx): Steps {
  if (h.level < 3 || !h.accepting || h.correctIdx === null) {
    return null;
  }
  return [
    { from: h.correctIdx, to: h.blank.row * h.cols + h.blank.col },
    { from: h.blank.row * h.cols, to: h.blank.row * h.cols + (h.cols - 1) },
    { from: h.blank.col, to: (h.rows - 1) * h.cols + h.blank.col },
  ];
}

export function resolveGT011EffectiveStage(
  sr: ZoneRect | undefined,
  slots: readonly Slot[],
  sp: LogicSpace
): ZoneRect | undefined {
  if (!sr) {
    return undefined;
  }
  const b0 = sr.y + sr.h;
  const b1 = slots.reduce(
    (m, s) => Math.max(m, s.y + Math.max(s.h, s.hitH) / 2 + 20),
    b0
  );
  return b1 <= b0
    ? sr
    : { ...sr, h: Math.min(sp.h - sr.y, Math.ceil(b1 - sr.y)) };
}

export interface GT011OptionStateParams {
  readonly isWon: boolean;
  readonly isCorrect: boolean;
  readonly isWrongFlashing: boolean;
  readonly isTouching: boolean;
  readonly isPreviewed: boolean;
}
type OSt = GT011OptionStateParams;

export function resolveGT011OptionVisualState(p: OSt): ItemVisualState {
  if (p.isWon && p.isCorrect) {
    return "correct";
  }
  if (p.isWrongFlashing) {
    return "wrong";
  }
  if (p.isTouching) {
    return "touching";
  }
  return p.isPreviewed ? "selected" : "idle";
}

export interface GT011OptionPoseParams {
  readonly visualState: ItemVisualState;
  readonly isHovered: boolean;
  readonly wrongProg: number | null;
  readonly reducedMotion: boolean;
  readonly isDimmedByL3?: boolean;
}
type OPose = GT011OptionPoseParams;

export function resolveGT011OptionDrawSlot(slot: Slot, p: OPose): Slot {
  const st = p.visualState;
  let scale = p.isDimmedByL3 && st === "idle" ? 0.94 : 1;
  let dx = 0;
  let dy = 0;
  if (st === "selected") {
    scale = 1.05;
    dy = -4;
  } else if (st === "touching") {
    scale = 0.96;
    dy = 2;
  } else if (st === "correct") {
    scale = 1.06;
    dy = -2;
  } else if (st === "wrong" && !p.reducedMotion && p.wrongProg !== null) {
    dx = Math.sin(p.wrongProg * Math.PI * 4) * 5 * (1 - p.wrongProg * 0.5);
  } else if (p.isHovered) {
    dy = -2;
  }
  return {
    ...slot,
    x: slot.x + dx,
    y: slot.y + dy,
    w: Math.max(12, Math.round(slot.w * scale)),
    h: Math.max(12, Math.round(slot.h * scale)),
  };
}

export function resolveGT011WrongReasonVi(rM: boolean, cM: boolean): string {
  if (rM && !cM) {
    return "Khớp hàng ngang nhưng chưa khớp cột dọc";
  }
  if (!rM && cM) {
    return "Khớp cột dọc nhưng chưa khớp hàng ngang";
  }
  return rM || cM
    ? "Chưa khớp quy luật hai chiều của bảng"
    : "Chưa khớp quy luật hàng ngang và cột dọc";
}

type AssetRef =
  | { readonly kind: string; readonly ref?: string; readonly path?: string }
  | null
  | undefined;

export function resolveGT011FallbackBadgeIndex(
  asset: AssetRef,
  idx: number
): number | null {
  if (!asset) {
    return idx;
  }
  if (asset.kind === "emoji") {
    return asset.ref?.trim() ? null : idx;
  }
  return asset.kind === "image" && !asset.path?.trim() ? idx : null;
}

function clampParticles(pts: Particle[], b: SceneBox, pad: number): void {
  for (const p of pts) {
    p.x = Math.min(b.x + b.w - pad, Math.max(b.x + pad, p.x));
    p.y = Math.min(b.y + b.h - pad, Math.max(b.y + pad, p.y));
  }
}

export function spawnGT011CelebrateParticles(
  s: Slot | undefined,
  b: SceneBox,
  on: boolean
): Particle[] {
  if (!(s && on) || prefersReducedMotion()) {
    return [];
  }
  const spawned = spawnParticlesAtSlot(s, 12);
  clampParticles(spawned, b, 6);
  return spawned;
}

export function stepGT011Particles(pts: Particle[], b: SceneBox): void {
  if (pts.length > 0) {
    updateParticles(pts);
    clampParticles(pts, b, 4);
  }
}
