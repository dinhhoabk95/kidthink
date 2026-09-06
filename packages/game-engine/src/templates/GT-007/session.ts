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
  drawEmptyTargetSlot,
  drawMatchLine,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT007Content, GT007Difficulty } from "./template.js";

function extractOptionId(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && "option_id" in data) {
    const val = Reflect.get(data, "option_id");
    return typeof val === "string" ? val : undefined;
  }
  return undefined;
}

export class GT007Session extends TemplateGameSession<
  GT007Content,
  GT007Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();
  private stagedOptionId: string | null = null;

  filledParts: Map<string, number> = new Map();

  setupEntities(): void {
    this.filledParts.clear();
    this.stagedOptionId = null;
    this.isWon = false;
  }

  getStagedOptionId(): string | null {
    return this.stagedOptionId;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "fill_part" || action.type === "tap_option") {
      const optionId = extractOptionId(action.data);
      const option = this.content.options.find((o) => o.id === optionId);

      if (!option) {
        return ACTION_RETRY;
      }

      if (option.is_correct) {
        return ACTION_CORRECT;
      }

      return ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  private getTargetPartId(): string {
    const targetPart = this.content.parts.find((p) => p.is_target);
    return targetPart ? targetPart.id : (this.content.parts[0]?.id ?? "part_0");
  }

  onPartFilled(optionId: string, partId?: string): void {
    const targetId = partId ?? this.getTargetPartId();
    const option = this.content.options.find((o) => o.id === optionId);
    if (!option) {
      return;
    }

    this.recordEvent("bond_selected", {
      option_id: optionId,
      part_id: targetId,
      is_correct: option.is_correct,
    });

    if (option.is_correct) {
      this.filledParts.set(targetId, option.value);
      this.recordEvent("part_filled", {
        part_id: targetId,
        value: option.value,
      });

      if (this.checkWinCondition()) {
        this.winSession();
      }
    }
  }

  override checkWinCondition(): boolean {
    const targetParts = this.content.parts.filter((p) => p.is_target);
    if (targetParts.length === 0) {
      return true;
    }

    return targetParts.every((tp) => {
      const filledVal = this.filledParts.get(tp.id);
      return filledVal === tp.value;
    });
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("number-bond-tree");
    return layoutFn({
      slotCount: this.content.options.length,
      targetCount: this.content.parts.length,
      ageBand,
    });
  }

  private findDraggedOption(
    gesture: Extract<Gesture, { type: "drop" }>,
    sources: readonly Slot[],
    hitTolerance: number
  ): GT007Content["options"][number] | null {
    for (let i = 0; i < this.content.options.length; i++) {
      const slot = sources[i];
      const opt = this.content.options[i];
      if (!(slot && opt)) {
        continue;
      }
      const halfW = Math.max(slot.hitW, slot.w) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.fromX - slot.x) <= halfW &&
        Math.abs(gesture.fromY - slot.y) <= halfH
      ) {
        return opt;
      }
    }
    return null;
  }

  private findTargetPart(
    x: number,
    y: number,
    targets: readonly Slot[],
    hitTolerance: number
  ): GT007Content["parts"][number] | null {
    for (let i = 0; i < this.content.parts.length; i++) {
      const part = this.content.parts[i];
      const slot = targets[i + 1];
      if (!(part && slot)) {
        continue;
      }
      if (!part.is_target || this.filledParts.has(part.id)) {
        continue;
      }
      const halfW = Math.max(slot.hitW, slot.w, 100) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h, 100) / 2 + hitTolerance;
      if (Math.abs(x - slot.x) <= halfW && Math.abs(y - slot.y) <= halfH) {
        return part;
      }
    }
    return null;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const opt = this.findDraggedOption(gesture, sources, hitTolerance);
    if (!opt) {
      return null;
    }
    const part = this.findTargetPart(
      gesture.toX,
      gesture.toY,
      targets,
      hitTolerance
    );
    if (!part) {
      return null;
    }
    return {
      type: "fill_part",
      data: {
        option_id: opt.id,
        part_id: part.id,
      },
    };
  }

  private handleTapTarget(
    gesture: Extract<Gesture, { type: "tap" }>,
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    if (!this.stagedOptionId) {
      return null;
    }
    const part = this.findTargetPart(
      gesture.x,
      gesture.y,
      targets,
      hitTolerance
    );
    if (!part) {
      return null;
    }
    return {
      type: "fill_part",
      data: {
        option_id: this.stagedOptionId,
        part_id: part.id,
      },
    };
  }

  private handleTapSource(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    hitTolerance: number
  ): void {
    for (let i = 0; i < this.content.options.length; i++) {
      const slot = sources[i];
      const opt = this.content.options[i];
      if (!(slot && opt)) {
        continue;
      }
      const halfW = Math.max(slot.hitW, slot.w) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.x - slot.x) <= halfW &&
        Math.abs(gesture.y - slot.y) <= halfH
      ) {
        if (this.stagedOptionId === opt.id) {
          this.stagedOptionId = null;
        } else {
          this.stagedOptionId = opt.id;
        }
        return;
      }
    }
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const targetAction = this.handleTapTarget(gesture, targets, hitTolerance);
    if (targetAction) {
      return targetAction;
    }
    this.handleTapSource(gesture, sources, hitTolerance);
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    const hitTolerance = 24;
    const sources = this.sourceSlots;
    const targets = this.targetSlots;

    if (gesture.type === "drop") {
      return this.toDropAction(gesture, sources, targets, hitTolerance);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, sources, targets, hitTolerance);
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "fill_part" &&
      action.data &&
      typeof action.data === "object"
    ) {
      const data = action.data as { option_id?: string; part_id?: string };
      if (data.option_id) {
        this.onPartFilled(data.option_id, data.part_id);
        this.stagedOptionId = null;
      }
    }
  }

  private toOptionEntityState(
    optId: string,
    rawState: ItemVisualState
  ): ViewEntity["state"] {
    if (this.stagedOptionId === optId || rawState === "selected") {
      return "selected";
    }
    if (rawState === "correct") {
      return "correct";
    }
    if (rawState === "wrong") {
      return "incorrect";
    }
    return "idle";
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const targets = this.targetSlots;
    const sources = this.sourceSlots;

    const wholeSlot = targets[0];
    if (wholeSlot) {
      entities.push({
        id: this.content.whole.id,
        slotIndex: this.slots.indexOf(wholeSlot),
        role: "target",
        state: "idle",
        x: wholeSlot.x,
        y: wholeSlot.y,
        w: wholeSlot.w,
        h: wholeSlot.h,
      });
    }

    this.content.parts.forEach((part, i) => {
      const slot = targets[i + 1];
      if (!slot) {
        return;
      }
      const isFilled = this.filledParts.has(part.id);
      entities.push({
        id: part.id,
        slotIndex: this.slots.indexOf(slot),
        role: "target",
        state: isFilled ? "correct" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    });

    this.content.options.forEach((opt, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const rawState = this.getRenderItemState(opt.id);
      entities.push({
        id: opt.id,
        slotIndex: this.slots.indexOf(slot),
        role: "source",
        state: this.toOptionEntityState(opt.id, rawState),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    });

    return {
      entities,
      activePrompt: this.content.prompt,
    };
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
    drawSceneBackground(ctx, rs, this.themeId);
    drawPromptText(ctx, rs, this.content.prompt);
    const targets = this.targetSlots;
    const sources = this.sourceSlots;

    // Slot 0 của number-bond-tree là ô tổng, các ô sau là nhánh.
    const wholeSlot = targets[0];
    if (wholeSlot) {
      this.content.parts.forEach((_, i) => {
        const slot = targets[i + 1];
        if (slot) {
          drawMatchLine(
            ctx,
            wholeSlot.x,
            wholeSlot.y,
            slot.x,
            slot.y,
            designTokens.colors.montessori.woodBevel
          );
        }
      });
      drawSlotItem(ctx, rs, wholeSlot, {
        id: this.content.whole.id,
        text: String(this.content.whole.value),
        label: this.content.whole.label,
      });
    }

    this.content.parts.forEach((part, i) => {
      const slot = targets[i + 1];
      if (!slot) {
        return;
      }
      const filled = this.filledParts.get(part.id);
      if (part.is_target && filled === undefined) {
        drawEmptyTargetSlot(ctx, slot);
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: part.id,
        text: String(filled ?? part.value),
        label: part.label,
        state: filled === undefined ? "idle" : "correct",
      });
    });

    this.content.options.forEach((opt, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: opt.id,
        text: String(opt.value),
        state: this.getRenderItemState(opt.id),
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

export default GT007Session;
