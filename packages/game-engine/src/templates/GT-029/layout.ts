import type {
  GameAction,
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/game-session";
import type { EngineView, EntityVisual, ViewEntity } from "#src/interaction";
import {
  resolveAssetLabels,
  resolveAssetSpeech,
} from "#src/labels/spoken-keyword";
import { dockRectAroundSlots, splitCaption } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawGT029GroupTray,
  drawGT029ItemOverlay,
  drawGT029ItemUnderlay,
  drawGT029OptionOverlay,
  drawGT029OptionUnderlay,
  drawGT029ScaffoldOverlay,
  type GT029ScaffoldOverlayParams,
  type GT029VisualState,
} from "#src/render/gt-029-shapes";
import {
  catMouthOpen,
  drawCat,
  drawProgressDots,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  groupSlidePose,
  type ItemVisualState,
} from "#src/render/index";
import { deriveDerangement } from "#src/rng/derangement";
import { deriveStream } from "#src/rng/mulberry32";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT029Content, GT029Difficulty } from "./template.js";
import { computeGroupTrayBounds } from "./zone-layout.js";

export const WRONG_FLASH_DURATION_MS = 500;

export interface DualStamp {
  readonly logicMs: number;
  renderMs: number | null;
}

export interface GT029ClockState {
  activeHintLevel: HintLevel | 0;
  closeStamp: DualStamp | null;
  hoveredId: string | null;
  readonly itemCellTo: Map<string, number>;
  readonly itemSlideFrom: Map<
    string,
    { readonly x: number; readonly y: number }
  >;
  lastBiteStamp: DualStamp | null;
  lastRenderMs: number | null;
  logicMs: number;
  particles: Particle[];
  slideStartStamp: DualStamp | null;
  winStamp: DualStamp | null;
  wrongItemId: string | null;
  wrongItemStamp: DualStamp | null;
  wrongOptionStamp: DualStamp | null;
}

const CLOCK_MAP = new WeakMap<object, GT029ClockState>();

function createClockState(): GT029ClockState {
  return {
    activeHintLevel: 0,
    closeStamp: null,
    hoveredId: null,
    itemCellTo: new Map(),
    itemSlideFrom: new Map(),
    lastBiteStamp: null,
    lastRenderMs: null,
    logicMs: 0,
    particles: [],
    slideStartStamp: null,
    winStamp: null,
    wrongItemId: null,
    wrongItemStamp: null,
    wrongOptionStamp: null,
  };
}

export function getGT029Clock(host: object): GT029ClockState {
  let state = CLOCK_MAP.get(host);
  if (!state) {
    state = createClockState();
    CLOCK_MAP.set(host, state);
  }
  return state;
}

export function resetGT029Clock(host: object): GT029ClockState {
  const fresh = createClockState();
  CLOCK_MAP.set(host, fresh);
  return fresh;
}

export function makeStamp(clock: GT029ClockState): DualStamp {
  return { logicMs: clock.logicMs, renderMs: clock.lastRenderMs };
}

export function elapsedSince(
  stamp: DualStamp | null,
  clock: GT029ClockState,
  timeMs?: number
): number {
  if (!stamp) {
    return Number.POSITIVE_INFINITY;
  }
  const logicDelta = Math.max(0, clock.logicMs - stamp.logicMs);
  if (timeMs === undefined || !Number.isFinite(timeMs)) {
    return logicDelta;
  }
  if (stamp.renderMs === null) {
    stamp.renderMs = timeMs;
  }
  const renderDelta = Math.max(0, timeMs - stamp.renderMs);
  return Math.max(logicDelta, renderDelta);
}

export interface GT029ActionPayload {
  readonly id?: string;
  readonly item_id?: string;
  readonly option_id?: string;
  readonly value?: number;
}

