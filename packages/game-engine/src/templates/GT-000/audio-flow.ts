import {
  formatPromptLabel,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import type { GameAction } from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import type { LogicSpace } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import type { GT000SegmentProgressInfo } from "#src/render/gt-000-shapes.js";
import {
  curtainOpenness,
  type ItemVisualState,
  type RenderItem,
} from "#src/render/index.js";
import { spawnParticlesAtSlot, updateParticles } from "#src/render/particles";
import type { AudioController } from "#src/systems/audio-controller";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  buildGT000BaseRenderItems,
  buildGT000ViewEntities,
  computeStepAssetIds,
  decorateGT000RenderItems,
  findTappedItem,
  type GT000RenderOptions,
  resolveGT000LinkConnector,
  resolveLinkDropAction,
} from "#src/templates/GT-000/step-renderers.js";
import {
  type GT000Asset,
  type GT000Content,
  type GT000Difficulty,
  type GT000Segment,
  type GT000Step,
  getStepItemCount,
  resolveGT000LinkTapSelection,
  type SpeakAlongMode,
} from "#src/templates/GT-000/template.js";

export function computeGT000StepSlots(
  step: GT000Step | undefined,
  ageBand: AgeBand,
  logic: LogicSpace,
  cssPerLogic: number
): readonly Slot[] {
  if (!step) {
    return [];
  }
  const itemCount = getStepItemCount(step);
  return resolveLayout(itemCount <= 1 ? "single-focus" : "grid")({
    slotCount: itemCount,
    ageBand,
    logic,
    cssPerLogic,
  });
}

export function shouldShuffleStepItems(difficulty: GT000Difficulty): boolean {
  return !("shuffle_items" in difficulty && difficulty.shuffle_items === false);
}

export function resolveGT000EngineView(
  step: GT000Step | undefined,
  renderItems: readonly RenderItem[],
  slots: readonly Slot[],
  assets: readonly GT000Asset[],
  logicSpace: LogicSpace,
  promptText: string
): EngineView {
  if (!step) {
    return { entities: [], activePrompt: "Bé đã hoàn thành bài làm quen!" };
  }
  return {
    entities: buildGT000ViewEntities(
      step,
      renderItems,
      slots,
      assets,
      logicSpace
    ),
    activePrompt: promptText,
  };
}

export interface GT000StepCacheSnapshot {
  readonly stepIdx: number;
  readonly assets: readonly string[];
  readonly promptText: string;
  readonly renderItems: RenderItem[];
}

export const EMPTY_STEP_CACHE: GT000StepCacheSnapshot = {
  stepIdx: -1,
  assets: [],
  promptText: "",
  renderItems: [],
};

export const RENDER_ORIGIN_BY_SESSION = new WeakMap<
  object,
  { readonly stepIndex: number; readonly originMs: number }
>();

export function buildGT000StepCacheSnapshot(
  step: GT000Step,
  stepIndex: number,
  layoutSeed: number,
  difficulty: GT000Difficulty,
  speakAlong: SpeakAlongMode,
  assets: readonly GT000Asset[],
  renderItemStates: ReadonlyMap<string, ItemVisualState>
): GT000StepCacheSnapshot {
  const ids = computeStepAssetIds(
    step,
    layoutSeed,
    stepIndex,
    shouldShuffleStepItems(difficulty)
  );
  const target = assets.find((a) => a.asset_id === step.target_asset_id);
  return {
    stepIdx: stepIndex,
    assets: ids,
    promptText: getStepPromptText(step, target, speakAlong),
    renderItems: buildGT000BaseRenderItems(step, ids, assets, renderItemStates),
  };
}

export function collectGT000DecoratedItems(
  step: GT000Step,
  currentStepIndex: number,
  cache: GT000StepCacheSnapshot,
  layoutSeed: number,
  difficulty: GT000Difficulty,
  assets: readonly GT000Asset[],
  renderItemStates: ReadonlyMap<string, ItemVisualState>,
  hoveredSlotIndex: number | null
): RenderItem[] {
  const base =
    cache.stepIdx === currentStepIndex
      ? cache.renderItems
      : buildGT000BaseRenderItems(
          step,
          computeStepAssetIds(
            step,
            layoutSeed,
            currentStepIndex,
            shouldShuffleStepItems(difficulty)
          ),
          assets,
          renderItemStates
        );
  return decorateGT000RenderItems(base, renderItemStates, hoveredSlotIndex);
}

