import type { EntityVisual, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawGT024PathGrooves,
  drawGT024SandSlate,
  drawGT024Waypoints,
  type GT024HintVisual,
  type GT024RenderedWaypoint,
} from "#src/render/gt-024-shapes.js";
import {
  type AntCrawl,
  antCrawl,
  type CrawlPoint,
  drawAntNest,
  drawCrawlingAnt,
  drawSceneBackground,
  drawSubPromptText,
  legibleFontPx,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import type { TraceWaypoint } from "#src/systems/trace-system";
import { WRONG_FLASH_MS, WrongFlashMap } from "#src/systems/wrong-flash.js";
import {
  buildChevrons,
  clampC,
  clampPegCoords,
  clampR,
  resolveGuideEmoji,
  resolvePegFillStroke,
  resolveSlateBox,
} from "./stage-fit.js";
import type { GT024Content, GT024Difficulty } from "./template.js";

const MISS_FADE_MS = 450;
const POP_MS = 260;

export interface DualStamp {
  readonly logicMs: number;
  renderMs: number | null;
}
export interface AntAnimState {
  readonly from: CrawlPoint;
  readonly fromReached: number;
  readonly reached: number;
  readonly startMs: number;
}
export interface GT024Clock {
  ant: AntAnimState | null;
  fadingPoints: readonly { readonly x: number; readonly y: number }[];
  fadingStamp: DualStamp | null;
  hoveredIndex: number | null;
  logicMs: number;
  readonly reachedStamps: Map<number, DualStamp>;
  scaffoldLevel: 0 | 1 | 2 | 3;
  readonly wrongFlashes: WrongFlashMap;
  readonly wrongStamps: Map<number, DualStamp>;
}

const CLOCKS = new WeakMap<object, GT024Clock>();

function createFreshClock(): GT024Clock {
  return {
    ant: null,
    fadingPoints: [],
    fadingStamp: null,
    hoveredIndex: null,
    logicMs: 0,
    reachedStamps: new Map(),
    scaffoldLevel: 0,
    wrongFlashes: new WrongFlashMap(WRONG_FLASH_MS),
    wrongStamps: new Map(),
  };
}

export function getGT024Clock(session: object): GT024Clock {
  let c = CLOCKS.get(session);
  if (!c) {
    c = createFreshClock();
    CLOCKS.set(session, c);
  }
  return c;
}

export function resetGT024Clock(session: object): void {
  CLOCKS.set(session, createFreshClock());
}

export function tickGT024Clock(session: object, deltaMs: number): void {
  const c = getGT024Clock(session);
  c.logicMs += deltaMs;
  c.wrongFlashes.drainExpired(c.logicMs);
  for (const [idx, s] of c.wrongStamps) {
    if (c.logicMs - s.logicMs >= WRONG_FLASH_MS) {
      c.wrongStamps.delete(idx);
    }
  }
}

export function triggerGT024Wrong(
  session: object,
  indices: readonly number[],
  strokePoints?: readonly { readonly x: number; readonly y: number }[]
): void {
  const c = getGT024Clock(session);
  for (const idx of indices) {
    if (idx >= 0) {
      c.wrongFlashes.trigger(String(idx), c.logicMs);
      c.wrongStamps.set(idx, { logicMs: c.logicMs, renderMs: null });
    }
  }
  if (strokePoints && strokePoints.length >= 2) {
    c.fadingPoints = strokePoints;
    c.fadingStamp = { logicMs: c.logicMs, renderMs: null };
  }
}

export function markGT024Reached(session: object, index: number): void {
  const c = getGT024Clock(session);
  c.scaffoldLevel = 0;
  c.wrongFlashes.clear(String(index));
  c.wrongStamps.delete(index);
  c.reachedStamps.set(index, { logicMs: c.logicMs, renderMs: null });
}

function elapsedMs(
  s: DualStamp | undefined | null,
  c: GT024Clock,
  t: number
): number {
  if (!s) {
    return Number.POSITIVE_INFINITY;
  }
  if (c.logicMs > s.logicMs) {
    return c.logicMs - s.logicMs;
  }
  s.renderMs ??= t;
  return Math.max(0, t - s.renderMs);
}

export interface GT024RenderHost {
  checkWinCondition(): boolean;
  readonly content: GT024Content;
  readonly degradation: DegradationState | null;
  readonly difficulty: GT024Difficulty;
  getCurrentOrderIndex(): number;
  getPlacement(): { nest: CrawlPoint | null; perch: CrawlPoint | null };
  getScreenWaypoints(): readonly TraceWaypoint[];
  getSlotOfWaypoint(): readonly number[];
  getStageBounds(): ZoneRect | undefined;
  readonly hitHalfPx: number;
  isAcceptingInput(): boolean;
  isRoundClosedOnWrong(): boolean;
  readonly slots: readonly Slot[];
  readonly themeId?: string;
}

function resolveEntityState(
  w: TraceWaypoint,
  idx: number,
  cur: number,
  c: GT024Clock
): EntityVisual {
  if (w.order < cur) {
    return "correct";
  }
  const stamp = c.wrongStamps.get(idx);
  const isWrong =
    c.wrongFlashes.isActive(String(idx), c.logicMs) ||
    (stamp !== undefined &&
      stamp.renderMs === null &&
      c.logicMs === stamp.logicMs);
  if (isWrong) {
    return "incorrect";
  }
  return w.order === cur ? "active" : "idle";
}

export function buildGT024ViewEntities(host: GT024RenderHost): ViewEntity[] {
  const c = getGT024Clock(host);
  const cur = host.getCurrentOrderIndex();
  const wps = host.getScreenWaypoints();
  const slotMap = host.getSlotOfWaypoint();
  const hitSize = Math.max(64, host.hitHalfPx * 2);
  const usedIds = new Set<string>();

  return wps.map((w, idx) => {
    const id = usedIds.has(w.id) ? `${w.id}:${idx}` : w.id;
    usedIds.add(id);
    const slotIdx = slotMap[idx] ?? idx;
    const slot = host.slots[slotIdx];
    const ew = slot ? Math.max(slot.w, slot.hitW) : hitSize;
    const eh = slot ? Math.max(slot.h, slot.hitH) : hitSize;
    return {
      id,
      slotIndex: slotIdx,
      role: "target",
      state: resolveEntityState(w, idx, cur, c),
      x: w.x,
      y: w.y,
      w: ew,
      h: eh,
      hitW: ew,
      hitH: eh,
      hitShape: "circle",
      ...(w.label ? resolveAssetLabels({ kind: "text", text: w.label }) : {}),
    };
  });
}

function findWrongProgress(
  same: readonly number[],
  c: GT024Clock,
  t: number
): number | undefined {
  for (const idx of same) {
    const el = elapsedMs(c.wrongStamps.get(idx), c, t);
    if (el < WRONG_FLASH_MS) {
      return el / WRONG_FLASH_MS;
    }
  }
  return undefined;
}
function findPopElapsed(
  same: readonly number[],
  c: GT024Clock,
  t: number
): number {
  return Math.min(
    ...same.map((idx) => elapsedMs(c.reachedStamps.get(idx), c, t))
  );
}

/**
 * Bán kính chấm vẽ: không nhỏ hơn nửa vùng chạm. Chấm vẽ 24 px trong khi vùng
 * chạm 48 px làm trẻ thấy mục tiêu nhỏ hơn chỗ chạm được (phone 390x844).
 */
export function gt024WaypointBaseRadius(hitHalfPx: number): number {
  const legible = Math.max(16, Math.ceil(legibleFontPx(14) * 0.75));
  return Number.isFinite(hitHalfPx) ? Math.max(legible, hitHalfPx) : legible;
}

function buildOneRenderedWaypoint(
  host: GT024RenderHost,
  rs: RenderSystem,
  c: GT024Clock,
  w: TraceWaypoint,
  i: number,
  timeMs: number
): GT024RenderedWaypoint {
  const wps = host.getScreenWaypoints();
  const cur = host.getCurrentOrderIndex();
  const b = host.getStageBounds();
  const baseR = gt024WaypointBaseRadius(host.hitHalfPx);
  const same: number[] = [];
  wps.forEach((p, idx) => {
    if (p.x === w.x && p.y === w.y) {
      same.push(idx);
    }
  });
  const doneOrClosed = host.checkWinCondition() || host.isRoundClosedOnWrong();
  const isTargetNow = !doneOrClosed && same.includes(cur);
  const isDone = doneOrClosed || (!isTargetNow && i < cur);
  const wrongProgress = findWrongProgress(same, c, timeMs);
  const popEl = findPopElapsed(same, c, timeMs);
  const isPop = !rs.reducedMotion && popEl >= 0 && popEl < POP_MS;
  const popScale = isPop ? 1 + 0.14 * Math.sin((popEl / POP_MS) * Math.PI) : 1;
  const r = clampR(w.x, w.y, baseR * (isTargetNow ? 1.12 : 1) * popScale, b);
  const isHovered = same.includes(c.hoveredIndex ?? -1);
  const shake =
    wrongProgress !== undefined && !rs.reducedMotion
      ? Math.sin(wrongProgress * Math.PI * 4) * (1 - wrongProgress) * 3
      : 0;
  const { cx, cy } = clampPegCoords(w.x, w.y, r, shake, isHovered, b);
  const pulse = rs.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(timeMs / 220);
  const haloR = clampR(cx, cy, r + 4 + pulse * 3, b);
  const colors = resolvePegFillStroke(
    wrongProgress,
    isTargetNow,
    isDone,
    isHovered
  );
  const pT = isPop ? popEl / POP_MS : 0.35;
  return {
    cx,
    cy,
    fill: colors.fill,
    haloAlpha: 0.55 + pulse * 0.25,
    haloR,
    isDone,
    isPop,
    isTargetNow,
    label: w.label ?? String(i + 1),
    lineWidth: isTargetNow || isHovered ? 3.5 : 3,
    outerHaloR: clampR(cx, cy, haloR + 4, b),
    r,
    retryR: clampR(cx, cy, baseR + 8, b),
    sparkAlpha: Math.max(0, 1 - pT),
    sparkDist: clampR(cx, cy, r + 3 + pT * 5, b),
    stroke: colors.stroke,
    wrongProgress,
  };
}

function resolveAntState(
  host: GT024RenderHost,
  c: GT024Clock,
  timeMs: number,
  reducedMotion: boolean
): AntCrawl | null {
  const wps = host.getScreenWaypoints();
  const reached = Math.min(host.getCurrentOrderIndex(), wps.length);
  const antHome = (r: number): CrawlPoint | null =>
    wps[0] ? (wps[r - 1] ?? host.getPlacement().perch) : null;
  const home = antHome(reached);
  if (!home) {
    return null;
  }
  const buildPath = (a: AntAnimState): readonly CrawlPoint[] => {
    const h = antHome(a.reached);
    if (!h) {
      return [];
    }
    return a.reached <= a.fromReached
      ? [h]
      : [a.from, ...wps.slice(Math.max(0, a.fromReached), a.reached)];
  };
  if (!c.ant) {
    c.ant = { from: home, fromReached: reached, reached, startMs: timeMs };
  } else if (c.ant.reached !== reached) {
    const now = antCrawl(
      buildPath(c.ant),
      timeMs - c.ant.startMs,
      reducedMotion
    );
    c.ant = {
      from: now ?? home,
      fromReached: c.ant.reached,
      reached,
      startMs: timeMs,
    };
  }
  return antCrawl(buildPath(c.ant), timeMs - c.ant.startMs, reducedMotion);
}

function buildHintVisual(
  host: GT024RenderHost,
  c: GT024Clock,
  reducedMotion: boolean,
  particlesOff: boolean,
  timeMs: number
): GT024HintVisual | null {
  const isFinished = host.checkWinCondition() || host.isRoundClosedOnWrong();
  if (c.scaffoldLevel < 2 || isFinished) {
    return null;
  }
  const wps = host.getScreenWaypoints();
  const cur = host.getCurrentOrderIndex();
  const from = wps[cur > 0 ? cur - 1 : 0];
  const to = wps[cur > 0 ? cur : 1];
  if (!(from && to)) {
    return null;
  }
  const t = reducedMotion ? 0.5 : (timeMs % 1200) / 1200;
  const bx = from.x + (to.x - from.x) * t;
  const by = from.y + (to.y - from.y) * t;
  return {
    beadR: particlesOff ? 0 : clampR(bx, by, 6, host.getStageBounds()),
    beadX: bx,
    beadY: by,
    from,
    to,
  };
}

export function renderGT024(
  host: GT024RenderHost,
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  timeMs: number
): void {
  const c = getGT024Clock(host);
  const wps = host.getScreenWaypoints();
  const cur = host.getCurrentOrderIndex();
  const isClosed = host.isRoundClosedOnWrong();
  const b = host.getStageBounds();
  const particlesOff = host.degradation?.particles_enabled === false;
  const shadowsOff = host.degradation?.soft_shadows_enabled === false;
  const won = host.checkWinCondition();

  drawSceneBackground(ctx, rs, host.themeId);
  if (!b) {
    drawSubPromptText(ctx, rs, host.content.shape_name);
  }
  const box = resolveSlateBox(wps, b);
  const f = wps[0];
  const l = wps.at(-1);
  drawGT024SandSlate(ctx, rs, {
    box,
    closedLoop: Boolean(
      wps.length >= 4 && f && l && f.x === l.x && f.y === l.y
    ),
    guideGlyph: resolveGuideEmoji(host.content.guide_asset),
    inset: clampC(Math.floor(Math.min(box.w, box.h) * 0.03), 4, 8),
    isClosedReveal: isClosed,
    isWon: won,
    shadowsOff,
    waypoints: wps,
  });

  const fadeEl = elapsedMs(c.fadingStamp, c, timeMs);
  const fadingAlpha =
    fadeEl < MISS_FADE_MS ? (1 - fadeEl / MISS_FADE_MS) * 0.55 : 0;
  const fadingPoints =
    fadingAlpha > 0 && b
      ? c.fadingPoints.map((p) => ({
          x: clampC(p.x, b.x + 2, b.x + b.w - 2),
          y: clampC(p.y, b.y + 2, b.y + b.h - 2),
        }))
      : c.fadingPoints;
  drawGT024PathGrooves(ctx, rs, {
    chevrons: host.difficulty.show_guide_lines
      ? buildChevrons(wps, cur, b)
      : [],
    fadingAlpha,
    fadingPoints,
    hint: buildHintVisual(host, c, rs.reducedMotion, particlesOff, timeMs),
    isWon: won,
    showGuideLines: host.difficulty.show_guide_lines,
    tracedPoints: wps.slice(0, isClosed ? wps.length : cur),
    waypoints: wps,
  });

  const nest = host.getPlacement().nest;
  if (nest && host.difficulty.show_numbered_dots) {
    drawAntNest(ctx, nest.x, nest.y);
  }
  const items: GT024RenderedWaypoint[] = [];
  wps.forEach((w, i) => {
    if (!wps.slice(0, i).some((p) => p.x === w.x && p.y === w.y)) {
      const it = buildOneRenderedWaypoint(host, rs, c, w, i, timeMs);
      const showSpark =
        (it.isPop || won) && !(particlesOff || rs.reducedMotion);
      items.push(showSpark ? it : { ...it, sparkAlpha: 0 });
    }
  });
  drawGT024Waypoints(ctx, rs, {
    items,
    scaffoldLevel: c.scaffoldLevel,
    showNumberedDots: host.difficulty.show_numbered_dots,
  });
  const crawl = resolveAntState(host, c, timeMs, rs.reducedMotion);
  if (crawl) {
    drawCrawlingAnt(ctx, crawl);
  }
}