export function narrowActionPayload(action: GameAction): GT029ActionPayload {
  const raw = action.data;
  if (typeof raw !== "object" || raw === null) {
    return {};
  }
  const itemId = Reflect.get(raw, "item_id");
  const id = Reflect.get(raw, "id");
  const optionId = Reflect.get(raw, "option_id");
  const value = Reflect.get(raw, "value");
  return {
    item_id: typeof itemId === "string" ? itemId : undefined,
    id: typeof id === "string" ? id : undefined,
    option_id: typeof optionId === "string" ? optionId : undefined,
    value: typeof value === "number" ? value : undefined,
  };
}

export function resolveDisplayItems(
  content: GT029Content,
  difficulty: GT029Difficulty,
  layoutSeed: number,
  roundGeneration: number
): GT029Content["initial_items"] {
  const base = content.initial_items;
  if (difficulty.shuffle_items !== true || base.length <= 1) {
    return base;
  }
  const seedForRound =
    roundGeneration > 0 ? layoutSeed + roundGeneration * 7919 : layoutSeed;
  return deriveDerangement(base, deriveStream(seedForRound, "items"));
}

export function resolveDisplayOptions(
  content: GT029Content,
  layoutSeed: number,
  roundGeneration: number
): GT029Content["answer_options"] {
  const base = content.answer_options;
  if (roundGeneration <= 0 || layoutSeed <= 0 || base.length <= 1) {
    return base;
  }
  const seedForRound = layoutSeed + roundGeneration * 7919;
  return deriveDerangement(base, deriveStream(seedForRound, "distractors"));
}

export interface GT029LayoutHost {
  readonly content: GT029Content;
  readonly degradation: DegradationState | null;
  readonly removedItemIds: ReadonlySet<string>;
  readonly selectedOptionId: string | null;
  readonly slots: readonly Slot[];
  readonly stageRect?: ZoneRect;
  readonly themeId?: string;
  checkWinCondition(): boolean;
  getDisplayItems(): GT029Content["initial_items"];
  getDisplayOptions(): GT029Content["answer_options"];
  getRemovedDockRects(): ZoneRect[];
  isRoundClosedOnWrong(): boolean;
  itemCellIndex(itemIndex: number): number;
  itemSlotFor(itemIndex: number): Slot | undefined;
}

function buildItemEntities(host: GT029LayoutHost): ViewEntity[] {
  const items = host.getDisplayItems();
  const entities: ViewEntity[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const slot = host.itemSlotFor(i);
    if (!(it && slot)) {
      continue;
    }
    const isRemoved = host.removedItemIds.has(it.item_id);
    entities.push({
      id: it.item_id,
      slotIndex: slot.index,
      role: "source",
      state: isRemoved ? "selected" : "idle",
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      ...resolveAssetSpeech(it.asset),
    });
  }
  return entities;
}

function buildOptionEntities(host: GT029LayoutHost): ViewEntity[] {
  if (host.removedItemIds.size < host.content.remove_count) {
    return [];
  }
  const items = host.getDisplayItems();
  const options = host.getDisplayOptions();
  const entities: ViewEntity[] = [];
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const slot = host.slots[items.length + i];
    if (!(opt && slot)) {
      continue;
    }
    const isSelected = host.selectedOptionId === opt.option_id;
    let state: EntityVisual = "idle";
    if (isSelected) {
      state = opt.is_correct ? "correct" : "incorrect";
    }
    entities.push({
      id: opt.option_id,
      slotIndex: slot.index,
      role: "target",
      state,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitShape: "square",
      ...resolveAssetLabels({ kind: "text", text: String(opt.value) }),
    });
  }
  return entities;
}

export function buildGT029View(host: GT029LayoutHost): EngineView {
  return {
    activePrompt: host.content.prompt,
    entities: [...buildItemEntities(host), ...buildOptionEntities(host)],
  };
}

