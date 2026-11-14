import type { HintDemoStep, HintLevel, HintTarget } from "#src/game-session";
import type { ViewEntity } from "#src/interaction";
import {
  type KeywordAsset,
  resolveAssetLabels,
} from "#src/labels/spoken-keyword";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { GT025ScaffoldVisual } from "#src/render/gt-025-shapes";
import type { SceneBox } from "#src/render/types";
import { deriveStream } from "#src/rng/mulberry32";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import type { GT025Content } from "./template.js";

export type SpotSide = "left" | "right";
export type SpotDiffItem = GT025Content["differences"][number];

const RIGHT_COLUMN_OFFSET = 480;
const BROKEN_EMOJI_RE = /^EMJ-[a-z0-9-]+$/i;
const PLACEHOLDER_ASSET: KeywordAsset = { kind: "text", text: "Ô hình" };

export interface ResolvedSpotObject extends Slot {
  readonly asset: KeywordAsset;
  readonly entityId: string;
  readonly forcePlaceholder: boolean;
  readonly id: string;
  readonly key: string;
  readonly layoutOrderIndex: number;
  readonly origX?: number;
  readonly origY?: number;
  readonly pairIndex: number;
  readonly side: SpotSide;
  readonly slot: Slot;
  readonly slotIndex: number;
}

export interface DualStamp {
  readonly logicStartMs: number;
  renderStartMs: number | null;
}

export interface GT025Clock {
  activeHintLevel: 0 | 1 | 2 | 3;
  closeStamp: DualStamp | null;
  readonly foundStamps: Map<string, DualStamp>;
  hoveredKey: string | null;
  lastRenderMs: number | null;
  logicMs: number;
  readonly wrongStamps: Map<string, DualStamp>;
}

type Obj = ResolvedSpotObject;
type RObjs = readonly Obj[];
type HL = HintLevel;
type SVis = GT025ScaffoldVisual | null;
type HSteps = readonly HintDemoStep[] | null;
type RIn = [GT025Content, readonly Slot[], readonly Slot[], number, number];
const CLOCKS = new WeakMap<object, GT025Clock>();

function createClock(): GT025Clock {
  return {
    activeHintLevel: 0,
    closeStamp: null,
    foundStamps: new Map(),
    hoveredKey: null,
    lastRenderMs: null,
    logicMs: 0,
    wrongStamps: new Map(),
  };
}

export function getGT025Clock(host: object, reset = false): GT025Clock {
  let c = reset ? undefined : CLOCKS.get(host);
  if (!c) {
    c = createClock();
    CLOCKS.set(host, c);
  }
  return c;
}

export function makeDualStamp(c: GT025Clock): DualStamp {
  return { logicStartMs: c.logicMs, renderStartMs: c.lastRenderMs };
}

export function observeGT025RenderClock(c: GT025Clock, t: number): void {
  c.lastRenderMs = t;
  const stamps = [...c.foundStamps.values(), ...c.wrongStamps.values()];
  for (const s of [...stamps, c.closeStamp]) {
    if (s) {
      s.renderStartMs ??= t;
    }
  }
}

export function elapsedDualMs(s: DualStamp | undefined, c: GT025Clock): number {
  if (!s) {
    return 1e9;
  }
  const r =
    s.renderStartMs === null ? 0 : (c.lastRenderMs ?? 0) - s.renderStartMs;
  return Math.max(0, c.logicMs - s.logicStartMs, r);
}

export function isBrokenSpotAsset(asset: KeywordAsset | undefined): boolean {
  if (!asset) {
    return true;
  }
  if (asset.kind === "emoji") {
    const ref = asset.ref.trim();
    return ref.length === 0 || BROKEN_EMOJI_RE.test(ref);
  }
  return (asset.kind === "image" ? asset.path : asset.text).trim().length === 0;
}

export function buildDeterministicDerangement(
  n: number,
  seed: number,
  gen: number
): readonly number[] {
  const id = Array.from({ length: n }, (_, i) => i);
  if (gen < 1 || n < 2) {
    return id;
  }
  if (n === 2) {
    return [1, 0];
  }
  const rng = deriveStream(seed + gen * 7919, "items");
  const arr = [...id];
  for (let i = n - 1; i > 0; i--) {
    const j = rng.nextInt(i);
    const tmp = arr[i] ?? i;
    arr[i] = arr[j] ?? j;
    arr[j] = tmp;
  }
  return arr;
}

export interface ResolvedGT025Round {
  readonly effectiveDifferences: readonly SpotDiffItem[];
  readonly effectiveTargetCount: number;
  readonly objects: readonly Obj[];
}

