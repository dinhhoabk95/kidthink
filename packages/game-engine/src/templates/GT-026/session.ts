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
import {
  resolveAssetLabels,
  spokenKeywordForAsset,
} from "#src/labels/spoken-keyword";
import { resolveTouchFloor, SLOT_GAP_PX } from "#src/layout/constants";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize, splitCaption } from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import {
  drawPedestalTarget,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import {
  InhibitionSystem,
  type TrialItem,
} from "#src/systems/inhibition-system";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT026Content, GT026Difficulty } from "./template.js";

/** Nút "dừng" của lối không tính giờ: cạnh tối thiểu (còn theo sàn chạm). */
const STOP_PAD_MIN_PX = 72;
/** Chừa mép dưới sân khấu cho viền thân đất sét của nút dừng. */
const STOP_PAD_EDGE_PX = 8;
/** Tên và asset nút dừng — bàn tay giơ lên, không phải chữ (`BR-E026-09`). */
const STOP_PAD_ID = "stop-pad";
const STOP_PAD_ASSET = { kind: "emoji", ref: "✋" } as const;
/** Bội số nới ở bậc `L1` (cửa sổ) và `L2` (nhịp nghỉ); `L3` là không tính giờ. */
const LADDER_WIDEN_FACTOR = 1.5;
/** Số lượt `go` bỏ sót liên tiếp để lên bậc `L3`. */
const LADDER_UNTIMED_AT = 3;

export class GT026Session extends TemplateGameSession<
  GT026Content,
  GT026Difficulty
