import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintLevel,
  type HintTarget,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveLayout } from "#src/layout/registry";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawGT016ChoiceDecor,
  drawGT016ClockStage,
  drawGT016TargetBadge,
} from "#src/render/gt-016-shapes";
import {
  drawMontessoriControlOfErrorPill,
  drawSlotItem,
  type SceneBox,
} from "#src/render/index.js";
import { drawTimeOfDaySky } from "#src/render/scene-decor.js";
import type { DegradationState } from "#src/systems/degradation";
import type { MontessoriExploreTracker } from "#src/systems/montessori-explore-system";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type ClockTime,
  formatClockTime,
  isSameTime,
  timeToAngles,
} from "#src/systems/rotation-system";
import {
  computeGT016FaceBox,
  computeGT016HintDestinationPoint,
  computeGT016StageSlots,
  computeGT016TargetBadgeBox,
  findGT016HitSlotIndex,
  formatSpokenClockTime,
  type GT016AnimState,
  resolveClockGestureTime,
  resolveGT016HintTargetForLevel,
} from "./layout.js";
import type { GT016Content, GT016Difficulty } from "./template.js";

type C = GT016Content;
type D = GT016Difficulty;
type Opt = C["options"][number];
type Card = C["activity_cards"][number];
export interface GT016Point {
  readonly x: number;
  readonly y: number;
}
export type GT016DayLabel =
  | "Buổi sáng"
  | "Buổi trưa"
  | "Buổi chiều"
  | "Buổi tối";

export const GT016_TICK_MS = 360;
export const GT016_WRONG_MS = 450;
export const GT016_CELEB_MS = 900;

export interface GT016ViewInput {
  readonly content: C;
  readonly difficulty: D;
  readonly currentTime: ClockTime;
  readonly options: C["options"];
  readonly activityCards: C["activity_cards"];
  readonly slots: readonly Slot[];
  readonly stageRect: ZoneRect | undefined;
  readonly logicSpace: { readonly w: number; readonly h: number };
  readonly touchFloor: number;
  readonly selectedOptionIndex: number | null;
  readonly matchedCardIds: ReadonlySet<string>;
  readonly anim: GT016AnimState;
  readonly roundClosedOnWrong: boolean;
  readonly hasSubmittedTime: boolean;
  readonly activeHintLevel: 0 | 1 | 2 | 3;
  readonly isWon: boolean;
  readonly skyProgress: number;
  readonly degradation: DegradationState | null;
  readonly exploreTracker: MontessoriExploreTracker;
}

export function resolveDayPeriodLabel(h: number): GT016DayLabel {
  if (h >= 6 && h <= 10) {
    return "Buổi sáng";
  }
  if (h >= 11 && h <= 12) {
    return "Buổi trưa";
  }
  return h >= 1 && h <= 5 ? "Buổi chiều" : "Buổi tối";
}

export function resolveGT016ChoiceCount(
  mode: C["mode"],
  options: C["options"],
  activityCards: C["activity_cards"]
): number {
  if (mode === "set") {
    return 0;
  }
  return mode === "read" ? options.length : activityCards.length;
}

export function computeGT016SessionFaceBox(v: GT016ViewInput): SceneBox {
  const cnt = resolveGT016ChoiceCount(
    v.content.mode,
    v.options,
    v.activityCards
  );
  return computeGT016FaceBox(v.stageRect, v.logicSpace, cnt, v.touchFloor);
}

export function resolveGT016HoverSlot(
  v: GT016ViewInput,
  xOrPt: number | { readonly x: number; readonly y: number } | null,
  y?: number
): number | null {
  if (xOrPt === null || v.content.mode === "set") {
    return null;
  }
  const px = typeof xOrPt === "number" ? xOrPt : xOrPt.x;
  const py = typeof xOrPt === "number" ? (y ?? 0) : xOrPt.y;
  const cnt = resolveGT016ChoiceCount(
    v.content.mode,
    v.options,
    v.activityCards
  );
  const idx = findGT016HitSlotIndex(v.slots, cnt, px, py);
  return idx >= 0 ? idx : null;
}