export function resolveGT029HintTargetIndex(
  host: GT029LayoutHost
): number | null {
  if (host.checkWinCondition() || host.isRoundClosedOnWrong()) {
    return null;
  }
  const items = host.getDisplayItems();
  const options = host.getDisplayOptions();
  if (host.removedItemIds.size < host.content.remove_count) {
    const unremovedIdx = items.findIndex(
      (it) => !host.removedItemIds.has(it.item_id)
    );
    return unremovedIdx >= 0 ? host.itemCellIndex(unremovedIdx) : null;
  }
  const correctOptIdx = options.findIndex((opt) => opt.is_correct);
  return correctOptIdx >= 0 ? items.length + correctOptIdx : null;
}

function unremovedItemIds(host: GT029LayoutHost): string[] {
  return host
    .getDisplayItems()
    .filter((it) => !host.removedItemIds.has(it.item_id))
    .map((it) => it.item_id);
}

export function resolveGT029HintTargetForLevel(
  host: GT029LayoutHost,
  level: HintLevel
): HintTarget | null {
  if (host.checkWinCondition() || host.isRoundClosedOnWrong()) {
    return null;
  }
  const needed = host.content.remove_count - host.removedItemIds.size;
  const remainingIds = unremovedItemIds(host);
  if (needed > 0) {
    if (level === 1) {
      return { kind: "region", ids: remainingIds };
    }
    if (level === 2) {
      return { kind: "region", ids: remainingIds.slice(0, needed) };
    }
    const idx = resolveGT029HintTargetIndex(host);
    return idx === null ? null : { kind: "slot", index: idx };
  }
  const options = host.getDisplayOptions();
  if (level === 1) {
    const ids =
      remainingIds.length > 0 ? remainingIds : options.map((o) => o.option_id);
    return { kind: "region", ids };
  }
  if (level === 2) {
    const correctOpt = options.find((o) => o.is_correct);
    const distractorOpt = options.find((o) => !o.is_correct);
    const ids = [correctOpt?.option_id, distractorOpt?.option_id].filter(
      (id): id is string => typeof id === "string"
    );
    return { kind: "region", ids };
  }
  const idx = resolveGT029HintTargetIndex(host);
  return idx === null ? null : { kind: "slot", index: idx };
}

export function resolveGT029DemoSequence(
  host: GT029LayoutHost,
  level: HintLevel
): readonly HintDemoStep[] | null {
  if (level < 3 || host.checkWinCondition() || host.isRoundClosedOnWrong()) {
    return null;
  }
  const items = host.getDisplayItems();
  const needed = host.content.remove_count - host.removedItemIds.size;
  if (needed > 0) {
    const steps: HintDemoStep[] = [];
    for (let i = 0; i < items.length && steps.length < needed; i++) {
      const it = items[i];
      if (it && !host.removedItemIds.has(it.item_id)) {
        steps.push({ from: host.itemCellIndex(i) });
      }
    }
    return steps.length > 0 ? steps : null;
  }
  const idx = resolveGT029HintTargetIndex(host);
  return idx === null ? null : [{ from: idx }];
}

function collectRemainingItemSlots(host: GT029LayoutHost): Slot[] {
  const items = host.getDisplayItems();
  const out: Slot[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const s = host.itemSlotFor(i);
    if (it && s && !host.removedItemIds.has(it.item_id)) {
      out.push(s);
    }
  }
  return out;
}

function buildScaffoldOverlayParams(
  host: GT029LayoutHost,
  level: HintLevel,
  clip: ZoneRect,
  progressBox: ZoneRect | undefined,
  timeMs: number
): GT029ScaffoldOverlayParams {
  const needed = host.content.remove_count - host.removedItemIds.size;
  const remainingSlots = collectRemainingItemSlots(host);

  if (needed > 0) {
    return {
      clip,
      level,
      phase: "remove",
      timeMs,
      progressBox,
      targetSlots:
        level === 2 ? remainingSlots.slice(0, needed) : remainingSlots,
      primarySlot: remainingSlots[0],
    };
  }

  const items = host.getDisplayItems();
  const options = host.getDisplayOptions();
  const correctIdx = options.findIndex((o) => o.is_correct);
  const distractorIdx = options.findIndex((o) => !o.is_correct);
  const correctSlot =
    correctIdx >= 0 ? host.slots[items.length + correctIdx] : undefined;
  const distractorSlot =
    distractorIdx >= 0 ? host.slots[items.length + distractorIdx] : undefined;
  const candidateSlots = [correctSlot, distractorSlot].filter(
    (s): s is Slot => s !== undefined
  );
  return {
    clip,
    level,
    phase: "answer",
    timeMs,
    targetSlots: level === 1 ? remainingSlots : candidateSlots,
    primarySlot: correctSlot,
  };
}

