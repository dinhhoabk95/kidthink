import type { AgeBand } from "#src/contracts/types";
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
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT030Content, GT030Difficulty } from "./template.js";

interface GT030ActionPayload {
  readonly option_id?: string;
  readonly id?: string;
  readonly value?: number;
}

export class GT030Session extends TemplateGameSession<
  GT030Content,
  GT030Difficulty
> {
  degradation: DegradationState | null = null;
  placedUnitsCount = 0;
  selectedOptionId: string | null = null;
  isWin = false;

  private particles: Particle[] = [];

  setupEntities(): void {
    this.placedUnitsCount = 0;
    this.selectedOptionId = null;
    this.isWin = false;
    this.particles = [];
    this.recordEvent("game_started", {
      template_code: "GT-030",
      target_length: this.content.object.length_in_units,
      unit_id: this.content.unit.unit_id,
    });
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("measure-strip");
    return layoutFn({
      slotCount: this.content.answer_options.length,
      ageBand: band,
      targetCount: this.content.object.length_in_units,
    });
  }

  private validatePlaceAction(): ActionResult {
    if (this.placedUnitsCount >= this.content.object.length_in_units) {
      return ACTION_RETRY;
    }
    return ACTION_CORRECT;
  }

  private validateRemoveAction(): ActionResult {
    if (this.placedUnitsCount <= 0) {
      return ACTION_IGNORED;
    }
    return ACTION_CORRECT;
  }

  private validateOptionAction(data: GT030ActionPayload): ActionResult {
    if (this.placedUnitsCount < this.content.object.length_in_units) {
      return ACTION_RETRY;
    }

    const optionId =
      data.option_id ??
      data.id ??
      (data.value === undefined ? "" : `opt_${data.value}`);

    const option = this.content.answer_options.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );

    if (!option) {
      return ACTION_IGNORED;
    }

    return option.is_correct ? ACTION_CORRECT : ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT030ActionPayload;

    if (
      type === "place_unit" ||
      type === "tap_unit" ||
      type === "drag_unit" ||
      type === "snap_unit"
    ) {
      return this.validatePlaceAction();
    }

    if (type === "remove_unit" || type === "undo_unit") {
      return this.validateRemoveAction();
    }

    if (type === "select_option" || type === "choose_answer") {
      return this.validateOptionAction(data);
    }

    return ACTION_IGNORED;
  }

  private commitOptionSelection(data: GT030ActionPayload): void {
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount < targetLength) {
      return;
    }

    const optionId =
      data.option_id ??
      data.id ??
      (data.value === undefined ? "" : `opt_${data.value}`);

    const option = this.content.answer_options.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );

    if (!option) {
      return;
    }

    this.selectedOptionId = option.option_id;
    this.recordEvent("answer_selected", {
      option_id: option.option_id,
      value: option.value,
      is_correct: option.is_correct,
    });

    if (option.is_correct) {
      this.isWin = true;
      this.isWon = true;
      const optIndex = this.content.answer_options.indexOf(option);
      const slotIndex = 2 + targetLength + optIndex;
      const slot = this.slots[slotIndex];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 12));
      }
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
    }
  }

  override commit(action: GameAction): void {
    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT030ActionPayload;
    const targetLength = this.content.object.length_in_units;

    if (
      type === "place_unit" ||
      type === "tap_unit" ||
      type === "drag_unit" ||
      type === "snap_unit"
    ) {
      if (this.placedUnitsCount < targetLength) {
        this.placedUnitsCount++;
        this.recordEvent("unit_placed", {
          slot_index: this.placedUnitsCount,
          placed_count: this.placedUnitsCount,
          target_count: targetLength,
        });
      }
      return;
    }

    if (type === "remove_unit" || type === "undo_unit") {
      if (this.placedUnitsCount > 0) {
        const removedIndex = this.placedUnitsCount;
        this.placedUnitsCount--;
        this.selectedOptionId = null;
        this.recordEvent("unit_removed", {
          slot_index: removedIndex,
          placed_count: this.placedUnitsCount,
        });
      }
      return;
    }

    if (type === "select_option" || type === "choose_answer") {
      this.commitOptionSelection(data);
    }
  }

  private findTappedOption(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount < targetLength) {
      return null;
    }
    const hitTolerance = 24;
    for (let i = 0; i < this.content.answer_options.length; i++) {
      const opt = this.content.answer_options[i];
      const slotIndex = 2 + targetLength + i;
      const slot = this.slots[slotIndex];
      if (!(opt && slot)) {
        continue;
      }
      const hw = (slot.hitW ?? slot.w) / 2 + hitTolerance;
      const hh = (slot.hitH ?? slot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.x - slot.x) <= hw &&
        Math.abs(gesture.y - slot.y) <= hh
      ) {
        return {
          type: "select_option",
          data: { option_id: opt.option_id, value: opt.value },
        };
      }
    }
    return null;
  }

  private findTappedPlacedUnit(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const hitTolerance = 24;
    for (let i = 1; i <= this.placedUnitsCount; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      const hw = (slot.hitW ?? slot.w) / 2 + hitTolerance;
      const hh = (slot.hitH ?? slot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.x - slot.x) <= hw &&
        Math.abs(gesture.y - slot.y) <= hh
      ) {
        return {
          type: "remove_unit",
          data: {},
        };
      }
    }
    return null;
  }

  private findTappedSourceOrTarget(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const targetLength = this.content.object.length_in_units;
    const hitTolerance = 24;

    const sourceSlot = this.slots[1 + targetLength];
    if (sourceSlot) {
      const hw = (sourceSlot.hitW ?? sourceSlot.w) / 2 + hitTolerance;
      const hh = (sourceSlot.hitH ?? sourceSlot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.x - sourceSlot.x) <= hw &&
        Math.abs(gesture.y - sourceSlot.y) <= hh
      ) {
        return {
          type: "place_unit",
          data: {},
        };
      }
    }

    if (this.placedUnitsCount < targetLength) {
      const nextSlot = this.slots[1 + this.placedUnitsCount];
      if (nextSlot) {
        const hw = (nextSlot.hitW ?? nextSlot.w) / 2 + hitTolerance;
        const hh = (nextSlot.hitH ?? nextSlot.h) / 2 + hitTolerance;
        if (
          Math.abs(gesture.x - nextSlot.x) <= hw &&
          Math.abs(gesture.y - nextSlot.y) <= hh
        ) {
          return {
            type: "place_unit",
            data: {},
          };
        }
      }
    }

    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }

    return (
      this.findTappedOption(gesture) ??
      this.findTappedPlacedUnit(gesture) ??
      this.findTappedSourceOrTarget(gesture)
    );
  }

  private getOptionEntities(): ViewEntity[] {
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount < targetLength) {
      return [];
    }
    const entities: ViewEntity[] = [];
    for (let i = 0; i < this.content.answer_options.length; i++) {
      const opt = this.content.answer_options[i];
      const slotIndex = 2 + targetLength + i;
      const slot = this.slots[slotIndex];
      if (!(opt && slot)) {
        continue;
      }
      const isSelected = this.selectedOptionId === opt.option_id;
      let state: EntityVisual = "idle";
      if (isSelected) {
        state = opt.is_correct ? "correct" : "incorrect";
      }
      entities.push({
        id: opt.option_id,
        slotIndex,
        role: "target",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
    return entities;
  }

  override getView(): EngineView {
    const targetLength = this.content.object.length_in_units;
    const entities: ViewEntity[] = [];

    const objSlot = this.slots[0];
    if (objSlot) {
      entities.push({
        id: this.content.object.object_id,
        slotIndex: 0,
        role: "neutral",
        state: "idle",
        x: objSlot.x,
        y: objSlot.y,
        w: objSlot.w,
        h: objSlot.h,
      });
    }

    for (let i = 0; i < targetLength; i++) {
      const slot = this.slots[1 + i];
      if (!slot) {
        continue;
      }
      const isPlaced = i < this.placedUnitsCount;
      entities.push({
        id: `unit_slot_${i + 1}`,
        slotIndex: 1 + i,
        role: "target",
        state: isPlaced ? "active" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }

    const sourceSlot = this.slots[1 + targetLength];
    if (sourceSlot) {
      entities.push({
        id: this.content.unit.unit_id,
        slotIndex: 1 + targetLength,
        role: "source",
        state: "idle",
        x: sourceSlot.x,
        y: sourceSlot.y,
        w: sourceSlot.w,
        h: sourceSlot.h,
      });
    }

    entities.push(...this.getOptionEntities());

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  getPlacedUnitsCount(): number {
    return this.placedUnitsCount;
  }

  private renderObject(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    const objectSlot = this.slots[0];
    if (!objectSlot) {
      return;
    }

    drawSlotItem(
      ctx,
      rs,
      objectSlot,
      {
        id: this.content.object.object_id,
        asset: this.content.object.asset,
        label: "Vật cần đo",
        state: "idle",
      },
      "square"
    );
  }

  private renderStripUnits(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const targetLength = this.content.object.length_in_units;

    for (let i = 0; i < targetLength; i++) {
      const slot = this.slots[1 + i];
      if (!slot) {
        continue;
      }

      const isPlaced = i < this.placedUnitsCount;
      if (isPlaced) {
        drawSlotItem(
          ctx,
          rs,
          slot,
          {
            id: `placed_unit_${i + 1}`,
            asset: this.content.unit.asset,
            label: `${i + 1}`,
            state: "selected",
          },
          "square"
        );
      } else {
        drawSlotItem(
          ctx,
          rs,
          slot,
          {
            id: `empty_slot_${i + 1}`,
            text: "?",
            state: "idle",
          },
          "square"
        );
      }
    }
  }

  private renderTrayAndOptions(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const targetLength = this.content.object.length_in_units;
    drawWoodenTokenDock(ctx, rs);

    // Source unit in tray
    const sourceSlot = this.slots[1 + targetLength];
    if (sourceSlot) {
      drawSlotItem(
        ctx,
        rs,
        sourceSlot,
        {
          id: this.content.unit.unit_id,
          asset: this.content.unit.asset,
          label: "Chạm để xếp",
          state: "idle",
        },
        "circle"
      );
    }

    // Answer options
    if (this.placedUnitsCount < targetLength) {
      return;
    }

    for (let j = 0; j < this.content.answer_options.length; j++) {
      const opt = this.content.answer_options[j];
      const slot = this.slots[2 + targetLength + j];
      if (!(opt && slot)) {
        continue;
      }

      const isSelected = this.selectedOptionId === opt.option_id;
      let optState: ItemVisualState = "idle";
      if (isSelected) {
        optState = opt.is_correct ? "correct" : "wrong";
      }

      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: opt.option_id,
          text: String(opt.value),
          state: optState,
        },
        "square"
      );
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    drawPromptText(ctx, rs, this.content.prompt);

    const targetLength = this.content.object.length_in_units;
    const subPrompt =
      this.placedUnitsCount < targetLength
        ? `Đã đặt: ${this.placedUnitsCount}/${targetLength} đơn vị`
        : "Đã xếp kín dải đo! Vật dài bao nhiêu đơn vị?";
    drawSubPromptText(ctx, rs, subPrompt);

    this.renderObject(ctx, rs);
    this.renderStripUnits(ctx, rs);
    this.renderTrayAndOptions(ctx, rs);

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
