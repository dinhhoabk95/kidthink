import type {
  GameAction,
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/game-session";
import type { EngineView, EntityVisual, ViewEntity } from "#src/interaction";
import {
  resolveAssetSpeech,
  spokenKeywordForAsset,
} from "#src/labels/spoken-keyword";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type {
  GT028LilypadState,
  GT028ScaffoldParams,
} from "#src/render/gt-028-shapes";
import type { ItemVisualState, SceneBox } from "#src/render/index.js";
import { deriveDerangement } from "#src/rng/derangement";
import { deriveStream } from "#src/rng/mulberry32";
import type { GT028Content } from "./template.js";

export type GT028Item = GT028Content["items"][number];
const BROKEN_EMOJI_RE = /^EMJ-[a-z0-9_-]+$/i;
export const GT028_WRONG_SUBMIT_MS = 450;
export const GT028_TAP_RIPPLE_MS = 380;

export interface ClockStamp {
  renderStartMs: number | null;
  readonly updateStartMs: number;
}

export interface GT028Clock {
  activeHintLevel: 0 | 1 | 2 | 3;
  countAnimFrom: number;
  countAnimTo: number;
  countStamp: ClockStamp | null;
  frogFromTick: number;
  frogStamp: ClockStamp | null;
  frogToTick: number;
  hoveredItemId: string | null;
  readonly itemTapStamps: Map<string, ClockStamp>;
  lastRenderMs: number | null;
  updateMs: number;
  winStamp: ClockStamp | null;
  wrongSubmitStamp: ClockStamp | null;
}

export interface GT028BuildViewParams {
  readonly clock: GT028Clock;
  readonly isWon: boolean;
  readonly items: readonly GT028Item[];
  readonly prompt: string;
  readonly renderStates: ReadonlyMap<string, string>;
  readonly selectedIds: readonly string[];
  readonly slots: readonly Slot[];
  readonly step: 2 | 5 | 10;
  readonly targetTotal: number;
}

export interface GT028HintQuery {
  readonly allowUndo: boolean;
  readonly currentTotal: number;
  readonly disabled: boolean;
  readonly items: readonly GT028Item[];
  readonly selectedIds: readonly string[];
  readonly slots: readonly Slot[];
  readonly step: 2 | 5 | 10;
  readonly targetTotal: number;
}

export interface GT028ScaffoldQueryParams {
  readonly badgeBox: SceneBox;
  readonly captionRect: ZoneRect;
  readonly clip: ZoneRect;
  readonly clock: GT028Clock;
  readonly query: GT028HintQuery;
}

const CLOCKS = new WeakMap<object, GT028Clock>();

function clockOf(host: object, reset = false): GT028Clock {
  let c = reset ? undefined : CLOCKS.get(host);
  if (!c) {
    c = {
      activeHintLevel: 0,
      countAnimFrom: 0,
      countAnimTo: 0,
      countStamp: null,
      frogFromTick: 0,
      frogStamp: null,
      frogToTick: 0,
      hoveredItemId: null,
      itemTapStamps: new Map(),
      lastRenderMs: null,
      updateMs: 0,
      winStamp: null,
      wrongSubmitStamp: null,
    };
    CLOCKS.set(host, c);
  }
  return c;
}

const stampOf = (c: GT028Clock): ClockStamp => ({
  updateStartMs: c.updateMs,
  renderStartMs: c.lastRenderMs,
});

function tickClock(c: GT028Clock, timeMs: number): void {
  c.lastRenderMs = timeMs;
  const anchor = timeMs <= 1000 ? 0 : timeMs;
  const list = [c.frogStamp, c.countStamp, c.wrongSubmitStamp, c.winStamp];
  for (const s of [...list, ...c.itemTapStamps.values()]) {
    if (s && s.renderStartMs === null) {
      s.renderStartMs = anchor;
    }
  }
}

function elapsedMs(c: GT028Clock, s: ClockStamp | null | undefined): number {
  if (!s) {
    return 1e9;
  }
  const r =
    s.renderStartMs === null ? 0 : (c.lastRenderMs ?? 0) - s.renderStartMs;
  return Math.max(0, c.updateMs - s.updateStartMs, r);
}

function stepFrogCount(
  c: GT028Clock,
  fromTick: number,
  toTick: number,
  countFrom: number,
  countTo: number
): void {
  const st = stampOf(c);
  [c.frogFromTick, c.frogToTick] = [fromTick, toTick];
  [c.countAnimFrom, c.countAnimTo] = [countFrom, countTo];
  c.frogStamp = st;
  c.countStamp = st;
}

function countView(
  c: GT028Clock,
  cur: number,
  rm: boolean
): [number, boolean, number] {
  const dur = rm ? 120 : 240;
  const el = elapsedMs(c, c.countStamp);
  if (!c.countStamp || el >= dur || c.countAnimFrom === c.countAnimTo) {
    return [cur, false, 0];
  }
  const p = Math.min(1, Math.max(0, el / dur));
  const d = c.countAnimTo - c.countAnimFrom;
  let val = Math.round(c.countAnimFrom + d * (1 - (1 - p) * (1 - p)));
  if (p > 0 && p < 1 && Math.abs(d) >= 2) {
    const lo = Math.min(c.countAnimFrom, c.countAnimTo) + 1;
    const hi = Math.max(c.countAnimFrom, c.countAnimTo) - 1;
    val = Math.max(lo, Math.min(hi, val));
  }
  return [val, true, Math.sin(p * Math.PI)];
}

function parseItemId(data: GameAction["data"]): string | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const rec: { item_id?: string; id?: string } = data;
  const id = rec.item_id ?? rec.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function isBrokenAsset(asset: GT028Item["asset"] | undefined): boolean {
  if (!asset) {
    return true;
  }
  if (asset.kind === "emoji") {
    const ref = asset.ref.trim();
    return ref.length === 0 || BROKEN_EMOJI_RE.test(ref);
  }
  const v = asset.kind === "image" ? asset.path : asset.text;
  return v.trim().length === 0;
}

function shuffleRound(
  items: readonly GT028Item[],
  shuf: boolean,
  seed0: number,
  gen: number
): GT028Item[] {
  if (items.length <= 1 || (gen === 0 && !shuf)) {
    return [...items];
  }
  const seed = gen === 0 ? seed0 : seed0 + gen * 7919;
  return deriveDerangement(items, deriveStream(seed, "items"));
}

function resolveVis(
  id: string,
  sel: boolean,
  o: GT028BuildViewParams
): EntityVisual {
  if (o.isWon || sel) {
    return o.isWon ? "correct" : "selected";
  }
  const rs = o.renderStates.get(id);
  if (rs === "correct" || rs === "wrong") {
    return rs === "correct" ? "correct" : "incorrect";
  }
  return o.clock.hoveredItemId === id ? "active" : "idle";
}

function buildView(o: GT028BuildViewParams): EngineView {
  const { items, selectedIds, slots, step, prompt, targetTotal } = o;
  const entities: ViewEntity[] = items.map((item, i) => {
    const slot = slots[i];
    const selIdx = selectedIds.indexOf(item.item_id);
    const isSel = selIdx !== -1;
    const state = resolveVis(item.item_id, isSel, o);
    const cnt = (isSel ? selIdx + 1 : selectedIds.length + 1) * step;
    const assetLabels = resolveAssetSpeech(item.asset);
    const kw = spokenKeywordForAsset({ kind: "text", text: String(cnt) });
    return {
      id: item.item_id,
      slotIndex: slot?.index ?? i,
      role: "target",
      state,
      x: slot?.x ?? 0,
      y: slot?.y ?? 0,
      w: slot?.hitW ?? 80,
      h: slot?.hitH ?? 80,
      hitShape: "circle",
      ...assetLabels,
      label: isSel ? String(cnt) : undefined,
      spokenLabel: kw ?? assetLabels.spokenLabel ?? String(cnt),
    };
  });
  const tot = String(targetTotal);
  const activePrompt = new RegExp(`(?<!\\d)${tot}(?!\\d)`).test(prompt)
    ? prompt
    : `${prompt} Đếm tới ${tot} nhé!`;
  return { activePrompt, entities };
}

function lilyState(
  won: boolean,
  sel: boolean,
  hov: boolean,
  wr: boolean
): GT028LilypadState {
  if (won || sel) {
    return won ? "correct" : "selected";
  }
  if (hov || wr) {
    return hov ? "hovered" : "wrong";
  }
  return "idle";
}

function slotVisual(
  won: boolean,
  sel: boolean,
  hov: boolean,
  fb: ItemVisualState
): ItemVisualState {
  if (won || sel) {
    return won ? "correct" : "selected";
  }
  return hov ? "touching" : fb;
}

function hintIdx(q: GT028HintQuery): number | null {
  if (q.disabled) {
    return null;
  }
  if (q.currentTotal < q.targetTotal) {
    const idx = q.items.findIndex((it) => !q.selectedIds.includes(it.item_id));
    return idx >= 0 ? idx : null;
  }
  if (q.currentTotal > q.targetTotal && q.allowUndo) {
    const lastId = q.selectedIds.at(-1);
    const idx = lastId ? q.items.findIndex((it) => it.item_id === lastId) : -1;
    return idx >= 0 ? idx : null;
  }
  return null;
}

function hintForLv(lv: HintLevel, q: GT028HintQuery): HintTarget | null {
  if (q.disabled) {
    return null;
  }
  if (q.currentTotal === q.targetTotal) {
    return { kind: "action" };
  }
  if (lv === 3) {
    const idx = hintIdx(q);
    return idx === null
      ? null
      : { kind: "slot", index: q.slots[idx]?.index ?? idx };
  }
  if (q.currentTotal < q.targetTotal) {
    const unsel = q.items
      .filter((it) => !q.selectedIds.includes(it.item_id))
      .map((it) => it.item_id);
    const need = Math.max(
      1,
      Math.ceil((q.targetTotal - q.currentTotal) / q.step)
    );
    const ids = lv === 1 ? unsel : unsel.slice(0, need);
    return ids.length > 0 ? { kind: "region", ids } : null;
  }
  if (!q.allowUndo || q.selectedIds.length === 0) {
    return null;
  }
  const ex = Math.max(1, Math.ceil((q.currentTotal - q.targetTotal) / q.step));
  const ids = lv === 1 ? [...q.selectedIds] : q.selectedIds.slice(-ex);
  return { kind: "region", ids };
}

function hintDemo(
  lv: HintLevel,
  q: GT028HintQuery
): readonly HintDemoStep[] | null {
  if (lv !== 3 || q.disabled || q.currentTotal === q.targetTotal) {
    return null;
  }
  if (q.currentTotal < q.targetTotal) {
    const need = Math.max(
      1,
      Math.ceil((q.targetTotal - q.currentTotal) / q.step)
    );
    const steps = q.items
      .map((it, idx) => ({ it, sIdx: q.slots[idx]?.index ?? idx }))
      .filter((x) => !q.selectedIds.includes(x.it.item_id))
      .slice(0, need)
      .map((x) => ({ from: x.sIdx, to: x.sIdx }));
    return steps.length > 0 ? steps : null;
  }
  if (!q.allowUndo) {
    return null;
  }
  const ex = Math.max(1, Math.ceil((q.currentTotal - q.targetTotal) / q.step));
  const steps: HintDemoStep[] = [];
  for (const id of [...q.selectedIds.slice(-ex)].reverse()) {
    const idx = q.items.findIndex((it) => it.item_id === id);
    if (idx >= 0) {
      const sIdx = q.slots[idx]?.index ?? idx;
      steps.push({ from: sIdx, to: sIdx });
    }
  }
  return steps.length > 0 ? steps : null;
}

function scaffoldVis(p: GT028ScaffoldQueryParams): GT028ScaffoldParams | null {
  const { query: q, clock: c, clip, captionRect, badgeBox } = p;
  const lv = c.activeHintLevel;
  if (lv === 0 || q.disabled) {
    return null;
  }
  const tIdx = hintIdx(q);
  const targetSlot = tIdx === null ? null : (q.slots[tIdx] ?? null);
  return {
    badgeBox,
    captionRect,
    clip,
    currentTotal: q.currentTotal,
    level: lv,
    selectedCount: q.selectedIds.length,
    step: q.step,
    targetSlot,
    targetTotal: q.targetTotal,
    ticks: q.items.length,
    timeMs: c.lastRenderMs ?? 0,
  };
}

export const gt28 = {
  buildView,
  clockOf,
  countView,
  elapsedMs,
  hintDemo,
  hintForLv,
  hintIdx,
  isBrokenAsset,
  lilyState,
  parseItemId,
  scaffoldVis,
  shuffleRound,
  slotVisual,
  stampOf,
  stepFrogCount,
  tickClock,
};