function resolveItemVisualState(params: {
  readonly hoveredId: string | null;
  readonly isClosedTarget: boolean;
  readonly isRemoved: boolean;
  readonly isWon: boolean;
  readonly isWrongItem: boolean;
  readonly itemId: string;
}): GT029VisualState {
  if (params.isRemoved) {
    return "removed";
  }
  if (params.isWrongItem) {
    return "wrong";
  }
  if (params.isWon) {
    return "correct";
  }
  if (params.isClosedTarget) {
    return "closed";
  }
  return params.hoveredId === params.itemId ? "hovered" : "idle";
}

function computeSlideDrawSlot(
  slot: Slot,
  from: { readonly x: number; readonly y: number } | undefined,
  slideElapsed: number,
  reducedMotion: boolean
): Slot {
  if (!from) {
    return slot;
  }
  const pose = groupSlidePose(from, slot, slideElapsed, reducedMotion);
  if (pose.scale === 1 && pose.x === slot.x && pose.y === slot.y) {
    return slot;
  }
  return {
    ...slot,
    x: pose.x,
    y: pose.y,
    w: slot.w * pose.scale,
    h: slot.h * pose.scale,
  };
}

function applyWrongShakeSlot(
  slot: Slot,
  stage: ZoneRect,
  wrongProgress: number,
  reducedMotion: boolean
): Slot {
  if (reducedMotion) {
    return slot;
  }
  const shakeX =
    Math.sin(wrongProgress * Math.PI * 4) * 4 * (1 - wrongProgress);
  const minX = stage.x + slot.w / 2 + 2;
  const maxX = stage.x + stage.w - slot.w / 2 - 2;
  const nextX =
    minX <= maxX
      ? Math.max(minX, Math.min(maxX, slot.x + shakeX))
      : slot.x + shakeX;
  return { ...slot, x: nextX };
}

function renderGT029Items(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  host: GT029LayoutHost,
  clock: GT029ClockState,
  stage: ZoneRect,
  timeMs: number
): void {
  const items = host.getDisplayItems();
  const shadowsOff = host.degradation?.soft_shadows_enabled === false;
  const slideElapsed = elapsedSince(clock.slideStartStamp, clock, timeMs);
  const wrongElapsed = elapsedSince(clock.wrongItemStamp, clock, timeMs);
  const isWrongActive = wrongElapsed < WRONG_FLASH_DURATION_MS;
  const wrongProgress = Math.min(1, wrongElapsed / WRONG_FLASH_DURATION_MS);
  const needed = Math.max(
    0,
    host.content.remove_count - host.removedItemIds.size
  );
  let unremovedSeen = 0;

  for (const removedDock of host.getRemovedDockRects()) {
    drawWoodenTokenDock(ctx, rs, removedDock);
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const slot = host.itemSlotFor(i);
    if (!(it && slot)) {
      continue;
    }
    const isRemoved = host.removedItemIds.has(it.item_id);
    if (!isRemoved) {
      unremovedSeen++;
    }
    const isWrongItem = isWrongActive && clock.wrongItemId === it.item_id;
    const vState = resolveItemVisualState({
      itemId: it.item_id,
      isRemoved,
      isWrongItem,
      isWon: host.checkWinCondition(),
      isClosedTarget:
        host.isRoundClosedOnWrong() && !isRemoved && unremovedSeen <= needed,
      hoveredId: clock.hoveredId,
    });
    const slideSlot = computeSlideDrawSlot(
      slot,
      clock.itemSlideFrom.get(it.item_id),
      slideElapsed,
      rs.reducedMotion
    );
    const drawSlot =
      vState === "wrong"
        ? applyWrongShakeSlot(slideSlot, stage, wrongProgress, rs.reducedMotion)
        : slideSlot;
    const itemParams = {
      clip: stage,
      slot: drawSlot,
      state: vState,
      timeMs,
      wrongProgress: isWrongItem ? wrongProgress : undefined,
      shadowsOff,
    };
    drawGT029ItemUnderlay(ctx, rs, itemParams);
    drawSlotItem(
      ctx,
      rs,
      drawSlot,
      { id: it.item_id, asset: it.asset, state: isRemoved ? "locked" : "idle" },
      "circle"
    );
    drawGT029ItemOverlay(ctx, rs, itemParams);
  }
}

