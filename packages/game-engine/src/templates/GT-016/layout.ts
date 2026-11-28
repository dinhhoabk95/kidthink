import type { AgeBand } from "#src/contracts/types";
import type {
  GameAction,
  GameActionValue,
  HintLevel,
  HintTarget,
} from "#src/game-session";
import type { Gesture } from "#src/interaction";
import { resolveTouchFloor } from "#src/layout/constants";
import {
  HERO_OPTION_CELL_MAX_PX,
  heroSlot,
  splitHeroStage,
} from "#src/layout/hero-split";
import {
  findHitSlotIndex as findHitIndex,
  TAP_TOLERANCE_PX,
} from "#src/layout/hit-test";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { insetBox, type SceneBox, squareBox } from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { Rng } from "#src/rng/types";
import {
  type ClockAngles,
  type ClockTime,
  isSameTime,
  timeToAngles,
} from "#src/systems/rotation-system";
import type { GT016Content, GT016Difficulty } from "./template.js";

const FACE_INSET = 0.04;

type C = GT016Content;
type D = GT016Difficulty;
type Mode = C["mode"];
type Step = 15 | 30 | 60;
type Opt = C["options"][number];
type Card = C["activity_cards"][number];
type DropGesture = Extract<Gesture, { type: "drop" }>;

export interface GT016ResolvedRound {
  readonly initialTime: ClockTime;
  readonly options: C["options"];
  readonly activityCards: C["activity_cards"];
}
type RoundOut = GT016ResolvedRound;

export interface GT016AnimState {
  displayAngles: ClockAngles;
  tickPulseMs: number;
  wrongChoiceTimerMs: number;
  wrongCardId: string | null;
  wrongClockTimerMs: number;
  celebrateMs: number;
  hoveredSlotIndex: number | null;
}
type Anim = GT016AnimState;

export function computeGT016TargetBadgeBox(b: SceneBox): SceneBox {
  const s = Math.min(b.w, b.h);
  const w = Math.round(s * 0.2);
  const h = Math.round(s * 0.095);
  const pad = Math.round(s * 0.02);
  return { x: b.x + b.w - w - pad, y: b.y + pad, w, h };
}

export function createGT016AnimState(initialTime: ClockTime): Anim {
  return {
    displayAngles: timeToAngles(initialTime),
    tickPulseMs: 0,
    wrongChoiceTimerMs: 0,
    wrongCardId: null,
    wrongClockTimerMs: 0,
    celebrateMs: 0,
    hoveredSlotIndex: null,
  };
}

function stepDeg(cur: number, tgt: number, maxStep: number): number {
  const diff = ((tgt - cur + 540) % 360) - 180;
  if (Math.abs(diff) <= maxStep) {
    return ((tgt % 360) + 360) % 360;
  }
  return (((cur + Math.sign(diff) * maxStep) % 360) + 360) % 360;
}

export function stepGT016AnimState(
  a: Anim,
  tgtTime: ClockTime,
  dtMs: number
): boolean {
  const dt = Math.max(0, dtMs);
  const tgt = timeToAngles(tgtTime);
  const maxStep = (dt / 1000) * 720;
  const cur = a.displayAngles;
  a.displayAngles = {
    hourAngleDeg: stepDeg(cur.hourAngleDeg, tgt.hourAngleDeg, maxStep),
    minuteAngleDeg: stepDeg(cur.minuteAngleDeg, tgt.minuteAngleDeg, maxStep),
  };
  a.tickPulseMs = Math.max(0, a.tickPulseMs - dt);
  a.wrongClockTimerMs = Math.max(0, a.wrongClockTimerMs - dt);
  a.celebrateMs = Math.max(0, a.celebrateMs - dt);
  if (a.wrongChoiceTimerMs > 0) {
    a.wrongChoiceTimerMs = Math.max(0, a.wrongChoiceTimerMs - dt);
    if (a.wrongChoiceTimerMs === 0) {
      a.wrongCardId = null;
      return true;
    }
  }
  return false;
}

export const formatSpokenClockTime = (t: ClockTime): string =>
  t.minute === 0 ? `${t.hour} giờ` : `${t.hour} giờ ${t.minute} phút`;

export function stepClockTime(c: ClockTime, d: number, s: Step): ClockTime {
  const delta = Math.sign(d) * s;
  const total = (((c.hour * 60 + c.minute + delta) % 720) + 720) % 720;
  const rawH = Math.floor(total / 60);
  return { hour: rawH === 0 ? 12 : rawH, minute: total % 60 };
}

