import type { AgeBand } from "#src/contracts/types";
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
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "../shared-render.js";
import type { GT030Content, GT030Difficulty } from "./template.js";

export class GT030Session extends TemplateGameSession<
  GT030Content,
  GT030Difficulty
> {
  slots: Slot[] = [];
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
    this.resolveSlots("5-6");
    this.recordEvent("game_started", {
      template_code: "GT-030",
      target_length: this.content.object.length_in_units,
      unit_id: this.content.unit.unit_id,
    });
  }

  resolveSlots(band: AgeBand): void {
    const layoutFn = resolveLayout("measure-strip");
    this.slots = layoutFn({
      slotCount: this.content.answer_options.length,
      ageBand: band,
      targetCount: this.content.object.length_in_units,
    });
  }

  private handlePlaceUnit(): ActionResult {
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount >= targetLength) {
      return ACTION_RETRY;
    }

    this.placedUnitsCount++;
    this.recordEvent("unit_placed", {
      slot_index: this.placedUnitsCount,
      placed_count: this.placedUnitsCount,
      target_count: targetLength,
    });

    return ACTION_CORRECT;
  }

  private handleRemoveUnit(): ActionResult {
    if (this.placedUnitsCount <= 0) {
      return ACTION_IGNORED;
    }

    const removedIndex = this.placedUnitsCount;
    this.placedUnitsCount--;
    this.selectedOptionId = null;
    this.recordEvent("unit_removed", {
      slot_index: removedIndex,
      placed_count: this.placedUnitsCount,
    });

    return ACTION_CORRECT;
  }

  private handleOptionSelection(data: Record<string, unknown>): ActionResult {
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount < targetLength) {
      return ACTION_RETRY;
    }

    const optionId =
      (data.option_id as string) ||
      (data.id as string) ||
      (data.value === undefined ? "" : `opt_${data.value}`);

    const option = this.content.answer_options.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );

    if (!option) {
      return ACTION_IGNORED;
    }

    this.selectedOptionId = option.option_id;
    this.recordEvent("answer_selected", {
      option_id: option.option_id,
      value: option.value,
      is_correct: option.is_correct,
    });

    if (option.is_correct) {
      this.isWin = true;
      const optIndex = this.content.answer_options.indexOf(option);
      const slotIndex = 2 + targetLength + optIndex;
      const slot = this.slots[slotIndex];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 12));
      }
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (action.data as Record<string, unknown>) ?? {};

    if (
      type === "place_unit" ||
      type === "tap_unit" ||
      type === "drag_unit" ||
      type === "snap_unit"
    ) {
      return this.handlePlaceUnit();
    }

    if (type === "remove_unit" || type === "undo_unit") {
      return this.handleRemoveUnit();
    }

    if (type === "select_option" || type === "choose_answer") {
      return this.handleOptionSelection(data);
    }

    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    return this.isWin;
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
    drawSceneBackground(ctx, rs);
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
