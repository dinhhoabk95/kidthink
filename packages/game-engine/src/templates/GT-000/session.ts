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
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  type ItemVisualState,
  type RenderAsset,
  type RenderItem,
  updateParticles,
} from "#src/render/index.js";
import { AudioController } from "#src/systems/audio-controller";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type {
  GT000Asset,
  GT000Content,
  GT000Difficulty,
  GT000Step,
} from "./template.js";

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
    label: asset.label,
    text: asset.glyph ?? asset.text,
    asset: resolveRenderAsset(asset),
    state,
  };
}

const DIGIT_REGEX = /^\d+$/;

function drawFlashcardFrame(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  cardW: number,
  cardH: number
): void {
  // 1. Warm ambient drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(30, 27, 75, 0.12)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = designTokens.colors.surface[200];
  ctx.beginPath();
  ctx.roundRect(left, top, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 2. 3D bottom slab
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[200];
  ctx.beginPath();
  ctx.roundRect(left, top + 5, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 3. Main card white body
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.strokeStyle = designTokens.colors.surface[200];
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(left, top, cardW, cardH, 28);
  ctx.fill();
  ctx.stroke();

  // 4. White top specular highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left + 28, top + 4);
  ctx.lineTo(left + cardW - 28, top + 4);
  ctx.stroke();
  ctx.restore();
}

function drawNumberContent(
  ctx: CanvasRenderingContext2D,
  asset: GT000Asset,
  val: number,
  x: number,
  y: number,
  cardW: number
): void {
  // Large orange numeral
  ctx.save();
  ctx.font = `bold 100px ${designTokens.fonts.heading}`;
  ctx.fillStyle = designTokens.colors.cta[500];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(val), x, y - 50);
  ctx.restore();

  if (val === 0) {
    ctx.save();
    ctx.font = `18px ${designTokens.fonts.sans}`;
    ctx.fillStyle = designTokens.colors.surface[500];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("(Không có đồ vật nào)", x, y + 55);
    ctx.restore();
  } else {
    const itemEmoji =
      asset.image_ref?.kind === "emoji" &&
      asset.image_ref.ref &&
      !asset.image_ref.ref.includes("️⃣")
        ? asset.image_ref.ref
        : "⚽";

    const maxCount = Math.min(val, 10);
    const gap = Math.min(60, (cardW - 60) / maxCount);
    const startX = x - ((maxCount - 1) * gap) / 2;

    ctx.save();
    ctx.font = `44px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < maxCount; i++) {
      ctx.fillText(itemEmoji, startX + i * gap, y + 55);
    }
    ctx.restore();
  }

  // Label at bottom
  ctx.save();
  ctx.font = `bold 22px ${designTokens.fonts.sans}`;
  ctx.fillStyle = designTokens.colors.surface[700];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(asset.label, x, y + 115);
  ctx.restore();
}

function drawNonNumberContent(
  ctx: CanvasRenderingContext2D,
  asset: GT000Asset,
  x: number,
  y: number
): void {
  if (asset.image_ref?.kind === "emoji") {
    ctx.save();
    ctx.font = `84px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(asset.image_ref.ref, x, y - 25);
    ctx.restore();
  } else if (asset.glyph) {
    ctx.save();
    ctx.font = `bold 100px ${designTokens.fonts.heading}`;
    ctx.fillStyle = designTokens.colors.brand[600];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(asset.glyph, x, y - 25);
    ctx.restore();
  }

  ctx.save();
  ctx.font = `bold 24px ${designTokens.fonts.sans}`;
  ctx.fillStyle = designTokens.colors.surface[800];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(asset.label, x, y + 80);
  ctx.restore();
}

function drawFlashcard(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  slot: Slot,
  asset: GT000Asset
): void {
  const cardW = 350;
  const cardH = 320;
  const x = slot.x;
  const y = slot.y;
  const left = x - cardW / 2;
  const top = y - cardH / 2;

  drawFlashcardFrame(ctx, left, top, cardW, cardH);

  const hasDigit = Boolean(asset.glyph && DIGIT_REGEX.test(asset.glyph));
  const val =
    asset.value ??
    (hasDigit ? Number.parseInt(asset.glyph as string, 10) : undefined);

  if (val === undefined) {
    drawNonNumberContent(ctx, asset, x, y);
  } else {
    drawNumberContent(ctx, asset, val, x, y, cardW);
  }
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
  selectedAssetId: string | null = null;
  readonly missCounts = new Map<string, number>();
  readonly deferredAssetIds: string[] = [];
  readonly recallAnswers: { asset_id: string; correct: boolean }[] = [];
  /** Số lần trẻ bấm nghe lại ở từng bước tập nói — BR-CIR-22. */
  private readonly echoReplayCounts = new Map<string, number>();

  readonly audio = new AudioController();
  audioPromptCalled = false;
  lastTtsUsed = false;

  private allSteps: GT000Step[] = [];
  private renderParticles: Particle[] = [];
  private readonly renderItemStates = new Map<string, ItemVisualState>();
  private currentAgeBand: AgeBand = "3-4";

  get steps(): readonly GT000Step[] {
    if (this.allSteps.length === 0) {
      this.allSteps = [
        ...(this.content.steps ??
          this.content.segments?.flatMap((s) => s.steps) ??
          []),
      ];
    }
    return this.allSteps;
  }

  setupEntities(): void {
    this.isWon = false;
    this.currentStepIndex = 0;
    this.selectedAssetId = null;
    this.missCounts.clear();
    this.deferredAssetIds.length = 0;
    this.recallAnswers.length = 0;
    this.echoReplayCounts.clear();
    this.renderItemStates.clear();
    this.audioPromptCalled = false;
    this.lastTtsUsed = false;
    this.allSteps = [
      ...(this.content.steps ??
        this.content.segments?.flatMap((s) => s.steps) ??
        []),
    ];

    this.recordEvent("game_started", {
      template_code: "GT-000",
      total_steps: this.steps.length,
    });

    this.recordEvent("intro_segment_started", {
      segment_id: "seg_0",
      segment_index: 0,
      asset_count: this.content.assets.length,
      is_review: false,
    });

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
      this.audioPromptCalled = true;
    }
  }

  /**
   * Phát mẫu cho bước tập nói theo — BR-CIR-21.
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
      const spoke = this.audio.speakPrompt(asset.label);
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
      const spoke = this.audio.speakPrompt(asset.label);
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

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }

    // Chặn chạm cho tới khi lệnh phát âm thanh đã được gọi (BR-CIR-19)
    if (!this.audioPromptCalled) {
      return null;
    }

    const step = this.getCurrentStep();
    if (!step) {
      return null;
    }

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

  validateAction(action: GameAction): ActionResult {
    const step = this.getCurrentStep();
    if (!step) {
      return ACTION_IGNORED;
    }

    const payload =
      typeof action.data === "object" && action.data !== null
        ? (action.data as Record<string, string | boolean | number>)
        : {};

    if (payload.intent === "prev") {
      this.prevStep();
      return ACTION_CORRECT;
    }
    if (payload.intent === "replay") {
      if (step.action === "echo") {
        return this.handleEchoAction(payload, step);
      }
      if (step.action === "present") {
        this.playPresentAudio(step);
        return ACTION_CORRECT;
      }
    }
    if (
      payload.intent === "advance" &&
      (step.action === "present" || step.action === "echo")
    ) {
      this.advanceStep();
      return ACTION_CORRECT;
    }

    switch (step.action) {
      case "present":
        return this.handlePresentAction(payload, step);
      case "echo":
        return this.handleEchoAction(payload, step);
      case "recognise":
        return this.handleRecogniseAction(payload, step);
      case "link":
        return this.handleLinkAction(payload, step);
      case "recall":
        return this.handleRecallAction(payload, step);
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
    this.currentStepIndex += 1;
    if (this.currentStepIndex >= this.steps.length) {
      this.isWon = true;
      let totalMisses = 0;
      for (const count of this.missCounts.values()) {
        totalMisses += count;
      }
      this.recordEvent("intro_segment_completed", {
        segment_id: "seg_0",
        segment_index: 0,
        miss_count: totalMisses,
      });
      this.recordEvent("game_completed", {
        completed: true,
        total_steps: this.steps.length,
      });
    } else {
      this.updateCurrentStepLayout();
    }
  }

  prevStep(): void {
    if (this.currentStepIndex <= 0) {
      return;
    }
    this.audio.stopAll();
    this.renderItemStates.clear();
    this.selectedAssetId = null;
    this.currentStepIndex -= 1;
    this.updateCurrentStepLayout();
  }

  override destroy(): void {
    this.audio.stopAll();
    super.destroy();
  }

  override checkWinCondition(): boolean {
    return this.isWon || this.currentStepIndex >= this.steps.length;
  }

  private getStepPromptText(step: GT000Step): string {
    if (step.action === "present") {
      const label = this.getAsset(step.target_asset_id)?.label ?? "";
      return step.narration_line ?? `Đây là ${label}`;
    }
    if (step.action === "echo") {
      const label = this.getAsset(step.target_asset_id)?.label ?? "";
      return step.prompt_line ?? `Bé nói theo cô nhé: ${label}`;
    }
    if (step.action === "recognise") {
      const label = this.getAsset(step.target_asset_id)?.label ?? "";
      return step.prompt_line ?? `Bé hãy chỉ cho cô ${label}`;
    }
    if (step.action === "link") {
      return step.prompt_line ?? "Nối đối tượng tương ứng";
    }
    return step.prompt_line ?? "Đây là gì?";
  }

  private getStepAssetIds(step: GT000Step): string[] {
    if (step.action === "recognise") {
      return [step.target_asset_id, ...step.distractor_asset_ids];
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
    drawSceneBackground(ctx, rs);

    const step = this.getCurrentStep();
    if (!step) {
      drawPromptText(ctx, rs, "Bé đã hoàn thành bài làm quen!");
      return;
    }

    drawPromptText(ctx, rs, this.getStepPromptText(step));
    drawSubPromptText(ctx, rs, `Khái niệm: ${this.content.concept.label}`);

    const renderItems = this.collectRenderItems(step);
    const isCard = step.action === "present" || step.action === "echo";

    if (isCard) {
      const item = renderItems[0];
      const slot = this.slots[0];
      const asset = this.getAsset(step.target_asset_id);
      if (item && slot && asset) {
        drawFlashcard(ctx, rs, slot, asset);
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

    this.renderParticles = updateParticles(this.renderParticles);
  }
}