function derange<T>(
  xs: readonly T[],
  eq: (a: T, b: T) => boolean,
  r: Rng
): T[] {
  if (xs.length < 2) {
    return [...xs];
  }
  const out = shuffle([...xs], r);
  if (out.every((v, i) => xs[i] !== undefined && eq(v, xs[i]))) {
    const a = out[0];
    const b = out[1];
    if (a !== undefined && b !== undefined) {
      out[0] = b;
      out[1] = a;
    }
  }
  return out;
}

export function resolveGT016RoundOrder(c: C, d: D, s: number): RoundOut {
  const init: ClockTime = c.initial_time ?? {
    hour: c.target_time.hour,
    minute: c.target_time.minute,
  };
  const opts = c.options ?? [];
  const cards = c.activity_cards ?? [];
  if (s === 0) {
    return { initialTime: init, options: opts, activityCards: cards };
  }
  const rng = deriveStream(s, "items");
  if (c.mode === "read") {
    const eq = (a: Opt, b: Opt): boolean =>
      a.hour === b.hour && a.minute === b.minute;
    const options = derange(opts, eq, rng);
    return { initialTime: init, options, activityCards: cards };
  }
  if (c.mode === "match") {
    const eq = (a: Card, b: Card): boolean => a.card_id === b.card_id;
    const activityCards = derange(cards, eq, rng);
    return { initialTime: init, options: opts, activityCards };
  }
  let cand = init;
  const n = 1 + rng.nextInt(5);
  for (let i = 0; i < n; i++) {
    cand = stepClockTime(cand, 1, d.minute_step);
  }
  if (isSameTime(cand, c.target_time) || isSameTime(cand, init)) {
    cand = stepClockTime(cand, 1, d.minute_step);
    if (isSameTime(cand, c.target_time)) {
      cand = stepClockTime(cand, 1, d.minute_step);
    }
  }
  return { initialTime: cand, options: opts, activityCards: cards };
}

export const findGT016HitSlotIndex = (
  s: readonly Slot[],
  n: number,
  x: number,
  y: number
): number => findHitIndex(s.slice(0, n), x, y, "square", TAP_TOLERANCE_PX);

export function computeGT016FaceBox(
  st: ZoneRect | undefined,
  lg: { readonly w: number; readonly h: number },
  n: number,
  tf: number
): SceneBox {
  if (st) {
    const { hero } = splitHeroStage(st, n > 0, { count: n, touchFloor: tf });
    return squareBox(insetBox(hero, FACE_INSET));
  }
  const s = insetBox({ x: 0, y: 0, w: lg.w, h: lg.h }, 0.08);
  return squareBox({ x: s.x, y: s.y, w: s.w, h: s.h * 0.58 });
}

export function computeGT016StageSlots(
  st: ZoneRect,
  age: AgeBand,
  cpl: number,
  n: number,
  m: Mode
): { readonly slots: Slot[]; readonly touchFloor: number } {
  const touchFloor = resolveTouchFloor(age, cpl);
  const { hero, rest } = splitHeroStage(st, n > 0, { count: n, touchFloor });
  if (n === 0) {
    return { slots: [heroSlot(hero, 0)], touchFloor };
  }
  const maxCell = { w: HERO_OPTION_CELL_MAX_PX, h: HERO_OPTION_CELL_MAX_PX };
  const role = m === "read" ? "source" : "target";
  const slots = computeStageCellSlots({
    count: n,
    stage: rest,
    touchFloor,
    maxCell,
    role,
    hasLabels: false,
  });
  return { slots, touchFloor };
}

const ptDeg = (cx: number, cy: number, x: number, y: number): number =>
  ((Math.atan2(y - cy, x - cx) * 180) / Math.PI + 90 + 360) % 360;

const degToHour = (deg: number): number => {
  const raw = Math.round(deg / 30) % 12;
  return raw === 0 ? 12 : raw;
};

function degToMin(deg: number, step: Step): 0 | 15 | 30 | 45 {
  if (step === 60) {
    return 0;
  }
  if (step === 30) {
    return (Math.round(deg / 180) * 30) % 60 === 30 ? 30 : 0;
  }
  const m = (Math.round(deg / 90) * 15) % 60;
  return m === 15 || m === 30 || m === 45 ? m : 0;
}

function handDist(
  g: DropGesture,
  cx: number,
  cy: number,
  deg: number,
  len: number
): number {
  const rad = ((deg - 90) * Math.PI) / 180;
  const dx = Math.cos(rad) * len;
  const dy = Math.sin(rad) * len;
  const l2 = dx * dx + dy * dy;
  const u = ((g.fromX - cx) * dx + (g.fromY - cy) * dy) / (l2 || 1);
  const t = Math.max(0, Math.min(1, u));
  return Math.hypot(g.fromX - (cx + t * dx), g.fromY - (cy + t * dy));
}

