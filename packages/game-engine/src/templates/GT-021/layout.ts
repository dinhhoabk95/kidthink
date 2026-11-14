import type { AgeBand } from "#src/contracts/types";
import type { EntityVisual, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { type LogicSpace, resolveTouchFloor } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import {
  computeStageCellSlots,
  computeStageMirror,
  reindexSlots,
} from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import { computeTraySourceSlots, pickTrayZones } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawGT021ReferenceCell,
  drawGT021SymmetryBoard,
  drawGT021TargetCell,
  drawGT021TrayPiece,
  type GT021GuidePair,
} from "#src/render/gt-021-shapes";
import {
  drawMirrorAxis,
  drawSceneBackground,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  type ItemVisualState,
  sceneBox,
} from "#src/render/index";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { HintLevel } from "#src/systems/hint-ladder";
import type { MirrorSystem } from "#src/systems/mirror-system";
import type { RenderSystem } from "#src/systems/render-system";
import type { WrongFlashMap } from "#src/systems/wrong-flash";
import type { GT021Content, GT021Difficulty } from "./template";

const MAX_CELL = 96;
const GAP = 24;
export const INSPECT_HIGHLIGHT_MS = 1400;

export type GT021Option = GT021Content["options"][number];
export type GT021TargetDef = GT021Content["target_slots"][number];
export type DualStamp = Record<"logicAt", number> &
  Record<"renderAt", number | null>;
export type GT021DemoStep = Record<"from" | "x" | "y", number> &
  Partial<Record<"to", number>>;
export interface GT021Clock {
  logicMs: number;
  lastRenderMs: number | null;
  readonly placedStamps: Map<string, DualStamp>;
  lastCorrectStamp: DualStamp | null;
  inspectedPair: { readonly index: number; readonly stamp: DualStamp } | null;
}

type SlotBag = Record<
  "slots" | "neutralSlots" | "targetSlots" | "sourceSlots",
  readonly Slot[]
>;
type FlashBag = Record<"wrongFlashes" | "wrongSourceFlashes", WrongFlashMap>;
type HoverBag = Record<"hoveredTargetIdx" | "hoveredSourceIdx", number | null>;
type FlagBag = Record<"roundClosedOnWrong", boolean>;
type ZoneBag = Partial<Record<"stageRect" | "trayRect", ZoneRect>>;

export interface GT021BoardHost
  extends Readonly<SlotBag & FlashBag & HoverBag & FlagBag & ZoneBag> {
  readonly content: GT021Content;
  readonly difficulty: GT021Difficulty;
  readonly mirrorSystem: MirrorSystem;
  readonly assetByRef: ReadonlyMap<string, GT021Option["asset"]>;
  readonly scaffoldLevel: 0 | HintLevel;
  readonly themeId?: string | undefined;
  readonly logicSpace: LogicSpace;
  readonly cssPerLogic?: number | undefined;
  checkWinCondition(): boolean;
  getDisplayOptions(): readonly GT021Option[];
  getPlacements(): ReadonlyMap<string, string>;
  getStagedItemId(): string | null;
  getBaseItemState(id: string): ItemVisualState;
}

type H = GT021BoardHost;
type C = GT021Clock;
type Opt = GT021Option;
type TDef = GT021TargetDef;
type Role = ViewEntity["role"];
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
const SESSION_CLOCK = new WeakMap<object, C>();

export function getSessionClock(owner: object): C {
  let c = SESSION_CLOCK.get(owner);
  if (!c) {
    const placedStamps = new Map<string, DualStamp>();
    const z = { logicMs: 0, lastRenderMs: null, placedStamps };
    c = { ...z, lastCorrectStamp: null, inspectedPair: null };
    SESSION_CLOCK.set(owner, c);
  }
  return c;
}

export function resetSessionClock(owner: object): void {
  SESSION_CLOCK.delete(owner);
}

export function stampNow(c: C): DualStamp {
  return { logicAt: c.logicMs, renderAt: c.lastRenderMs };
}

export function elapsedSince(s: DualStamp | undefined, c: C, t: number) {
  if (!s) {
    return null;
  }
  s.renderAt ??= t;
  return Math.max(0, c.logicMs - s.logicAt, t - s.renderAt);
}

