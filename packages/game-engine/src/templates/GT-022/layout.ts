import type { AgeBand } from "#src/contracts/types";
import type { EngineView, EntityVisual, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import {
  type LogicSpace,
  resolveTouchFloor,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { hasHitOverlap } from "#src/layout/hit-overlap";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawMagnifier,
  drawStoryCharacterInStage,
  magnifierPose,
} from "#src/render/craft-shapes";
import {
  drawGT022HintOverlay,
  drawGT022QuestHeader,
  drawGT022SceneObject,
  drawGT022StageBackdrop,
} from "#src/render/gt-022-shapes";
import {
  drawProgressDots,
  drawSceneBackground,
  resolveEmojiGlyph,
} from "#src/render/shared-render";
import type {
  GT022QuestRefItem,
  RenderAsset,
  SceneBox,
} from "#src/render/types";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { RngStreamName } from "#src/rng/types";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import type { SceneObject, SceneSystem } from "#src/systems/scene-system";
import { WRONG_FLASH_MS, WrongFlashMap } from "#src/systems/wrong-flash";
import {
  type LayerUnit,
  layoutLayeredScene,
  type PlacedLayer,
} from "./layered-scene.js";
import type { GT022Content, GT022Difficulty } from "./template.js";

const EMOJI_CODE_RE = /^EMJ-[a-z0-9-]+$/i;
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type SV = GT022SessionView;
type StripTuple = readonly [Slot[], ZoneRect];
type PairTuple = readonly [number, number];
export interface GT022ClockState {
  logicMs: number;
  lastRenderMs: number | null;
  lensObjectId: string | null;
  lensStartedMs: number | null;
  readonly wrongFlashes: WrongFlashMap;
  readonly foundAtMs: Map<string, number>;
  winAtMs: number | null;
  hoveredId: string | null;
  activeHintLevel: 0 | 1 | 2 | 3;
  autoRevealElapsedMs: number;
}
export interface GT022SessionView {
  readonly content: GT022Content;
  readonly difficulty: GT022Difficulty;
  readonly themeId?: string;
  readonly stageRect?: ZoneRect;
  readonly logicSpace: LogicSpace;
  readonly cssPerLogic?: number;
  readonly layoutSeed: number;
  readonly roundGeneration: number;
  readonly resolvedObjects: readonly SceneObject[];
  readonly slots: readonly Slot[];
  readonly referenceSlots: readonly Slot[];
  readonly layers: readonly PlacedLayer[] | null;
  readonly sceneSystem: SceneSystem;
  readonly degradation: DegradationState | null;
  readonly roundClosedOnWrong: boolean;
  layerDrawOrder(): readonly PlacedLayer[];
  resolveAssetById(): ReadonlyMap<string, RenderAsset>;
  getHintTargetIndex(): number | null;
}
export interface GT022ReferenceGroup {
  readonly asset: RenderAsset;
  readonly objectIds: readonly string[];
}
export interface GT022LayoutResult {
  readonly slots: readonly Slot[];
  readonly referenceSlots: readonly Slot[];
  readonly layers: readonly PlacedLayer[] | null;
}
const CLOCK_MAP = new WeakMap<object, GT022ClockState>();
function createClock(): GT022ClockState {
  const wrongFlashes = new WrongFlashMap(WRONG_FLASH_MS);
  const foundAtMs = new Map<string, number>();
  const [lastRenderMs, lensObjectId, lensStartedMs] = [null, null, null];
  const [winAtMs, hoveredId] = [null, null];
  const [logicMs, activeHintLevel, autoRevealElapsedMs] = [0, 0 as const, 0];
  const t1 = { logicMs, lastRenderMs, lensObjectId, lensStartedMs };
  const t2 = { wrongFlashes, foundAtMs, winAtMs, hoveredId };
  return { ...t1, ...t2, activeHintLevel, autoRevealElapsedMs };
}
export function getGT022Clock(key: object): GT022ClockState {
  const cur = CLOCK_MAP.get(key) ?? createClock();
  CLOCK_MAP.set(key, cur);
  return cur;
}
export function resetGT022Clock(key: object): GT022ClockState {
  const c = createClock();
  CLOCK_MAP.set(key, c);
  return c;
}
export function isResolvableGT022Asset(asset?: RenderAsset): boolean {
  if (!asset) {
    return false;
  }
  if (asset.kind === "emoji") {
    const raw = asset.ref.trim();
    if (!raw || EMOJI_CODE_RE.test(raw)) {
      return false;
    }
    const res = resolveEmojiGlyph(raw);
    return Boolean(res && res.trim().length > 0 && !EMOJI_CODE_RE.test(res));
  }
  return (asset.kind === "text" ? asset.text : asset.path).trim().length > 0;
}
function permute<T>(
  items: readonly T[],
  seed: number,
  tag: RngStreamName
): T[] {
  if (items.length < 2) {
    return [...items];
  }
  const list = Array.from({ length: items.length }, (_, i) => i);
  const idx = shuffle(list, deriveStream(seed, tag));
  const id = idx.every((v, i) => v === i) || idx[0] === 0;
  const seq = id ? [...idx.slice(1), idx[0] ?? 0] : idx;
  return seq.flatMap((si) => {
    const v = items[si];
    return v === undefined ? [] : [v];
  });
}
export function buildResolvedObjects(
  c: GT022Content,
  seed: number,
  gen: number
): SceneObject[] {
  const objs = c.scene_objects;
  const okT = objs.some((o) => o.is_target && isResolvableGT022Asset(o.asset));
  const rng = deriveStream(seed, "items");
  const rPt = (o: { x?: number; y?: number }): PairTuple => [
    o.x ?? Math.round(100 + rng.next() * 760),
    o.y ?? Math.round(100 + rng.next() * 340),
  ];
  const base = objs.map(rPt);
  const pts =
    gen >= 1 && base.length >= 2
      ? permute(base, seed + gen * 7919, "items")
      : base;
  return objs.map((o, layer) => {
    const [x, y] = pts[layer] ?? base[layer] ?? [200, 200];
    const isTarget = o.is_target && (!okT || isResolvableGT022Asset(o.asset));
    const [id, width, height, isHidden] = [o.id, 64, 64, o.is_hidden];
    return { id, x, y, width, height, isTarget, isHidden, layer };
  });
}
function hitPriority(obj: SceneObject, sys: SceneSystem): number {
  const st = sys.getObjectState(obj.id);
  if (obj.isHidden && st?.isRevealed !== true) {
    return 3;
  }
  if (obj.isHidden && st?.isRevealed === true && st?.isFound !== true) {
    return 2;
  }
  return st?.isFound === true ? 0 : 1;
}
export function findHitSceneObject(
  objs: readonly SceneObject[],
  sys: SceneSystem,
  x: number,
  y: number,
  tol = TAP_TOLERANCE_PX
): SceneObject | null {
  let best: SceneObject | null = null;
  let [bestP, bestD] = [-1, Number.POSITIVE_INFINITY];
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i];
    if (!o) {
      continue;
    }
    const [dx, dy] = [Math.abs(x - o.x), Math.abs(y - o.y)];
    if (dx > o.width / 2 + tol || dy > o.height / 2 + tol) {
      continue;
    }
    const [p, d] = [hitPriority(o, sys), dx * dx + dy * dy];
    if (p > bestP || (p === bestP && d + 1e-6 < bestD)) {
      [bestP, bestD, best] = [p, d, o];
    }
  }
  return best;
}
export function computeGT022ReferenceGroups(
  c: GT022Content,
  res: readonly SceneObject[]
): readonly GT022ReferenceGroup[] {
  const valid = new Set(res.filter((o) => o.isTarget).map((o) => o.id));
  const groups = new Map<string, { asset: RenderAsset; objectIds: string[] }>();
  for (const o of c.scene_objects) {
    if (o.is_target && valid.has(o.id)) {
      const k = JSON.stringify(o.asset);
      const g = groups.get(k) ?? { asset: o.asset, objectIds: [] };
      g.objectIds.push(o.id);
      groups.set(k, g);
    }
  }
  return [...groups.values()];
}
function mkSlot(i: number, x: number, y: number, w: number, h: number): Slot {
  return { index: i, x, y, w, h, hitW: w, hitH: h, page: 0, role: "neutral" };
}
function computeRefStrip(
  st: ZoneRect,
  fl: number,
  rn: number,
  on: number
): StripTuple {
  if (rn === 0) {
    return [[], st];
  }
  const [pitch, sh] = [fl + SLOT_GAP_PX, fl + 2 * SLOT_GAP_PX];
  const left = st.x + (st.w - (rn * pitch - SLOT_GAP_PX)) / 2;
  const cy = Math.round(st.y + SLOT_GAP_PX + fl / 2);
  const slots = Array.from({ length: rn }, (_, i) =>
    mkSlot(on + i, Math.round(left + fl / 2 + i * pitch), cy, fl, fl)
  );
  return [slots, { ...st, y: st.y + sh, h: st.h - sh }];
}
function computePairs(c: GT022Content): PairTuple[] {
  const [objs, used] = [c.scene_objects, new Set<number>()];
  const pairs: PairTuple[] = [];
  objs.forEach((o, hid) => {
    const occ = objs.findIndex((it) => it.id === o.occluded_by);
    const ok =
      occ >= 0 && occ !== hid && !o.is_hidden && !objs[occ]?.occluded_by;
    if (ok && !used.has(occ) && !used.has(hid)) {
      used.add(occ);
      used.add(hid);
      pairs.push([occ, hid]);
    }
  });
  return pairs;
}
function tryLayered(
  a: StripTuple,
  units: readonly LayerUnit[],
  u: number
): GT022LayoutResult | null {
  const placed = layoutLayeredScene(a[1], units, u, SLOT_GAP_PX);
  if (!placed) {
    return null;
  }
  const sl = placed.map((p) =>
    mkSlot(p.index, p.hit.x, p.hit.y, p.hit.w, p.hit.h)
  );
  const all = [...sl, ...a[0]];
  if (hasHitOverlap(all)) {
    return null;
  }
  return { slots: all, layers: placed, referenceSlots: a[0] };
}
function tryAllLayered(
  s: SV,
  st: ZoneRect,
  strip: StripTuple,
  fl: number
): GT022LayoutResult | null {
  const pairs = computePairs(s.content);
  if (pairs.length === 0) {
    return null;
  }
  const gen = s.roundGeneration;
  const seed = s.layoutSeed + (gen >= 1 ? gen * 7919 : 0);
  const [rng, inP] = [deriveStream(seed, "sides"), new Set(pairs.flat())];
  const singles = s.content.scene_objects.flatMap((_, index) =>
    inP.has(index) ? [] : [{ index }]
  );
  const paired = pairs.map(([index, hiddenIndex]): LayerUnit => {
    const side = rng.next() < 0.5 ? "left" : "right";
    return { index, hiddenIndex, side };
  });
  const raw: LayerUnit[] = [...singles, ...paired];
  const units = gen >= 1 ? permute(raw, seed, "sides") : shuffle(raw, rng);
  const even = (n: number): number => Math.ceil(n / 2) * 2;
  const emptyStrip: StripTuple = [[], st];
  for (const area of [strip, emptyStrip]) {
    for (const u of [even(Math.max(fl, 84)), even(fl)]) {
      const res = tryLayered(area, units, u);
      if (res) {
        return res;
      }
    }
  }
  return null;
}
export function computeGT022Layout(s: SV, ageBand: AgeBand): GT022LayoutResult {
  const fn = resolveLayout("free-scene");
  const slotCount = s.content.scene_objects.length;
  const [logic, cssPerLogic] = [s.logicSpace, s.cssPerLogic];
  const layoutIn = (stage: ZoneRect | undefined, minS: number): Slot[] => {
    const raw = fn({ slotCount, ageBand, logic, stage, cssPerLogic }).map(
      (sl) => {
        const [w, h] = [Math.max(sl.w, minS), Math.max(sl.h, minS)];
        const [hitW, hitH] = [Math.max(sl.hitW, minS), Math.max(sl.hitH, minS)];
        return { ...sl, w, h, hitW, hitH };
      }
    );
    if (s.roundGeneration < 1 || raw.length < 2) {
      return raw;
    }
    const seed = s.layoutSeed + s.roundGeneration * 7919;
    const p = permute(raw, seed, "cells");
    return raw.map((sl, i) => {
      const [index, page, role] = [sl.index, sl.page, sl.role];
      return { ...(p[i] ?? sl), index, page, role };
    });
  };
  if (!s.stageRect) {
    const slots = insetDrawSize(layoutIn(undefined, 0), undefined);
    return { slots, referenceSlots: [], layers: null };
  }
  const fl = resolveTouchFloor(ageBand, s.cssPerLogic);
  const refs = computeGT022ReferenceGroups(s.content, s.resolvedObjects);
  const strip = computeRefStrip(s.stageRect, fl, refs.length, slotCount);
  const layered = tryAllLayered(s, s.stageRect, strip, fl);
  if (layered) {
    return layered;
  }
  for (const sz of [Math.max(fl, 84), fl]) {
    const sc = layoutIn(strip[1], sz);
    const all = [...sc, ...strip[0]];
    if (!hasHitOverlap(all)) {
      return { slots: all, referenceSlots: strip[0], layers: null };
    }
  }
  const slots = layoutIn(s.stageRect, Math.max(fl, 84));
  return { slots, referenceSlots: [], layers: null };
}
export function buildGT022View(s: SV): EngineView {
  const [clock, assets] = [getGT022Clock(s), s.resolveAssetById()];
  const entities: ViewEntity[] = s.resolvedObjects.map((o, slotIndex) => {
    const st = s.sceneSystem.getObjectState(o.id);
    let state: EntityVisual = "idle";
    if (st?.isFound) {
      state = "correct";
    } else if (clock.wrongFlashes.isActive(o.id, clock.logicMs)) {
      state = "incorrect";
    } else if (clock.hoveredId === o.id) {
      state = "active";
    }
    const cov = Boolean(o.isHidden) && st?.isRevealed !== true;
    const a = assets.get(o.id);
    const [x, y, w, h] = [o.x, o.y, o.width, o.height];
    const b1 = { id: o.id, slotIndex, role: "source" as const, state, x, y };
    const b2 = { w, h, hitW: w, hitH: h, hitShape: "square" as const };
    return { ...b1, ...b2, ...(!cov && a ? resolveAssetLabels(a) : {}) };
  });
  computeGT022ReferenceGroups(s.content, s.resolvedObjects).forEach((g, i) => {
    const sl = s.referenceSlots[i];
    if (sl) {
      const ok = g.objectIds.every(
        (id) => s.sceneSystem.getObjectState(id)?.isFound === true
      );
      const state: EntityVisual = ok ? "correct" : "idle";
      const [id, slotIndex] = [`ref-${i}`, sl.index];
      const b = { id, slotIndex, role: "neutral" as const, state };
      const lbl = resolveAssetLabels(g.asset);
      entities.push({ ...sl, ...b, hitShape: "square", ...lbl });
    }
  });
  return { activePrompt: s.content.prompt, entities };
}
export function computeGT022SceneBounds(s: SV): SceneBox {
  const [st, r0] = [s.stageRect, s.referenceSlots[0]];
  if (!st) {
    return { x: 0, y: 0, w: s.logicSpace.w, h: s.logicSpace.h };
  }
  if (!r0) {
    return st;
  }
  const sh = r0.h + 2 * SLOT_GAP_PX;
  return { x: st.x, y: st.y + sh, w: st.w, h: Math.max(40, st.h - sh) };
}
export function computeGT022QuadrantBox(a: SceneBox, o: SceneObject): SceneBox {
  const [mx, my] = [a.x + a.w / 2, a.y + a.h / 2];
  const [w, h] = [Math.max(24, a.w / 2 - 4), Math.max(24, a.h / 2 - 4)];
  return { x: o.x <= mx ? a.x + 4 : mx, y: o.y <= my ? a.y + 4 : my, w, h };
}
function drawQuestStripAndCounter(s: SV, ctx: Ctx, rs: RS): void {
  const items: GT022QuestRefItem[] = [];
  const groups = computeGT022ReferenceGroups(s.content, s.resolvedObjects);
  groups.forEach((g, index) => {
    const slot = s.referenceSlots[index];
    if (slot) {
      const isFound = g.objectIds.every(
        (id) => s.sceneSystem.getObjectState(id)?.isFound === true
      );
      items.push({ slot, asset: g.asset, isFound, index });
    }
  });
  const [r0, rL] = [s.referenceSlots[0], s.referenceSlots.at(-1)];
  let sb: SceneBox | null = null;
  if (r0 && rL) {
    const [x, y] = [r0.x - r0.w / 2 - 6, r0.y - r0.h / 2 - 4];
    const [w, h] = [rL.x + rL.w / 2 - (r0.x - r0.w / 2) + 12, r0.h + 8];
    sb = { x, y, w, h };
  }
  drawGT022QuestHeader(ctx, sb, items, s.stageRect);
  if (s.stageRect && rL && s.difficulty.show_target_counter) {
    const left = rL.x + rL.w / 2 + SLOT_GAP_PX;
    const right = s.stageRect.x + s.stageRect.w - SLOT_GAP_PX;
    if (right - left > 0) {
      const [done, total] = [
        s.sceneSystem.getFoundCount(),
        s.sceneSystem.getTotalTargets(),
      ];
      const box = { x: left, y: rL.y - 16, w: right - left, h: 32 };
      drawProgressDots(ctx, rs, { done, total }, box);
    }
  }
}
function clampLensSlot(slot: Slot, st?: ZoneRect): Slot {
  if (!st) {
    return slot;
  }
  const r = Math.min(slot.w, slot.h) * 0.5;
  const x = Math.max(st.x + r * 1.15, Math.min(st.x + st.w - r * 1.5, slot.x));
  const y = Math.max(st.y + r * 1.15, Math.min(st.y + st.h - r * 1.5, slot.y));
  return { ...slot, x, y };
}
type DrawEnv = readonly [SV, Ctx, RS, number, number];
function drawSingleObject(
  env: DrawEnv,
  o: SceneObject,
  slot: Slot,
  index: number
): void {
  const [s, ctx, rs, timeMs, lensMs] = env;
  const [c, st] = [getGT022Clock(s), s.sceneSystem.getObjectState(o.id)];
  const [isCovered, isFound] = [
    Boolean(o.isHidden) && st?.isRevealed !== true,
    st?.isFound === true,
  ];
  const wf = c.wrongFlashes;
  const wrongProgress = wf.isActive(o.id, c.logicMs)
    ? wf.progress(o.id, c.logicMs)
    : null;
  const [fAt, wAt] = [c.foundAtMs.get(o.id), c.winAtMs];
  const foundElapsedMs =
    fAt === undefined ? null : Math.max(0, c.logicMs - fAt);
  const winElapsedMs = wAt === null ? null : Math.max(0, c.logicMs - wAt);
  const [asset, isHovered] = [
    s.resolveAssetById().get(o.id),
    c.hoveredId === o.id,
  ];
  const isAutoRevealed = s.roundClosedOnWrong && o.isTarget && !isFound;
  const hintLevel = s.getHintTargetIndex() === index ? c.activeHintLevel : 0;
  const [stageRect, showParticles] = [
    s.stageRect,
    s.degradation?.particles_enabled ?? true,
  ];
  const p1 = { slot, asset, index, isCovered, isFound, isHovered };
  const p2 = { isAutoRevealed, wrongProgress, foundElapsedMs, winElapsedMs };
  const p3 = { hintLevel, stageRect, timeMs, showParticles };
  drawGT022SceneObject(ctx, rs, { ...p1, ...p2, ...p3 });
  if (c.lensObjectId === o.id && c.lensStartedMs !== null) {
    const el = timeMs - c.lensStartedMs;
    if (el >= 0 && el < lensMs) {
      const ls = clampLensSlot(slot, stageRect);
      drawMagnifier(ctx, magnifierPose(ls, timeMs, rs.reducedMotion));
    }
  }
}
function drawSceneObjectsByMode(...env: DrawEnv): void {
  const s = env[0];
  if (s.layers) {
    for (const l of s.layerDrawOrder()) {
      const o = s.resolvedObjects[l.index];
      if (o) {
        const sz = l.draw.size;
        const dSlot = mkSlot(l.index, l.draw.x, l.draw.y, sz, sz);
        drawSingleObject(env, o, dSlot, l.index);
      }
    }
    return;
  }
  const n = s.resolvedObjects.length;
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
    const ha = s.resolvedObjects[a]?.isHidden ? 1 : 0;
    const hb = s.resolvedObjects[b]?.isHidden ? 1 : 0;
    return ha - hb || a - b;
  });
  for (const i of idx) {
    const o = s.resolvedObjects[i];
    if (o) {
      const base = s.slots[i] ?? mkSlot(i, o.x, o.y, o.width, o.height);
      const rSlot = s.stageRect
        ? base
        : { ...base, x: o.x, y: o.y, w: o.width, h: o.height };
      drawSingleObject(env, o, rSlot, i);
    }
  }
}
export function renderGT022Scene(
  s: SV,
  ctx: Ctx,
  rs: RS,
  timeMs: number,
  lensMs: number
): void {
  const c = getGT022Clock(s);
  c.lastRenderMs = timeMs;
  if (c.lensObjectId !== null && c.lensStartedMs === null) {
    c.lensStartedMs = timeMs;
  }
  drawSceneBackground(ctx, rs, s.themeId);
  drawGT022StageBackdrop(ctx, rs, s.stageRect);
  drawStoryCharacterInStage(ctx, "duck", s.stageRect, s.slots);
  drawQuestStripAndCounter(s, ctx, rs);
  const [area, hIdx] = [computeGT022SceneBounds(s), s.getHintTargetIndex()];
  const hObj = hIdx === null ? undefined : s.resolvedObjects[hIdx];
  const quadrantBox = hObj ? computeGT022QuadrantBox(area, hObj) : null;
  const targetSlot = hObj
    ? { x: hObj.x, y: hObj.y, w: hObj.width, h: hObj.height }
    : null;
  const [level, stageRect] = [c.activeHintLevel, s.stageRect];
  const hp = { level, quadrantBox, targetSlot, stageRect, timeMs };
  drawGT022HintOverlay(ctx, rs, hp);
  drawSceneObjectsByMode(s, ctx, rs, timeMs, lensMs);
}
