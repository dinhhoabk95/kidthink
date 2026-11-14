import type { GameAction, HintDemoStep, HintTarget } from "#src/game-session";
import type { Gesture } from "#src/interaction";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type {
  GT024Bounds,
  GT024Chevron,
  GT024Point,
} from "#src/render/gt-024-shapes.js";
import {
  type AvoidBox,
  antNestBox,
  antNestPoint,
  antPerchPoint,
  type CrawlPoint,
} from "#src/render/index.js";
import { designTokens } from "#src/systems/designTokens";
import type { TraceWaypoint } from "#src/systems/trace-system";

const GUIDE_BOX_STEP_PX = 10;
const GUIDE_BOX_HALF_PX = 6;
const INTERP_STEP_PX = 8;
const MIN_MISS_STROKE_LEN_PX = 24;
const EMJ_RE = /^EMJ-/i;
const ALNUM_RE = /[\p{L}\p{N}]/u;

export interface StageFit {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
}
export interface FitPoint {
  readonly x: number;
  readonly y: number;
}

export function fitContentToStage(
  stage: ZoneRect,
  margin: number,
  points: readonly FitPoint[]
): StageFit {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const boxW = Math.max(1, Math.max(...xs) - minX);
  const boxH = Math.max(1, Math.max(...ys) - minY);
  const innerW = Math.max(1, stage.w - 2 * margin);
  const innerH = Math.max(1, stage.h - 2 * margin);
  const scale = Math.min(innerW / boxW, innerH / boxH);
  return {
    scale,
    offsetX: stage.x + margin + (innerW - boxW * scale) / 2 - minX * scale,
    offsetY: stage.y + margin + (innerH - boxH * scale) / 2 - minY * scale,
  };
}

export function applyStageFit<T extends FitPoint>(point: T, fit: StageFit): T {
  return {
    ...point,
    x: Math.round(fit.offsetX + point.x * fit.scale),
    y: Math.round(fit.offsetY + point.y * fit.scale),
  };
}

export function isPointInStage(
  x: number,
  y: number,
  stage: ZoneRect | undefined
): boolean {
  return (
    stage === undefined ||
    (x >= stage.x &&
      x <= stage.x + stage.w &&
      y >= stage.y &&
      y <= stage.y + stage.h)
  );
}

export function clampR(
  x: number,
  y: number,
  r: number,
  b?: GT024Bounds
): number {
  if (!b) {
    return Math.max(2, r);
  }
  const m = Math.min(
    r,
    x - b.x - 1,
    b.x + b.w - x - 1,
    y - b.y - 1,
    b.y + b.h - y - 1
  );
  return Math.max(2, m);
}