export function computeGT016SlotsForBand(
  v: GT016ViewInput,
  ageBand: AgeBand,
  cssPerLogic: number
): { readonly slots: readonly Slot[]; readonly touchFloor: number } {
  const cnt = resolveGT016ChoiceCount(
    v.content.mode,
    v.options,
    v.activityCards
  );
  if (v.stageRect) {
    return computeGT016StageSlots(
      v.stageRect,
      ageBand,
      cssPerLogic,
      cnt,
      v.content.mode
    );
  }
  const slotCount = Math.max(v.options.length, v.activityCards.length, 1);
  return {
    slots: resolveLayout("grid")({ slotCount, ageBand, logic: v.logicSpace }),
    touchFloor: v.touchFloor,
  };
}

function buildMatchEntity(
  c: Card,
  i: number,
  s: Slot,
  v: GT016ViewInput
): ViewEntity {
  const ok = v.matchedCardIds.has(c.card_id);
  const bad = v.anim.wrongCardId === c.card_id && v.anim.wrongChoiceTimerMs > 0;
  let state: EntityVisual = "idle";
  if (ok) {
    state = "correct";
  } else if (bad) {
    state = "incorrect";
  }
  const t: ClockTime = { hour: c.hour, minute: c.minute };
  const al = resolveAssetLabels(c.asset);
  const ts = formatSpokenClockTime(t);
  return {
    id: c.card_id,
    slotIndex: i,
    role: "target",
    state,
    hitShape: "square",
    x: s.x,
    y: s.y,
    w: Math.max(s.hitW ?? s.w, s.w),
    h: Math.max(s.hitH ?? s.h, s.h),
    ...al,
    label: formatClockTime(t),
    spokenLabel: al.spokenLabel ? `${al.spokenLabel}, ${ts}` : ts,
  };
}

function buildReadEntity(
  o: Opt,
  i: number,
  s: Slot,
  selIdx: number | null
): ViewEntity {
  let state: EntityVisual = "idle";
  if (selIdx === i) {
    state = o.is_correct ? "correct" : "incorrect";
  }
  const t: ClockTime = { hour: o.hour, minute: o.minute };
  return {
    id: `opt-${i}`,
    slotIndex: i,
    role: "source",
    state,
    hitShape: "square",
    x: s.x,
    y: s.y,
    w: Math.max(s.hitW ?? s.w, s.w),
    h: Math.max(s.hitH ?? s.h, s.h),
    label: formatClockTime(t),
    spokenLabel: formatSpokenClockTime(t),
  };
}

function buildClockFaceEntity(v: GT016ViewInput): ViewEntity {
  const isSet = v.content.mode === "set";
  const fb = computeGT016SessionFaceBox(v);
  return {
    id: "clock-face",
    slotIndex: isSet ? 0 : -1,
    role: "neutral",
    state: "idle",
    hitShape: "circle",
    x: Math.round(fb.x + fb.w / 2),
    y: Math.round(fb.y + fb.h / 2),
    w: Math.round(fb.w),
    h: Math.round(fb.h),
    label: formatClockTime(v.currentTime),
    spokenLabel: formatSpokenClockTime(v.currentTime),
  };
}

function buildTargetTimeEntity(v: GT016ViewInput): ViewEntity {
  const b = computeGT016TargetBadgeBox(
    v.stageRect ?? { x: 0, y: 0, ...v.logicSpace }
  );
  const tgt = v.content.target_time;
  return {
    id: "target-time",
    slotIndex: -1,
    role: "neutral",
    state: "idle",
    hitShape: "square",
    x: Math.round(b.x + b.w / 2),
    y: Math.round(b.y + b.h / 2),
    w: b.w,
    h: b.h,
    label: formatClockTime(tgt),
    spokenLabel: `Mục tiêu ${formatSpokenClockTime(tgt)}`,
  };
}