const inBox = (x: number, y: number, b: SceneBox | undefined): boolean =>
  Boolean(
    b &&
      x >= b.x - 4 &&
      x <= b.x + b.w + 4 &&
      y >= b.y - 4 &&
      y <= b.y + b.h + 4
  );

const setAct = (
  hour: number,
  minute: number,
  hand: "hour" | "minute"
): GameAction => ({
  type: "set_clock_time",
  data: { hour, minute, hand },
});

export interface ClockGestureInput {
  readonly gesture: Gesture;
  readonly faceBox: SceneBox;
  readonly targetBadgeBox?: SceneBox;
  readonly currentTime: ClockTime;
  readonly minuteStep: Step;
  /** Giờ đích: kim thả trong vùng hút quanh bước đích thì hút về bước đó (`BR-ENG-19`). */
  readonly targetTime?: ClockTime;
  /** Bán kính vùng hút (px logic) quanh đầu kim ở bước đích: 0,45 × sàn chạm. */
  readonly snapRadiusPx?: number;
}
type Inp = ClockGestureInput;

/** Hub = nơi trục kim: kéo từ đây là kéo kim mà trợ giúp đang chỉ, không phải kim nào cụ thể. */
const HUB_RATIO = 0.18;

/** Khoảng cách cung (px) từ điểm thả tới góc `deg` ở cùng bán kính với điểm thả. */
function arcToAngle(a1: number, deg: number, radius: number): number {
  const diff = Math.abs(((a1 - deg + 540) % 360) - 180);
  return (diff * Math.PI * radius) / 180;
}

/** Điểm thả có nằm trong vùng hút của bước đích (góc `targetDeg`) không. */
function attractedTo(
  inp: Inp,
  a1: number,
  d1: number,
  targetDeg: number
): boolean {
  return arcToAngle(a1, targetDeg, d1) <= (inp.snapRadiusPx ?? 0);
}

function stepMinDrop(
  cur: ClockTime,
  a0: number,
  a1: number,
  st: Step,
  snappedMin: number | null
): GameAction {
  const nextMin = snappedMin ?? degToMin(a1, st);
  let hour = cur.hour;
  let minute = nextMin;
  if (a0 >= 270 && a1 <= 90) {
    hour = (cur.hour % 12) + 1;
  } else if (a0 <= 90 && a1 >= 270) {
    hour = ((cur.hour + 10) % 12) + 1;
    if (cur.minute === 0 && nextMin === 0 && st < 60) {
      minute = st === 30 ? 30 : 45;
    }
  }
  return setAct(hour, minute, "minute");
}

function resolveDrop(g: DropGesture, inp: Inp): GameAction | null {
  const tb = inp.targetBadgeBox;
  if (inBox(g.fromX, g.fromY, tb) || inBox(g.toX, g.toY, tb)) {
    return null;
  }
  const fb = inp.faceBox;
  const cx = fb.x + fb.w / 2;
  const cy = fb.y + fb.h / 2;
  const r = fb.w / 2;
  const d0 = Math.hypot(g.fromX - cx, g.fromY - cy);
  const d1 = Math.hypot(g.toX - cx, g.toY - cy);
  if (d0 > r * 1.2 || d1 < r * 0.18 || d1 > r * 1.45) {
    return null;
  }
  const a0 = ptDeg(cx, cy, g.fromX, g.fromY);
  const a1 = ptDeg(cx, cy, g.toX, g.toY);
  const { currentTime: cur, minuteStep: st, targetTime: tgt } = inp;
  const hourDeg = tgt ? tgt.hour * 30 : null;
  const hourOf = (): number =>
    hourDeg !== null && attractedTo(inp, a1, d1, hourDeg)
      ? (tgt?.hour ?? degToHour(a1))
      : degToHour(a1);
  if (st === 60) {
    return setAct(hourOf(), 0, "hour");
  }
  const ang = timeToAngles(cur);
  const dh = handDist(g, cx, cy, ang.hourAngleDeg, r * 0.48);
  const dm = handDist(g, cx, cy, ang.minuteAngleDeg, r * 0.76);
  const hubGrab = tgt !== undefined && d0 <= r * HUB_RATIO;
  const grabsHour = hubGrab ? cur.hour !== tgt.hour : dh <= dm + 6;
  if ((hubGrab || d0 <= r * 0.56) && grabsHour) {
    return setAct(hourOf(), cur.minute, "hour");
  }
  const tgtMinDeg = tgt && tgt.minute % st === 0 ? tgt.minute * 6 : null;
  const snapped =
    tgt && tgtMinDeg !== null && attractedTo(inp, a1, d1, tgtMinDeg)
      ? tgt.minute
      : null;
  return stepMinDrop(cur, a0, a1, st, snapped);
}

