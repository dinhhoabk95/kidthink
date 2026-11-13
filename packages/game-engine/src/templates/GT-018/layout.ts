import type { AgeBand } from "#src/contracts/types";
import {
  type GameAction,
  type HintTarget,
  ACTION_IGNORED as IGN,
  ACTION_CORRECT as OK,
  ACTION_RETRY as RETRY,
} from "#src/game-session";
import type { EntityVisual, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import {
  findHitSlotIndex as fHit,
  isPointInSlot as inSlot,
  TAP_TOLERANCE_PX as TOL,
} from "#src/layout/hit-test";
import {
  computeMutedStripLayout,
  type StripChip,
} from "#src/layout/muted-strip";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize, splitCaption, splitFigure } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { ItemVisualState } from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import { deriveDerangement } from "#src/rng/derangement";
import { deriveStream } from "#src/rng/mulberry32";
import type { HintDemoStep, HintLevel } from "#src/systems/hint-ladder";
import type { GT018Content } from "./template";

export const GRAMOPHONE_SIZE_PX = 130;
export type GT018Option = GT018Content["options"][number];
type Opt = GT018Option;
type Opts = readonly Opt[];
type Ids = readonly string[];
type Slots = readonly Slot[];
type Cnt = GT018Content;
type Z = ZoneRect;
type Logic = Z | { readonly w: number; readonly h: number };
export type GT018HoverTarget =
  | { readonly kind: "gramophone" }
  | { readonly kind: "slot"; readonly index: number };
type Hov = GT018HoverTarget | null;
type CN1 = "logicMs" | "playingUntilMs" | "gramTapAtMs" | "lastReorderAtMs";
type CN2 = "replayCount" | "reactionRemainingMs";

export interface GT018Clock extends Record<CN1 | CN2, number> {
  winAtMs: number | null;
  closedAtMs: number | null;
  hoveredTarget: Hov;
  scaffoldHintLevel: 0 | 1 | 2 | 3;
  wrongItemId: string | null;
  isSequenceWrong: boolean;
  readonly wrongItemIds: Set<string>;
  stagedStepIndex: number | null;
  isRoundClosed: boolean;
  displayOptions: Opts;
  reactionPose: MascotPose | null;
  pendingInvitation: string | null;
}

export interface GT018VisualPair {
  readonly viewState: EntityVisual;
  readonly cardState: ItemVisualState;
}

export interface GT018FigureLayout {
  readonly figure: Z;
  readonly gramophone: StripChip;
  readonly chips: readonly StripChip[];
  readonly items: Opts;
  readonly stripMode: "none" | "muted-cue" | "step-beads" | "audio-cue";
}

export type {
  GT018FigureLayout as Fig018,
  GT018Option as Opt018,
  GT018VisualPair as VP018,
};

type Clk = GT018Clock;
type VP = GT018VisualPair;
type Fig = GT018FigureLayout;
type SM = Fig["stripMode"];
type HT = HintTarget | null;
type VE = ViewEntity;
type Fl = readonly [boolean, boolean, boolean, boolean];
type CS = [Cnt, AgeBand, Logic, Z?, number?];
type OE = [Opt, number, EntityVisual, boolean, Slot?];

const VP_CORR: VP = { viewState: "correct", cardState: "correct" };
const VP_WRG: VP = { viewState: "incorrect", cardState: "wrong" };
const VP_SEL: VP = { viewState: "selected", cardState: "selected" };
const VP_ACT: VP = { viewState: "active", cardState: "touching" };
const VP_IDL: VP = { viewState: "idle", cardState: "idle" };
const CLOCK_STORE = new WeakMap<object, Clk>();

function makeInitialClock(auto: boolean, opts: Opts = []): Clk {
  const a = { logicMs: 0, playingUntilMs: auto ? 2400 : 0, replayCount: 0 };
  const b = { gramTapAtMs: -1e4, lastReorderAtMs: -1e4 };
  const d = { winAtMs: null, closedAtMs: null, hoveredTarget: null };
  const e = { wrongItemId: null, stagedStepIndex: null, reactionPose: null };
  const f = { isSequenceWrong: false, isRoundClosed: false };
  const g = { pendingInvitation: null, scaffoldHintLevel: 0 as const };
  const h = { displayOptions: [...opts], wrongItemIds: new Set<string>() };
  return { ...a, ...b, ...d, ...e, ...f, ...g, ...h, reactionRemainingMs: 0 };
}