function perm(a: readonly Opt[], sd: number): Opt[] {
  const out = shuffle(a, deriveStream(sd, "items"));
  const same = out.every((v, i) => v.item_id === a[i]?.item_id);
  return same ? [...out.slice(1), ...out.slice(0, 1)] : out;
}

export function computeDisplayOptions(o: readonly Opt[], s: number, g: number) {
  if (o.length <= 1 || s === 0) {
    return [...o];
  }
  const r1 = perm(o, s);
  return g > 0 ? perm(r1, s + g * 97) : r1;
}

function computeOneColumnMirror(stage: ZoneRect, tf: number, n: number) {
  const w = Math.floor(stage.w / 2) - GAP / 2;
  const first = { x: stage.x, y: stage.y, w, h: stage.h };
  const [inW, inH] = [w - 2 * GAP, stage.h - 2 * GAP];
  if (inW >= 2 * tf + GAP || inH < n * tf + (n - 1) * GAP) {
    return null;
  }
  const [maxCell, role] = [{ w: MAX_CELL, h: MAX_CELL }, "neutral" as const];
  const cfg = { count: n, stage: first, touchFloor: tf, maxCell, role };
  const reference = computeStageCellSlots({ ...cfg, cols: 1 });
  const [cx2, tRole] = [2 * (stage.x + stage.w / 2), "target" as const];
  const mirrorX = (s: Slot, i: number): Slot => ({
    ...s,
    index: n + i,
    x: Math.round(cx2 - s.x),
    role: tRole,
  });
  return { reference, targets: reference.map(mirrorX) };
}

export function computeGT021Slots(b: H, band: AgeBand): readonly Slot[] {
  const [c, optCount] = [b.content, b.getDisplayOptions().length];
  const zones = pickTrayZones(b.stageRect, b.trayRect);
  if (!zones) {
    const cfg = { slotCount: optCount, targetCount: c.target_slots.length };
    const fn = resolveLayout("mirror-axis-split");
    return fn({ ...cfg, ageBand: band, logic: b.logicSpace });
  }
  const tf = resolveTouchFloor(band, b.cssPerLogic);
  const n = Math.max(c.reference_pattern.length, c.target_slots.length);
  const isV4 = c.axis === "vertical" && n === 4;
  const oneCol = isV4 ? computeOneColumnMirror(zones.stage, tf, n) : null;
  const maxCell = { w: MAX_CELL, h: MAX_CELL };
  const mCfg = { count: n, axis: c.axis, stage: zones.stage, touchFloor: tf };
  const m = oneCol ?? computeStageMirror({ ...mCfg, maxCell });
  const refs = m.reference.slice(0, c.reference_pattern.length);
  const tgts = m.targets.slice(0, c.target_slots.length);
  const srcs = computeTraySourceSlots(optCount, zones.tray, tf);
  return reindexSlots([...refs, ...tgts, ...srcs]);
}

const isClosed = (b: H): boolean =>
  b.checkWinCondition() || b.roundClosedOnWrong;
const isUnfilled = (b: H, t: TDef): boolean =>
  b.mirrorSystem.getPlacement(t.slot_id) !== t.expected_asset_ref;

export const firstUnfilledTargetIndex = (b: H): number =>
  b.content.target_slots.findIndex((t) => isUnfilled(b, t));

export function matchingTargetForStaged(b: H): number {
  const id = isClosed(b) ? null : b.getStagedItemId();
  const opt = id ? b.content.options.find((o) => o.item_id === id) : undefined;
  return opt
    ? b.content.target_slots.findIndex(
        (t) => isUnfilled(b, t) && t.expected_asset_ref === opt.asset_ref
      )
    : -1;
}

export const matchingSourceIndexForTarget = (b: H, tIdx: number): number => {
  const exp = b.content.target_slots[tIdx]?.expected_asset_ref;
  const [opts, placed] = [b.getDisplayOptions(), b.getPlacements()];
  const free = exp
    ? opts.findIndex((o) => o.asset_ref === exp && !placed.has(o.item_id))
    : -1;
  return free >= 0 || !exp ? free : opts.findIndex((o) => o.asset_ref === exp);
};