export function buildGT016View(v: GT016ViewInput): EngineView {
  const entities: ViewEntity[] = [buildClockFaceEntity(v)];
  if (v.content.mode === "set") {
    entities.push(buildTargetTimeEntity(v));
    return { activePrompt: v.content.prompt, entities };
  }
  if (v.content.mode === "match") {
    for (let i = 0; i < v.activityCards.length; i += 1) {
      const c = v.activityCards[i];
      const s = v.slots[i];
      if (c && s) {
        entities.push(buildMatchEntity(c, i, s, v));
      }
    }
    return { activePrompt: v.content.prompt, entities };
  }
  for (let i = 0; i < v.options.length; i += 1) {
    const o = v.options[i];
    const s = v.slots[i];
    if (o && s) {
      entities.push(buildReadEntity(o, i, s, v.selectedOptionIndex));
    }
  }
  return { activePrompt: v.content.prompt, entities };
}

function renderMatchChoices(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  v: GT016ViewInput,
  hIds: ReadonlySet<string> | null,
  hSlot: number | null,
  wrongProg: number
): void {
  v.activityCards.forEach((c, i) => {
    const s = v.slots[i];
    if (!s) {
      return;
    }
    const cardTime: ClockTime = { hour: c.hour, minute: c.minute };
    const ok =
      v.matchedCardIds.has(c.card_id) ||
      (v.roundClosedOnWrong && isSameTime(v.currentTime, cardTime));
    const bad =
      v.anim.wrongCardId === c.card_id && v.anim.wrongChoiceTimerMs > 0;
    let st: "idle" | "correct" | "wrong" = "idle";
    if (ok) {
      st = "correct";
    } else if (bad) {
      st = "wrong";
    }
    drawSlotItem(ctx, rs, s, {
      id: c.card_id,
      asset: c.asset,
      label: formatClockTime(cardTime),
      state: st,
    });
    drawGT016ChoiceDecor(ctx, s, {
      isHovered: v.anim.hoveredSlotIndex === i,
      isHinted: Boolean(hIds?.has(c.card_id)) || hSlot === i,
      status: st,
    });
    if (st === "wrong") {
      rs.drawRetryRing(ctx, s.x, s.y, Math.min(s.w, s.h) * 0.44, wrongProg);
    }
  });
}

function renderReadChoices(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  v: GT016ViewInput,
  hIds: ReadonlySet<string> | null,
  hSlot: number | null,
  wrongProg: number
): void {
  v.options.forEach((o, i) => {
    const s = v.slots[i];
    if (!s) {
      return;
    }
    let st: "idle" | "correct" | "wrong" = "idle";
    if (v.selectedOptionIndex === i) {
      st = o.is_correct ? "correct" : "wrong";
    } else if (v.roundClosedOnWrong && o.is_correct) {
      st = "correct";
    }
    const text = formatClockTime({ hour: o.hour, minute: o.minute });
    drawSlotItem(ctx, rs, s, { id: `opt-${i}`, text, state: st });
    drawGT016ChoiceDecor(ctx, s, {
      isHovered: v.anim.hoveredSlotIndex === i,
      isHinted: Boolean(hIds?.has(`opt-${i}`)) || hSlot === i,
      status: st,
    });
    if (st === "wrong") {
      rs.drawRetryRing(ctx, s.x, s.y, Math.min(s.w, s.h) * 0.44, wrongProg);
    }
  });
}

function computeHintArc(
  cur: ClockTime,
  tgt: ClockTime
): { readonly d0: number; readonly d1: number } | null {
  if (isSameTime(cur, tgt)) {
    return null;
  }
  const cAng = timeToAngles(cur);
  const tAng = timeToAngles(tgt);
  const isH = cur.hour !== tgt.hour;
  const d0 = isH ? cAng.hourAngleDeg : cAng.minuteAngleDeg;
  const d1 = isH ? tAng.hourAngleDeg : tAng.minuteAngleDeg;
  return { d0, d1 };
}