function clk(key: object, opts: Opts = []): Clk {
  let c = CLOCK_STORE.get(key);
  if (!c) {
    c = makeInitialClock(false, opts);
    CLOCK_STORE.set(key, c);
  }
  return c;
}

function resetClk(k: object, auto: boolean, o: Opts, seed: number): Clk {
  const c = makeInitialClock(auto, displayOpts(o, seed));
  CLOCK_STORE.set(k, c);
  return c;
}

function tickClk(key: object, deltaMs: number): Clk {
  const c = clk(key);
  if (deltaMs > 0) {
    c.logicMs += deltaMs;
    c.reactionRemainingMs = Math.max(0, c.reactionRemainingMs - deltaMs);
  }
  return c;
}

function prefixMatch(seq: Ids, target: Ids): boolean {
  const okLen = target.length > 0 && seq.length >= target.length;
  return okLen && target.every((id, idx) => seq[idx] === id);
}

function displayOpts(opts: Opts, seed: number): Opts {
  return seed === 0 || opts.length <= 1
    ? [...opts]
    : deriveDerangement(opts, deriveStream(seed, "items"));
}

function initSeq(opts: Opts, target: Ids, seed: number): Ids {
  const baseIds = opts.map((opt) => opt.item_id);
  if (seed === 0 || baseIds.length <= 1) {
    return baseIds;
  }
  const cand = deriveDerangement(baseIds, deriveStream(seed, "items"));
  if (!prefixMatch(cand, target)) {
    return cand;
  }
  let fallback: Ids = cand;
  for (let shift = 1; shift < cand.length; shift++) {
    const rot = [...cand.slice(shift), ...cand.slice(0, shift)];
    if (!prefixMatch(rot, target)) {
      if (rot.some((id, idx) => id !== baseIds[idx])) {
        return rot;
      }
      fallback = rot;
    }
  }
  return fallback;
}

function seqOpts(opts: Opts, seq: Ids): Opts {
  if (seq.length === 0) {
    return [...opts];
  }
  return seq.flatMap((id, idx) => {
    const f = opts.find((o) => o.item_id === id) ?? opts[idx] ?? opts[0];
    return f ? [f] : [];
  });
}

type MovePair = { readonly from: number; readonly to: number } | null;

function nextMove(seq: Ids, target: Ids): MovePair {
  for (let toIdx = 0; toIdx < target.length; toIdx++) {
    const wanted = target[toIdx];
    if (wanted !== undefined && seq[toIdx] !== wanted) {
      const nextFrom = seq.indexOf(wanted, toIdx + 1);
      const fromIdx = nextFrom >= 0 ? nextFrom : seq.indexOf(wanted);
      if (fromIdx >= 0 && fromIdx !== toIdx) {
        return { from: fromIdx, to: toIdx };
      }
    }
  }
  return null;
}

function demoSteps(seq: Ids, target: Ids): readonly HintDemoStep[] {
  const working = [...seq];
  const steps: HintDemoStep[] = [];
  for (let step = 0; step < Math.max(1, target.length); step++) {
    const move = nextMove(working, target);
    if (!move) {
      break;
    }
    steps.push({ from: move.from, to: move.to });
    const [moved] = working.splice(move.from, 1);
    if (moved !== undefined) {
      working.splice(move.to, 0, moved);
    }
  }
  return steps;
}

function seqHintTarget(lv: HintLevel, s: Slots, q: Ids, t: Ids): HintTarget {
  if (s.length === 0 || prefixMatch(q, t)) {
    return { kind: "action" };
  }
  if (lv === 1) {
    return { kind: "region", ids: ["gramophone"] };
  }
  const move = nextMove(q, t);
  if (!move) {
    return { kind: "action" };
  }
  if (lv === 2) {
    const raw = [q[move.from], q[move.to]];
    return { kind: "region", ids: raw.filter((x): x is string => Boolean(x)) };
  }
  return { kind: "slot", index: move.from, toIndex: move.to };
}