export function resolveGT000PointerHoverState(
  x: number,
  y: number,
  step: GT000Step | undefined,
  renderItems: readonly RenderItem[],
  slots: readonly Slot[],
  logicSpace: LogicSpace,
  selectedAssetId: string | null
): {
  readonly hoveredSlotIndex: number | null;
  readonly pointerHoverPoint: { readonly x: number; readonly y: number } | null;
} {
  if (!step) {
    return { hoveredSlotIndex: null, pointerHoverPoint: null };
  }
  const hit = findTappedItem({ x, y }, step, renderItems, slots, logicSpace);
  return {
    hoveredSlotIndex: hit ? hit.slotIndex : null,
    pointerHoverPoint:
      step.action === "link" && selectedAssetId !== null ? { x, y } : null,
  };
}

export function startGT000StepPromptSpeech(
  audio: AudioController,
  step: GT000Step & { action: "recognise" | "link" | "recall" },
  onSettled: () => void,
  onTtsUnavailable: (assetId: string) => void
): { readonly pending: boolean; readonly spoke: boolean } {
  if (!step.prompt_line) {
    return { pending: false, spoke: false };
  }
  let settledSync = false;
  const spoke = audio.speakPrompt(step.prompt_line, () => {
    settledSync = true;
    onSettled();
  });
  if (!spoke) {
    onTtsUnavailable(step.target_asset_id);
  }
  return { pending: spoke && !settledSync, spoke };
}

export function resolveGT000RenderElapsedMs(
  originMap: WeakMap<
    object,
    { readonly stepIndex: number; readonly originMs: number }
  >,
  sessionKey: object,
  currentStepIndex: number,
  stepElapsedMs: number,
  timeMs: number
): number {
  let anchor = originMap.get(sessionKey);
  if (!anchor || anchor.stepIndex !== currentStepIndex) {
    anchor = { stepIndex: currentStepIndex, originMs: timeMs };
    originMap.set(sessionKey, anchor);
  }
  return stepElapsedMs > 0
    ? stepElapsedMs
    : Math.max(0, timeMs - anchor.originMs);
}

export interface GT000TimedAsset {
  readonly assetId: string;
  readonly timerMs: number;
}

export function tickGT000TimedAsset(
  current: GT000TimedAsset | null,
  deltaMs: number
): GT000TimedAsset | null {
  if (!current) {
    return null;
  }
  const next = current.timerMs - deltaMs;
  return next > 0 ? { assetId: current.assetId, timerMs: next } : null;
}

export function stepGT000ParticlesInPlace(
  particles: Particle[],
  deltaMs: number
): void {
  if (particles.length === 0) {
    return;
  }
  const alive = updateParticles(particles, deltaMs / 1000);
  particles.length = 0;
  particles.push(...alive);
}

export function spawnGT000AssetCelebration(
  particles: Particle[],
  particlesEnabled: boolean,
  slots: readonly Slot[],
  stepAssets: readonly string[],
  assetId: string,
  count = 10
): void {
  if (!particlesEnabled) {
    return;
  }
  const idx = stepAssets.indexOf(assetId);
  const slot = idx >= 0 ? slots[idx] : slots[0];
  if (slot) {
    particles.push(...spawnParticlesAtSlot(slot, count));
  }
}