export function resolveGT021HintTargetIndex(b: H): number | null {
  if (isClosed(b)) {
    return null;
  }
  const stg = matchingTargetForStaged(b);
  if (stg >= 0) {
    return b.targetSlots[stg]?.index ?? null;
  }
  const fIdx = firstUnfilledTargetIndex(b);
  const sIdx = fIdx >= 0 ? matchingSourceIndexForTarget(b, fIdx) : -1;
  return sIdx >= 0 ? (b.sourceSlots[sIdx]?.index ?? null) : null;
}

export function resolveGT021HintDestinationIndex(b: H): number | null {
  if (isClosed(b) || matchingTargetForStaged(b) >= 0) {
    return null;
  }
  return b.targetSlots[firstUnfilledTargetIndex(b)]?.index ?? null;
}

export function resolveGT021HintTargetForLevel(b: H, lv: HintLevel) {
  if (isClosed(b)) {
    return null;
  }
  const stg = matchingTargetForStaged(b);
  const pIdx = stg >= 0 ? stg : firstUnfilledTargetIndex(b);
  const ref = b.content.reference_pattern[pIdx];
  const tgt = b.content.target_slots[pIdx];
  if (pIdx < 0 || !tgt) {
    return null;
  }
  const baseIds = ref ? [ref.slot_id, tgt.slot_id] : [tgt.slot_id];
  const k = "region" as const;
  if (lv === 1) {
    return { kind: k, ids: baseIds };
  }
  if (lv === 2) {
    const opt = b.getDisplayOptions()[matchingSourceIndexForTarget(b, pIdx)];
    return { kind: k, ids: opt ? [...baseIds, opt.item_id] : baseIds };
  }
  return null;
}

export function resolveGT021HintDemoSequence(b: H, lv: HintLevel) {
  if (lv < 3 || isClosed(b)) {
    return null;
  }
  const fIdx = firstUnfilledTargetIndex(b);
  const sIdx = fIdx >= 0 ? matchingSourceIndexForTarget(b, fIdx) : -1;
  const [src, tgt] = [b.sourceSlots[sIdx], b.targetSlots[fIdx]];
  if (!(src && tgt)) {
    return null;
  }
  const s1 = { from: src.index, to: tgt.index, x: src.x, y: src.y };
  return [s1, { from: tgt.index, x: tgt.x, y: tgt.y }];
}

const isSymmetricToStaged = (b: H, t: TDef): boolean => {
  const id = isClosed(b) ? null : b.getStagedItemId();
  const opt = id ? b.content.options.find((o) => o.item_id === id) : undefined;
  const empty = b.mirrorSystem.getPlacement(t.slot_id) === undefined;
  return Boolean(opt && opt.asset_ref === t.expected_asset_ref && empty);
};

function ent(id: string, s: Slot, r: Role, st: EntityVisual, a?: Opt["asset"]) {
  const [w, h] = [Math.max(s.w, s.hitW), Math.max(s.h, s.hitH)];
  const p1 = { id, slotIndex: s.index, role: r, state: st, x: s.x, y: s.y };
  const p2 = { w, h, hitShape: "square" as const };
  return { ...p1, ...p2, ...(a ? resolveAssetLabels(a) : {}) };
}

