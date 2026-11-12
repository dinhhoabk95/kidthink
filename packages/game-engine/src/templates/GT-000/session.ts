import type { AgeBand } from "#src/contracts/types";
import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import type { Slot } from "#src/layout/types";
import {
  GT000_CARD_BOUNCE_DURATION_MS,
  GT000_NUDGE_DURATION_MS,
  GT000_SPOTLIGHT_DURATION_MS,
} from "#src/render/gt-000-shapes.js";
import type { RenderItem } from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { AudioController } from "#src/systems/audio-controller";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  buildGT000StepCacheSnapshot,
  buildGT000StepRenderOptions,
  collectGT000DecoratedItems,
  computeGT000StepSlots,
  EMPTY_STEP_CACHE,
  type GT000StepCacheSnapshot,
  type GT000TimedAsset,
  playGT000CardAudioWithFallback,
  playGT000TargetThenAsk,
  RENDER_ORIGIN_BY_SESSION,
  resolveGT000EngineView,
  resolveGT000GestureToAction,
  resolveGT000PointerHoverState,
  spawnGT000AssetCelebration,
  startGT000StepPromptSpeech,
  stepGT000ParticlesInPlace,
  tickGT000TimedAsset,
} from "#src/templates/GT-000/audio-flow.js";
import {
  handleGT000Action,
  renderGT000Step,
  STEP_PROMPT_SETTLE_TIMEOUT_MS,
} from "#src/templates/GT-000/step-renderers.js";
import {
  computeGT000TotalMisses,
  type GT000Asset,
  type GT000Content,
  type GT000Difficulty,
  type GT000Segment,
  type GT000Step,
  readGT000ActionPayload,
  resolveGT000AnswerReaction,
  resolveGT000HintDestinationIndex,
  resolveGT000HintTargetIndex,
  resolveGT000InitialState,
  resolveNormalizedSegments,
  resolveSpeakAlong,
  routeGT000Action,
  type SpeakAlongMode,
  syncSegmentCursorFromStepIndex,
  validateGT000SessionAction,
} from "#src/templates/GT-000/template.js";

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E000-15`, `BR-FBK-16`). */
export const GT000_STORY_LINE =
  "Cô Cú dạy bé nhận từng thứ nhé: nghe cô nói, chỉ cho cô, rồi nói cô nghe.";
export const GT000_HAPPY_MS = 1000;
export const GT000_LISTEN_MS = 1500;

export class GT000Session extends TemplateGameSession<
  GT000Content,
  GT000Difficulty
> {
  degradation: DegradationState | null = null;
  currentStepIndex = 0;
  currentSegmentIndex = 0;
  currentSegmentStepIndex = 0;
  selectedAssetId: string | null = null;
  readonly missCounts = new Map<string, number>();
  readonly deferredAssetIds: string[] = [];
  readonly recallAnswers: { asset_id: string; correct: boolean }[] = [];
  readonly particles: Particle[] = [];
  private readonly echoReplayCounts = new Map<string, number>();
  private stepPromptPending = false;
  private stepPromptToken = 0;
  private stepPromptWaitedMs = 0;
  private advancePending = false;
  private readonly mood = new MoodPulse();
  stepElapsedMs = 0;
  cardBounceMs = 0;
  rePresentSpotlight: GT000TimedAsset | null = null;
  tappedNudge: GT000TimedAsset | null = null;
  hoveredSlotIndex: number | null = null;
  pointerHoverPoint: { readonly x: number; readonly y: number } | null = null;
  private readonly ttsMissReported = new Set<string>();

  readonly audio = new AudioController();
  audioPromptCalled = false;
  lastTtsUsed = false;

  private allSteps: GT000Step[] = [];
  private normalizedSegments: GT000Segment[] = [];
  private segmentMissBaseline = 0;
  private readonly initialResumeSegmentIndex?: number;
  private currentAgeBand: AgeBand = "3-4";
  private stepCache: GT000StepCacheSnapshot = EMPTY_STEP_CACHE;

  constructor(
    content: GT000Content,
    difficulty: GT000Difficulty,
    layoutSeed = 0,
    themeId?: string,
    resumeSegmentIndex?: number
  ) {
    super(content, difficulty, layoutSeed, themeId);
    this.initialResumeSegmentIndex = resumeSegmentIndex;
  }

  get speakAlong(): SpeakAlongMode {
    return resolveSpeakAlong(this.difficulty);
  }

  get segments(): readonly GT000Segment[] {
    if (this.normalizedSegments.length === 0) {
      this.normalizedSegments = resolveNormalizedSegments(this.content);
    }
    return this.normalizedSegments;
  }

  get steps(): readonly GT000Step[] {
    if (this.allSteps.length === 0) {
      this.allSteps = this.segments.flatMap((s) => s.steps);
    }
    return this.allSteps;
  }

  private emitSegmentStarted(segmentIndex: number): void {
    const seg = this.normalizedSegments[segmentIndex];
    if (seg) {
      this.recordEvent("intro_segment_started", {
        segment_id: seg.segment_id,
        segment_index: segmentIndex,
        asset_count: seg.asset_ids.length,
        is_review: seg.is_review ?? false,
      });
    }
  }

  private resetStepState(): void {
    this.renderItemStates.clear();
    this.selectedAssetId = null;
    this.stepElapsedMs = 0;
    this.cardBounceMs = 0;
    this.rePresentSpotlight = null;
    this.tappedNudge = null;
    this.clearPointerOver();
    this.stepCache = EMPTY_STEP_CACHE;
    RENDER_ORIGIN_BY_SESSION.delete(this);
  }

  setupEntities(): void {
    this.isWon = false;
    this.missCounts.clear();
    this.deferredAssetIds.length = 0;
    this.recallAnswers.length = 0;
    this.particles.length = 0;
    this.echoReplayCounts.clear();
    this.ttsMissReported.clear();
    this.advancePending = false;
    this.mood.clear();
    this.audioPromptCalled = false;
    this.releaseStepPrompt();
    this.lastTtsUsed = false;
    this.segmentMissBaseline = 0;
    this.resetStepState();
    const init = resolveGT000InitialState(
      this.content,
      this.difficulty,
      this.initialResumeSegmentIndex
    );
    this.normalizedSegments = init.normalizedSegments;
    this.allSteps = init.allSteps;
    this.currentSegmentIndex = init.currentSegmentIndex;
    this.currentSegmentStepIndex = 0;
    this.currentStepIndex = init.currentStepIndex;
    this.recordEvent("game_started", {
      template_code: "GT-000",
      total_steps: this.steps.length,
    });
    this.emitSegmentStarted(this.currentSegmentIndex);
    this.updateCurrentStepLayout();
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    this.currentAgeBand = band;
    return computeGT000StepSlots(
      this.getCurrentStep(),
      band,
      this.logicSpace,
      this.cssPerLogic ?? 1
    );
  }

  private getCurrentStep(): GT000Step | undefined {
    return this.steps[this.currentStepIndex];
  }

  private getAsset(assetId: string): GT000Asset | undefined {
    return this.content.assets.find((a) => a.asset_id === assetId);
  }

  private updateCurrentStepLayout(): void {
    const step = this.getCurrentStep();
    if (!step) {
      return;
    }
    this.resolveSlots(this.currentAgeBand);
    this.ensureStepAssetsCached(step);
    this.releaseStepPrompt();
    this.recordEvent("intro_step_started", {
      step_id: `step_${this.currentStepIndex}`,
      action: step.action,
      target_asset_id: step.target_asset_id,
      asset_kind: this.getAsset(step.target_asset_id)?.kind ?? "glyph",
    });

    if (step.action === "present") {
      this.playCardStepAudio(step, step.narration_line);
    } else if (step.action === "echo") {
      this.playEchoModel(step);
    } else {
      this.playStepPrompt(step);
    }
  }

  private releaseStepPrompt(): void {
    this.stepPromptToken++;
    this.stepPromptPending = false;
    this.stepPromptWaitedMs = 0;
  }

  override isAcceptingInput(): boolean {
    return !(this.stepPromptPending || this.advancePending);
  }

  override storyLine(): string {
    return GT000_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  setPointerOver(x: number, y: number): void {
    const step = this.getCurrentStep();
    const hover = resolveGT000PointerHoverState(
      x,
      y,
      step,
      step ? this.collectRenderItems(step, true) : [],
      this.slots,
      this.logicSpace,
      this.selectedAssetId
    );
    this.hoveredSlotIndex = hover.hoveredSlotIndex;
    this.pointerHoverPoint = hover.pointerHoverPoint;
  }

  clearPointerOver(): void {
    this.hoveredSlotIndex = null;
    this.pointerHoverPoint = null;
  }

  private triggerCardBounce(): void {
    this.cardBounceMs = GT000_CARD_BOUNCE_DURATION_MS;
    this.queueSfx("tap");
  }

  update(deltaMs: number): void {
    this.stepElapsedMs += deltaMs;
    if (this.cardBounceMs > 0) {
      this.cardBounceMs = Math.max(0, this.cardBounceMs - deltaMs);
    }
    this.rePresentSpotlight = tickGT000TimedAsset(
      this.rePresentSpotlight,
      deltaMs
    );
    this.tappedNudge = tickGT000TimedAsset(this.tappedNudge, deltaMs);
    stepGT000ParticlesInPlace(this.particles, deltaMs);
    this.mood.tick(deltaMs);
    if (this.advancePending) {
      this.advancePending = false;
      this.advanceStep();
    }
    if (this.stepPromptPending) {
      this.stepPromptWaitedMs += deltaMs;
      if (this.stepPromptWaitedMs >= STEP_PROMPT_SETTLE_TIMEOUT_MS) {
        this.stepPromptPending = false;
      }
    }
  }

  private playStepPrompt(
    step: GT000Step & { action: "recognise" | "link" | "recall" }
  ): void {
    this.audioPromptCalled = true;
    const token = this.stepPromptToken;
    const speech = startGT000StepPromptSpeech(
      this.audio,
      step,
      () => {
        if (token === this.stepPromptToken) {
          this.stepPromptPending = false;
        }
      },
      (id) =>
        this.recordEvent("tts_unavailable", { lang: "vi-VN", asset_id: id })
    );
    this.stepPromptPending = speech.pending;
    this.stepPromptWaitedMs = 0;
    if (speech.spoke || speech.pending) {
      this.lastTtsUsed = speech.spoke;
    }
  }

  private playCardStepAudio(
    step: GT000Step & { action: "present" | "echo" },
    promptToSpeak?: string
  ): GT000Asset | undefined {
    this.audioPromptCalled = true;
    const asset = this.getAsset(step.target_asset_id);
    if (asset) {
      playGT000CardAudioWithFallback(
        this.audio,
        step,
        asset,
        this.speakAlong,
        promptToSpeak,
        () => this.renderItemStates.set(asset.asset_id, "selected"),
        (spoke) => {
          this.lastTtsUsed = spoke;
        },
        (id) => this.reportTtsUnavailable(id)
      );
    }
    return asset;
  }

  private replayTargetThenAsk(
    step: GT000Step & { action: "recognise" | "link" }
  ): void {
    this.rePresentSpotlight = {
      assetId: step.target_asset_id,
      timerMs: GT000_SPOTLIGHT_DURATION_MS,
    };
    const asset = this.getAsset(step.target_asset_id);
    if (!asset) {
      this.playStepPrompt(step);
      return;
    }
    this.releaseStepPrompt();
    this.stepPromptPending = true;
    const token = this.stepPromptToken;
    let askCalled = false;
    playGT000TargetThenAsk(
      this.audio,
      asset,
      this.speakAlong,
      () => {
        if (!askCalled && token === this.stepPromptToken) {
          askCalled = true;
          this.stepPromptPending = false;
          this.playStepPrompt(step);
        }
      },
      (spoke) => {
        this.lastTtsUsed = spoke;
      },
      (id) => this.reportTtsUnavailable(id)
    );
  }

  private reportTtsUnavailable(assetId: string): void {
    if (!this.ttsMissReported.has(assetId)) {
      this.ttsMissReported.add(assetId);
      this.recordEvent("tts_unavailable", { lang: "vi-VN", asset_id: assetId });
    }
  }

  private playEchoModel(step: GT000Step & { action: "echo" }): void {
    const asset = this.playCardStepAudio(step);
    if (asset) {
      this.recordEvent("intro_echo_started", {
        step_id: `step_${this.currentStepIndex}`,
        target_asset_id: asset.asset_id,
        tts_used: this.lastTtsUsed,
      });
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    const step = this.getCurrentStep();
    const res = resolveGT000GestureToAction(
      gesture,
      step,
      this.audioPromptCalled && !this.stepPromptPending,
      step ? this.collectRenderItems(step) : [],
      this.slots,
      this.logicSpace,
      this.selectedAssetId,
      this.renderItemStates
    );
    if (res.linkSelectionChanged) {
      this.selectedAssetId = res.nextSelectedAssetId;
      this.pointerHoverPoint = null;
    }
    return res.action;
  }

  validateAction(action: GameAction): ActionResult {
    return validateGT000SessionAction(
      action,
      this.getCurrentStep(),
      this.currentStepIndex,
      this.echoReplayCounts
    );
  }

  private advanceStep(): void {
    this.audio.stopAll();
    const prevSlot = this.slots[0];
    this.resetStepState();

    const currentSeg = this.normalizedSegments[this.currentSegmentIndex];
    this.currentStepIndex += 1;
    this.currentSegmentStepIndex += 1;
    if (currentSeg && this.currentSegmentStepIndex < currentSeg.steps.length) {
      this.updateCurrentStepLayout();
      return;
    }

    const totalMisses = computeGT000TotalMisses(this.missCounts);
    const segmentMisses = Math.max(0, totalMisses - this.segmentMissBaseline);
    this.segmentMissBaseline = totalMisses;
    if (currentSeg) {
      this.recordEvent("intro_segment_completed", {
        segment_id: currentSeg.segment_id,
        segment_index: this.currentSegmentIndex,
        miss_count: segmentMisses,
      });
      if (prevSlot) {
        spawnGT000AssetCelebration(
          this.particles,
          this.degradation?.particles_enabled !== false,
          [prevSlot],
          [],
          "",
          14
        );
      }
    }

    if (this.currentSegmentIndex + 1 < this.normalizedSegments.length) {
      this.currentSegmentIndex += 1;
      this.currentSegmentStepIndex = 0;
      this.audio.playPopCelebrateSound();
      this.emitSegmentStarted(this.currentSegmentIndex);
      this.updateCurrentStepLayout();
      return;
    }
    this.recordEvent("game_completed", {
      completed: true,
      total_steps: this.steps.length,
    });
    this.winSession();
  }

  prevStep(): void {
    if (this.currentStepIndex <= 0) {
      return;
    }
    this.audio.stopAll();
    this.resetStepState();
    this.currentStepIndex -= 1;
    const pos = syncSegmentCursorFromStepIndex(
      this.normalizedSegments,
      this.currentStepIndex
    );
    this.currentSegmentIndex = pos.segmentIndex;
    this.currentSegmentStepIndex = pos.segmentStepIndex;
    this.updateCurrentStepLayout();
  }

  override destroy(): void {
    this.audio.dispose();
    super.destroy();
  }

  override checkWinCondition(): boolean {
    return this.isWon || this.currentStepIndex >= this.steps.length;
  }

  override commit(action: GameAction): void {
    const step = this.getCurrentStep();
    if (!step) {
      return;
    }
    const payload = readGT000ActionPayload(action);
    switch (routeGT000Action(payload, step)) {
      case "prev":
        this.prevStep();
        return;
      case "replay_echo":
        this.applyStepAnswer(payload, step);
        return;
      case "replay_present":
        if (step.action === "present") {
          this.triggerCardBounce();
          this.playCardStepAudio(step, step.narration_line);
        }
        return;
      case "advance":
        if (step.action === "present") {
          this.applyStepAnswer(payload, step);
        } else {
          this.advanceStep();
        }
        return;
      default: {
        if (step.action === "link") {
          this.selectedAssetId = null;
          this.renderItemStates.clear();
          this.clearPointerOver();
        }
        const reaction = resolveGT000AnswerReaction(
          step,
          this.applyStepAnswer(payload, step)
        );
        if (reaction === "happy") {
          this.queueSfx("teacher_chime");
          this.mood.set("happy", GT000_HAPPY_MS);
        } else if (reaction === "listen") {
          this.mood.set("listen", GT000_LISTEN_MS);
        }
      }
    }
  }

  private applyStepAnswer(
    payload: Record<string, string | boolean | number>,
    step: GT000Step
  ): ActionResult {
    return handleGT000Action(step, payload, {
      currentStepIndex: this.currentStepIndex,
      echoReplayCounts: this.echoReplayCounts,
      missCounts: this.missCounts,
      deferredAssetIds: this.deferredAssetIds,
      renderItemStates: this.renderItemStates,
      recallAnswers: this.recallAnswers,
      requiresReintro: this.content.requires_reintro,
      lastTtsUsed: this.lastTtsUsed,
      recordEvent: (name, data) => this.recordEvent(name, data),
      playEchoModel: (s) => this.playEchoModel(s),
      onReplayCard: () => this.triggerCardBounce(),
      onCorrectAnswer: (assetId) =>
        spawnGT000AssetCelebration(
          this.particles,
          this.degradation?.particles_enabled !== false,
          this.slots,
          this.cachedStepAssets() ?? [],
          assetId
        ),
      onWrongTap: (assetId) => {
        this.tappedNudge = { assetId, timerMs: GT000_NUDGE_DURATION_MS };
      },
      replayTargetThenAsk: (s) => this.replayTargetThenAsk(s),
      advanceStep: () => this.advanceStep(),
      deferAdvance: () => {
        this.advancePending = true;
      },
    });
  }

  private cachedStepAssets(): readonly string[] | null {
    const s = this.getCurrentStep();
    if (!s) {
      return null;
    }
    this.ensureStepAssetsCached(s);
    return this.stepCache.assets;
  }

  override getHintTargetIndex(): number | null {
    const s = this.getCurrentStep();
    const assets = this.cachedStepAssets();
    return s && assets
      ? resolveGT000HintTargetIndex(s, assets, this.selectedAssetId)
      : null;
  }

  override getHintDestinationIndex(): number | null {
    const s = this.getCurrentStep();
    const assets = this.cachedStepAssets();
    return s && assets
      ? resolveGT000HintDestinationIndex(s, assets, this.selectedAssetId)
      : null;
  }

  private ensureStepAssetsCached(step: GT000Step): void {
    if (this.stepCache.stepIdx === this.currentStepIndex) {
      return;
    }
    this.stepCache = buildGT000StepCacheSnapshot(
      step,
      this.currentStepIndex,
      this.layoutSeed,
      this.difficulty,
      this.speakAlong,
      this.content.assets,
      this.renderItemStates
    );
  }

  private collectRenderItems(step: GT000Step, pure = false): RenderItem[] {
    if (this.stepCache.stepIdx !== this.currentStepIndex && !pure) {
      this.ensureStepAssetsCached(step);
    }
    return collectGT000DecoratedItems(
      step,
      this.currentStepIndex,
      this.stepCache,
      this.layoutSeed,
      this.difficulty,
      this.content.assets,
      this.renderItemStates,
      this.hoveredSlotIndex
    );
  }

  override getView(): EngineView {
    const step = this.getCurrentStep();
    if (step) {
      this.ensureStepAssetsCached(step);
    }
    return resolveGT000EngineView(
      step,
      step ? this.collectRenderItems(step) : [],
      this.slots,
      this.content.assets,
      this.logicSpace,
      this.stepCache.promptText
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const step = this.getCurrentStep();
    renderGT000Step(
      ctx,
      rs,
      buildGT000StepRenderOptions(
        rs,
        timeMs,
        this,
        step,
        this.stepCache,
        step ? this.collectRenderItems(step, true) : []
      )
    );
  }
}