function legacySlot(
  index: number,
  side: SpotSide,
  ref: { readonly x?: number; readonly y?: number }
): Slot {
  const rx = ref.x === undefined ? 680 : ref.x + RIGHT_COLUMN_OFFSET;
  const x = side === "left" ? (ref.x ?? 200) : rx;
  const y = ref.y ?? 250;
  const role = side === "left" ? "source" : "target";
  return { index, x, y, w: 64, h: 64, hitW: 64, hitH: 64, page: 0, role };
}

function badObj(o: { readonly asset: KeywordAsset } | undefined): boolean {
  return !o || isBrokenSpotAsset(o.asset);
}

function scanBrokenRound(c: GT025Content): {
  brokenKeys: Set<string>;
  brokenPairs: Set<number>;
  effectiveDifferences: SpotDiffItem[];
} {
  const [leftRaw, rightRaw] = [c.left_objects, c.right_objects];
  const brokenPairs = new Set<number>();
  const brokenKeys = new Set<string>();
  for (let i = 0; i < Math.max(leftRaw.length, rightRaw.length); i++) {
    const [l, r] = [leftRaw[i], rightRaw[i]];
    if ((l && badObj(l)) || (r && badObj(r))) {
      brokenPairs.add(i);
      brokenKeys.add(l ? `left:${l.id}` : "");
      brokenKeys.add(r ? `right:${r.id}` : "");
    }
  }
  const effectiveDifferences = c.differences.filter((d) => {
    const l = leftRaw.find((o) => o.id === d.left_id);
    const r = rightRaw.find((o) => o.id === d.right_id);
    const ok = !(badObj(l) || badObj(r));
    if (!ok) {
      brokenKeys.add(`left:${d.left_id}`);
      brokenKeys.add(`right:${d.right_id}`);
    }
    return ok;
  });
  return { brokenKeys, brokenPairs, effectiveDifferences };
}

export function resolveGT025RoundData(...a: RIn): ResolvedGT025Round {
  const [content, sources, targets, layoutSeed, roundGen] = a;
  const [leftRaw, rightRaw] = [content.left_objects, content.right_objects];
  const pairCount = Math.min(leftRaw.length, rightRaw.length);
  const perm = buildDeterministicDerangement(pairCount, layoutSeed, roundGen);
  const { brokenKeys, brokenPairs, effectiveDifferences } =
    scanBrokenRound(content);
  const rightIds = new Set(rightRaw.map((o) => o.id));
  const sharedIds = new Set(
    leftRaw.map((o) => o.id).filter((id) => rightIds.has(id))
  );
  const objects: Obj[] = [];
  const appendSide = (
    raw: GT025Content["left_objects"],
    slots: readonly Slot[],
    side: SpotSide
  ): void => {
    const idxOff = side === "left" ? 0 : leftRaw.length;
    raw.forEach((obj, i) => {
      const ord = i < pairCount ? (perm[i] ?? i) : i;
      const ref = raw[ord] ?? obj;
      const s = slots[ord] ?? legacySlot(idxOff + ord, side, ref);
      const key = `${side}:${obj.id}`;
      const forcePlaceholder = brokenPairs.has(i) || brokenKeys.has(key);
      const entityId = sharedIds.has(obj.id) ? key : obj.id;
      const meta = { id: obj.id, key, entityId, pairIndex: i, side };
      const pos = { layoutOrderIndex: ord, origX: ref.x, origY: ref.y };
      const slotInfo = { slotIndex: s.index, slot: s, asset: obj.asset };
      objects.push({ ...s, ...meta, ...pos, ...slotInfo, forcePlaceholder });
    });
  };
  appendSide(leftRaw, sources, "left");
  appendSide(rightRaw, targets, "right");
  const len = effectiveDifferences.length;
  const effectiveTargetCount =
    len > 0 ? Math.min(content.target_count, len) : 0;
  return { objects, effectiveDifferences, effectiveTargetCount };
}

export function findHitSpotObject(o: RObjs, x: number, y: number): Obj | null {
  for (let i = o.length - 1; i >= 0; i--) {
    const it = o[i];
    if (it && isPointInSlot(it.slot, x, y, "circle", TAP_TOLERANCE_PX)) {
      return it;
    }
  }
  return null;
}