export function resolveGT000GestureToAction(
  gesture: Gesture,
  step: GT000Step | undefined,
  canInteract: boolean,
  renderItems: readonly RenderItem[],
  slots: readonly Slot[],
  logicSpace: LogicSpace,
  selectedAssetId: string | null,
  renderItemStates: Map<string, ItemVisualState>
): {
  readonly action: GameAction | null;
  readonly nextSelectedAssetId: string | null;
  readonly linkSelectionChanged: boolean;
} {
  if (gesture.type === "commit") {
    return {
      action: {
        type: "tap_item",
        data: { intent: gesture.intent ?? "advance" },
      },
      nextSelectedAssetId: selectedAssetId,
      linkSelectionChanged: false,
    };
  }
  if (!(step && canInteract)) {
    return {
      action: null,
      nextSelectedAssetId: selectedAssetId,
      linkSelectionChanged: false,
    };
  }
  if (gesture.type === "drop") {
    return {
      action:
        step.action === "link"
          ? resolveLinkDropAction(gesture, renderItems, slots)
          : null,
      nextSelectedAssetId: selectedAssetId,
      linkSelectionChanged: false,
    };
  }
  if (gesture.type !== "tap") {
    return {
      action: null,
      nextSelectedAssetId: selectedAssetId,
      linkSelectionChanged: false,
    };
  }
  const hit = findTappedItem(gesture, step, renderItems, slots, logicSpace);
  if (!hit) {
    return {
      action: null,
      nextSelectedAssetId: selectedAssetId,
      linkSelectionChanged: false,
    };
  }
  if (hit.isLink) {
    const sel = resolveGT000LinkTapSelection(
      selectedAssetId,
      hit.itemId,
      renderItemStates
    );
    return {
      action: sel.action,
      nextSelectedAssetId: sel.nextSelectedId,
      linkSelectionChanged: true,
    };
  }
  return {
    action:
      step.action === "present"
        ? { type: "tap_item", data: { intent: "replay" } }
        : {
            type: "tap_item",
            data: { item_id: hit.itemId, asset_id: hit.itemId },
          },
    nextSelectedAssetId: selectedAssetId,
    linkSelectionChanged: false,
  };
}

/** Tóm tắt tiến độ phân đoạn (hoặc bước khi chỉ có 1 phân đoạn) cho dải hạt. */
export function resolveGT000SegmentProgress(
  segments: readonly GT000Segment[],
  currentSegmentIndex: number,
  currentStepIndex: number,
  totalSteps: number
): GT000SegmentProgressInfo {
  return segments.length >= 2
    ? {
        currentIndex: currentSegmentIndex,
        totalCount: segments.length,
        isLastReview: Boolean(segments.at(-1)?.is_review),
      }
    : {
        currentIndex: currentStepIndex,
        totalCount: totalSteps,
        isLastReview: false,
      };
}

/** Tạo câu dẫn theo bước và chế độ `speak_along`. */
export function getStepPromptText(
  step: GT000Step,
  asset: GT000Asset | undefined,
  speakAlong: SpeakAlongMode
): string {
  const fmt = asset ? { value: asset.value, glyph: asset.glyph } : undefined;
  const label = asset ? formatPromptLabel(asset.label, fmt) : "";
  const spokenLabel = asset ? formatSpokenLabel(asset.label, fmt) : "";

  if (step.action === "present") {
    return step.narration_line ?? `Đây là ${label}`;
  }
  if (step.action === "echo") {
    return speakAlong === "off"
      ? `Đây là ${label}`
      : (step.prompt_line ?? `Bé nói theo cô nhé: ${spokenLabel}`);
  }
  if (step.action === "recognise") {
    return step.prompt_line ?? `Bé hãy chỉ cho cô ${label} nhé!`;
  }
  if (step.action === "recall") {
    return step.prompt_line ?? `Đâu là ${label}?`;
  }
  return step.action === "link"
    ? (step.prompt_line ?? "Nối đối tượng tương ứng")
    : "Đây là gì?";
}

/** Phát âm mẫu cho bước `present` / `echo`, tự rơi xuống TTS khi `audio_path` lỗi. */
export function playGT000CardAudioWithFallback(
  audio: AudioController,
  step: GT000Step & { action: "present" | "echo" },
  asset: GT000Asset,
  speakAlong: SpeakAlongMode,
  promptToSpeak: string | undefined,
  onSpeaking: () => void,
  onSpokeChange: (spoke: boolean) => void,
  onTtsUnavailable: (assetId: string) => void
): void {
  const speakFallback = (): void => {
    const text = promptToSpeak ?? getStepPromptText(step, asset, speakAlong);
    const spoke = audio.speakPrompt(text, undefined, onSpeaking);
    onSpokeChange(spoke);
    if (!spoke) {
      onTtsUnavailable(asset.asset_id);
    }
  };
  if (asset.audio_path) {
    onSpokeChange(false);
    audio.playPromptAudio(asset.audio_path, undefined, speakFallback);
  } else {
    speakFallback();
  }
}

