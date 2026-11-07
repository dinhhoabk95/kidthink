import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import type { RenderItem } from "#src/render/index.js";
import { AudioController } from "#src/systems/audio-controller";
import type { RenderSystem } from "#src/systems/render-system";
import {
  computeGlobalStepOffset,
  computeStepAssetIds,
  createRenderItem,
  evaluateGT000StepAnswer,
  findTappedItem,
  getStepItemCount,
  getStepPromptText,
  handleGT000Action,
  renderGT000Step,
  resolveNormalizedSegments,
  resolveStartSegmentIndex,
  routeGT000Action,
  STEP_PROMPT_SETTLE_TIMEOUT_MS,
  syncSegmentCursorFromStepIndex,
  toGT000ViewEntity,
} from "./step-renderers.js";
import {
  type GT000Asset,
  type GT000Content,
  type GT000Difficulty,
  type GT000Segment,
  type GT000Step,
  resolveSpeakAlong,
  type SpeakAlongMode,
} from "./template.js";

export class GT000Session extends TemplateGameSession<
  GT000Content,
  GT000Difficulty
> {
  currentStepIndex = 0;
  currentSegmentIndex = 0;
  currentSegmentStepIndex = 0;
  selectedAssetId: string | null = null;
  readonly missCounts = new Map<string, number>();
  readonly deferredAssetIds: string[] = [];
  readonly recallAnswers: { asset_id: string; correct: boolean }[] = [];
  /** Số lần trẻ bấm nghe lại ở từng bước tập nói — BR-CIR-22. */
  private readonly echoReplayCounts = new Map<string, number>();
  /**
   * Câu hỏi của bước (`prompt_line`) đang đọc — chạm chưa được chấm
   * (`BR-E000-12`). Token chặn `onEnd` của câu hỏi cũ mở cổng câu mới: đọc câu
   * mới `cancel()` câu cũ, và câu cũ báo `onEnd` ngay lúc đó.
   */
  private stepPromptPending = false;
  private stepPromptToken = 0;
  private stepPromptWaitedMs = 0;
  private wrongResetTimerMs = 0;

  readonly audio = new AudioController();
  audioPromptCalled = false;
  lastTtsUsed = false;

  private allSteps: GT000Step[] = [];
  private normalizedSegments: GT000Segment[] = [];
  private segmentMissBaseline = 0;
  private readonly initialResumeSegmentIndex?: number;
  private currentAgeBand: AgeBand = "3-4";

  private cachedStepIdx = -1;
  private cachedStepAssets: readonly string[] = [];
  private cachedStepPromptText = "";
  private cachedStepRenderItems: RenderItem[] = [];

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

  /**
   * Bậc "tập nói theo" đang áp dụng — trường thiếu là `off` (`BR-E000-11`).
   * Bề mặt chơi đọc getter này, Cấm — NEVER tự đọc `difficulty.speak_along`
   * rồi đoán mặc định riêng.
   */
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
    if (!seg) {
      return;
    }
    this.recordEvent("intro_segment_started", {
      segment_id: seg.segment_id,
      segment_index: segmentIndex,
      asset_count: seg.asset_ids.length,
      is_review: seg.is_review ?? false,
    });
  }

  private getTotalMissCount(): number {
    let total = 0;
    for (const count of this.missCounts.values()) {
      total += count;
    }
    return total;
  }

  private resetStepState(): void {
    this.renderItemStates.clear();
    this.selectedAssetId = null;
    this.cachedStepIdx = -1;
    this.cachedStepAssets = [];
    this.cachedStepPromptText = "";
    this.cachedStepRenderItems = [];
  }

  setupEntities(): void {
    this.isWon = false;
    this.missCounts.clear();
    this.deferredAssetIds.length = 0;
    this.recallAnswers.length = 0;
    this.echoReplayCounts.clear();
    this.wrongResetTimerMs = 0;
    this.audioPromptCalled = false;
    this.releaseStepPrompt();
    this.lastTtsUsed = false;
    this.segmentMissBaseline = 0;
    this.resetStepState();
    this.normalizedSegments = resolveNormalizedSegments(this.content);
    this.allSteps = this.normalizedSegments.flatMap((s) => s.steps);

    const startSegIdx = resolveStartSegmentIndex(
      this.initialResumeSegmentIndex,
      this.difficulty.resume_segment_index,
      this.content.resume_segment_index,
      this.normalizedSegments.length
    );
    this.currentSegmentIndex = startSegIdx;
    this.currentSegmentStepIndex = 0;
    this.currentStepIndex = computeGlobalStepOffset(
      this.normalizedSegments,
      startSegIdx
    );

    this.recordEvent("game_started", {
      template_code: "GT-000",
      total_steps: this.steps.length,
    });

    this.emitSegmentStarted(startSegIdx);
    this.updateCurrentStepLayout();
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    this.currentAgeBand = band;
    const step = this.getCurrentStep();
    if (!step) {
      return [];
    }
    const itemCount = getStepItemCount(step);
    const layoutId = itemCount <= 1 ? "single-focus" : "grid";
    return resolveLayout(layoutId)({
      slotCount: itemCount,
      ageBand: band,
      logic: this.logicSpace,
    });
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
    this.releaseStepPrompt();

    const targetId = step.target_asset_id;
    const assetKind = this.getAsset(targetId)?.kind ?? "glyph";

    this.recordEvent("intro_step_started", {
      step_id: `step_${this.currentStepIndex}`,
      action: step.action,
      target_asset_id: targetId,
      asset_kind: assetKind,
    });

    if (step.action === "present") {
      this.playPresentAudio(step);
    } else if (step.action === "echo") {
      this.playEchoModel(step);
    } else {
      this.playStepPrompt(step);
    }
  }

  /** Mở cổng câu hỏi của bước và vô hiệu mọi `onEnd` còn treo của câu cũ. */
  private releaseStepPrompt(): void {
    this.stepPromptToken++;
    this.stepPromptPending = false;
    this.stepPromptWaitedMs = 0;
  }

  /**
   * `false` khi câu hỏi của bước đang đọc — bề mặt chơi nuốt cử chỉ, engine
   * dừng đồng hồ trợ giúp (`BR-E000-12`, cùng hợp đồng `BR-PNR-11`).
   */
  override isAcceptingInput(): boolean {
    return !this.stepPromptPending;
  }

  /**
   * Trần chờ câu hỏi của bước: giọng treo không báo xong thì sau
   * `STEP_PROMPT_SETTLE_TIMEOUT_MS` vẫn mở cổng (`BR-PNR-09`).
   */
  update(deltaMs: number): void {
    if (this.wrongResetTimerMs > 0) {
      this.wrongResetTimerMs -= deltaMs;
      if (this.wrongResetTimerMs <= 0) {
        this.wrongResetTimerMs = 0;
        for (const [id, state] of this.renderItemStates) {
          if (state === "wrong") {
            this.renderItemStates.set(id, "idle");
          }
        }
      }
    }
    if (!this.stepPromptPending) {
      return;
    }
    this.stepPromptWaitedMs += deltaMs;
    if (this.stepPromptWaitedMs >= STEP_PROMPT_SETTLE_TIMEOUT_MS) {
      this.stepPromptPending = false;
    }
  }

  private playStepPrompt(
    step: GT000Step & { action: "recognise" | "link" | "recall" }
  ): void {
    this.audioPromptCalled = true;
    const promptText = step.prompt_line;
    if (!promptText) {
      return;
    }
    this.stepPromptPending = true;
    this.stepPromptWaitedMs = 0;
    const token = this.stepPromptToken;
    const spoke = this.audio.speakPrompt(promptText, () => {
      if (token === this.stepPromptToken) {
        this.stepPromptPending = false;
      }
    });
    this.lastTtsUsed = spoke;
    if (!spoke) {
      this.recordEvent("tts_unavailable", {
        lang: "vi-VN",
        asset_id: step.target_asset_id,
      });
    }
  }

  private playCardStepAudio(
    step: GT000Step & { action: "present" | "echo" },
    promptToSpeak?: string
  ): GT000Asset | undefined {
    this.audioPromptCalled = true;
    const asset = this.getAsset(step.target_asset_id);
    if (!asset) {
      return undefined;
    }

    if (asset.audio_path) {
      this.lastTtsUsed = false;
      this.audio.playPromptAudio(asset.audio_path);
    } else {
      const text =
        promptToSpeak ?? getStepPromptText(step, asset, this.speakAlong);
      const spoke = this.audio.speakPrompt(text, undefined, () => {
        this.renderItemStates.set(asset.asset_id, "selected");
      });
      this.lastTtsUsed = spoke;
      if (!spoke) {
        this.recordEvent("tts_unavailable", {
          lang: "vi-VN",
          asset_id: asset.asset_id,
        });
      }
    }
    return asset;
  }

  private playEchoModel(step: GT000Step & { action: "echo" }): void {
    const asset = this.playCardStepAudio(step);
    if (!asset) {
      return;
    }
    this.recordEvent("intro_echo_started", {
      step_id: `step_${this.currentStepIndex}`,
      target_asset_id: asset.asset_id,
      tts_used: this.lastTtsUsed,
    });
  }

  private playPresentAudio(step: GT000Step & { action: "present" }): void {
    this.playCardStepAudio(step, step.narration_line);
  }

  override getView(): EngineView {
    const step = this.getCurrentStep();
    if (!step) {
      return {
        entities: [],
        activePrompt: "Bé đã hoàn thành bài làm quen!",
      };
    }

    const renderItems = this.collectRenderItems(step);
    const isCard = step.action === "present" || step.action === "echo";
    const entities: ReturnType<typeof toGT000ViewEntity>[] = [];

    for (let i = 0; i < renderItems.length; i++) {
      const item = renderItems[i];
      const slot = this.slots[i];
      if (item && slot) {
        entities.push(
          toGT000ViewEntity(item, slot, i, isCard, this.getAsset(item.id))
        );
      }
    }

    return {
      entities,
      activePrompt: this.getStepPromptText(step),
    };
  }

  private resolveLinkTapAction(itemId: string): GameAction | null {
    if (this.selectedAssetId === null) {
      this.selectedAssetId = itemId;
      this.renderItemStates.set(itemId, "selected");
      return null;
    }
    if (this.selectedAssetId === itemId) {
      this.selectedAssetId = null;
      this.renderItemStates.delete(itemId);
      return null;
    }
    const sourceId = this.selectedAssetId;
    this.selectedAssetId = null;
    this.renderItemStates.delete(sourceId);
    return {
      type: "tap_item",
      data: {
        source_id: sourceId,
        target_id: itemId,
        item_id: itemId,
        asset_id: itemId,
      },
    };
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "commit") {
      const intent = gesture.intent ?? "advance";
      return {
        type: "tap_item",
        data: { intent },
      };
    }

    if (
      gesture.type !== "tap" ||
      !this.audioPromptCalled ||
      this.stepPromptPending
    ) {
      return null;
    }

    const step = this.getCurrentStep();
    if (!step) {
      return null;
    }

    const renderItems = this.collectRenderItems(step);
    const hit = findTappedItem(gesture, step, renderItems, this.slots);
    if (!hit) {
      return null;
    }

    if (hit.isLink) {
      return this.resolveLinkTapAction(hit.itemId);
    }

    return {
      type: "tap_item",
      data: {
        item_id: hit.itemId,
        asset_id: hit.itemId,
      },
    };
  }

  private readPayload(
    action: GameAction
  ): Record<string, string | boolean | number> {
    return typeof action.data === "object" && action.data !== null
      ? (action.data as Record<string, string | boolean | number>)
      : {};
  }

  validateAction(action: GameAction): ActionResult {
    const step = this.getCurrentStep();
    if (!step) {
      return ACTION_IGNORED;
    }

    const payload = this.readPayload(action);

    switch (routeGT000Action(payload, step)) {
      case "prev":
      case "replay_present":
      case "advance":
        return ACTION_CORRECT;
      case "replay_echo": {
        const used =
          this.echoReplayCounts.get(`step_${this.currentStepIndex}`) ?? 0;
        return used >= (step as GT000Step & { action: "echo" }).repeat_count
          ? ACTION_IGNORED
          : ACTION_CORRECT;
      }
      default:
        return evaluateGT000StepAnswer(payload, step);
    }
  }

  private advanceStep(): void {
    this.audio.stopAll();
    this.resetStepState();

    const currentSeg = this.normalizedSegments[this.currentSegmentIndex];
    this.currentStepIndex += 1;
    this.currentSegmentStepIndex += 1;

    const isSegmentDone =
      !currentSeg || this.currentSegmentStepIndex >= currentSeg.steps.length;
    if (!isSegmentDone) {
      this.updateCurrentStepLayout();
      return;
    }

    const totalMisses = this.getTotalMissCount();
    const segmentMisses = Math.max(0, totalMisses - this.segmentMissBaseline);
    this.segmentMissBaseline = totalMisses;

    if (currentSeg) {
      this.recordEvent("intro_segment_completed", {
        segment_id: currentSeg.segment_id,
        segment_index: this.currentSegmentIndex,
        miss_count: segmentMisses,
      });
    }

    if (this.currentSegmentIndex + 1 < this.normalizedSegments.length) {
      this.currentSegmentIndex += 1;
      this.currentSegmentStepIndex = 0;
      this.audio.playPopCelebrateSound();
      this.emitSegmentStarted(this.currentSegmentIndex);
      this.updateCurrentStepLayout();
      return;
    }

    this.isWon = true;
    this.recordEvent("game_completed", {
      completed: true,
      total_steps: this.steps.length,
    });
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

    const payload = this.readPayload(action);

    switch (routeGT000Action(payload, step)) {
      case "prev":
        this.prevStep();
        return;
      case "replay_echo":
        this.applyStepAnswer(payload, step);
        return;
      case "replay_present":
        this.playPresentAudio(step as GT000Step & { action: "present" });
        return;
      case "advance":
        this.advanceStep();
        return;
      default:
        this.applyStepAnswer(payload, step);
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
      advanceStep: () => this.advanceStep(),
      setWrongTimer: (ms) => {
        this.wrongResetTimerMs = ms;
      },
    });
  }

  override getHintTargetIndex(): number | null {
    const step = this.getCurrentStep();
    if (!step) {
      return null;
    }
    if (step.action === "present" || step.action === "echo") {
      return 0;
    }
    const ids = this.getStepAssetIds(step);
    const wanted =
      step.action === "link" ? step.source_asset_id : step.target_asset_id;
    const idx = ids.indexOf(wanted);
    return idx >= 0 ? idx : null;
  }

  private getStepPromptText(step: GT000Step): string {
    const asset = this.getAsset(step.target_asset_id);
    return getStepPromptText(step, asset, this.speakAlong);
  }

  private ensureStepAssetsCached(step: GT000Step): void {
    if (this.cachedStepIdx === this.currentStepIndex) {
      return;
    }
    const shouldShuffle =
      Reflect.get(this.difficulty, "shuffle_items") !== false;
    const ids = computeStepAssetIds(
      step,
      this.layoutSeed,
      this.currentStepIndex,
      shouldShuffle
    );
    this.cachedStepIdx = this.currentStepIndex;
    this.cachedStepAssets = ids;
    this.cachedStepPromptText = this.getStepPromptText(step);

    if (step.action === "present" || step.action === "echo") {
      const asset = this.getAsset(step.target_asset_id);
      this.cachedStepRenderItems = asset
        ? [createRenderItem(asset, "idle")]
        : [];
    } else {
      const renderItems: RenderItem[] = [];
      for (const id of ids) {
        const asset = this.getAsset(id);
        if (asset) {
          const state = this.renderItemStates.get(id) ?? "idle";
          renderItems.push(createRenderItem(asset, state));
        }
      }
      this.cachedStepRenderItems = renderItems;
    }
  }

  private getStepAssetIds(step: GT000Step): readonly string[] {
    this.ensureStepAssetsCached(step);
    return this.cachedStepAssets;
  }

  private collectRenderItems(step: GT000Step): RenderItem[] {
    this.ensureStepAssetsCached(step);
    return this.cachedStepRenderItems.map((item) => ({
      ...item,
      state: this.renderItemStates.get(item.id) ?? "idle",
    }));
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    const step = this.getCurrentStep();
    const renderItems = step ? this.collectRenderItems(step) : [];
    const promptText = step ? this.cachedStepPromptText : "";
    const targetAsset = step ? this.getAsset(step.target_asset_id) : undefined;

    renderGT000Step(ctx, rs, {
      themeId: this.themeId,
      step,
      promptText,
      conceptLabel: this.content.concept.label,
      renderItems,
      slots: this.slots,
      targetAsset,
    });
  }
}
