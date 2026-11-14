import type { AgeBand } from "#src/contracts/types";
import type {
  GameActionValue,
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/game-session";
import type { EngineView, EntityVisual, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import type { LogicSpace } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize, splitCaption } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { CARD_FLIP_MS } from "#src/render/flashcard";
import type {
  GT027ItemCardParams,
  GT027RuleBannerParams,
} from "#src/render/gt-027-shapes";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import type { GT027Content } from "./template.js";

export type GT027Item = GT027Content["items"][number];
export type GT027RuleConfig = GT027Content["rules"][number];
type Pred = (item: GT027Item) => boolean;
type StateFn = (itemId: string) => string;

function isItemPayload(
  v: GameActionValue
): v is { readonly item_id?: string; readonly id?: string } {
  return typeof v === "object" && v !== null;
}

export function extractGT027ItemId(data: GameActionValue): string | undefined {
  if (!isItemPayload(data)) {
    return undefined;
  }
  if (typeof data.item_id === "string") {
    return data.item_id;
  }
  return typeof data.id === "string" ? data.id : undefined;
}

export function resolveGT027CardVisualState(
  isCorrect: boolean,
  isWrong: boolean,
  isHovered: boolean
): "idle" | "hovered" | "correct" | "wrong" {
  if (isCorrect) {
    return "correct";
  }
  if (isWrong) {
    return "wrong";
  }
  return isHovered ? "hovered" : "idle";
}

export function matchesGT027RuleConfig(
  rule: GT027RuleConfig,
  item: {
    readonly color: string;
    readonly shape: string;
    readonly size?: string;
  }
): boolean {
  if (rule.dimension === "color") {
    return item.color === rule.target_value;
  }
  if (rule.dimension === "shape") {
    return item.shape === rule.target_value;
  }
  return rule.dimension === "size" && item.size === rule.target_value;
}

const CORRECT_PULSE_MS = 420;

export interface DualStamp {
  readonly logicStartMs: number;
  renderStartMs: number | null;
}

export interface GT027ClockState {
  logicMs: number;
  lastRenderMs: number | null;
  readonly wrongStamps: Map<string, DualStamp>;
  bannerWrongStamp: DualStamp | null;
  readonly correctStamps: Map<string, DualStamp>;
  ruleFaceText: string | undefined;
  previousRuleFaceText: string;
  ruleFlipStamp: DualStamp | null;
}

const CLOCKS = new WeakMap<object, GT027ClockState>();

export function getGT027Clock(host: object): GT027ClockState {
  let state = CLOCKS.get(host);
  if (!state) {
    state = {
      logicMs: 0,
      lastRenderMs: null,
      wrongStamps: new Map<string, DualStamp>(),
      bannerWrongStamp: null,
      correctStamps: new Map<string, DualStamp>(),
      ruleFaceText: undefined,
      previousRuleFaceText: "",
      ruleFlipStamp: null,
    };
    CLOCKS.set(host, state);
  }
  return state;
}

export function resetGT027Clock(host: object): void {
  CLOCKS.delete(host);
}

function makeDualStamp(clock: GT027ClockState): DualStamp {
  return { logicStartMs: clock.logicMs, renderStartMs: null };
}

export function elapsedDualMs(
  stamp: DualStamp,
  clock: GT027ClockState
): number {
  const logicDelta = Math.max(0, clock.logicMs - stamp.logicStartMs);
  const renderDelta =
    stamp.renderStartMs !== null && clock.lastRenderMs !== null
      ? Math.max(0, clock.lastRenderMs - stamp.renderStartMs)
      : 0;
  return Math.max(logicDelta, renderDelta);
}

export function triggerGT027WrongFlash(host: object, itemId: string): void {
  const clock = getGT027Clock(host);
  clock.wrongStamps.set(itemId, makeDualStamp(clock));
  clock.bannerWrongStamp = makeDualStamp(clock);
}

export function clearGT027WrongFlashForItem(host: object, id: string): void {
  getGT027Clock(host).wrongStamps.delete(id);
}

export function triggerGT027CorrectPulse(host: object, itemId: string): void {
  const clock = getGT027Clock(host);
  clock.correctStamps.set(itemId, makeDualStamp(clock));
}

export function clearGT027ItemStampsOnSwitch(host: object): void {
  const clock = getGT027Clock(host);
  clock.wrongStamps.clear();
  clock.bannerWrongStamp = null;
  clock.correctStamps.clear();
}

function stampProgress(
  stamp: DualStamp | undefined | null,
  clock: GT027ClockState,
  durMs: number
): number {
  if (!stamp) {
    return 0;
  }
  const el = elapsedDualMs(stamp, clock);
  return el < durMs ? Math.max(0, 1 - el / durMs) : 0;
}

export function isGT027ItemWrongFlashing(host: object, id: string): boolean {
  const c = getGT027Clock(host);
  return stampProgress(c.wrongStamps.get(id), c, WRONG_FLASH_MS) > 0;
}

export function getGT027ItemWrongIntensity(host: object, id: string): number {
  const c = getGT027Clock(host);
  return stampProgress(c.wrongStamps.get(id), c, WRONG_FLASH_MS);
}

export function getGT027ItemCorrectPulse(host: object, id: string): number {
  const c = getGT027Clock(host);
  return stampProgress(c.correctStamps.get(id), c, CORRECT_PULSE_MS);
}

export function isGT027BannerWrongFlashing(host: object): boolean {
  const c = getGT027Clock(host);
  return stampProgress(c.bannerWrongStamp, c, WRONG_FLASH_MS) > 0;
}

export function tickGT027Clock(
  host: object,
  deltaMs: number,
  onExpireWrongItem: (itemId: string) => void
): void {
  const clock = getGT027Clock(host);
  clock.logicMs += Math.max(0, deltaMs);
  for (const [id, stamp] of [...clock.wrongStamps.entries()]) {
    if (elapsedDualMs(stamp, clock) >= WRONG_FLASH_MS) {
      clock.wrongStamps.delete(id);
      onExpireWrongItem(id);
    }
  }
  const bs = clock.bannerWrongStamp;
  if (bs && elapsedDualMs(bs, clock) >= WRONG_FLASH_MS) {
    clock.bannerWrongStamp = null;
  }
  for (const [id, stamp] of [...clock.correctStamps.entries()]) {
    if (elapsedDualMs(stamp, clock) >= CORRECT_PULSE_MS) {
      clock.correctStamps.delete(id);
    }
  }
}

export interface GT027BannerRenderClockSnapshot {
  readonly flipElapsedMs: number | null;
  readonly previousText: string;
  readonly bannerWrongIntensity: number;
}

function anchor(s: DualStamp | null, t: number, rewound: boolean): void {
  if (s && (s.renderStartMs === null || rewound)) {
    s.renderStartMs = t;
  }
}

export function observeGT027RenderClock(
  host: object,
  timeMs: number,
  currentBannerText: string
): GT027BannerRenderClockSnapshot {
  const clock = getGT027Clock(host);
  const rewound = clock.lastRenderMs !== null && timeMs < clock.lastRenderMs;
  for (const stamp of clock.wrongStamps.values()) {
    anchor(stamp, timeMs, rewound);
  }
  for (const stamp of clock.correctStamps.values()) {
    anchor(stamp, timeMs, rewound);
  }
  anchor(clock.bannerWrongStamp, timeMs, rewound);
  anchor(clock.ruleFlipStamp, timeMs, rewound);
  clock.lastRenderMs = timeMs;

  if (
    clock.ruleFaceText !== undefined &&
    clock.ruleFaceText !== currentBannerText
  ) {
    clock.previousRuleFaceText = clock.ruleFaceText;
    clock.ruleFlipStamp = {
      logicStartMs: clock.logicMs,
      renderStartMs: timeMs,
    };
  }
  clock.ruleFaceText = currentBannerText;

  let flipElapsedMs: number | null = null;
  if (clock.ruleFlipStamp) {
    const elapsed = elapsedDualMs(clock.ruleFlipStamp, clock);
    if (elapsed >= 0 && elapsed < CARD_FLIP_MS) {
      flipElapsedMs = elapsed;
    } else {
      clock.ruleFlipStamp = null;
    }
  }
  const bwInt = stampProgress(clock.bannerWrongStamp, clock, WRONG_FLASH_MS);
  if (bwInt === 0) {
    clock.bannerWrongStamp = null;
  }
  return {
    flipElapsedMs,
    previousText: clock.previousRuleFaceText,
    bannerWrongIntensity: bwInt,
  };
}

export function resolveRoundItems(
  items: readonly GT027Item[],
  roundGeneration: number,
  layoutSeed: number
): readonly GT027Item[] {
  if (roundGeneration === 0 || layoutSeed === 0 || items.length < 2) {
    return [...items];
  }
  const rng = deriveStream(layoutSeed + roundGeneration * 997, "items");
  const shuffled = shuffle([...items], rng);
  const sameOrder = shuffled.every((it, idx) => it.id === items[idx]?.id);
  const first = shuffled[0];
  return sameOrder && first ? [...shuffled.slice(1), first] : shuffled;
}

export function computeGT027Slots(
  stageRect: ZoneRect | undefined,
  logicSpace: LogicSpace,
  itemCount: number,
  ageBand: AgeBand,
  cssPerLogic: number | undefined
): readonly Slot[] {
  const layoutFn = resolveLayout("grid");
  const bodyRect = stageRect ? splitCaption(stageRect).body : undefined;
  const raw = layoutFn({
    slotCount: itemCount,
    ageBand,
    logic: logicSpace,
    stage: bodyRect,
    cssPerLogic,
  });
  return insetDrawSize(raw, bodyRect ?? stageRect);
}

const COLOR_VI: Readonly<Record<string, string>> = {
  red: "màu đỏ",
  blue: "màu xanh biển",
  yellow: "màu vàng",
  green: "màu xanh lá",
  orange: "màu cam",
  purple: "màu tím",
  pink: "màu hồng",
};
const SHAPE_VI: Readonly<Record<string, string>> = {
  circle: "hình tròn",
  square: "hình vuông",
  star: "hình ngôi sao",
  triangle: "hình tam giác",
  diamond: "hình thoi",
};

function describeItemVi(item: GT027Item): string {
  const shapeVi = SHAPE_VI[item.shape.toLowerCase()] ?? "hình";
  const colorVi = COLOR_VI[item.color.toLowerCase()] ?? "";
  return colorVi ? `${shapeVi} ${colorVi}` : shapeVi;
}

export function buildGT027View(
  host: object,
  slots: readonly Slot[],
  items: readonly GT027Item[],
  prompt: string,
  hoveredIndex: number | null,
  getRenderState: StateFn
): EngineView {
  const entities: ViewEntity[] = [];
  for (let i = 0; i < items.length; i++) {
    const [item, slot] = [items[i], slots[i]];
    if (!(item && slot)) {
      continue;
    }
    const isOk = getRenderState(item.id) === "correct";
    const isErr = isGT027ItemWrongFlashing(host, item.id);
    let state: EntityVisual = "idle";
    if (isOk) {
      state = "correct";
    } else if (isErr) {
      state = "incorrect";
    } else if (hoveredIndex === i) {
      state = "active";
    }
    const baseLabels = resolveAssetLabels(item.asset);
    const spokenLabel = baseLabels.spokenLabel ?? describeItemVi(item);
    entities.push({
      id: item.id,
      slotIndex: slot.index,
      role: "source",
      state,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitW: slot.hitW,
      hitH: slot.hitH,
      hitShape: "square",
      ...baseLabels,
      spokenLabel,
    });
  }
  return { activePrompt: prompt, entities };
}

export function resolveGT027UnselectedValidIndices(
  items: readonly GT027Item[],
  isValid: Pred,
  getRenderState: StateFn
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item && getRenderState(item.id) !== "correct" && isValid(item)) {
      indices.push(i);
    }
  }
  return indices;
}