export function clampC(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function clampPegCoords(
  x: number,
  y: number,
  r: number,
  shake: number,
  isHovered: boolean,
  b?: GT024Bounds
): { cx: number; cy: number } {
  const rawX = x + shake;
  const rawY = y + (isHovered ? 1 : 0);
  if (!b) {
    return { cx: rawX, cy: rawY };
  }
  return {
    cx: clampC(rawX, b.x + r + 2, b.x + b.w - r - 2),
    cy: clampC(rawY, b.y + r + 2, b.y + b.h - r - 2),
  };
}

export function resolveGuideEmoji(
  asset:
    | {
        readonly kind: string;
        readonly ref?: string;
        readonly text?: string;
        readonly path?: string;
      }
    | undefined
): string | null {
  if (asset?.kind !== "emoji" || typeof asset.ref !== "string") {
    return null;
  }
  const t = asset.ref.trim();
  if (t.length === 0 || EMJ_RE.test(t) || ALNUM_RE.test(t)) {
    return null;
  }
  return (t.codePointAt(0) ?? 0) > 127 ? t : null;
}

export function resolvePegFillStroke(
  wrong: number | undefined,
  isTarget: boolean,
  isDone: boolean,
  isHovered: boolean
): { fill: string; stroke: string } {
  const mo = designTokens.colors.montessori;
  if (wrong !== undefined || isTarget) {
    return { fill: mo.amberLight, stroke: mo.amberDark };
  }
  if (isDone) {
    return { fill: mo.emeraldBright, stroke: mo.emerald };
  }
  return {
    fill: designTokens.colors.surface[0],
    stroke: isHovered ? mo.amberDark : mo.woodBorder,
  };
}

export function resolveSlateBox(
  wps: readonly GT024Point[],
  b?: GT024Bounds
): GT024Bounds {
  if (b) {
    const px = clampC(Math.floor(b.w * 0.02), 3, 8);
    const pt = clampC(Math.floor(b.h * 0.02), 3, 8);
    const pb = clampC(Math.floor(b.h * 0.03), 6, 10);
    return {
      x: b.x + px,
      y: b.y + pt,
      w: Math.max(24, b.w - px * 2),
      h: Math.max(24, b.h - pt - pb),
    };
  }
  if (wps.length === 0) {
    return { x: 48, y: 84, w: 864, h: 420 };
  }
  const xs = wps.map((w) => w.x);
  const ys = wps.map((w) => w.y);
  const x = clampC(Math.min(...xs) - 54, 16, 900);
  const y = clampC(Math.min(...ys) - 54, 76, 480);
  return {
    x,
    y,
    w: clampC(Math.max(...xs) + 54, x + 40, 944) - x,
    h: clampC(Math.max(...ys) + 54, y + 40, 524) - y,
  };
}

export function buildChevrons(
  wps: readonly GT024Point[],
  reached: number,
  b?: GT024Bounds
): GT024Chevron[] {
  const out: GT024Chevron[] = [];
  for (let i = Math.max(1, reached); i < wps.length; i++) {
    const a = wps[i - 1];
    const p = wps[i];
    if (!(a && p)) {
      continue;
    }
    const dist = Math.hypot(p.x - a.x, p.y - a.y);
    if (dist < 42) {
      continue;
    }
    const mx = (a.x + p.x) / 2;
    const my = (a.y + p.y) / 2;
    const ux = (p.x - a.x) / dist;
    const uy = (p.y - a.y) / dist;
    const tx = mx + ux * 6;
    const ty = my + uy * 6;
    if (
      b &&
      (tx < b.x + 2 || tx > b.x + b.w - 2 || ty < b.y + 2 || ty > b.y + b.h - 2)
    ) {
      continue;
    }
    out.push({
      lx: mx - ux * 6 - uy * 4.5,
      ly: my - uy * 6 + ux * 4.5,
      tx,
      ty,
      rx: mx - ux * 6 + uy * 4.5,
      ry: my - uy * 6 - ux * 4.5,
    });
  }
  return out;
}

function guideBoxes(points: readonly CrawlPoint[]): AvoidBox[] {
  const boxes: AvoidBox[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (!(a && b)) {
      continue;
    }
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / GUIDE_BOX_STEP_PX)
    );
    for (let k = 0; k <= steps; k++) {
      boxes.push({
        x: a.x + ((b.x - a.x) * k) / steps,
        y: a.y + ((b.y - a.y) * k) / steps,
        halfW: GUIDE_BOX_HALF_PX,
        halfH: GUIDE_BOX_HALF_PX,
      });
    }
  }
  return boxes;
}

export function computeAntPlacement(
  wps: readonly TraceWaypoint[],
  hitHalf: number,
  stage: ZoneRect | undefined
): { nest: CrawlPoint | null; perch: CrawlPoint | null } {
  const first = wps[0];
  const last = wps.at(-1);
  if (!(first && last)) {
    return { nest: null, perch: null };
  }
  const boxes: AvoidBox[] = wps.map((w) => ({
    x: w.x,
    y: w.y,
    halfW: hitHalf,
    halfH: hitHalf,
  }));
  const cx = wps.reduce((sum, w) => sum + w.x, 0) / wps.length;
  const cy = wps.reduce((sum, w) => sum + w.y, 0) / wps.length;
  const centre = { x: cx, y: cy };
  const guides = guideBoxes(wps);
  const nest =
    antNestPoint(last, stage, [...boxes, ...guides], centre) ??
    antNestPoint(last, stage, boxes, centre);
  const withNest = nest ? [...boxes, antNestBox(nest)] : boxes;
  const perch =
    antPerchPoint(first, wps[1], stage, [...withNest, ...guides]) ??
    antPerchPoint(first, wps[1], stage, withNest);
  return { nest, perch };
}

