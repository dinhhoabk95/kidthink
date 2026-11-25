import {
  formatPromptLabel,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import type { GameAction } from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import type { LogicSpace } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { GT000ResolvedVisual } from "#src/render/gt-000-scene-shapes.js";
import type { GT000SegmentProgressInfo } from "#src/render/gt-000-shapes.js";
import {
  curtainOpenness,
  type ItemVisualState,
  type RenderItem,
} from "#src/render/index.js";
import { spawnParticlesAtSlot, updateParticles } from "#src/render/particles";
import { computeBookTurnProgress } from "#src/render/storybook-frame.js";
import type { AudioController } from "#src/systems/audio-controller";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { TeacherVoiceText } from "#src/systems/teacher-voice";
import {
  computeGT000StepLayout,
  type GT000ComputedStepLayout,
} from "./scene-board-layout.js";
import {
  EMPTY_PRECOMPUTED_SHOWCASE,
  type GT000PrecomputedShowcase,
  precomputeGT000Showcase,
} from "./scene-board-renderers.js";
import { resolveStoryContext } from "./scene-board-schema.js";
import {
  buildGT000BaseRenderItems,
  buildGT000ViewEntities,
  computeStepAssetIds,
  decorateGT000RenderItems,
  findTappedItem,
  type GT000RenderOptions,
  resolveGT000LinkConnector,
  resolveLinkDropAction,
} from "./step-renderers.js";
import {
  type GT000Asset,
  type GT000Content,
  type GT000Difficulty,
  type GT000Segment,
  type GT000Step,
  resolveGT000LinkTapSelection,
  type SpeakAlongMode,
} from "./template.js";

export const DEFAULT_COMPLETION_LINE = "Bé đã hoàn thành bài làm quen!";

export function formatLayoutCacheKey(
  ageBand: AgeBand,
  logic: LogicSpace,
  cssPerLogic: number,
  stageRect?: ZoneRect
): string {
  const s = stageRect
    ? `${stageRect.x},${stageRect.y},${stageRect.w},${stageRect.h}`
    : "none";
  return `${ageBand}|${logic.w}x${logic.h}|${cssPerLogic.toFixed(4)}|${s}`;
}

export function computeGT000StepSlots(
  step: GT000Step | undefined,
  ageBand: AgeBand,
  logic: LogicSpace,
  cssPerLogic: number,
  stageRect?: ZoneRect
): readonly Slot[] {
  return computeGT000StepLayout(step, ageBand, logic, cssPerLogic, stageRect)
    .slots;
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
  promptText: string,
  cardBounds?: ZoneRect,
  completionLine = DEFAULT_COMPLETION_LINE
): EngineView {
  if (!step) {
    return { entities: [], activePrompt: completionLine };
  }
  return {
    entities: buildGT000ViewEntities(
      step,
      renderItems,
      slots,
      assets,
      logicSpace,
      cardBounds
    ),
    activePrompt: promptText,
  };
}

export interface GT000StepCacheSnapshot {
  readonly stepIdx: number;
  readonly layoutKey: string;
  readonly layout: GT000ComputedStepLayout | null;
  readonly precomputedShowcase: GT000PrecomputedShowcase;
  readonly pageBadge: string;
  readonly assets: readonly string[];
  readonly promptText: string;
  readonly renderItems: RenderItem[];
}

export const EMPTY_STEP_CACHE: GT000StepCacheSnapshot = {
  stepIdx: -1,
  layoutKey: "",
  layout: null,
  precomputedShowcase: EMPTY_PRECOMPUTED_SHOWCASE,
  pageBadge: "",
  assets: [],
  promptText: "",
  renderItems: [],
};

export const RENDER_ORIGIN_BY_SESSION = new WeakMap<
  object,
  { readonly stepIndex: number; readonly originMs: number }
>();

export interface BuildStepCacheInput {
  readonly step: GT000Step;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly layoutSeed: number;
  readonly difficulty: GT000Difficulty;
  readonly speakAlong: SpeakAlongMode;
  readonly assets: readonly GT000Asset[];
  readonly visualMap: ReadonlyMap<string, GT000ResolvedVisual>;
  readonly renderItemStates: ReadonlyMap<string, ItemVisualState>;
  readonly ageBand: AgeBand;
  readonly logicSpace: LogicSpace;
  readonly cssPerLogic: number;
  readonly stageRect?: ZoneRect;
}

export function buildGT000StepCacheSnapshot(
  input: BuildStepCacheInput
): GT000StepCacheSnapshot {
  const {
    step,
    stepIndex,
    totalSteps,
    layoutSeed,
    difficulty,
    speakAlong,
    assets,
    visualMap,
    renderItemStates,
    ageBand,
    logicSpace,
    cssPerLogic,
    stageRect,
  } = input;
  const ids = computeStepAssetIds(
    step,
    layoutSeed,
    stepIndex,
    shouldShuffleStepItems(difficulty)
  );
  const target = assets.find((a) => a.asset_id === step.target_asset_id);
  const layout = computeGT000StepLayout(
    step,
    ageBand,
    logicSpace,
    cssPerLogic,
    stageRect
  );
  return {
    stepIdx: stepIndex,
    layoutKey: formatLayoutCacheKey(
      ageBand,
      logicSpace,
      cssPerLogic,
      stageRect
    ),
    layout,
    precomputedShowcase: precomputeGT000Showcase(layout.board, step, visualMap),
    pageBadge: `${stepIndex + 1}/${Math.max(1, totalSteps)}`,
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
  selectedAssetId: string | null,
  cardBounds?: ZoneRect,
  showcaseZone?: ZoneRect | null
): {
  readonly hoveredSlotIndex: number | null;
  readonly pointerHoverPoint: { readonly x: number; readonly y: number } | null;
} {
  if (!step) {
    return { hoveredSlotIndex: null, pointerHoverPoint: null };
  }
  const hit = findTappedItem(
    { x, y },
    step,
    renderItems,
    slots,
    logicSpace,
    cardBounds,
    showcaseZone
  );
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
  onTtsUnavailable: (assetId: string) => void,
  leadInPrefix?: readonly string[]
): { readonly pending: boolean; readonly spoke: boolean } {
  const baseLine = step.prompt_line?.trim();
  if (!(baseLine || leadInPrefix)) {
    return { pending: false, spoke: false };
  }
  const textToSpeak: TeacherVoiceText =
    leadInPrefix && baseLine
      ? [...leadInPrefix, baseLine]
      : (baseLine ?? leadInPrefix ?? "");
  let settledSync = false;
  const spoke = audio.speakPrompt(textToSpeak, () => {
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
  renderItemStates: Map<string, ItemVisualState>,
  cardBounds?: ZoneRect,
  showcaseZone?: ZoneRect | null
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
  const hit = findTappedItem(
    gesture,
    step,
    renderItems,
    slots,
    logicSpace,
    cardBounds,
    showcaseZone
  );
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

/** Tóm tắt tiến độ phân đoạn (hoặc bước khi chỉ có 1 phân đoạn) cho dải dấu trang hoa sen. */
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

function resolveCardChainedSpeech(
  step: GT000Step & { action: "present" | "echo" },
  asset: GT000Asset,
  speakAlong: SpeakAlongMode,
  leadInPrefix: readonly string[] | undefined
): TeacherVoiceText | undefined {
  if (step.action === "present") {
    const explicit = step.narration_line?.trim();
    if (leadInPrefix && explicit) {
      return [...leadInPrefix, explicit];
    }
    if (leadInPrefix) {
      return [...leadInPrefix, getStepPromptText(step, asset, speakAlong)];
    }
    return explicit || undefined;
  }
  return leadInPrefix
    ? [...leadInPrefix, getStepPromptText(step, asset, speakAlong)]
    : undefined;
}

/**
 * Phát âm bước `present` / `echo` (`BR-E000-14`, `BR-E000-15`):
 * - Nếu có lời dẫn chuyện (`leadInPrefix` mở bài/phân đoạn hoặc `step.narration_line`),
 *   đọc trọn lời dẫn qua TTS trước rồi mới nối sang `asset.audio_path` (KHÔNG nuốt
 *   `narration_line`). Nếu thiết bị không có giọng TTS Việt, tự rơi thẳng sang
 *   `asset.audio_path` và chỉ báo `tts_unavailable` khi cả hai cùng lỗi.
 * - Nếu không có lời dẫn riêng mà có `asset.audio_path`, phát trực tiếp mp3 rồi
 *   rơi xuống TTS khi mp3 lỗi.
 */
export function playGT000CardAudioWithFallback(
  audio: AudioController,
  step: GT000Step & { action: "present" | "echo" },
  asset: GT000Asset,
  speakAlong: SpeakAlongMode,
  leadInPrefix: readonly string[] | undefined,
  onSpeaking: () => void,
  onSpokeChange: (spoke: boolean) => void,
  onTtsUnavailable: (assetId: string) => void,
  isStillActiveStep: () => boolean = () => true
): void {
  const chainedSpeech = resolveCardChainedSpeech(
    step,
    asset,
    speakAlong,
    leadInPrefix
  );

  const speakFallback = (): void => {
    const text = chainedSpeech ?? getStepPromptText(step, asset, speakAlong);
    const spoke = audio.speakPrompt(text, undefined, onSpeaking);
    onSpokeChange(spoke);
    if (!spoke) {
      onTtsUnavailable(asset.asset_id);
    }
  };

  if (asset.audio_path) {
    if (chainedSpeech) {
      const audioRef = asset.audio_path;
      let chainedDone = false;
      const spoke = audio.speakPrompt(
        chainedSpeech,
        () => {
          if (!chainedDone && isStillActiveStep()) {
            chainedDone = true;
            audio.playPromptAudio(audioRef);
          }
        },
        onSpeaking
      );
      onSpokeChange(spoke);
      if (!spoke) {
        chainedDone = true;
        audio.playPromptAudio(audioRef, undefined, () =>
          onTtsUnavailable(asset.asset_id)
        );
      }
      return;
    }
    onSpokeChange(false);
    audio.playPromptAudio(asset.audio_path, undefined, speakFallback);
    return;
  }

  speakFallback();
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
  readonly pageTurnMs: number;
  readonly exploredCount: number;
  readonly lastExploredAtMs: number;
  readonly rePresentSpotlight: GT000TimedAsset | null;
  readonly tappedNudge: GT000TimedAsset | null;
  readonly selectedAssetId: string | null;
  readonly pointerHoverPoint: { readonly x: number; readonly y: number } | null;
  readonly particles: Particle[];
  readonly degradation: { readonly particles_enabled?: boolean } | null;
  readonly currentAgeBand: AgeBand;
  readonly logicSpace: LogicSpace;
  readonly stageRect?: ZoneRect;
  readonly cssPerLogic?: number;
}

export function buildGT000StepRenderOptions(
  rs: RenderSystem,
  timeMs: number,
  s: GT000RenderBuildContext,
  step: GT000Step | undefined,
  stepCache: GT000StepCacheSnapshot,
  renderItems: readonly RenderItem[],
  visualMap: ReadonlyMap<string, GT000ResolvedVisual>
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
  const effectiveLogic = s.stageRect ? s.logicSpace : rs.logicSpace;
  const cssRatio = s.cssPerLogic ?? rs.viewport?.scale ?? 1;
  const currentKey = formatLayoutCacheKey(
    s.currentAgeBand,
    effectiveLogic,
    cssRatio,
    s.stageRect
  );
  const cacheMatches =
    stepCache.stepIdx === s.currentStepIndex &&
    stepCache.layout !== null &&
    stepCache.layoutKey === currentKey;

  const layout =
    cacheMatches && stepCache.layout
      ? stepCache.layout
      : computeGT000StepLayout(
          step,
          s.currentAgeBand,
          effectiveLogic,
          cssRatio,
          s.stageRect
        );
  let precomputedShowcase = EMPTY_PRECOMPUTED_SHOWCASE;
  if (cacheMatches) {
    precomputedShowcase = stepCache.precomputedShowcase;
  } else if (step) {
    precomputedShowcase = precomputeGT000Showcase(
      layout.board,
      step,
      visualMap
    );
  }
  const progress = resolveGT000SegmentProgress(
    s.segments,
    s.currentSegmentIndex,
    s.currentStepIndex,
    s.steps.length
  );
  const storyCtx = resolveStoryContext(s.content);

  return {
    themeId: s.themeId ?? storyCtx?.theme_code,
    step,
    completionLine: storyCtx?.resolution_line ?? DEFAULT_COMPLETION_LINE,
    layout,
    frameState: {
      currentSegmentIndex: progress.currentIndex,
      totalSegments: progress.totalCount,
      isLastReview: Boolean(progress.isLastReview),
      conceptLabel: s.content.concept.label,
      pageBadge:
        cacheMatches && stepCache.pageBadge
          ? stepCache.pageBadge
          : `${Math.min(s.currentStepIndex + 1, Math.max(1, s.steps.length))}/${Math.max(1, s.steps.length)}`,
      turnProgress: computeBookTurnProgress(s.pageTurnMs, rs.reducedMotion),
    },
    precomputedShowcase,
    renderItems,
    slots: cacheMatches ? s.slots : layout.slots,
    targetAsset,
    speakAlong: s.speakAlong,
    stepElapsedMs: elapsedMs,
    cardBounceMs: s.cardBounceMs,
    exploredCount: s.exploredCount,
    lastExploredAtMs: s.lastExploredAtMs,
    rePresentSpotlight: s.rePresentSpotlight,
    tappedNudge: s.tappedNudge,
    linkConnector: resolveGT000LinkConnector(
      step,
      s.selectedAssetId,
      renderItems,
      cacheMatches ? s.slots : layout.slots,
      s.pointerHoverPoint
    ),
    particles: s.particles,
    particlesEnabled: s.degradation?.particles_enabled !== false,
    curtainOpenness: curtainOpenness(elapsedMs, rs.reducedMotion),
  };
}