function hintForLevel(lv: HintLevel, c: Cnt, s: Slots, o: Opts, q: Ids): HT {
  if (c.response_mode === "sequence") {
    return seqHintTarget(lv, s, q, c.target_sequence ?? []);
  }
  if (lv === 1) {
    return { kind: "region", ids: ["gramophone"] };
  }
  const idx = o.findIndex((opt) => opt.is_correct === true);
  const cOpt = idx >= 0 ? o[idx] : undefined;
  if (!cOpt) {
    return null;
  }
  if (lv === 2) {
    const dist = o.find((opt) => !opt.is_correct);
    const ids = dist ? [cOpt.item_id, dist.item_id] : [cOpt.item_id];
    return { kind: "region", ids };
  }
  return { kind: "slot", index: idx };
}

function cueItems(c: Cnt, onWhenAud: boolean, aud: boolean): Opts {
  if (aud && !onWhenAud) {
    return [];
  }
  const fb = c.response_mode === "sequence" ? (c.target_sequence ?? []) : [];
  const ids = c.audio_prompt.strip_item_ids ?? fb;
  return ids.flatMap((id) => {
    const opt = c.options.find((o) => o.item_id === id);
    return opt ? [opt] : [];
  });
}

function hasCaption(c: Cnt, stage?: Z): boolean {
  return !stage || c.audio_prompt.text.trim() !== c.prompt.trim();
}

function computeSlots(...[c, ab, l, s, cp]: CS): Slots {
  const body = s && hasCaption(c, s) ? splitCaption(s).body : s;
  const stage = body ? splitFigure(body, GRAMOPHONE_SIZE_PX).rest : undefined;
  const slotCount = c.options.length;
  const cfg = { slotCount, ageBand: ab, logic: l, stage, cssPerLogic: cp };
  return insetDrawSize(resolveLayout("grid")(cfg), s);
}

function figureZone(c: Cnt, logic: Logic, st?: Z): Z {
  if (!st) {
    return { x: logic.w / 2 - 160, y: 12, w: 320, h: GRAMOPHONE_SIZE_PX + 20 };
  }
  const b = hasCaption(c, st) ? splitCaption(st).body : st;
  return splitFigure(b, GRAMOPHONE_SIZE_PX).figure;
}

function stripMode(aud: boolean, isSeq: boolean, cue: boolean): SM {
  if (!aud) {
    return "muted-cue";
  }
  return isSeq && !cue ? "step-beads" : "audio-cue";
}

function figLayout(c: Cnt, l: Logic, a: boolean, q: boolean, st?: Z): Fig {
  const figure = figureZone(c, l, st);
  const isSeq = c.response_mode === "sequence";
  const items = !a || isSeq || q ? cueItems(c, isSeq || q, a) : [];
  if (items.length > 0) {
    const count = a ? Math.max(2, items.length) : items.length + 1;
    const m = computeMutedStripLayout(figure, count);
    const chips = a ? m.chips.slice(0, items.length) : m.chips;
    const sm = stripMode(a, isSeq, q);
    return { figure, gramophone: m.gramophone, chips, items, stripMode: sm };
  }
  const size = Math.min(GRAMOPHONE_SIZE_PX, figure.w, figure.h);
  const gramophone = {
    cx: figure.x + figure.w / 2,
    cy: figure.y + figure.h / 2,
    size,
  };
  return { figure, gramophone, chips: [], items: [], stripMode: "none" };
}

function gramSlot(g: StripChip): Slot {
  const a = { index: 0, x: g.cx, y: g.cy, w: g.size, h: g.size };
  return { ...a, hitW: g.size, hitH: g.size, page: 0, role: "target" };
}

function activeStep(c: Clk, n: number, act: boolean): number | null {
  return n > 0 && act ? Math.floor(c.logicMs / 650) % n : null;
}

function hitGram(slot: Slot, x: number, y: number): boolean {
  return inSlot(slot, x, y, "square", TOL);
}

