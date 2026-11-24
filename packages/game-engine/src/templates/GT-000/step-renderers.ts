import {
  formatDisplayLabel,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
} from "#src/game-session";
import type { Gesture, ViewEntity } from "#src/interaction";
import { DEFAULT_LOGIC_SPACE, type LogicSpace } from "#src/layout/constants";
import {
  findHitSlotIndex,
  isPointInSlot,
  TAP_TOLERANCE_PX,
} from "#src/layout/hit-test";
import { isPointInZone, type ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { drawGT000BoundedCurtains } from "#src/render/gt-000-scene-shapes.js";
import {
  drawGT000EchoWaves,
  drawGT000GridItemAccent,
  drawGT000LinkConnector,
  drawGT000RePresentSpotlight,
  drawGT000ReplayRipple,
  resolveGT000FlashcardRect,
} from "#src/render/gt-000-shapes.js";
import {
  drawEncouragementBanner,
  drawFlashcard,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  type RenderAsset,
  type RenderItem,
} from "#src/render/index.js";
import {
  drawStorybookPageTurnOverlay,
  drawStorybookSpreadFrame,
  type StorybookFrameState,
} from "#src/render/storybook-frame.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT000ComputedStepLayout } from "./scene-board-layout.js";
import {
  EMPTY_PRECOMPUTED_SHOWCASE,
  type GT000PrecomputedShowcase,
  renderGT000SceneBoardShowcase,
} from "./scene-board-renderers.js";
import {
  computeGT000CardPose,
  extractAssetId,
  type GT000ActionPayload,
  type GT000Asset,
  type GT000Step,
  resolveRecallCorrectAssetId,
  type SpeakAlongMode,
} from "./template.js";

/** Trần chờ câu hỏi của bước đọc xong (`BR-E000-12`, `BR-PNR-09`). */
export const STEP_PROMPT_SETTLE_TIMEOUT_MS = 12_000;

export function resolveRenderAsset(asset: GT000Asset): RenderAsset | null {
  if (!asset.image_ref) {
    return null;
  }
  if (asset.image_ref.kind === "emoji") {
    return { kind: "emoji", ref: asset.image_ref.ref };
  }
  if (asset.image_ref.kind === "text") {
    return { kind: "text", text: asset.image_ref.text };
  }
  return { kind: "image", path: asset.image_ref.path };
}

export function createRenderItem(
  asset: GT000Asset,
  state: ItemVisualState = "idle"
): RenderItem {
  const fmt = { value: asset.value, glyph: asset.glyph };
  const rep = asset.representation;
  const safeRep =
    rep &&
    rep.kind !== "finger" &&
    rep.kind !== "numeral" &&
    rep.kind !== "discrete-object"
      ? { kind: rep.kind, count: rep.count, max: rep.max }
      : undefined;
  return {
    id: asset.asset_id,
    label: formatDisplayLabel(asset.label, fmt),
    text: asset.glyph ?? asset.text,
    asset: resolveRenderAsset(asset),
    state,
    ...(safeRep ? { representation: safeRep } : {}),
  };
}

export function buildGT000BaseRenderItems(
  step: GT000Step,
  ids: readonly string[],
  assets: readonly GT000Asset[],
  states: ReadonlyMap<string, ItemVisualState>
): RenderItem[] {
  if (step.action === "present" || step.action === "echo") {
    const asset = assets.find((a) => a.asset_id === step.target_asset_id);
    return asset ? [createRenderItem(asset, "idle")] : [];
  }
  const items: RenderItem[] = [];
  for (const id of ids) {
    const asset = assets.find((a) => a.asset_id === id);
    if (asset) {
      items.push(createRenderItem(asset, states.get(id) ?? "idle"));
    }
  }
  return items;
}

export function decorateGT000RenderItems(
  baseItems: RenderItem[],
  states: ReadonlyMap<string, ItemVisualState>,
  hoveredSlotIndex: number | null
): RenderItem[] {
  if (states.size === 0 && hoveredSlotIndex === null) {
    return baseItems;
  }
  return baseItems.map((item, idx) => ({
    ...item,
    state:
      states.get(item.id) ?? (hoveredSlotIndex === idx ? "touching" : "idle"),
  }));
}

export function computeStepAssetIds(
  step: GT000Step,
  layoutSeed: number,
  stepIndex: number,
  shouldShuffle: boolean
): string[] {
  const stream = deriveStream(layoutSeed * 31 + stepIndex, "items");
  if (step.action === "recognise") {
    const items = [step.target_asset_id, ...step.distractor_asset_ids];
    return shouldShuffle ? shuffle(items, stream) : items;
  }
  if (step.action === "recall") {
    const items = [...step.option_asset_ids];
    return shouldShuffle ? shuffle(items, stream) : items;
  }
  if (step.action === "link") {
    const items = [step.target_asset_id, step.source_asset_id];
    return shouldShuffle ? shuffle(items, stream) : items;
  }
  return [];
}

export function resolveItemState(
  state?: string
): "idle" | "selected" | "correct" | "incorrect" {
  if (state === "wrong") {
    return "incorrect";
  }
  return state === "correct" || state === "selected" ? state : "idle";
}

export function toGT000ViewEntity(
  item: RenderItem,
  slot: Slot,
  slotIndex: number,
  isCard: boolean,
  asset: GT000Asset | undefined,
  logic: LogicSpace = DEFAULT_LOGIC_SPACE,
  cardBounds?: ZoneRect
): ViewEntity {
  const spokenLabel = asset
    ? formatSpokenLabel(asset.label, { value: asset.value, glyph: asset.glyph })
    : item.label;
  const emojiRef =
    asset?.image_ref?.kind === "emoji" ? asset.image_ref.ref : undefined;
  const cardRect = isCard
    ? resolveGT000FlashcardRect(logic, slot, cardBounds)
    : null;
  return {
    id: item.id,
    slotIndex,
    role: isCard ? "neutral" : "source",
    state: resolveItemState(item.state),
    x: cardRect ? cardRect.x : slot.x,
    y: cardRect ? cardRect.y : slot.y,
    w: cardRect ? cardRect.w : slot.w,
    h: cardRect ? cardRect.h : slot.h,
    hitShape: isCard ? "square" : "circle",
    label: item.label,
    spokenLabel,
    spokenAudioPath: asset?.audio_path,
    glyph: asset?.glyph ?? emojiRef,
  };
}

export function buildGT000ViewEntities(
  step: GT000Step,
  renderItems: readonly RenderItem[],
  slots: readonly Slot[],
  assets: readonly GT000Asset[],
  logic: LogicSpace,
  cardBounds?: ZoneRect
): ViewEntity[] {
  const isCard = step.action === "present" || step.action === "echo";
  const entities: ViewEntity[] = [];
  for (let i = 0; i < renderItems.length; i++) {
    const item = renderItems[i];
    const slot = slots[i];
    if (item && slot) {
      const asset = assets.find((a) => a.asset_id === item.id);
      entities.push(
        toGT000ViewEntity(item, slot, i, isCard, asset, logic, cardBounds)
      );
    }
  }
  return entities;
}

export interface GT000RenderOptions {
  readonly themeId?: string;
  readonly step?: GT000Step;
  readonly completionLine: string;
  readonly layout: GT000ComputedStepLayout;
  readonly frameState: StorybookFrameState;
  readonly precomputedShowcase: GT000PrecomputedShowcase;
  readonly renderItems: readonly RenderItem[];
  readonly slots: readonly Slot[];
  readonly targetAsset?: GT000Asset;
  readonly speakAlong?: SpeakAlongMode;
  readonly stepElapsedMs?: number;
  readonly cardBounceMs?: number;
  readonly exploredCount: number;
  readonly lastExploredAtMs: number;
  readonly rePresentSpotlight?: {
    readonly assetId: string;
    readonly timerMs: number;
  } | null;
  readonly tappedNudge?: {
    readonly assetId: string;
    readonly timerMs: number;
  } | null;
  readonly linkConnector?: {
    readonly from: { readonly x: number; readonly y: number };
    readonly to: { readonly x: number; readonly y: number };
  } | null;
  readonly particles?: Particle[];
  readonly particlesEnabled?: boolean;
  readonly curtainOpenness?: number;
}

function renderGT000CardLayer(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  step: GT000Step,
  options: GT000RenderOptions
): void {
  const item = options.renderItems[0];
  const slot = options.slots[0];
  if (!(item && slot && options.targetAsset)) {
    return;
  }
  const zone = options.layout.interactiveZone;
  const rect = resolveGT000FlashcardRect(rs.logicSpace, slot, zone);
  const cardSlot: Slot =
    rect.w === slot.w && rect.h === slot.h
      ? slot
      : { ...slot, x: rect.x, y: rect.y, w: rect.w, h: rect.h };
  const elapsedMs = options.stepElapsedMs ?? 0;
  const bounceMs = options.cardBounceMs ?? 0;

  if (step.action === "echo" && options.speakAlong === "tap") {
    drawGT000EchoWaves(ctx, rs, rect, elapsedMs, zone);
  }
  const pose = computeGT000CardPose(elapsedMs, bounceMs, rs.reducedMotion);
  drawFlashcard(ctx, rs, cardSlot, options.targetAsset, item.label, {
    state: item.state,
    depressed: pose.depressed,
    scale: pose.scale,
    offsetY: pose.offsetY,
    softShadowsEnabled: rs.softShadowsEnabled,
  });
  if (bounceMs > 0) {
    drawGT000ReplayRipple(ctx, rs, rect, bounceMs, zone);
  }
}

function renderGT000GridLayer(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  step: GT000Step,
  options: GT000RenderOptions
): void {
  const nudge = options.tappedNudge;
  const stageBounds = options.layout.stage;
  for (let i = 0; i < options.renderItems.length; i++) {
    const item = options.renderItems[i];
    const slot = options.slots[i];
    if (item && slot) {
      drawSlotItem(ctx, rs, slot, item);
      const nudgeMs = nudge && nudge.assetId === item.id ? nudge.timerMs : 0;
      if (
        item.state === "touching" ||
        item.state === "selected" ||
        nudgeMs > 0
      ) {
        drawGT000GridItemAccent(
          ctx,
          rs,
          slot,
          item.state,
          nudgeMs,
          stageBounds
        );
      }
    }
  }
  if (step.action === "link" && options.linkConnector) {
    drawGT000LinkConnector(
      ctx,
      options.linkConnector.from,
      options.linkConnector.to
    );
  }
  if (step.action === "recall") {
    drawGT000BoundedCurtains(
      ctx,
      options.slots,
      options.layout.spread.innerRect,
      options.curtainOpenness
    );
  }
}

function renderGT000FeedbackLayer(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  isCard: boolean,
  options: GT000RenderOptions
): void {
  const spot = options.rePresentSpotlight;
  if (!isCard && spot && spot.timerMs > 0) {
    const idx = options.renderItems.findIndex((it) => it.id === spot.assetId);
    const targetSlot = idx >= 0 ? options.slots[idx] : undefined;
    if (targetSlot) {
      drawGT000RePresentSpotlight(
        ctx,
        rs,
        targetSlot,
        spot.timerMs,
        options.layout.stage
      );
    }
  }
  if (
    options.particlesEnabled !== false &&
    options.particles &&
    options.particles.length > 0
  ) {
    rs.drawParticles(ctx, options.particles);
  }
}

/**
 * Vẽ một khung hình của `GT-000` bên trong `zones.stage` (`usesPromptZone = true`).
 * 0 gọi `drawPromptText` / `drawSubPromptText` / `drawGT000SegmentProgress` cũ (`BR-PSZ-06`, `BR-PSZ-08`).
 */
export function renderGT000Step(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  options: GT000RenderOptions
): void {
  drawSceneBackground(ctx, rs, options.themeId);
  drawStorybookSpreadFrame(
    ctx,
    rs,
    options.layout.spread,
    options.frameState,
    options.layout.hasTwoPages
  );

  if (!options.step) {
    drawEncouragementBanner(
      ctx,
      rs,
      options.completionLine,
      "celebrate",
      options.layout.interactiveZone
    );
    renderGT000FeedbackLayer(ctx, rs, true, options);
    return;
  }

  if (options.layout.hasTwoPages && options.layout.showcaseZone) {
    renderGT000SceneBoardShowcase(ctx, rs, {
      board: options.layout.board,
      step: options.step,
      showcaseZone: options.layout.showcaseZone,
      targetAsset: options.targetAsset,
      precomputed: options.precomputedShowcase ?? EMPTY_PRECOMPUTED_SHOWCASE,
      exploredCount: options.exploredCount,
      lastExploredAtMs: options.lastExploredAtMs,
    });
  }

  const isCard =
    options.step.action === "present" || options.step.action === "echo";
  if (isCard) {
    renderGT000CardLayer(ctx, rs, options.step, options);
  } else {
    renderGT000GridLayer(ctx, rs, options.step, options);
  }

  drawStorybookPageTurnOverlay(
    ctx,
    options.layout.spread,
    options.frameState.turnProgress,
    rs.reducedMotion
  );
  renderGT000FeedbackLayer(ctx, rs, isCard, options);
}

export function findTappedItem(
  gesture: { readonly x: number; readonly y: number },
  step: GT000Step,
  renderItems: readonly RenderItem[],
  slots: readonly Slot[],
  logic: LogicSpace = DEFAULT_LOGIC_SPACE,
  cardBounds?: ZoneRect,
  showcaseZone?: ZoneRect | null
): { itemId: string; isLink: boolean; slotIndex: number } | null {
  if (step.action === "present" || step.action === "echo") {
    const item = renderItems[0];
    const slot = slots[0];
    if (!(item && slot)) {
      return null;
    }
    const rect = resolveGT000FlashcardRect(logic, slot, cardBounds);
    const cardSlot: Slot = {
      ...slot,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      hitW: Math.max(slot.hitW, rect.w),
      hitH: Math.max(slot.hitH, rect.h),
    };
    const hitCard = isPointInSlot(
      cardSlot,
      gesture.x,
      gesture.y,
      "square",
      TAP_TOLERANCE_PX
    );
    const hitShowcase =
      step.action === "present" &&
      showcaseZone !== null &&
      showcaseZone !== undefined &&
      isPointInZone(gesture.x, gesture.y, showcaseZone);
    return hitCard || hitShowcase
      ? { itemId: item.id, isLink: false, slotIndex: 0 }
      : null;
  }
  const hitIdx = findHitSlotIndex(
    slots.slice(0, renderItems.length),
    gesture.x,
    gesture.y,
    "circle",
    TAP_TOLERANCE_PX
  );
  const item = hitIdx >= 0 ? renderItems[hitIdx] : undefined;
  return item
    ? { itemId: item.id, isLink: step.action === "link", slotIndex: hitIdx }
    : null;
}

export function resolveLinkDropAction(
  gesture: Extract<Gesture, { type: "drop" }>,
  renderItems: readonly RenderItem[],
  slots: readonly Slot[]
): GameAction | null {
  const active = slots.slice(0, renderItems.length);
  const fromIdx = findHitSlotIndex(
    active,
    gesture.fromX,
    gesture.fromY,
    "circle",
    TAP_TOLERANCE_PX
  );
  const toIdx = findHitSlotIndex(
    active,
    gesture.toX,
    gesture.toY,
    "circle",
    TAP_TOLERANCE_PX
  );
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
    return null;
  }
  const fromItem = renderItems[fromIdx];
  const toItem = renderItems[toIdx];
  if (!(fromItem && toItem)) {
    return null;
  }
  return {
    type: "tap_item",
    data: {
      source_id: fromItem.id,
      target_id: toItem.id,
      item_id: toItem.id,
      asset_id: toItem.id,
    },
  };
}