function renderOverlay(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  sb: SceneBox,
  v: GT016ViewInput,
  wp: number
): void {
  if (v.content.mode === "set") {
    drawGT016TargetBadge(ctx, rs, computeGT016TargetBadgeBox(sb), {
      txt: formatClockTime(v.content.target_time),
      wp,
    });
    return;
  }
  const baseIdx = resolveGT016HintTargetIndex(v);
  const baseHt: HintTarget | null =
    baseIdx === null ? null : { kind: "slot", index: baseIdx };
  const ht =
    v.activeHintLevel === 2 || v.activeHintLevel === 3
      ? resolveGT016HintLevelTarget(v.activeHintLevel, v, baseHt)
      : null;
  const hIds = ht?.kind === "region" ? new Set(ht.ids) : null;
  const hSlot = ht?.kind === "slot" ? ht.index : null;
  const cwp =
    v.anim.wrongChoiceTimerMs > 0
      ? 1 - v.anim.wrongChoiceTimerMs / GT016_WRONG_MS
      : 0;
  if (v.content.mode === "match") {
    renderMatchChoices(ctx, rs, v, hIds, hSlot, cwp);
  } else {
    renderReadChoices(ctx, rs, v, hIds, hSlot, cwp);
  }
}

export function renderGT016StageContent(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  sb: SceneBox,
  v: GT016ViewInput
): void {
  const tod = v.content.time_of_day;
  if (tod && v.content.mode === "set") {
    drawTimeOfDaySky(ctx, sb, tod, rs.reducedMotion ? 1 : v.skyProgress);
  }
  const wp =
    v.anim.wrongClockTimerMs > 0
      ? 1 - v.anim.wrongClockTimerMs / GT016_WRONG_MS
      : 0;
  const tp =
    v.anim.tickPulseMs > 0 ? 1 - v.anim.tickPulseMs / GT016_TICK_MS : 0;
  const cp =
    v.anim.celebrateMs > 0 ? 1 - v.anim.celebrateMs / GT016_CELEB_MS : 0;
  const tgt = v.content.target_time;
  drawGT016ClockStage(ctx, rs, {
    stageBox: sb,
    faceBox: computeGT016SessionFaceBox(v),
    angles: rs.reducedMotion
      ? timeToAngles(v.currentTime)
      : v.anim.displayAngles,
    targetAngles: timeToAngles(tgt),
    targetTime: tgt,
    hintArc: computeHintArc(v.currentTime, tgt),
    minuteStep: v.difficulty.minute_step,
    hintLevel: v.activeHintLevel,
    isSetMode: v.content.mode === "set",
    showTargetGhostHands: v.roundClosedOnWrong,
    isWon: v.isWon,
    wrongClockProgress: wp,
    tickPulseProgress: tp,
    celebrateProgress: cp,
    disableShadows: v.degradation?.soft_shadows_enabled === false,
    disableParticles: v.degradation?.particles_enabled === false,
  });
  renderOverlay(ctx, rs, sb, v, wp);
  drawMontessoriControlOfErrorPill(
    ctx,
    sb,
    v.exploreTracker,
    rs.viewport?.scale
  );
}

function resolveMatchGesture(
  g: Gesture,
  v: GT016ViewInput,
  faceBox: SceneBox
): GameAction | null {
  if (g.type === "tap") {
    const idx = findGT016HitSlotIndex(
      v.slots,
      v.activityCards.length,
      g.x,
      g.y
    );
    const card = idx >= 0 ? v.activityCards[idx] : undefined;
    if (card) {
      return { type: "match_card", data: card.card_id };
    }
  }
  if (g.type === "adjust") {
    return { type: "adjust_time", data: { delta: g.delta } };
  }
  return resolveClockGestureTime({
    gesture: g,
    faceBox,
    currentTime: v.currentTime,
    minuteStep: v.difficulty.minute_step,
  });
}

export function resolveGT016ToAction(
  g: Gesture,
  v: GT016ViewInput
): GameAction | null {
  const faceBox = computeGT016SessionFaceBox(v);
  const mode = v.content.mode;
  if (mode === "read") {
    if (g.type !== "tap") {
      return null;
    }
    const idx = findGT016HitSlotIndex(v.slots, v.options.length, g.x, g.y);
    return idx >= 0 ? { type: "select_option", data: idx } : null;
  }
  if (mode === "match") {
    return resolveMatchGesture(g, v, faceBox);
  }
  if (g.type === "adjust") {
    return { type: "adjust_time", data: { delta: g.delta } };
  }
  if (g.type === "commit") {
    return { type: "submit_time", data: null };
  }
  const sb = v.stageRect ?? { x: 0, y: 0, ...v.logicSpace };
  return resolveClockGestureTime({
    gesture: g,
    faceBox,
    targetBadgeBox: computeGT016TargetBadgeBox(sb),
    currentTime: v.currentTime,
    minuteStep: v.difficulty.minute_step,
  });
}