/** Đọc lại tên chất liệu mục tiêu rồi hỏi lại câu của bước (`BR-E000-14`). */
export function playGT000TargetThenAsk(
  audio: AudioController,
  asset: GT000Asset,
  speakAlong: SpeakAlongMode,
  ask: () => void,
  onSpokeChange: (spoke: boolean) => void,
  onTtsUnavailable: (assetId: string) => void
): void {
  const speakTargetThenAsk = (): void => {
    const text = getStepPromptText(
      { action: "present", target_asset_id: asset.asset_id },
      asset,
      speakAlong
    );
    const spoke = audio.speakPrompt(text, ask);
    onSpokeChange(spoke);
    if (!spoke) {
      onTtsUnavailable(asset.asset_id);
      ask();
    }
  };
  if (asset.audio_path) {
    onSpokeChange(false);
    let fellBack = false;
    audio.playPromptAudio(
      asset.audio_path,
      () => {
        if (!fellBack) {
          ask();
        }
      },
      () => {
        fellBack = true;
        speakTargetThenAsk();
      }
    );
    return;
  }
  speakTargetThenAsk();
}

export function resolveGT000RenderPromptText(
  step: GT000Step | undefined,
  currentStepIndex: number,
  cache: GT000StepCacheSnapshot,
  targetAsset: GT000Asset | undefined,
  speakAlong: SpeakAlongMode
): string {
  if (!step) {
    return "";
  }
  return cache.stepIdx === currentStepIndex
    ? cache.promptText
    : getStepPromptText(step, targetAsset, speakAlong);
}

export interface GT000RenderBuildContext {
  readonly themeId?: string | undefined;
  readonly currentStepIndex: number;
  readonly currentSegmentIndex: number;
  readonly segments: readonly GT000Segment[];
  readonly steps: readonly GT000Step[];
  readonly content: GT000Content;
  readonly slots: readonly Slot[];
  readonly speakAlong: SpeakAlongMode;
  readonly stepElapsedMs: number;
  readonly cardBounceMs: number;
  readonly rePresentSpotlight: GT000TimedAsset | null;
  readonly tappedNudge: GT000TimedAsset | null;
  readonly selectedAssetId: string | null;
  readonly pointerHoverPoint: { readonly x: number; readonly y: number } | null;
  readonly particles: Particle[];
  readonly degradation: { readonly particles_enabled?: boolean } | null;
}

export function buildGT000StepRenderOptions(
  rs: RenderSystem,
  timeMs: number,
  s: GT000RenderBuildContext,
  step: GT000Step | undefined,
  stepCache: GT000StepCacheSnapshot,
  renderItems: readonly RenderItem[]
): GT000RenderOptions {
  const elapsedMs = resolveGT000RenderElapsedMs(
    RENDER_ORIGIN_BY_SESSION,
    s,
    s.currentStepIndex,
    s.stepElapsedMs,
    timeMs
  );
  const targetAsset = step
    ? s.content.assets.find((a) => a.asset_id === step.target_asset_id)
    : undefined;
  return {
    themeId: s.themeId,
    step,
    promptText: resolveGT000RenderPromptText(
      step,
      s.currentStepIndex,
      stepCache,
      targetAsset,
      s.speakAlong
    ),
    conceptLabel: s.content.concept.label,
    renderItems,
    slots: s.slots,
    targetAsset,
    speakAlong: s.speakAlong,
    stepElapsedMs: elapsedMs,
    cardBounceMs: s.cardBounceMs,
    segmentProgress: resolveGT000SegmentProgress(
      s.segments,
      s.currentSegmentIndex,
      s.currentStepIndex,
      s.steps.length
    ),
    rePresentSpotlight: s.rePresentSpotlight,
    tappedNudge: s.tappedNudge,
    linkConnector: resolveGT000LinkConnector(
      step,
      s.selectedAssetId,
      renderItems,
      s.slots,
      s.pointerHoverPoint
    ),
    particles: s.particles,
    particlesEnabled: s.degradation?.particles_enabled !== false,
    curtainOpenness: curtainOpenness(elapsedMs, rs.reducedMotion),
  };
}