export function resolveGT000LinkConnector(
  step: GT000Step | undefined,
  selectedAssetId: string | null,
  renderItems: readonly RenderItem[],
  slots: readonly Slot[],
  pointerHoverPoint?: { readonly x: number; readonly y: number } | null
): {
  readonly from: { readonly x: number; readonly y: number };
  readonly to: { readonly x: number; readonly y: number };
} | null {
  if (step?.action !== "link" || !selectedAssetId) {
    return null;
  }
  const fromIdx = renderItems.findIndex((it) => it.id === selectedAssetId);
  const fromSlot = fromIdx >= 0 ? slots[fromIdx] : undefined;
  if (!fromSlot) {
    return null;
  }
  if (pointerHoverPoint) {
    return {
      from: { x: fromSlot.x, y: fromSlot.y },
      to: { x: pointerHoverPoint.x, y: pointerHoverPoint.y },
    };
  }
  const otherIdx = renderItems.findIndex((it) => it.id !== selectedAssetId);
  const otherSlot = otherIdx >= 0 ? slots[otherIdx] : undefined;
  if (!otherSlot) {
    return null;
  }
  return {
    from: { x: fromSlot.x, y: fromSlot.y },
    to: {
      x: Math.round((fromSlot.x + otherSlot.x) / 2),
      y: Math.round((fromSlot.y + otherSlot.y) / 2),
    },
  };
}