export function buildGT025ViewEntities(
  objs: RObjs,
  foundKeys: ReadonlySet<string>,
  clock: GT025Clock
): ViewEntity[] {
  return objs.map((obj) => {
    let state: ViewEntity["state"] =
      clock.hoveredKey === obj.key ? "active" : "idle";
    if (foundKeys.has(obj.key)) {
      state = "correct";
    } else if (
      elapsedDualMs(clock.wrongStamps.get(obj.key), clock) < WRONG_FLASH_MS
    ) {
      state = "incorrect";
    }
    const { index: slotIndex, x, y, hitW: w, hitH: h } = obj.slot;
    const geom = { slotIndex, x, y, w, h };
    const asset = obj.forcePlaceholder ? PLACEHOLDER_ASSET : obj.asset;
    return {
      id: obj.entityId,
      role: "source",
      state,
      ...geom,
      hitShape: "circle",
      ...resolveAssetLabels(asset),
    };
  });
}

export interface GT025HintQuery {
  readonly diffs: readonly SpotDiffItem[];
  readonly disabled: boolean;
  readonly foundDiffIds: ReadonlySet<string>;
  readonly objects: RObjs;
}
type Q = GT025HintQuery;

function getPendingDiffPair(q: Q): { left: Obj; right: Obj } | null {
  const p = q.disabled
    ? undefined
    : q.diffs.find((d) => !q.foundDiffIds.has(d.id));
  if (!p) {
    return null;
  }
  const left = q.objects.find((o) => o.side === "left" && o.id === p.left_id);
  const right = q.objects.find(
    (o) => o.side === "right" && o.id === p.right_id
  );
  return left && right ? { left, right } : null;
}

function resolveRegionOrders(objs: RObjs, t: Obj): Set<number> {
  const lefts = objs.filter((o) => o.side === "left");
  const sameRow = lefts.filter(
    (o) => Math.abs(o.y - t.y) <= Math.max(24, t.h * 0.65)
  );
  if (sameRow.length >= 2) {
    return new Set(sameRow.map((o) => o.layoutOrderIndex));
  }
  const sorted = [...lefts].sort(
    (a, b) => a.layoutOrderIndex - b.layoutOrderIndex
  );
  const idx = sorted.findIndex((o) => o.key === t.key);
  const nb = sorted[idx + 1] ?? sorted[idx - 1];
  const base = [t.layoutOrderIndex];
  return new Set(nb ? [...base, nb.layoutOrderIndex] : base);
}

export function resolveGT025HintTargetForLevel(
  lv: HL,
  q: Q
): HintTarget | null {
  const pair = getPendingDiffPair(q);
  if (!pair) {
    return null;
  }
  if (lv === 1) {
    const orders = resolveRegionOrders(q.objects, pair.left);
    const ids = q.objects
      .filter((o) => orders.has(o.layoutOrderIndex))
      .map((o) => o.entityId);
    return ids.length > 0 ? { kind: "region", ids } : null;
  }
  return lv === 2
    ? { kind: "region", ids: [pair.left.entityId, pair.right.entityId] }
    : { kind: "slot", index: pair.left.slotIndex };
}

export function resolveGT025HintDemoSequence(lv: HL, q: Q): HSteps {
  if (lv !== 3 || q.disabled) {
    return null;
  }
  const steps: HintDemoStep[] = [];
  for (const d of q.diffs) {
    const left = q.foundDiffIds.has(d.id)
      ? undefined
      : q.objects.find((o) => o.side === "left" && o.id === d.left_id);
    if (left) {
      steps.push({ from: left.slotIndex, to: left.slotIndex });
    }
  }
  return steps.length > 0 ? steps : null;
}

function buildRegionBox(slots: readonly Slot[]): SceneBox {
  const xs = slots.flatMap((s) => [s.x - s.w / 2 - 6, s.x + s.w / 2 + 6]);
  const ys = slots.flatMap((s) => [s.y - s.h / 2 - 6, s.y + s.h / 2 + 6]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

export function buildGT025ScaffoldVisual(
  q: Q,
  c: GT025Clock,
  clip: ZoneRect
): SVis {
  const level = c.activeHintLevel;
  const pair = level === 0 ? null : getPendingDiffPair(q);
  if (!pair || level === 0) {
    return null;
  }
  const orders = level === 1 ? resolveRegionOrders(q.objects, pair.left) : null;
  const pickSide = (side: SpotSide, fb: Slot): SceneBox | undefined => {
    if (!orders) {
      return undefined;
    }
    const s = q.objects
      .filter((o) => o.side === side && orders.has(o.layoutOrderIndex))
      .map((o) => o.slot);
    return buildRegionBox(s.length > 0 ? s : [fb]);
  };
  return {
    clip,
    level,
    leftSlot: pair.left.slot,
    rightSlot: pair.right.slot,
    leftRegion: pickSide("left", pair.left.slot),
    rightRegion: pickSide("right", pair.right.slot),
    timeMs: c.lastRenderMs ?? 0,
  };
}
