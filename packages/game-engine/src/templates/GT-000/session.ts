import {
  formatDisplayLabel,
  formatPromptLabel,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import {
  drawFlashcard,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  type ItemVisualState,
  type RenderAsset,
  type RenderItem,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import { AudioController } from "#src/systems/audio-controller";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type GT000Asset,
  type GT000Content,
  type GT000Difficulty,
  type GT000Segment,
  type GT000Step,
  resolveSpeakAlong,
  type SpeakAlongMode,
} from "./template.js";

/**
 * Trần chờ câu hỏi của bước đọc xong — cùng mốc `NARRATION_SETTLE_TIMEOUT_MS`
 * của câu dẫn vòng ở bề mặt chơi (`BR-E000-12`, `BR-PNR-09`).
 */
const STEP_PROMPT_SETTLE_TIMEOUT_MS = 12_000;

function resolveRenderAsset(asset: GT000Asset): RenderAsset | null {
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

function createRenderItem(
  asset: GT000Asset,
  state: ItemVisualState = "idle"
): RenderItem {
  return {
    id: asset.asset_id,
    label: formatDisplayLabel(asset.label, {
      value: asset.value,
      glyph: asset.glyph,
    }),
    text: asset.glyph ?? asset.text,
    asset: resolveRenderAsset(asset),
    state,
  };
}

function getStepItemCount(step: GT000Step): number {
  if (step.action === "recognise") {
    return 1 + step.distractor_asset_ids.length;
  }
  if (step.action === "link") {
    return 2;
  }
  if (step.action === "recall") {
    return step.option_asset_ids.length;
  }
  return 1;
}

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

  readonly audio = new AudioController();
  audioPromptCalled = false;
  lastTtsUsed = false;

  private allSteps: GT000Step[] = [];
  private normalizedSegments: GT000Segment[] = [];
  private segmentMissBaseline = 0;
  private readonly initialResumeSegmentIndex?: number;
  private currentAgeBand: AgeBand = "3-4";

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
      this.normalizedSegments = this.resolveNormalizedSegments();
    }
    return this.normalizedSegments;
  }

  get steps(): readonly GT000Step[] {
    if (this.allSteps.length === 0) {
      this.allSteps = this.segments.flatMap((s) => s.steps);
    }
    return this.allSteps;
  }

  private resolveNormalizedSegments(): GT000Segment[] {
    if (this.content.segments && this.content.segments.length > 0) {
      return [...this.content.segments];
    }
    return [
      {
        segment_id: "seg_1",
        asset_ids: this.content.assets.map((a) => a.asset_id),
        steps: [...(this.content.steps ?? [])],
        is_review: false,
      },
    ];
  }

  private resolveStartSegmentIndex(totalSegments: number): number {
    const raw =
      this.initialResumeSegmentIndex ??
      this.difficulty.resume_segment_index ??
      this.content.resume_segment_index ??
      0;
    if (!Number.isInteger(raw) || raw <= 0 || raw >= totalSegments) {
      return 0;
    }
    return raw;
  }

  private computeGlobalStepOffset(segmentIndex: number): number {
    let offset = 0;
    for (let i = 0; i < segmentIndex; i++) {
      offset += this.normalizedSegments[i]?.steps.length ?? 0;
    }
    return offset;
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

  private syncSegmentCursorFromStepIndex(globalStepIdx: number): void {
    let remaining = globalStepIdx;
    for (let i = 0; i < this.normalizedSegments.length; i++) {
      const len = this.normalizedSegments[i]?.steps.length ?? 0;
      if (remaining < len) {
        this.currentSegmentIndex = i;
        this.currentSegmentStepIndex = remaining;
        return;
      }
      remaining -= len;
    }
  }

  setupEntities(): void {
    this.isWon = false;
    this.selectedAssetId = null;
    this.missCounts.clear();
    this.deferredAssetIds.length = 0;
    this.recallAnswers.length = 0;
    this.echoReplayCounts.clear();
    this.renderItemStates.clear();
    this.audioPromptCalled = false;
    this.releaseStepPrompt();
    this.lastTtsUsed = false;
    this.segmentMissBaseline = 0;
    this.normalizedSegments = this.resolveNormalizedSegments();
    this.allSteps = this.normalizedSegments.flatMap((s) => s.steps);

    const startSegIdx = this.resolveStartSegmentIndex(
      this.normalizedSegments.length
    );
    this.currentSegmentIndex = startSegIdx;
    this.currentSegmentStepIndex = 0;
    this.currentStepIndex = this.computeGlobalStepOffset(startSegIdx);

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

  private getStepTargetAssetId(step: GT000Step): string {
    if (step.action === "link") {
      return step.target_asset_id;
    }
    return step.target_asset_id;
  }

  private updateCurrentStepLayout(): void {
    const step = this.getCurrentStep();
    if (!step) {
      return;
    }

    this.resolveSlots(this.currentAgeBand);
    this.releaseStepPrompt();

    const targetId = this.getStepTargetAssetId(step);
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
    if (!this.stepPromptPending) {
      return;
    }
    this.stepPromptWaitedMs += deltaMs;
    if (this.stepPromptWaitedMs >= STEP_PROMPT_SETTLE_TIMEOUT_MS) {
      this.stepPromptPending = false;
    }
  }

  /**
   * Đọc `prompt_line` của bước `recognise` · `link` · `recall` — trẻ chưa
   * đọc được chữ nên câu hỏi chỉ hiện trong khung câu hỏi (`getStepPromptText`)
   * không tới được trẻ nếu không có giọng đi kèm (Task #273, `BR-PNR-01`).
   * Chỉ có TTS ở đây: ba hành động này chưa có trường `audio_path` riêng
   * trong contract, khác `present`/`echo` đọc theo `asset.audio_path`.
   * Đóng cổng chấm chạm tới khi câu hỏi đọc xong (`BR-E000-12`).
   */
  private playStepPrompt(
    step: GT000Step & { action: "recognise" | "link" | "recall" }
  ): void {
    this.audioPromptCalled = true;
    const promptText = step.prompt_line;
    if (!promptText) {
      return;
    }
    // Bậc 3 (không có giọng): Cấm — NEVER im lặng hoàn toàn (BR-PNR-06), nhưng
    // KHÔNG sáng mục tiêu như `playPresentAudio`/`playEchoModel` làm — mục
    // tiêu ở đây LÀ đáp án của một câu hỏi (`recognise`/`recall`), sáng nó
    // lên là lộ đáp án trước khi trẻ chạm. Câu hỏi vẫn hiện trong khung chữ
    // (`getStepPromptText`) nên không thứ gì bị mất, chỉ mất kênh âm.
    this.stepPromptPending = true;
    this.stepPromptWaitedMs = 0;
    const token = this.stepPromptToken;
    // Không có giọng thì `speakPrompt` gọi `onEnd` ngay — cổng không đóng.
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

  /**
   * Phát mẫu cho bước tập nói theo — BR-CIR-23.
   *
   * Máy đọc, trẻ nói theo thành tiếng, rồi chạm để đi tiếp.
   * Cấm — NEVER mở micro, NEVER ghi âm, NEVER chấm phát âm.
   */
  private playEchoModel(step: GT000Step & { action: "echo" }): void {
    this.audioPromptCalled = true;
    const asset = this.getAsset(step.target_asset_id);
    if (!asset) {
      return;
    }

    if (asset.audio_path) {
      this.lastTtsUsed = false;
      this.audio.playPromptAudio(asset.audio_path);
    } else {
      const spokenTerm = formatSpokenLabel(asset.label, {
        value: asset.value,
        glyph: asset.glyph,
      });
      // Cue thay giọng dùng "selected" — Cấm — NEVER mượn "correct": trẻ sẽ học
      // rằng ô sáng nghĩa là "đã trả lời đúng".
      const spoke = this.audio.speakPrompt(spokenTerm, undefined, () => {
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

    this.recordEvent("intro_echo_started", {
      step_id: `step_${this.currentStepIndex}`,
      target_asset_id: asset.asset_id,
      tts_used: this.lastTtsUsed,
    });
  }

  private playPresentAudio(step: GT000Step & { action: "present" }): void {
    this.audioPromptCalled = true;
    const asset = this.getAsset(step.target_asset_id);
    if (!asset) {
      return;
    }

    if (asset.audio_path) {
      this.lastTtsUsed = false;
      this.audio.playPromptAudio(asset.audio_path);
    } else {
      const promptToSpeak =
        step.narration_line ??
        `Đây là ${formatPromptLabel(asset.label, {
          value: asset.value,
          glyph: asset.glyph,
        })}`;
      const spoke = this.audio.speakPrompt(promptToSpeak, undefined, () => {
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
  }

  private resolveItemState(
    state?: string
  ): "idle" | "selected" | "correct" | "incorrect" {
    if (state === "wrong") {
      return "incorrect";
    }
    if (state === "correct") {
      return "correct";
    }
    if (state === "selected") {
      return "selected";
    }
    return "idle";
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
    const entities: ViewEntity[] = [];

    for (let i = 0; i < renderItems.length; i++) {
      const item = renderItems[i];
      const slot = this.slots[i];
      if (item && slot) {
        const isCard = step.action === "present" || step.action === "echo";
        entities.push({
          id: item.id,
          slotIndex: i,
          role: "target",
          state: this.resolveItemState(item.state),
          x: slot.x,
          y: slot.y,
          w: isCard ? 350 : slot.w,
          h: isCard ? 320 : slot.h,
        });
      }
    }

    return {
      entities,
      activePrompt: this.getStepPromptText(step),
    };
  }

  private findTappedItem(
    gesture: Extract<Gesture, { type: "tap" }>,
    step: GT000Step
  ): GameAction | null {
    const renderItems = this.collectRenderItems(step);
    const hitTolerance = 24;

    for (let i = 0; i < renderItems.length; i++) {
      const item = renderItems[i];
      const slot = this.slots[i];
      if (!(item && slot)) {
        continue;
      }

      const isCard = step.action === "present" || step.action === "echo";
      const targetW = isCard ? 350 : slot.w;
      const targetH = isCard ? 320 : slot.h;
      const halfW = Math.max(slot.hitW, targetW) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, targetH) / 2 + hitTolerance;

      if (
        Math.abs(gesture.x - slot.x) <= halfW &&
        Math.abs(gesture.y - slot.y) <= halfH
      ) {
        return {
          type: "tap_item",
          data: {
            item_id: item.id,
            asset_id: item.id,
          },
        };
      }
    }

    return null;
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

    return this.findTappedItem(gesture, step);
  }

  private readPayload(
    action: GameAction
  ): Record<string, string | boolean | number> {
    return typeof action.data === "object" && action.data !== null
      ? (action.data as Record<string, string | boolean | number>)
      : {};
  }

  /**
   * Bảng định tuyến dùng chung cho `validateAction` (thuần) và `commit` (đổi state).
   * Một chỗ quyết định nhánh, hai chỗ dùng — tránh lệch nhau.
   */
  private routeAction(
    payload: Record<string, string | boolean | number>,
    step: GT000Step
  ): "prev" | "replay_echo" | "replay_present" | "advance" | "step" {
    if (payload.intent === "prev") {
      return "prev";
    }
    if (payload.intent === "replay") {
      if (step.action === "echo") {
        return "replay_echo";
      }
      if (step.action === "present") {
        return "replay_present";
      }
    }
    if (
      payload.intent === "advance" &&
      (step.action === "present" || step.action === "echo")
    ) {
      return "advance";
    }
    return "step";
  }

  /**
   * Chấm điểm THUẦN — Cấm — NEVER đổi state (hợp đồng `dispatch` bước 3).
   * Mọi thay đổi state nằm ở `commit`; `dispatch` gọi hàm này trước rồi mới gọi
   * `commit`, nên đổi state ở đây sẽ áp hai lần cho một gesture.
   */
  validateAction(action: GameAction): ActionResult {
    const step = this.getCurrentStep();
    if (!step) {
      return ACTION_IGNORED;
    }

    const payload = this.readPayload(action);

    switch (this.routeAction(payload, step)) {
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
        return this.evaluateStepAnswer(payload, step);
    }
  }

  /** Chấm đáp án của bước hiện tại, không đổi state. */
  private evaluateStepAnswer(
    payload: Record<string, string | boolean | number>,
    step: GT000Step
  ): ActionResult {
    switch (step.action) {
      case "present":
      case "echo":
      case "recall":
        return ACTION_CORRECT;
      case "recognise": {
        const selectedId = String(payload.item_id ?? payload.asset_id ?? "");
        return selectedId === step.target_asset_id
          ? ACTION_CORRECT
          : ACTION_RETRY;
      }
      case "link": {
        const sourceId = String(payload.source_id ?? "");
        const targetId = String(payload.target_id ?? "");
        const isMatch =
          (sourceId === step.source_asset_id &&
            targetId === step.target_asset_id) ||
          (sourceId === step.target_asset_id &&
            targetId === step.source_asset_id);
        return isMatch ? ACTION_CORRECT : ACTION_RETRY;
      }
      default:
        return ACTION_IGNORED;
    }
  }

  private handlePresentAction(
    _payload: Record<string, string | boolean | number>,
    _step: GT000Step & { action: "present" }
  ): ActionResult {
    this.recordEvent("intro_step_answered", {
      step_id: `step_${this.currentStepIndex}`,
      action: "present",
      answer_correct: true,
      miss_count: 0,
      tts_used: this.lastTtsUsed,
    });
    this.advanceStep();
    return ACTION_CORRECT;
  }

  /**
   * Bước tập nói theo không có đáp án để sai (BR-E000-10).
   *
   * `replay` là yêu cầu nghe lại; nó Cấm — NEVER đẩy step đi tiếp, và bị chặn
   * ở trần `repeat_count` (BR-CIR-22). Mọi thao tác khác là "bé nói xong rồi".
   */
  private handleEchoAction(
    payload: Record<string, string | boolean | number>,
    step: GT000Step & { action: "echo" }
  ): ActionResult {
    const stepId = `step_${this.currentStepIndex}`;

    if (payload.intent === "replay") {
      const used = this.echoReplayCounts.get(stepId) ?? 0;
      if (used >= step.repeat_count) {
        return ACTION_IGNORED;
      }
      this.echoReplayCounts.set(stepId, used + 1);
      this.playEchoModel(step);
      return ACTION_CORRECT;
    }

    this.recordEvent("intro_echo_completed", {
      step_id: stepId,
      target_asset_id: step.target_asset_id,
      replay_count: this.echoReplayCounts.get(stepId) ?? 0,
    });
    this.advanceStep();
    return ACTION_CORRECT;
  }

  private handleRecogniseAction(
    payload: Record<string, string | boolean | number>,
    step: GT000Step & { action: "recognise" }
  ): ActionResult {
    const selectedId = String(payload.item_id ?? payload.asset_id ?? "");
    const isCorrect = selectedId === step.target_asset_id;

    if (!isCorrect) {
      const misses = (this.missCounts.get(step.target_asset_id) ?? 0) + 1;
      this.missCounts.set(step.target_asset_id, misses);

      this.renderItemStates.set(selectedId, "wrong");

      if (
        misses >= 3 &&
        this.content.requires_reintro &&
        !this.deferredAssetIds.includes(step.target_asset_id)
      ) {
        this.deferredAssetIds.push(step.target_asset_id);
        this.recordEvent("intro_step_deferred", {
          step_id: `step_${this.currentStepIndex}`,
          reason: "miss_limit",
        });
        this.advanceStep();
        return ACTION_RETRY;
      }
      return ACTION_RETRY;
    }

    this.renderItemStates.set(selectedId, "correct");
    this.recordEvent("intro_step_answered", {
      step_id: `step_${this.currentStepIndex}`,
      action: "recognise",
      answer_correct: true,
      miss_count: this.missCounts.get(step.target_asset_id) ?? 0,
      tts_used: false,
    });
    this.advanceStep();
    return ACTION_CORRECT;
  }

  private handleLinkAction(
    payload: Record<string, string | boolean | number>,
    step: GT000Step & { action: "link" }
  ): ActionResult {
    const sourceId = String(payload.source_id ?? "");
    const targetId = String(payload.target_id ?? "");

    const isMatch =
      (sourceId === step.source_asset_id &&
        targetId === step.target_asset_id) ||
      (sourceId === step.target_asset_id && targetId === step.source_asset_id);

    if (!isMatch) {
      return ACTION_RETRY;
    }

    this.recordEvent("intro_step_answered", {
      step_id: `step_${this.currentStepIndex}`,
      action: "link",
      answer_correct: true,
      miss_count: 0,
      tts_used: false,
    });
    this.advanceStep();
    return ACTION_CORRECT;
  }

  private handleRecallAction(
    payload: Record<string, string | boolean | number>,
    step: GT000Step & { action: "recall" }
  ): ActionResult {
    const selectedId = String(payload.item_id ?? payload.asset_id ?? "");
    const isCorrect = selectedId === step.target_asset_id;

    this.recallAnswers.push({
      asset_id: step.target_asset_id,
      correct: isCorrect,
    });

    this.recordEvent("intro_recall_answered", {
      step_id: `step_${this.currentStepIndex}`,
      target_asset_id: step.target_asset_id,
      answer_correct: isCorrect,
    });

    this.advanceStep();
    return ACTION_CORRECT;
  }

  private advanceStep(): void {
    this.audio.stopAll();
    this.renderItemStates.clear();
    this.selectedAssetId = null;

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
    this.renderItemStates.clear();
    this.selectedAssetId = null;
    this.currentStepIndex -= 1;
    this.syncSegmentCursorFromStepIndex(this.currentStepIndex);
    this.updateCurrentStepLayout();
  }

  override destroy(): void {
    this.audio.dispose();
    super.destroy();
  }

  override checkWinCondition(): boolean {
    return this.isWon || this.currentStepIndex >= this.steps.length;
  }

  /**
   * Áp state cho một action đã được `validateAction` chấm.
   * `dispatch` gọi commit đúng một lần cho mỗi gesture, nên đây là chỗ duy nhất
   * được đẩy step / ghi event / phát audio.
   */
  override commit(action: GameAction): void {
    const step = this.getCurrentStep();
    if (!step) {
      return;
    }

    const payload = this.readPayload(action);

    switch (this.routeAction(payload, step)) {
      case "prev":
        this.prevStep();
        return;
      case "replay_echo":
        this.handleEchoAction(payload, step as GT000Step & { action: "echo" });
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
  ): void {
    switch (step.action) {
      case "present":
        this.handlePresentAction(payload, step);
        break;
      case "echo":
        this.handleEchoAction(payload, step);
        break;
      case "recognise":
        this.handleRecogniseAction(payload, step);
        break;
      case "link":
        this.handleLinkAction(payload, step);
        break;
      case "recall":
        this.handleRecallAction(payload, step);
        break;
      default:
        break;
    }
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
    const label = asset
      ? formatPromptLabel(asset.label, {
          value: asset.value,
          glyph: asset.glyph,
        })
      : "";
    const spokenLabel = asset
      ? formatSpokenLabel(asset.label, {
          value: asset.value,
          glyph: asset.glyph,
        })
      : "";

    if (step.action === "present") {
      return step.narration_line ?? `Đây là ${label}`;
    }
    if (step.action === "echo") {
      // `off`: `prompt_line` của bước echo là lời mời "nói theo" (325/325
      // bước trong corpus) — thay bằng câu trình bày (`BR-E000-11`).
      if (this.speakAlong === "off") {
        return `Đây là ${label}`;
      }
      return step.prompt_line ?? `Bé nói theo cô nhé: ${spokenLabel}`;
    }
    if (step.action === "recognise") {
      return step.prompt_line ?? `Bé hãy chỉ cho cô ${label} nhé!`;
    }
    if (step.action === "recall") {
      return step.prompt_line ?? `Đâu là ${label}?`;
    }
    if (step.action === "link") {
      return step.prompt_line ?? "Nối đối tượng tương ứng";
    }
    return "Đây là gì?";
  }

  private getStepAssetIds(step: GT000Step): string[] {
    if (step.action === "recognise") {
      // Xáo theo seed + bước: đặt mục tiêu luôn ở ô đầu thì trẻ học vị trí.
      return shuffle(
        [step.target_asset_id, ...step.distractor_asset_ids],
        deriveStream(this.layoutSeed * 31 + this.currentStepIndex, "items")
      );
    }
    if (step.action === "recall") {
      return step.option_asset_ids;
    }
    if (step.action === "link") {
      return [step.target_asset_id, step.source_asset_id];
    }
    return [];
  }

  private collectRenderItems(step: GT000Step): RenderItem[] {
    const renderItems: RenderItem[] = [];

    if (step.action === "present" || step.action === "echo") {
      const asset = this.getAsset(step.target_asset_id);
      if (asset) {
        renderItems.push(createRenderItem(asset, "idle"));
      }
      return renderItems;
    }

    const assetIds = this.getStepAssetIds(step);
    for (const id of assetIds) {
      const asset = this.getAsset(id);
      if (asset) {
        const state = this.renderItemStates.get(id) ?? "idle";
        renderItems.push(createRenderItem(asset, state));
      }
    }

    return renderItems;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);

    const step = this.getCurrentStep();
    if (!step) {
      drawPromptText(ctx, rs, "Bé đã hoàn thành bài làm quen!");
      return;
    }

    drawPromptText(ctx, rs, this.getStepPromptText(step));
    drawSubPromptText(ctx, rs, this.content.concept.label);

    const renderItems = this.collectRenderItems(step);
    const isCard = step.action === "present" || step.action === "echo";

    if (isCard) {
      const item = renderItems[0];
      const slot = this.slots[0];
      const asset = this.getAsset(step.target_asset_id);
      if (item && slot && asset) {
        drawFlashcard(ctx, rs, slot, asset, item.label);
      }
    } else {
      for (let i = 0; i < renderItems.length; i++) {
        const item = renderItems[i];
        const slot = this.slots[i];
        if (item && slot) {
          drawSlotItem(ctx, rs, slot, item);
        }
      }
    }
  }
}