export interface StepActionContext {
  currentStepIndex: number;
  echoReplayCounts: Map<string, number>;
  missCounts: Map<string, number>;
  deferredAssetIds: string[];
  renderItemStates: Map<string, ItemVisualState>;
  recallAnswers: { asset_id: string; correct: boolean }[];
  requiresReintro?: boolean;
  lastTtsUsed: boolean;
  recordEvent: (
    eventName: string,
    data?: Record<string, string | number | boolean | null | undefined>
  ) => void;
  playEchoModel: (step: GT000Step & { action: "echo" }) => void;
  onReplayCard?: () => void;
  onCorrectAnswer?: (assetId: string) => void;
  onWrongTap?: (assetId: string) => void;
  replayTargetThenAsk: (
    step: GT000Step & { action: "recognise" | "link" }
  ) => void;
  advanceStep: () => void;
  deferAdvance: () => void;
}

function handlePresentAction(ctx: StepActionContext): ActionResult {
  ctx.recordEvent("intro_step_answered", {
    step_id: `step_${ctx.currentStepIndex}`,
    action: "present",
    answer_correct: true,
    miss_count: 0,
    tts_used: ctx.lastTtsUsed,
  });
  ctx.advanceStep();
  return ACTION_CORRECT;
}

function handleEchoAction(
  step: Extract<GT000Step, { action: "echo" }>,
  payload: GT000ActionPayload,
  ctx: StepActionContext
): ActionResult {
  const stepId = `step_${ctx.currentStepIndex}`;
  if (payload.intent === "replay") {
    const used = ctx.echoReplayCounts.get(stepId) ?? 0;
    if (used >= step.repeat_count) {
      return ACTION_IGNORED;
    }
    ctx.echoReplayCounts.set(stepId, used + 1);
    ctx.onReplayCard?.();
    ctx.playEchoModel(step);
    return ACTION_CORRECT;
  }
  ctx.recordEvent("intro_echo_completed", {
    step_id: stepId,
    target_asset_id: step.target_asset_id,
    replay_count: ctx.echoReplayCounts.get(stepId) ?? 0,
  });
  ctx.advanceStep();
  return ACTION_CORRECT;
}