export function buildGT021ViewEntities(b: H): ViewEntity[] {
  const used = new Set<string>();
  const alloc = (raw: string, pre: string): string => {
    const id = used.has(raw) ? `${pre}:${raw}` : raw;
    used.add(id);
    return id;
  };
  const [clock, opts] = [getSessionClock(b), b.getDisplayOptions()];
  const stgId = b.getStagedItemId();
  const refs = b.neutralSlots.flatMap((s, i) => {
    const r = b.content.reference_pattern[i];
    const id = r ? alloc(r.slot_id, "ref") : "";
    return r ? [ent(id, s, "neutral", "idle", r.asset)] : [];
  });
  const targets = b.targetSlots.flatMap((s, i) => {
    const t = b.content.target_slots[i];
    if (!t) {
      return [];
    }
    const pRef = b.mirrorSystem.getPlacement(t.slot_id);
    let st: EntityVisual = isSymmetricToStaged(b, t) ? "active" : "idle";
    if (pRef) {
      st = pRef === t.expected_asset_ref ? "correct" : "incorrect";
    }
    const asset = pRef ? b.assetByRef.get(pRef) : undefined;
    return [ent(alloc(t.slot_id, "target"), s, "target", st, asset)];
  });
  const sources = b.sourceSlots.flatMap((s, i) => {
    const o = opts[i];
    if (!o) {
      return [];
    }
    const wrong = b.wrongSourceFlashes.isActive(o.item_id, clock.logicMs);
    let st: EntityVisual = wrong ? "incorrect" : "idle";
    if (stgId === o.item_id) {
      st = "selected";
    }
    const base = ent(alloc(o.item_id, "src"), s, "source", st, o.asset);
    return [{ ...base, draggable: !isClosed(b) }];
  });
  return [...refs, ...targets, ...sources];
}

function resolveRefState(b: H, i: number, now: number, ins: number, h: number) {
  if (b.wrongFlashes.isActive(b.content.target_slots[i]?.slot_id ?? "", now)) {
    return "wrong_pair" as const;
  }
  if (ins === i) {
    return "inspected" as const;
  }
  const isH = b.scaffoldLevel >= 1 && h === i;
  return isH ? ("hint" as const) : ("none" as const);
}

function resolveTargetState(b: H, t: TDef, i: number, now: number) {
  const pRef = b.mirrorSystem.getPlacement(t.slot_id);
  const flash = b.wrongFlashes.isActive(t.slot_id, now);
  if (pRef === t.expected_asset_ref && !flash) {
    return "correct" as const;
  }
  if (flash || (pRef && (b.difficulty.allow_retry || !b.roundClosedOnWrong))) {
    return "wrong" as const;
  }
  if (b.roundClosedOnWrong && !b.difficulty.allow_retry) {
    return "closed" as const;
  }
  if (b.hoveredTargetIdx === i) {
    return "hovered" as const;
  }
  return isSymmetricToStaged(b, t) ? ("targeted" as const) : ("empty" as const);
}

function resolveTrayState(b: H, optId: string, i: number, now: number) {
  if (b.getStagedItemId() === optId) {
    return "selected" as const;
  }
  if (b.wrongSourceFlashes.isActive(optId, now)) {
    return "wrong" as const;
  }
  if (b.hoveredSourceIdx === i && !b.roundClosedOnWrong) {
    return "hovered" as const;
  }
  const isOff = b.roundClosedOnWrong || b.getPlacements().has(optId);
  return isOff ? ("off" as const) : ("idle" as const);
}

function renderTargets(b: H, c: Ctx, rs: RS, box: ZoneRect, v: number[]) {
  const [ins = -1, h = -1, tMs = 0, deg = 0] = v;
  const clock = getSessionClock(b);
  for (let i = 0; i < b.content.target_slots.length; i++) {
    const [t, slot] = [b.content.target_slots[i], b.targetSlots[i]];
    if (!(t && slot)) {
      continue;
    }
    const pRef = b.mirrorSystem.getPlacement(t.slot_id);
    const state = resolveTargetState(b, t, i, clock.logicMs);
    const refAsset = b.content.reference_pattern[i]?.asset;
    const expAsset = b.assetByRef.get(t.expected_asset_ref) ?? refAsset;
    const pSt: ItemVisualState = state === "wrong" ? "wrong" : "correct";
    const pAsset = b.assetByRef.get(pRef ?? "");
    const placedItem = pRef
      ? { id: t.slot_id, asset: pAsset, state: pSt }
      : null;
    const expSt = "idle" as const;
    const expectedItem = { id: t.slot_id, asset: expAsset, state: expSt };
    const pStamp = clock.placedStamps.get(t.slot_id);
    const revealElapsedMs = elapsedSince(pStamp, clock, tMs) ?? 0;
    const wrongProgress = b.wrongFlashes.progress(t.slot_id, clock.logicMs);
    const isOpen = state !== "correct";
    const showGhostHint = b.scaffoldLevel >= 2 && h === i && isOpen;
    const hOk = (b.scaffoldLevel >= 1 && h === i) || ins === i;
    const t1 = { slot, axis: b.content.axis, index: i, state };
    const t2 = { placedItem, expectedItem, stageBounds: box };
    const t3 = { revealElapsedMs, wrongProgress, showGhostHint };
    const t4 = { isHintTarget: isOpen && hOk, timeMs: tMs, degraded: deg > 0 };
    drawGT021TargetCell(c, rs, { ...t1, ...t2, ...t3, ...t4 });
  }
}

