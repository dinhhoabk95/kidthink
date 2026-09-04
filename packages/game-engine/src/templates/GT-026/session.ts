import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import type { DegradationState } from "#src/systems/degradation";
import {
  InhibitionSystem,
  type TrialItem,
} from "#src/systems/inhibition-system";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawProgressBadge,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  type ItemVisualState,
  updateParticles,
} from "../shared-render.js";
import { drawPedestalTarget } from "../shared-render-shapes.js";
import type { GT026Content, GT026Difficulty } from "./template.js";

export class GT026Session extends TemplateGameSession<
  GT026Content,
  GT026Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private inhibitionSystem!: InhibitionSystem;

  setupEntities(): void {
    this.isWon = false;

    const trials: TrialItem[] = this.content.trials.map((t) => ({
      id: t.id,
      kind: t.kind,
    }));

    this.inhibitionSystem = new InhibitionSystem({
      trials,
      stimulusWindowMs: this.difficulty.stimulus_window_ms,
      isiMs: this.difficulty.isi_ms,
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
    switch (action.type) {
      case "tap_stimulus":
      case "tap_card":
      case "select_item": {
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
        return trial.kind === "go" ? ACTION_CORRECT : ACTION_RETRY;
      }
      default:
        return ACTION_IGNORED;
    }
  }

  onTapStimulus(): ActionResult {
    if (!this.inhibitionSystem || this.inhibitionSystem.isFinished()) {
      return ACTION_IGNORED;
    }

    const result = this.inhibitionSystem.handleAction();
    if (!result) {
      return ACTION_IGNORED;
    }

    this.recordEvent("item_selected", {
      outcome: result.outcome,
      is_correct: result.isCorrect,
      action_type: "tap",
    });

    if (this.inhibitionSystem.isFinished()) {
      this.isWon =
        this.inhibitionSystem.getCorrectCount() >=
        Math.ceil(this.content.trials.length * 0.6);
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
    }

    return result.isCorrect ? ACTION_CORRECT : ACTION_RETRY;
  }

  // biome-ignore lint/suspicious/noConfusingVoidType: void needed for compatibility with update
  update(deltaMs: number): ActionResult | void | null {
    if (!this.inhibitionSystem || this.inhibitionSystem.isFinished()) {
      return null;
    }

    const verdict = this.inhibitionSystem.tick(deltaMs);

    if (this.inhibitionSystem.isFinished() && !this.isWon) {
      this.isWon =
        this.inhibitionSystem.getCorrectCount() >=
        Math.ceil(this.content.trials.length * 0.6);
      this.recordEvent("round_completed", { round_index: 0 });
      this.completeSession();
    }

    if (verdict) {
      this.recordEvent("item_selected", {
        outcome: verdict.outcome,
        is_correct: verdict.isCorrect,
        action_type: "timeout_no_tap",
      });

      // Phát phản hồi cho phán quyết không-hành-động (BR-TGB-04, BR-TGB-05)
      return verdict.isCorrect ? ACTION_CORRECT : ACTION_RETRY;
    }

    return null;
  }

  override checkWinCondition(): boolean {
    return this.isWon;
  }

  override destroy(): void {
    // cleanup
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    return layoutFn({
      slotCount: 1,
      ageBand,
    });
  }

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getRenderItemState(itemId: string): ItemVisualState {
    return this.renderItemStates.get(itemId) ?? "idle";
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    const trial = this.inhibitionSystem.getCurrentTrial();
    drawProgressBadge(
      ctx,
      rs,
      this.inhibitionSystem.getCurrentTrialIndex(),
      this.inhibitionSystem.getTotalTrials()
    );

    if (!trial || this.inhibitionSystem.getState() !== "stimulus") {
      // Khoảng nghỉ giữa hai lượt: màn phải trống, đó là phần của bài kiểm ức chế.
      this.drawRenderFeedback(rs, ctx);
      return;
    }

    const stimulus =
      trial.kind === "go"
        ? this.content.go_stimulus
        : this.content.nogo_stimulus;
    drawSubPromptText(ctx, rs, stimulus.label);
    const slot = this.slots[0];
    if (slot) {
      drawPedestalTarget(ctx, slot);
      drawSlotItem(ctx, rs, slot, {
        id: trial.id,
        asset: stimulus.asset,
      });
    }
    this.drawRenderFeedback(rs, ctx);
  }

  private drawRenderFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    this.renderParticles = updateParticles(this.renderParticles);
    rs.drawParticles(ctx, this.renderParticles);
  }
}