export function resolveGT027HintTargetIndex(
  items: readonly GT027Item[],
  isValid: Pred,
  getRenderState: StateFn,
  isInputOpen: boolean
): number | null {
  if (!isInputOpen) {
    return null;
  }
  const unsel = resolveGT027UnselectedValidIndices(
    items,
    isValid,
    getRenderState
  );
  if (unsel.length > 0 && unsel[0] !== undefined) {
    return unsel[0];
  }
  const anyIdx = items.findIndex((it) => isValid(it));
  return anyIdx >= 0 ? anyIdx : null;
}

export function resolveGT027HintTarget(
  level: HintLevel,
  items: readonly GT027Item[],
  ruleConfig: GT027RuleConfig | undefined,
  isValid: Pred,
  getRenderState: StateFn,
  isInputOpen: boolean
): HintTarget | null {
  const idx = resolveGT027HintTargetIndex(
    items,
    isValid,
    getRenderState,
    isInputOpen
  );
  if (idx === null || !ruleConfig) {
    return null;
  }
  if (level === 1) {
    return { kind: "region", ids: [`rule-banner:${ruleConfig.id}`] };
  }
  if (level === 2) {
    const sample = items[idx];
    if (!sample) {
      return null;
    }
    const attr = `rule-attr:${ruleConfig.dimension}:${ruleConfig.target_value}`;
    return { kind: "region", ids: [attr, sample.id] };
  }
  return { kind: "slot", index: idx };
}