function validateMatchCardAction(
  data: GameAction["data"],
  activityCards: C["activity_cards"],
  currentTime: ClockTime
): ActionResult {
  if (typeof data !== "string") {
    return ACTION_RETRY;
  }
  const c = activityCards.find((x) => x.card_id === data);
  if (!c) {
    return ACTION_IGNORED;
  }
  return isSameTime(currentTime, { hour: c.hour, minute: c.minute })
    ? ACTION_CORRECT
    : ACTION_RETRY;
}

export function validateGT016Action(
  action: GameAction,
  v: GT016ViewInput
): ActionResult {
  if (action.type === "adjust_time" || action.type === "set_clock_time") {
    return ACTION_CORRECT;
  }
  if (action.type === "select_option") {
    return typeof action.data === "number" && v.options[action.data]?.is_correct
      ? ACTION_CORRECT
      : ACTION_RETRY;
  }
  if (action.type === "match_card") {
    return validateMatchCardAction(action.data, v.activityCards, v.currentTime);
  }
  if (action.type === "submit_time") {
    return isSameTime(v.currentTime, v.content.target_time)
      ? ACTION_CORRECT
      : ACTION_RETRY;
  }
  return ACTION_IGNORED;
}

export function checkGT016Win(v: GT016ViewInput): boolean {
  if (v.roundClosedOnWrong) {
    return false;
  }
  if (v.content.mode === "read") {
    return (
      v.selectedOptionIndex !== null &&
      v.options[v.selectedOptionIndex]?.is_correct === true
    );
  }
  if (v.content.mode === "set") {
    return (
      v.hasSubmittedTime && isSameTime(v.currentTime, v.content.target_time)
    );
  }
  const okCards = v.activityCards.filter((c) =>
    isSameTime(v.currentTime, { hour: c.hour, minute: c.minute })
  );
  return (
    okCards.length > 0 && okCards.every((c) => v.matchedCardIds.has(c.card_id))
  );
}

export function resolveGT016HintTargetIndex(v: GT016ViewInput): number | null {
  if (v.content.mode === "read") {
    const idx = v.options.findIndex((o) => o.is_correct);
    return idx >= 0 ? idx : null;
  }
  if (v.content.mode === "match") {
    const idx = v.activityCards.findIndex((c) =>
      isSameTime(v.currentTime, { hour: c.hour, minute: c.minute })
    );
    return idx >= 0 ? idx : null;
  }
  return isSameTime(v.currentTime, v.content.target_time) ? null : 0;
}

export function resolveGT016BaseHintTarget(
  v: GT016ViewInput,
  fallback: HintTarget | null
): HintTarget | null {
  if (v.content.mode === "set") {
    return isSameTime(v.currentTime, v.content.target_time)
      ? { kind: "action" }
      : { kind: "slot", index: 0 };
  }
  return fallback;
}

export function resolveGT016HintDestPoint(
  v: GT016ViewInput
): GT016Point | null {
  return computeGT016HintDestinationPoint(
    computeGT016SessionFaceBox(v),
    v.currentTime,
    v.content.target_time
  );
}

export function resolveGT016HintLevelTarget(
  level: HintLevel,
  v: GT016ViewInput,
  hintTarget: HintTarget | null
): HintTarget | null {
  return resolveGT016HintTargetForLevel({
    mode: v.content.mode,
    level,
    currentTime: v.currentTime,
    targetTime: v.content.target_time,
    options: v.options,
    activityCards: v.activityCards,
    hintTarget,
  });
}

export function extractAdjustDelta(data: GameAction["data"]): number {
  return typeof data === "object" && data !== null && "delta" in data
    ? Number(Reflect.get(data, "delta"))
    : 0;
}