function resolveOptionStates(params: {
  readonly hoveredId: string | null;
  readonly isClosed: boolean;
  readonly isCorrect: boolean;
  readonly isReady: boolean;
  readonly isSelected: boolean;
  readonly isWrongActive: boolean;
  readonly optionId: string;
}): readonly [GT029VisualState, ItemVisualState] {
  if (!(params.isReady || params.isClosed)) {
    return ["locked", "locked"];
  }
  if (params.isSelected && params.isCorrect) {
    return ["correct", "correct"];
  }
  if (
    params.isSelected &&
    !params.isCorrect &&
    (params.isWrongActive || params.isClosed)
  ) {
    return ["wrong", "wrong"];
  }
  if (params.isClosed && params.isCorrect) {
    return ["closed", "correct"];
  }
  return [params.hoveredId === params.optionId ? "hovered" : "idle", "idle"];
}

function renderGT029Options(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  host: GT029LayoutHost,
  clock: GT029ClockState,
  stage: ZoneRect,
  timeMs: number
): void {
  const items = host.getDisplayItems();
  const options = host.getDisplayOptions();
  const isReady = host.removedItemIds.size >= host.content.remove_count;
  const shadowsOff = host.degradation?.soft_shadows_enabled === false;
  const particlesOff = host.degradation?.particles_enabled === false;
  const wrongElapsed = elapsedSince(clock.wrongOptionStamp, clock, timeMs);
  const isWrongActive = wrongElapsed < WRONG_FLASH_DURATION_MS;
  const wrongProgress = Math.min(1, wrongElapsed / WRONG_FLASH_DURATION_MS);
  const winElapsed = elapsedSince(clock.winStamp, clock, timeMs);

  const body = host.stageRect ? splitCaption(host.stageRect).body : undefined;
  drawWoodenTokenDock(
    ctx,
    rs,
    dockRectAroundSlots(host.slots.slice(items.length), body)
  );

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const slot = host.slots[items.length + i];
    if (!(opt && slot)) {
      continue;
    }
    const [vState, slotState] = resolveOptionStates({
      optionId: opt.option_id,
      isCorrect: opt.is_correct,
      isSelected: host.selectedOptionId === opt.option_id,
      isReady,
      isClosed: host.isRoundClosedOnWrong(),
      isWrongActive,
      hoveredId: clock.hoveredId,
    });
    const drawSlot =
      vState === "wrong"
        ? applyWrongShakeSlot(slot, stage, wrongProgress, rs.reducedMotion)
        : slot;
    const optParams = {
      clip: stage,
      slot: drawSlot,
      state: vState,
      timeMs,
      wrongProgress: vState === "wrong" ? wrongProgress : undefined,
      winElapsedMs: vState === "correct" ? winElapsed : undefined,
      particlesOff,
      shadowsOff,
    };
    drawGT029OptionUnderlay(ctx, rs, optParams);
    drawSlotItem(
      ctx,
      rs,
      drawSlot,
      { id: opt.option_id, text: String(opt.value), state: slotState },
      "square"
    );
    drawGT029OptionOverlay(ctx, rs, optParams);
  }
}