> {
  degradation: DegradationState | null = null;
  private lastFrameMs = 0;
  private readonly wrongFlash = new WrongFlash();

  override readonly usesPromptZone = true;

  /** Cửa sổ kích thích không chạy lúc câu dẫn còn đọc (`BR-E026-04`). */
  readonly holdsClockWhileInputClosed = true;

  private inhibitionSystem!: InhibitionSystem;
  private isInputOpen = true;
  /** Số lượt `go` bỏ sót liên tiếp — quyết định bậc thang hạ độ khó (`BR-E026-10`). */
  private consecutiveMissedGo = 0;

  isUntimed(): boolean {
    return this.inhibitionSystem?.isUntimed() === true;
  }

  getWindowMs(): number {
    return this.inhibitionSystem?.getStimulusWindowMs() ?? 0;
  }

  getIsiMs(): number {
    return this.inhibitionSystem?.getIsiMs() ?? 0;
  }

  /** Bậc thang hạ độ khó sau một lượt `go` bỏ sót: nới cửa sổ, giãn nhịp nghỉ, rồi không tính giờ. */
  private stepDownAfterMiss(): void {
    this.consecutiveMissedGo++;
    if (this.consecutiveMissedGo >= LADDER_UNTIMED_AT) {
      this.inhibitionSystem.makeUntimed();
    } else if (this.consecutiveMissedGo === 2) {
      this.inhibitionSystem.widenIsi(LADDER_WIDEN_FACTOR);
    } else {
      this.inhibitionSystem.widenStimulusWindow(LADDER_WIDEN_FACTOR);
    }
  }

  setInputOpen(isOpen: boolean): void {
    this.isInputOpen = isOpen;
  }

  /** Kích thích chỉ hiện khi chạm được (`BR-E026-04`). */
  private isStimulusVisible(): boolean {
    return this.isInputOpen && this.inhibitionSystem?.getState() === "stimulus";
  }

  override isTrialBased(): boolean {
    return true;
  }

  setupEntities(): void {
    this.isWon = false;
    this.wrongFlash.clear();
    this.lastFrameMs = 0;
    this.consecutiveMissedGo = 0;

    const trials: TrialItem[] = this.content.trials.map((t) => ({
      id: t.id,
      kind: t.kind,
    }));

    this.inhibitionSystem = new InhibitionSystem({
      trials,
      stimulusWindowMs: this.difficulty.stimulus_window_ms,
      isiMs: this.difficulty.isi_ms,
      untimed: this.difficulty.untimed,
    });

    this.recordEvent("round_started", {
      round_index: 0,
      total_trials: trials.length,
    });
  }

  getCurrentTrial() {
    return this.inhibitionSystem?.getCurrentTrial() ?? null;
  }

  getState() {
    return this.inhibitionSystem?.getState() ?? "finished";
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.inhibitionSystem || this.inhibitionSystem.isFinished()) {
      return ACTION_IGNORED;
    }
    if (this.inhibitionSystem.getState() !== "stimulus") {
      return ACTION_IGNORED;
    }
    const trial = this.inhibitionSystem.getCurrentTrial();
    if (!trial) {
      return ACTION_IGNORED;
    }

    if (
      action.type === "tap_stimulus" ||
      action.type === "tap_card" ||
      action.type === "select_item"
    ) {
      return trial.kind === "go" ? ACTION_CORRECT : ACTION_RETRY;
    }

    if (
      action.type === "pass" ||
      action.type === "skip" ||
      action.type === "confirm_nogo"
    ) {
      return trial.kind === "nogo" ? ACTION_CORRECT : ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  private handleTrialAction(actionType: "tap" | "pass"): ActionResult {
    if (!this.inhibitionSystem || this.inhibitionSystem.isFinished()) {
      return ACTION_IGNORED;
    }

    const result = this.inhibitionSystem.handleAction(actionType);
    if (!result) {
      return ACTION_IGNORED;
    }

    if (!result.isCorrect) {
      this.wrongFlash.trigger(this.lastFrameMs);
    }
    if (result.outcome === "hit") {
      this.consecutiveMissedGo = 0;
    }

    this.recordEvent("item_selected", {
      outcome: result.outcome,
      is_correct: result.isCorrect,
      action_type: actionType,
    });

    if (this.inhibitionSystem.isFinished()) {
      // Hết trials luôn đóng vòng; số lượt đúng chỉ vào telemetry.
      this.isWon = true;
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
    }

    return result.isCorrect ? ACTION_CORRECT : ACTION_RETRY;
  }

  onTapStimulus(): ActionResult {
    return this.handleTrialAction("tap");
  }

  onPass(): ActionResult {
    return this.handleTrialAction("pass");
  }

  // biome-ignore lint/suspicious/noConfusingVoidType: void needed for compatibility with update
  update(deltaMs: number): ActionResult | void | null {
    this.lastFrameMs += deltaMs;
    if (!this.inhibitionSystem || this.inhibitionSystem.isFinished()) {
      return null;
    }

    const verdict = this.inhibitionSystem.tick(deltaMs);

    if (this.inhibitionSystem.isFinished() && !this.isWon) {
      // BR-E026-05: hết trials luôn đóng vòng; số lượt đúng chỉ vào telemetry.
      this.isWon = true;
      this.recordEvent("round_completed", { round_index: 0 });
      this.completeSession();
    }

    if (verdict) {
      this.recordEvent("item_selected", {
        outcome: verdict.outcome,
        is_correct: verdict.isCorrect,
        action_type: "timeout_no_tap",
      });

      // Kìm được ở lượt nogo thì khen. Bỏ sót lượt go là trung tính (`BR-E026-08`):
      // không báo sai, không vào điểm — chỉ hạ độ khó cho lượt sau (`BR-E026-10`).
      if (verdict.outcome === "miss") {
        this.stepDownAfterMiss();
        return ACTION_IGNORED;
      }
      return verdict.isCorrect ? ACTION_CORRECT : ACTION_RETRY;
    }

    return null;
  }

  override checkWinCondition(): boolean {
    return this.isWon;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }
    if (this.inhibitionSystem?.getState() !== "stimulus") {
      return null;
    }
    // Lối không tính giờ: nhịn là bấm nút dừng, không phải chạm ra ngoài (`BR-E026-09`).
    const pad = this.slots[1];
    if (
      this.isUntimed() &&
      pad &&
      isPointInSlot(pad, gesture.x, gesture.y, "circle", TAP_TOLERANCE_PX)
    ) {
      return { type: "pass", data: {} };
    }
    const slot = this.slots[0];
    if (
      slot &&
      isPointInSlot(slot, gesture.x, gesture.y, "circle", TAP_TOLERANCE_PX)
    ) {
      return { type: "tap_stimulus", data: {} };
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "tap_stimulus" ||
      action.type === "tap_card" ||
      action.type === "select_item"
    ) {
      this.onTapStimulus();
    } else if (
      action.type === "pass" ||
      action.type === "skip" ||
      action.type === "confirm_nogo"
    ) {
      this.onPass();
    }
  }

  override getView(): EngineView {
    const slot = this.slots[0];
    const trial = this.inhibitionSystem?.getCurrentTrial();
    const isStimulus = this.isStimulusVisible();
    const entities: ViewEntity[] = [];

    const now = this.lastFrameMs;
    const isWrong = this.wrongFlash.isActive(now);

    if (slot && trial && isStimulus) {
      const stimulus =
        trial.kind === "go"
          ? this.content.go_stimulus
          : this.content.nogo_stimulus;
      const assetLabels = resolveAssetLabels(stimulus.asset);
      const spokenLabel =
        assetLabels.spokenLabel ??
        spokenKeywordForAsset({ kind: "text", text: stimulus.label });
      entities.push({
        id: trial.id,
        slotIndex: 0,
        role: "source",
        state: isWrong ? "incorrect" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        ...assetLabels,
        label: stimulus.label,
        ...(spokenLabel ? { spokenLabel } : {}),
      });
    }

    const pad = this.slots[1];
    if (pad && trial && isStimulus && this.isUntimed()) {
      entities.push({
        id: STOP_PAD_ID,
        slotIndex: 1,
        role: "source",
        state: "idle",
        x: pad.x,
        y: pad.y,
        w: pad.w,
        h: pad.h,
        ...resolveAssetLabels(STOP_PAD_ASSET),
        spokenLabel: "Dừng lại",
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override destroy(): void {
    super.destroy();
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon) {
      return null;
    }
    const trial = this.inhibitionSystem?.getCurrentTrial();
    if (!this.isStimulusVisible()) {
      return null;
    }
    if (trial?.kind === "go") {
      return 0;
    }
    return this.isUntimed() && this.slots[1] ? 1 : null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    const pad = Math.max(
      resolveTouchFloor(ageBand, this.cssPerLogic),
      STOP_PAD_MIN_PX
    );
    const body = this.stageRect ? splitCaption(this.stageRect).body : undefined;
    // Chừa chỗ cho nút dừng dưới kích thích: kích thích co lại chứ không chồng nút.
    const stimArea = body
      ? {
          ...body,
          h: Math.max(0, body.h - pad - STOP_PAD_EDGE_PX - SLOT_GAP_PX),
        }
      : undefined;
    const [stim] = insetDrawSize(
      layoutFn({
        slotCount: 1,
        ageBand,
        logic: this.logicSpace,
        stage: stimArea,
        cssPerLogic: this.cssPerLogic,
      }),
      stimArea ?? this.stageRect
    );
    if (!stim) {
      return [];
    }
    const padSlot: Slot = {
      index: 1,
      x: body ? Math.round(body.x + body.w / 2) : stim.x,
      y: body
        ? Math.round(body.y + body.h - pad / 2 - STOP_PAD_EDGE_PX)
        : Math.round(stim.y + stim.h / 2 + SLOT_GAP_PX + pad / 2),
      w: pad,
      h: pad,
      hitW: pad,
      hitH: pad,
      page: 0,
      role: "source",
    };
    return [stim, padSlot];
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const trial = this.inhibitionSystem.getCurrentTrial();

    if (
      !trial ||
      this.isInputOpen === false ||
      this.inhibitionSystem.getState() !== "stimulus"
    ) {
      return;
    }

    const stimulus =
      trial.kind === "go"
        ? this.content.go_stimulus
        : this.content.nogo_stimulus;
    drawSubPromptText(
      ctx,
      rs,
      stimulus.label,
      this.stageRect ? splitCaption(this.stageRect).caption : undefined
    );
    const slot = this.slots[0];
    if (slot) {
      const now = this.lastFrameMs;
      const isWrong = this.wrongFlash.isActive(now);
      const shakeX =
        isWrong && !rs.reducedMotion
          ? Math.sin(this.wrongFlash.elapsedMs(now) / 30) * 4
          : 0;
      const renderSlot = shakeX === 0 ? slot : { ...slot, x: slot.x + shakeX };
      drawPedestalTarget(ctx, renderSlot);
      const pad = this.slots[1];
      if (pad && this.isUntimed()) {
        drawSlotItem(ctx, rs, pad, {
          id: STOP_PAD_ID,
          asset: STOP_PAD_ASSET,
          state: "idle",
        });
      }
      drawSlotItem(ctx, rs, renderSlot, {
        id: trial.id,
        asset: stimulus.asset,
        state: isWrong ? "wrong" : "idle",
      });
    }
  }
}