export function densifyPolyline(
  pts: readonly FitPoint[]
): { readonly x: number; readonly y: number }[] {
  if (pts.length <= 1) {
    return [...pts];
  }
  const out: { readonly x: number; readonly y: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (!(a && b)) {
      continue;
    }
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / INTERP_STEP_PX));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  const last = pts.at(-1);
  if (last) {
    out.push({ x: last.x, y: last.y });
  }
  return out;
}

export function readNum(data: GameAction["data"], key: string): number | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const v = Reflect.get(data, key);
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function readPointArray(
  data: GameAction["data"],
  key: string
): { readonly x: number; readonly y: number }[] {
  if (typeof data !== "object" || data === null) {
    return [];
  }
  const raw = Reflect.get(data, key);
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: { readonly x: number; readonly y: number }[] = [];
  for (const item of raw) {
    if (typeof item === "object" && item !== null) {
      const x = Reflect.get(item, "x");
      const y = Reflect.get(item, "y");
      if (typeof x === "number" && typeof y === "number") {
        out.push({ x, y });
      }
    }
  }
  return out;
}

function polylineLength(pts: readonly FitPoint[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (a && b) {
      len += Math.hypot(b.x - a.x, b.y - a.y);
    }
  }
  return len;
}

export interface HintHost {
  getCurrentOrderIndex(): number;
  getScreenWaypoints(): readonly TraceWaypoint[];
  getSlotOfWaypoint(): readonly number[];
  getStageBounds(): ZoneRect | undefined;
  isAcceptingInput(): boolean;
}

function matchPolylineTargets(
  wps: readonly TraceWaypoint[],
  startOrder: number,
  pts: readonly FitPoint[],
  tolerancePx: number,
  hitTolerance: number
): { readonly x: number; readonly y: number }[] {
  const densified = densifyPolyline(pts);
  const matched: { readonly x: number; readonly y: number }[] = [];
  let nextOrder = startOrder;
  for (const pt of densified) {
    const nextWp = wps[nextOrder];
    if (!nextWp) {
      break;
    }
    const dist = Math.hypot(nextWp.x - pt.x, nextWp.y - pt.y);
    if (dist <= hitTolerance) {
      matched.push(
        dist <= tolerancePx
          ? { x: pt.x, y: pt.y }
          : { x: nextWp.x, y: nextWp.y }
      );
      nextOrder++;
    }
  }
  return matched;
}