export function renderGT021(b: H, c: Ctx, rs: RS, t: number, d: boolean) {
  const clock = getSessionClock(b);
  clock.lastRenderMs = t;
  drawSceneBackground(c, rs, b.themeId);
  drawStoryCharacterInStage(c, "fairy", b.stageRect, b.slots);
  const zones = pickTrayZones(b.stageRect, b.trayRect);
  const stageBox = zones?.stage ?? sceneBox(rs);
  const pair = clock.inspectedPair;
  const inspEl = elapsedSince(pair?.stamp, clock, t);
  const inspOk = pair && inspEl !== null && inspEl < INSPECT_HIGHLIGHT_MS;
  const inspIdx = inspOk ? pair.index : -1;
  const stgIdx = matchingTargetForStaged(b);
  const hIdx = stgIdx >= 0 ? stgIdx : firstUnfilledTargetIndex(b);
  const guidePairs: GT021GuidePair[] = b.content.target_slots.flatMap(
    (_, i) => {
      const [ns, ts] = [b.neutralSlots[i], b.targetSlots[i]];
      const hl = resolveRefState(b, i, clock.logicMs, inspIdx, hIdx);
      const tone = hl === "inspected" ? ("sky" as const) : ("amber" as const);
      return ns && ts && hl !== "none"
        ? [{ fromX: ns.x, fromY: ns.y, toX: ts.x, toY: ts.y, tone }]
        : [];
    }
  );
  const showGuide = b.difficulty.show_axis_guide;
  const stamp = clock.lastCorrectStamp ?? undefined;
  const flashElapsedMs = showGuide ? elapsedSince(stamp, clock, t) : null;
  const b1 = { stageBounds: stageBox, axis: b.content.axis };
  const b2 = { showAxisGuide: showGuide, flashElapsedMs, guidePairs };
  const b3 = { ...b1, ...b2, allCompleted: b.checkWinCondition(), degraded: d };
  drawGT021SymmetryBoard(c, rs, b3);
  if (showGuide) {
    drawMirrorAxis(c, rs, b.content.axis, zones?.stage);
  }
  drawWoodenTokenDock(c, rs, zones?.tray);
  b.content.reference_pattern.forEach((ref, i) => {
    const slot = b.neutralSlots[i];
    if (slot) {
      const st = "locked" as const;
      const item = { id: ref.slot_id, asset: ref.asset, state: st };
      const highlight = resolveRefState(b, i, clock.logicMs, inspIdx, hIdx);
      const c1 = { slot, item, index: i, highlight, timeMs: t };
      drawGT021ReferenceCell(c, rs, c1);
    }
  });
  renderTargets(b, c, rs, stageBox, [inspIdx, hIdx, t, d ? 1 : 0]);
  const hSrcIdx = hIdx >= 0 ? matchingSourceIndexForTarget(b, hIdx) : -1;
  const stgId = b.getStagedItemId();
  b.getDisplayOptions().forEach((opt, i) => {
    const slot = b.sourceSlots[i];
    if (slot) {
      const baseSt = b.getBaseItemState(opt.item_id);
      const st: ItemVisualState = stgId === opt.item_id ? "selected" : baseSt;
      const item = { id: opt.item_id, asset: opt.asset, state: st };
      const state = resolveTrayState(b, opt.item_id, i, clock.logicMs);
      const wp = b.wrongSourceFlashes.progress(opt.item_id, clock.logicMs);
      const isHinted = b.scaffoldLevel >= 1 && hSrcIdx === i;
      const p1 = { slot, item, index: i, state };
      const p2 = { ...p1, wrongProgress: wp, isHinted, timeMs: t };
      drawGT021TrayPiece(c, rs, p2);
    }
  });
}