function partitionGroupAndRemovedSlots(host: GT029LayoutHost): {
  readonly groupSlots: Slot[];
  readonly removedSlots: Slot[];
} {
  const items = host.getDisplayItems();
  const groupSlots: Slot[] = [];
  const removedSlots: Slot[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const slot = host.itemSlotFor(i);
    if (it && slot) {
      (host.removedItemIds.has(it.item_id) ? removedSlots : groupSlots).push(
        slot
      );
    }
  }
  return { groupSlots, removedSlots };
}

function computeCaptionGeometry(
  rs: RenderSystem,
  stageRect?: ZoneRect
): {
  readonly catCx: number;
  readonly catCy: number;
  readonly catSize: number;
  readonly progressArea: ZoneRect | undefined;
} {
  const caption = stageRect ? splitCaption(stageRect).caption : undefined;
  const catSize = Math.min(40, (caption?.h ?? 44) - 4);
  const catCx = caption
    ? caption.x + caption.w - catSize / 2 - 6
    : rs.LOGIC_WIDTH - catSize / 2 - 12;
  const catCy = caption ? caption.y + caption.h / 2 : rs.LOGIC_HEIGHT * 0.12;
  const progressArea = caption
    ? { ...caption, w: Math.max(0, caption.w - catSize - 12) }
    : undefined;
  return { catCx, catCy, catSize, progressArea };
}

export function renderGT029Frame(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  host: GT029LayoutHost,
  timeMs: number
): void {
  const clock = getGT029Clock(host);
  if (Number.isFinite(timeMs) && timeMs >= 0) {
    clock.lastRenderMs = timeMs;
  }
  drawSceneBackground(ctx, rs, host.themeId);

  const stage: ZoneRect = host.stageRect ?? {
    x: 0,
    y: 0,
    w: rs.LOGIC_WIDTH,
    h: rs.LOGIC_HEIGHT,
  };
  const { catCx, catCy, catSize, progressArea } = computeCaptionGeometry(
    rs,
    host.stageRect
  );
  const { groupSlots, removedSlots } = partitionGroupAndRemovedSlots(host);
  const removedDockRects = host.getRemovedDockRects();
  const body = host.stageRect ? splitCaption(host.stageRect).body : undefined;
  const groupBounds = computeGroupTrayBounds(groupSlots, removedSlots, body);

  drawGT029GroupTray(ctx, rs, {
    clip: stage,
    groupBounds,
    removedDockRects,
    catAnchor: { x: catCx, y: catCy, r: catSize * 0.5 },
    isWon: host.checkWinCondition(),
    shadowsOff: host.degradation?.soft_shadows_enabled === false,
  });

  const targetRemove = host.content.remove_count;
  drawProgressDots(
    ctx,
    rs,
    {
      done: Math.min(host.removedItemIds.size, targetRemove),
      total: targetRemove,
      badge: `-${targetRemove}`,
    },
    progressArea
  );

  drawCat(
    ctx,
    catCx,
    catCy,
    catSize,
    catMouthOpen(
      elapsedSince(clock.lastBiteStamp, clock, timeMs),
      rs.reducedMotion
    )
  );

  renderGT029Items(ctx, rs, host, clock, stage, timeMs);
  renderGT029Options(ctx, rs, host, clock, stage, timeMs);

  const hintLevel = clock.activeHintLevel;
  if (
    hintLevel !== 0 &&
    !host.checkWinCondition() &&
    !host.isRoundClosedOnWrong()
  ) {
    drawGT029ScaffoldOverlay(
      ctx,
      rs,
      buildScaffoldOverlayParams(host, hintLevel, stage, progressArea, timeMs)
    );
  }

  if (
    host.degradation?.particles_enabled !== false &&
    clock.particles.length > 0
  ) {
    rs.drawParticles(ctx, clock.particles);
  }
}