export function resolveClockGestureTime(inp: Inp): GameAction | null {
  const g = inp.gesture;
  if (g.type === "drop") {
    return resolveDrop(g, inp);
  }
  if (g.type === "tap") {
    if (inBox(g.x, g.y, inp.targetBadgeBox)) {
      return null;
    }
    const fb = inp.faceBox;
    const cx = fb.x + fb.w / 2;
    const cy = fb.y + fb.h / 2;
    const r = fb.w / 2;
    const dist = Math.hypot(g.x - cx, g.y - cy);
    if (dist < r * 0.6 || dist > r * 0.96) {
      return null;
    }
    const cur = inp.currentTime;
    const st = inp.minuteStep;
    const th = degToHour(ptDeg(cx, cy, g.x, g.y));
    if (th !== cur.hour || st === 60) {
      return setAct(th, st === 60 ? 0 : cur.minute, "hour");
    }
    return setAct(cur.hour, (cur.minute + st) % 60, "minute");
  }
  return null;
}

export function extractSetClockTimeData(data: GameActionValue): {
  readonly hour: number;
  readonly minute: number;
  readonly hand: "hour" | "minute";
} | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const h = Number(Reflect.get(data, "hour"));
  const m = Number(Reflect.get(data, "minute"));
  const hand = Reflect.get(data, "hand");
  if (!(Number.isFinite(h) && Number.isFinite(m))) {
    return null;
  }
  const hour = Math.max(1, Math.min(12, Math.round(h)));
  const minute = m === 15 || m === 30 || m === 45 ? m : 0;
  return { hour, minute, hand: hand === "hour" ? "hour" : "minute" };
}

export function computeGT016HintDestinationPoint(
  fb: SceneBox,
  cur: ClockTime,
  tgt: ClockTime
): { readonly x: number; readonly y: number } {
  const f = squareBox(fb);
  const cx = f.x + f.w / 2;
  const cy = f.y + f.h / 2;
  const r = f.w / 2;
  const isH = cur.hour !== tgt.hour;
  const a = (((isH ? tgt.hour * 30 : tgt.minute * 6) - 90) * Math.PI) / 180;
  const d = isH ? r * 0.72 : r * 0.76;
  const x = Math.round(cx + Math.cos(a) * d);
  const y = Math.round(cy + Math.sin(a) * d);
  return { x, y };
}

export interface HintResolveParams {
  readonly mode: Mode;
  readonly level: HintLevel;
  readonly currentTime: ClockTime;
  readonly targetTime: ClockTime;
  readonly options: C["options"];
  readonly activityCards: C["activity_cards"];
  readonly hintTarget: HintTarget | null;
}
type HintP = HintResolveParams;
const isStr = (id: string | undefined): id is string => Boolean(id);
const sameCard = (c: Card, t: ClockTime): boolean =>
  isSameTime(t, { hour: c.hour, minute: c.minute });

export function resolveGT016HintTargetForLevel(p: HintP): HintTarget | null {
  if (p.mode === "set") {
    if (isSameTime(p.currentTime, p.targetTime)) {
      return { kind: "action" };
    }
    const ids = p.level === 1 ? ["clock-face", "target-time"] : ["clock-face"];
    return p.level <= 2
      ? { kind: "region", ids }
      : { kind: "slot", index: 0, toIndex: 0 };
  }
  if (p.level === 1) {
    return { kind: "region", ids: ["clock-face"] };
  }
  if (p.level === 3) {
    return p.hintTarget;
  }
  if (p.mode === "read") {
    const cIdx = p.options.findIndex((o) => o.is_correct);
    const oIdx = p.options.findIndex((o, i) => i !== cIdx && !o.is_correct);
    const ids = [cIdx, oIdx].filter((i) => i >= 0).map((i) => `opt-${i}`);
    return { kind: "region", ids };
  }
  const mCard =
    p.activityCards.find((c) => sameCard(c, p.currentTime)) ??
    p.activityCards.find((c) => sameCard(c, p.targetTime));
  const oCard = p.activityCards.find((c) => c.card_id !== mCard?.card_id);
  return {
    kind: "region",
    ids: [mCard?.card_id, oCard?.card_id].filter(isStr),
  };
}