function handleRecogniseAction(
  step: Extract<GT000Step, { action: "recognise" }>,
  payload: GT000ActionPayload,
  ctx: StepActionContext
): ActionResult {
  const selectedId = String(payload.item_id ?? payload.asset_id ?? "");
  if (selectedId !== step.target_asset_id) {
    if (selectedId) {
      ctx.onWrongTap?.(selectedId);
    }
    const misses = (ctx.missCounts.get(step.target_asset_id) ?? 0) + 1;
    ctx.missCounts.set(step.target_asset_id, misses);
    if (
      misses >= 3 &&
      ctx.requiresReintro &&
      !ctx.deferredAssetIds.includes(step.target_asset_id)
    ) {
      ctx.deferredAssetIds.push(step.target_asset_id);
      ctx.recordEvent("intro_step_deferred", {
        step_id: `step_${ctx.currentStepIndex}`,
        reason: "miss_limit",
      });
      ctx.advanceStep();
      return ACTION_RETRY;
    }
    ctx.replayTargetThenAsk(step);
    return ACTION_RETRY;
  }
  ctx.renderItemStates.set(selectedId, "correct");
  ctx.recordEvent("intro_step_answered", {
    step_id: `step_${ctx.currentStepIndex}`,
    action: "recognise",
    answer_correct: true,
    miss_count: ctx.missCounts.get(step.target_asset_id) ?? 0,
    tts_used: false,
  });
  ctx.onCorrectAnswer?.(selectedId);
  ctx.advanceStep();
  return ACTION_CORRECT;
}