export function resolveGT027DemoSequence(
  level: HintLevel,
  items: readonly GT027Item[],
  isValid: Pred,
  getRenderState: StateFn,
  isInputOpen: boolean,
  remainingInRule: number
): readonly HintDemoStep[] | null {
  if (level !== 3 || !isInputOpen || remainingInRule < 2) {
    return null;
  }
  const unsel = resolveGT027UnselectedValidIndices(
    items,
    isValid,
    getRenderState
  );
  if (unsel.length < 2) {
    return null;
  }
  return unsel.slice(0, remainingInRule).map((from) => ({ from }));
}

export interface GT027RenderFrameInput {
  readonly host: object;
  readonly stageRect: ZoneRect | undefined;
  readonly captionRect: ZoneRect | undefined;
  readonly slots: readonly Slot[];
  readonly items: readonly GT027Item[];
  readonly bannerText: string;
  readonly ruleConfig: GT027RuleConfig | undefined;
  readonly isSignaling: boolean;
  readonly signalProgress: number;
  readonly completedSteps: number;
  readonly switchAfterTrials: number;
  readonly isClosedOnMiss: boolean;
  readonly hintLevel: 0 | HintLevel;
  readonly hintIdx: number | null;
  readonly hoveredIndex: number | null;
  readonly particlesEnabled: boolean;
  readonly softShadowsEnabled: boolean;
  readonly timeMs: number;
  readonly isValid: Pred;
  readonly getRenderState: StateFn;
}