function pointToSegmentDist(p: FitPoint, a: FitPoint, b: FitPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 0.001) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  const t = clampC(((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq, 0, 1);
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function findWrongWaypointAlong(
  wps: readonly TraceWaypoint[],
  cur: number,
  pts: readonly FitPoint[],
  hitTolerance: number
): number {
  const target = wps[cur];
  const prev = cur > 0 ? wps[cur - 1] : undefined;
  for (const pt of densifyPolyline(pts)) {
    const idx = wps.findIndex(
      (w, i) =>
        i !== cur &&
        (w.x !== target?.x || w.y !== target?.y) &&
        !(prev && w.x === prev.x && w.y === prev.y) &&
        Math.hypot(w.x - pt.x, w.y - pt.y) <= hitTolerance
    );
    if (idx >= 0) {
      return idx;
    }
  }
  return -1;
}

function isStrokeOutsideCorridor(
  wps: readonly TraceWaypoint[],
  cur: number,
  pts: readonly FitPoint[],
  hitTolerance: number
): boolean {
  const target = wps[cur];
  if (!target) {
    return false;
  }
  const start = (cur > 0 ? wps[cur - 1] : undefined) ?? target;
  for (const pt of densifyPolyline(pts)) {
    if (pointToSegmentDist(pt, start, target) > hitTolerance) {
      return true;
    }
  }
  return false;
}

function resolveStrokeGesture(
  wps: readonly TraceWaypoint[],
  cur: number,
  stage: ZoneRect | undefined,
  gesture: Extract<Gesture, { type: "stroke" }>,
  tolerancePx: number,
  hitTolerance: number
): GameAction | null {
  const first = gesture.points[0];
  if (!(first && isPointInStage(first.x, first.y, stage))) {
    return null;
  }
  const inStage = gesture.points.filter((p) => isPointInStage(p.x, p.y, stage));
  const matched = matchPolylineTargets(
    wps,
    cur,
    inStage,
    tolerancePx,
    hitTolerance
  );
  if (matched.length === 1 && matched[0]) {
    return { type: "trace_point", data: matched[0] };
  }
  if (matched.length >= 2) {
    return { type: "trace_multi", data: { points: matched } };
  }
  const wrongIdx = findWrongWaypointAlong(wps, cur, inStage, hitTolerance);
  const offCorridor =
    wrongIdx < 0 &&
    polylineLength(inStage) >= MIN_MISS_STROKE_LEN_PX &&
    isStrokeOutsideCorridor(wps, cur, inStage, hitTolerance);
  if (wrongIdx >= 0 || offCorridor) {
    return {
      type: "tap_waypoint",
      data: {
        index: wrongIdx >= 0 ? wrongIdx : cur,
        strokePoints: inStage.map((p) => ({ x: p.x, y: p.y })),
      },
    };
  }
  return null;
}

function resolveDropGesture(
  wps: readonly TraceWaypoint[],
  cur: number,
  stage: ZoneRect | undefined,
  gesture: Extract<Gesture, { type: "drop" }>,
  tolerancePx: number,
  hitTolerance: number
): GameAction | null {
  if (
    !(
      isPointInStage(gesture.fromX, gesture.fromY, stage) &&
      isPointInStage(gesture.toX, gesture.toY, stage)
    )
  ) {
    return null;
  }
  const matched = matchPolylineTargets(
    wps,
    cur,
    [
      { x: gesture.fromX, y: gesture.fromY },
      { x: gesture.toX, y: gesture.toY },
    ],
    tolerancePx,
    hitTolerance
  );
  if (matched.length === 1 && matched[0]) {
    return { type: "trace_point", data: matched[0] };
  }
  return matched.length >= 2
    ? { type: "trace_multi", data: { points: matched } }
    : null;
}

function resolveTapGesture(
  wps: readonly TraceWaypoint[],
  cur: number,
  target: TraceWaypoint,
  stage: ZoneRect | undefined,
  gesture: Extract<Gesture, { type: "tap" }>,
  tolerancePx: number,
  hitTolerance: number
): GameAction | null {
  if (!isPointInStage(gesture.x, gesture.y, stage)) {
    return null;
  }
  const dist = Math.hypot(target.x - gesture.x, target.y - gesture.y);
  if (dist <= hitTolerance) {
    return {
      type: "trace_point",
      data:
        dist <= tolerancePx
          ? { x: gesture.x, y: gesture.y }
          : { x: target.x, y: target.y },
    };
  }
  const prev = cur > 0 ? wps[cur - 1] : undefined;
  if (
    prev &&
    Math.hypot(prev.x - gesture.x, prev.y - gesture.y) <= hitTolerance
  ) {
    return null;
  }
  const hitIdx = wps.findIndex(
    (w) =>
      !(prev && w.x === prev.x && w.y === prev.y) &&
      Math.hypot(w.x - gesture.x, w.y - gesture.y) <= hitTolerance
  );
  return hitIdx >= 0 ? { type: "tap_waypoint", data: { index: hitIdx } } : null;
}

export function resolveGT024GestureAction(
  host: HintHost,
  gesture: Gesture,
  tolerancePx: number,
  hitTolerance: number
): GameAction | null {
  const wps = host.getScreenWaypoints();
  const cur = host.getCurrentOrderIndex();
  const target = wps[cur];
  const stage = host.getStageBounds();
  if (!target) {
    return null;
  }
  if (gesture.type === "stroke") {
    return resolveStrokeGesture(
      wps,
      cur,
      stage,
      gesture,
      tolerancePx,
      hitTolerance
    );
  }
  if (gesture.type === "drop") {
    return resolveDropGesture(
      wps,
      cur,
      stage,
      gesture,
      tolerancePx,
      hitTolerance
    );
  }
  if (gesture.type === "tap") {
    return resolveTapGesture(
      wps,
      cur,
      target,
      stage,
      gesture,
      tolerancePx,
      hitTolerance
    );
  }
  return null;
}

export function buildDeduplicatedSlots(
  wps: readonly TraceWaypoint[],
  hit: number
): { slots: readonly Slot[]; slotOfWaypoint: readonly number[] } {
  const slots: Slot[] = [];
  const slotOfWaypoint = wps.map((w) => {
    const same = slots.find((slot) => slot.x === w.x && slot.y === w.y);
    if (same) {
      return same.index;
    }
    slots.push({
      index: slots.length,
      x: w.x,
      y: w.y,
      w: hit,
      h: hit,
      hitW: hit,
      hitH: hit,
      page: 0,
      role: "target",
    });
    return slots.length - 1;
  });
  return { slots, slotOfWaypoint };
}

export function resolveGT024HintTargetIndex(host: HintHost): number | null {
  if (!host.isAcceptingInput()) {
    return null;
  }
  const idx = host.getCurrentOrderIndex();
  const wps = host.getScreenWaypoints();
  return idx >= 0 && idx < wps.length
    ? (host.getSlotOfWaypoint()[idx] ?? idx)
    : null;
}

export function resolveGT024HintDestinationIndex(
  host: HintHost
): number | null {
  if (!host.isAcceptingInput()) {
    return null;
  }
  const idx = host.getCurrentOrderIndex();
  const wps = host.getScreenWaypoints();
  const slotMap = host.getSlotOfWaypoint();
  if (idx <= 0 && wps.length > 1) {
    return slotMap[1] ?? 1;
  }
  return idx >= 0 && idx < wps.length ? (slotMap[idx] ?? idx) : null;
}

function buildLevel2Hint(
  wps: readonly TraceWaypoint[],
  cur: number,
  targetWp: TraceWaypoint
): HintTarget {
  const prevWp = cur > 0 ? wps[cur - 1] : wps[0];
  const nextWp = cur > 0 ? targetWp : (wps[1] ?? targetWp);
  const ids =
    prevWp && prevWp.id !== nextWp.id ? [prevWp.id, nextWp.id] : [targetWp.id];
  return { kind: "region", ids };
}

export function resolveGT024HintTargetForLevel(
  host: HintHost,
  level: 1 | 2 | 3
): HintTarget | null {
  if (!host.isAcceptingInput()) {
    return null;
  }
  const cur = host.getCurrentOrderIndex();
  const wps = host.getScreenWaypoints();
  const slotMap = host.getSlotOfWaypoint();
  const targetWp = wps[cur];
  if (!targetWp) {
    return null;
  }
  const targetSlot = slotMap[cur] ?? cur;
  if (level === 1) {
    return { kind: "slot", index: targetSlot };
  }
  if (level === 2) {
    return buildLevel2Hint(wps, cur, targetWp);
  }
  const fromSlot = cur > 0 ? (slotMap[cur - 1] ?? cur - 1) : targetSlot;
  const toSlot = cur > 0 ? targetSlot : (slotMap[1] ?? targetSlot);
  return { kind: "slot", index: fromSlot, toIndex: toSlot };
}

export function resolveGT024HintDemoSequence(
  host: HintHost,
  level: 1 | 2 | 3
): readonly HintDemoStep[] | null {
  if (level < 3 || !host.isAcceptingInput()) {
    return null;
  }
  const cur = host.getCurrentOrderIndex();
  const wps = host.getScreenWaypoints();
  const slotMap = host.getSlotOfWaypoint();
  const moves: HintDemoStep[] = [];
  for (let i = cur > 0 ? cur - 1 : 0; i < wps.length - 1; i++) {
    moves.push({ from: slotMap[i] ?? i, to: slotMap[i + 1] ?? i + 1 });
  }
  return moves.length > 0 ? moves : null;
}