function hitOpt(slots: Slots, n: number, x: number, y: number): number {
  return fHit(slots.slice(0, n), x, y, "square", TOL);
}

function hitTarget(s: Slots, n: number, g: Slot, x: number, y: number): Hov {
  if (hitGram(g, x, y)) {
    return { kind: "gramophone" };
  }
  const idx = hitOpt(s, n, x, y);
  return idx >= 0 ? { kind: "slot", index: idx } : null;
}

function toSeqAct(c: Clk, s: Slots, n: number, g: Gesture): GameAction | null {
  if (g.type === "drop") {
    const [f, t] = [hitOpt(s, n, g.fromX, g.fromY), hitOpt(s, n, g.toX, g.toY)];
    return f >= 0 && t >= 0 && f !== t
      ? { type: "reorder_step", data: { from_index: f, to_index: t } }
      : null;
  }
  if (g.type === "tap") {
    const hit = hitOpt(s, n, g.x, g.y);
    if (hit < 0) {
      return null;
    }
    const from = c.stagedStepIndex;
    c.stagedStepIndex = from === null ? hit : null;
    const data = { from_index: from ?? 0, to_index: hit };
    return from !== null && from !== hit
      ? { type: "reorder_step", data }
      : null;
  }
  return g.type === "commit" ? { type: "submit_order", data: null } : null;
}

function optVis(c: Clk, opt: Opt, i: number, fl: Fl): VP {
  const [isSeq, isWon, sel, flash] = fl;
  const hov = c.hoveredTarget?.kind === "slot" && c.hoveredTarget.index === i;
  if (isSeq) {
    const isW = c.isSequenceWrong && c.wrongItemIds.has(opt.item_id) && flash;
    const list = [
      [isWon, VP_CORR],
      [isW, VP_WRG],
      [c.stagedStepIndex === i, VP_SEL],
      [hov, VP_ACT],
    ] as const;
    return list.find(([ok]) => ok)?.[1] ?? VP_IDL;
  }
  const isW =
    (c.wrongItemId === opt.item_id && flash) || (sel && !opt.is_correct);
  const list = [
    [sel && opt.is_correct, VP_CORR],
    [isW, VP_WRG],
    [sel, VP_SEL],
    [hov, VP_ACT],
  ] as const;
  return list.find(([ok]) => ok)?.[1] ?? VP_IDL;
}

function optEntity(...[o, i, v, q, s]: OE): VE {
  const lb = resolveAssetLabels(o.asset);
  const [w, h] = s ? [Math.max(s.w, s.hitW), Math.max(s.h, s.hitH)] : [80, 80];
  const b = { id: o.item_id, slotIndex: i, role: "source" as const, state: v };
  const g = { hitShape: "square" as const, draggable: q, x: s?.x ?? 0 };
  const p = { y: s?.y ?? 0, w, h, ...lb };
  const l = q ? { label: String(i + 1) } : {};
  return { ...b, ...g, ...p, ...l, spokenLabel: lb.spokenLabel ?? o.item_id };
}

type AudioPr = Cnt["audio_prompt"] & { readonly audio_path?: string };
function gramEntity(gram: StripChip, act: boolean, pr: AudioPr): VE {
  const st: EntityVisual = act ? "active" : "idle";
  const b = { id: "gramophone", slotIndex: -1, role: "neutral" as const };
  const g = { hitShape: "square" as const, state: st, x: gram.cx, y: gram.cy };
  const p = pr.audio_path ? { spokenAudioPath: pr.audio_path } : {};
  const s = { w: gram.size, h: gram.size, label: "Máy phát âm", ...p };
  return { ...b, ...g, ...s, spokenLabel: pr.text };
}

const l1 = { OK, IGN, RETRY, clk, resetClk, tickClk, prefixMatch, displayOpts };
const l2 = { initSeq, seqOpts, nextMove, demoSteps, hintForLevel, cueItems };
const l3 = { hasCaption, computeSlots, figLayout, gramSlot, activeStep };
const l4 = { hitGram, hitOpt, hitTarget, toSeqAct, optVis, optEntity };
export const L018 = { ...l1, ...l2, ...l3, ...l4, gramEntity };