export function buildGT027RenderFrame(input: GT027RenderFrameInput): {
  readonly banner: GT027RuleBannerParams;
  readonly cards: readonly GT027ItemCardParams[];
} {
  const { host, stageRect, slots, items, bannerText, ruleConfig, timeMs } =
    input;
  const snap = observeGT027RenderClock(host, timeMs, bannerText);
  const banner: GT027RuleBannerParams = {
    captionRect: input.captionRect,
    stageRect,
    currentText: bannerText,
    previousText: snap.previousText,
    flipElapsedMs: snap.flipElapsedMs,
    criterion: ruleConfig?.dimension ?? "color",
    targetValue: ruleConfig?.target_value ?? "red",
    isSignaling: input.isSignaling,
    signalProgress: input.signalProgress,
    completedSteps: input.completedSteps,
    switchAfterTrials: input.switchAfterTrials,
    wrongFlashIntensity: input.isClosedOnMiss ? 1 : snap.bannerWrongIntensity,
    hintLevel: input.hintLevel,
    softShadowsEnabled: input.softShadowsEnabled,
    timeMs,
  };
  const cards: GT027ItemCardParams[] = [];
  for (let i = 0; i < items.length; i++) {
    const [item, slot] = [items[i], slots[i]];
    if (!(item && slot)) {
      continue;
    }
    const isOk = input.getRenderState(item.id) === "correct";
    const isErr = isGT027ItemWrongFlashing(host, item.id);
    const state = resolveGT027CardVisualState(
      isOk,
      isErr,
      input.hoveredIndex === i
    );
    cards.push({
      slot,
      stageRect,
      itemId: item.id,
      asset: item.asset,
      color: item.color,
      shape: item.shape,
      size: item.size,
      state,
      wrongIntensity: getGT027ItemWrongIntensity(host, item.id),
      correctPulseProgress: getGT027ItemCorrectPulse(host, item.id),
      revealCorrect: input.isClosedOnMiss && input.isValid(item),
      isSignaling: input.isSignaling,
      hintLevel: input.hintLevel,
      isHintSample: input.hintLevel === 2 && input.hintIdx === i,
      isHintTarget: input.hintLevel === 3 && input.hintIdx === i,
      timeMs,
      particlesEnabled: input.particlesEnabled,
      softShadowsEnabled: input.softShadowsEnabled,
    });
  }
  return { banner, cards };
}
