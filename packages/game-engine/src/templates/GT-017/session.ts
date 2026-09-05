import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import type { DegradationState } from "#src/systems/degradation";
import {
  type CubeCoord,
  computeTopView,
  countHiddenCubes,
  type RotationAngle,
  sortCubesForRender,
} from "#src/systems/isometric-system";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  sceneBox,
  updateParticles,
} from "../shared-render.js";
import { drawIsometricModel, insetBox } from "../shared-render-shapes.js";
import type { GT017Content, GT017Difficulty } from "./template.js";

function isPointInSlot(slot: Slot, x: number, y: number): boolean {
  const hw = (slot.hitW ?? slot.w) / 2;
  const hh = (slot.hitH ?? slot.h) / 2;
  return (
    x >= slot.x - hw && x <= slot.x + hw && y >= slot.y - hh && y <= slot.y + hh
  );
}

function findHitOptionId(
  slots: readonly Slot[],
  options: readonly { option_id: string }[],
  x: number,
  y: number
): string | null {
  for (let i = 0; i < options.length; i++) {
    const slot = slots[i];
    if (slot && isPointInSlot(slot, x, y)) {
      return options[i]?.option_id ?? null;
    }
  }
  return null;
}

export class BlockStackSession extends TemplateGameSession<
  GT017Content,
  GT017Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private currentRotation: RotationAngle = 0;
  private selectedOptionId: string | null = null;

  setupEntities(): void {
    this.currentRotation = 0;
    this.selectedOptionId = null;
    this.isWon = false;

    this.recordEvent("game_started", {
      template_code: "GT-017",
      cube_count: this.content.model.length,
      question: this.content.question,
    });
  }

  getModel(): readonly CubeCoord[] {
    return this.content.model;
  }

  getQuestion(): GT017Content["question"] {
    return this.content.question;
  }

  getOptions(): GT017Content["options"] {
    return this.content.options;
  }

  getCurrentRotation(): RotationAngle {
    return this.currentRotation;
  }

  getSelectedOptionId(): string | null {
    return this.selectedOptionId;
  }

  getRenderableCubes(): CubeCoord[] {
    return sortCubesForRender(this.content.model, this.currentRotation);
  }

  getTopView(): number[][] {
    return computeTopView(this.content.model);
  }

  getHiddenCubeCount(): number {
    return countHiddenCubes(this.content.model, this.currentRotation);
  }

  rotateModel(direction: "cw" | "ccw" = "cw"): RotationAngle {
    if (!this.difficulty.allow_rotate) {
      return this.currentRotation;
    }

    const angles: readonly RotationAngle[] = [0, 90, 180, 270];
    const currIdx = angles.indexOf(this.currentRotation);
    const nextIdx = direction === "cw" ? (currIdx + 1) % 4 : (currIdx + 3) % 4;

    this.currentRotation = angles[nextIdx] ?? 0;

    this.recordEvent("model_rotated", {
      angle: this.currentRotation,
      hidden_cubes_remaining: this.getHiddenCubeCount(),
    });

    return this.currentRotation;
  }

  selectOption(optionId: string): boolean {
    const opt = this.content.options.find((o) => o.option_id === optionId);
    if (!opt) {
      return false;
    }

    this.selectedOptionId = optionId;

    this.recordEvent("option_selected", {
      option_id: optionId,
      is_correct: opt.is_correct,
    });

    if (this.checkWinCondition()) {
      this.winSession();
    }

    return opt.is_correct;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "tap") {
      const optionSlots = this.slots.filter((s) => s.role === "source");
      const slotsToCheck = optionSlots.length > 0 ? optionSlots : this.slots;
      const hitId = findHitOptionId(
        slotsToCheck,
        this.content.options,
        gesture.x,
        gesture.y
      );
      return hitId ? { type: "select_option", data: hitId } : null;
    }
    if (gesture.type === "adjust" && this.difficulty.allow_rotate) {
      return {
        type: "rotate_model",
        data: gesture.delta > 0 ? "cw" : "ccw",
      };
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "select_option" && typeof action.data === "string") {
      this.selectOption(action.data);
      return;
    }
    if (
      action.type === "rotate_model" &&
      (action.data === "cw" || action.data === "ccw")
    ) {
      this.rotateModel(action.data);
    }
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "rotate_model") {
      return this.difficulty.allow_rotate ? ACTION_CORRECT : ACTION_IGNORED;
    }
    if (action.type === "select_option") {
      if (typeof action.data !== "string") {
        return ACTION_RETRY;
      }
      const opt = this.content.options.find((o) => o.option_id === action.data);
      return opt?.is_correct ? ACTION_CORRECT : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];

    const targetSlot =
      this.slots.find((s) => s.role === "target") ?? this.slots[0];
    if (targetSlot) {
      entities.push({
        id: "model-view",
        slotIndex: 0,
        role: "target",
        state: "idle",
        x: targetSlot.x,
        y: targetSlot.y,
        w: targetSlot.w,
        h: targetSlot.h,
      });
    }

    const optionSlots = this.slots.filter((s) => s.role === "source");
    const slotsToUse = optionSlots.length > 0 ? optionSlots : this.slots;

    this.content.options.forEach((opt, i) => {
      const slot = slotsToUse[i];
      if (slot) {
        const chosen = this.selectedOptionId === opt.option_id;
        let state: EntityVisual = "idle";
        if (chosen) {
          state = opt.is_correct ? "correct" : "incorrect";
        }
        entities.push({
          id: opt.option_id,
          slotIndex: i + 1,
          role: "source",
          state,
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
        });
      }
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override checkWinCondition(): boolean {
    if (!this.selectedOptionId) {
      return false;
    }
    const opt = this.content.options.find(
      (o) => o.option_id === this.selectedOptionId
    );
    return opt?.is_correct === true;
  }

  override destroy(): void {
    super.destroy();
    this.selectedOptionId = null;
    this.currentRotation = 0;
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("split-columns");
    return layoutFn({
      slotCount: this.content.options.length,
      targetCount: 1,
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
    const scene = insetBox(sceneBox(rs), 0.08);
    drawIsometricModel(
      ctx,
      { x: scene.x, y: scene.y, w: scene.w, h: scene.h * 0.6 },
      this.content.model,
      this.currentRotation
    );

    const optionSlots = this.slots.filter((s) => s.role === "source");
    this.content.options.forEach((opt, i) => {
      const slot = optionSlots[i] ?? this.slots[i];
      if (!slot) {
        return;
      }
      const chosen = this.selectedOptionId === opt.option_id;
      let state: "correct" | "wrong" | "idle" = "idle";
      if (chosen) {
        state = opt.is_correct ? "correct" : "wrong";
      }
      drawSlotItem(ctx, rs, slot, {
        id: opt.option_id,
        asset: opt.asset,
        state,
      });
    });
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

export const GT017Session = BlockStackSession;
export default BlockStackSession;