function handleLinkAction(
  step: Extract<GT000Step, { action: "link" }>,
  payload: GT000ActionPayload,
  ctx: StepActionContext
): ActionResult {
  const sId = String(payload.source_id ?? "");
  const tId = String(payload.target_id ?? "");
  const isMatch =
    (sId === step.source_asset_id && tId === step.target_asset_id) ||
    (sId === step.target_asset_id && tId === step.source_asset_id);
  if (!isMatch) {
    const tappedId = tId || sId;
    if (tappedId) {
      ctx.onWrongTap?.(tappedId);
    }
    ctx.missCounts.set(
      step.target_asset_id,
      (ctx.missCounts.get(step.target_asset_id) ?? 0) + 1
    );
    ctx.replayTargetThenAsk(step);
    return ACTION_RETRY;
  }
  ctx.recordEvent("intro_step_answered", {
    step_id: `step_${ctx.currentStepIndex}`,
    action: "link",
    answer_correct: true,
    miss_count: 0,
    tts_used: false,
  });
  ctx.onCorrectAnswer?.(step.target_asset_id);
  ctx.advanceStep();
  return ACTION_CORRECT;
}

function handleRecallAction(
  step: Extract<GT000Step, { action: "recall" }>,
  payload: GT000ActionPayload,
  ctx: StepActionContext
): ActionResult {
  const selectedId = extractAssetId(payload);
  const correctId = resolveRecallCorrectAssetId(step);
  const isCorrect = selectedId === correctId;
  ctx.recallAnswers.push({ asset_id: correctId, correct: isCorrect });
  ctx.recordEvent("intro_recall_answered", {
    step_id: `step_${ctx.currentStepIndex}`,
    target_asset_id: correctId,
    answer_correct: isCorrect,
  });
  if (!isCorrect) {
    ctx.deferAdvance();
    return ACTION_IGNORED;
  }
  ctx.onCorrectAnswer?.(correctId);
  ctx.advanceStep();
  return ACTION_CORRECT;
}

export function handleGT000Action(
  step: GT000Step,
  payload: GT000ActionPayload,
  ctx: StepActionContext
): ActionResult {
  switch (step.action) {
    case "present":
      return handlePresentAction(ctx);
    case "echo":
      return handleEchoAction(step, payload, ctx);
    case "recognise":
      return handleRecogniseAction(step, payload, ctx);
    case "link":
      return handleLinkAction(step, payload, ctx);
    case "recall":
      return handleRecallAction(step, payload, ctx);
    default:
      return ACTION_IGNORED;
  }
}
