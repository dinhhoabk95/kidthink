import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize } from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  drawCheckMark,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenPlate,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32.js";
import { shuffle } from "#src/rng/shuffle.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT002Content, GT002Difficulty } from "./template.js";

type TargetItem = GT002Content["items"][number];

export class GT002Session extends TemplateGameSession<
  GT002Content,
  GT002Difficulty
> {
  displayItems: readonly TargetItem[] = [];
  private readonly mechanic = new SelectionMechanic({ mode: "multi" });
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];

  /** Nút Xong ở `zones.action` (`BR-PSZ-05`); chỉ sáng khi đã chọn ít nhất một vật. */
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;
    this.particles = [];
    const rng = deriveStream(this.layoutSeed, "items");
    this.displayItems = shuffle(this.content.items, rng);
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("grid-2x4");
    return insetDrawSize(
      layoutFn({
        slotCount: this.displayItems.length,
        ageBand,
        logic: this.logicSpace,
        stage: this.stageRect,
        cssPerLogic: this.cssPerLogic,
      }),
      this.stageRect
    );
  }

  override canCommit(): boolean {
    return this.hasSelection();
  }

  private hasSelection(): boolean {
    return this.mechanic.getSelectedIds().length > 0;
  }

  getItemState(itemId: string): ItemVisualState {
    if (this.isWon) {
      const item = this.content.items.find((it) => it.item_id === itemId);
      if (item?.is_correct) {
        return "correct";
      }
    }
    if (this.mechanic.isSelected(itemId)) {
      return "selected";
    }
    return "idle";
  }

  toggleItemSelection(itemId: string): void {
    this.mechanic.toggle(itemId);
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "toggle_item") {
      const data = action.data as { item_id?: string } | undefined;
      const exists = this.content.items.some(
        (i) => i.item_id === data?.item_id
      );
      return exists ? { valid: true, feedback: "none" } : ACTION_IGNORED;
    }
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      isCorrect: i.is_correct,
    }));
    return this.mechanic.validate(action, items);
  }

  onSubmitSelection(): void {
    const { valid } = this.validateAction({
      type: "submit_selection",
      data: {},
    });
    this.recordEvent("selection_submitted", { is_correct: valid });
    if (valid) {
      for (const item of this.displayItems) {
        if (item.is_correct) {
          const idx = this.displayItems.indexOf(item);
          const slot = this.slots[idx];
          if (slot) {
            this.particles.push(...spawnParticlesAtSlot(slot, 6));
          }
        }
      }
      this.winSession();
    }
  }

  private toEntityState(rawState: ItemVisualState): ViewEntity["state"] {
    if (rawState === "correct") {
      return "correct";
    }
    if (rawState === "selected") {
      return "selected";
    }
    return "idle";
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];

    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.slots[i];
      if (!(item && slot)) {
        continue;
      }
      const rawState = this.getItemState(item.item_id);
      const state = this.toEntityState(rawState);
      const labels = resolveAssetLabels(item.asset);
      entities.push({
        id: item.item_id,
        slotIndex: i,
        role: "neutral",
        state,
        ...labels,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
    return {
      entities,
      activePrompt: this.content.prompt,
    };
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "commit") {
      // Chưa chọn vật nào thì nuốt cử chỉ: nút đang mờ (`N1`), Cấm — NEVER
      // tính một lần sai.
      return this.hasSelection()
        ? { type: "submit_selection", data: {} }
        : null;
    }
    if (gesture.type !== "tap") {
      return null;
    }

    const hitIndex = findHitSlotIndex(
      this.slots,
      gesture.x,
      gesture.y,
      "circle",
      TAP_TOLERANCE_PX
    );
    if (hitIndex >= 0 && hitIndex < this.displayItems.length) {
      const item = this.displayItems[hitIndex];
      if (item) {
        return {
          type: "toggle_item",
          data: { item_id: item.item_id },
        };
      }
    }

    return null;
  }

  override getHintTargetIndex(): number | null {
    const idx = this.displayItems.findIndex(
      (it) => it.is_correct && this.getItemState(it.item_id) !== "selected"
    );
    return idx >= 0 ? idx : null;
  }

  /** Chọn đủ vật đúng rồi thì bước kế là bấm Xong (`BR-PSZ-05`). */
  override getHintTarget(): HintTarget | null {
    const slotTarget = super.getHintTarget();
    if (slotTarget) {
      return slotTarget;
    }
    return this.canCommit() ? { kind: "action" } : null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "toggle_item" &&
      action.data &&
      typeof action.data === "object" &&
      "item_id" in action.data
    ) {
      const itemId = String((action.data as { item_id: unknown }).item_id);
      this.toggleItemSelection(itemId);
    } else if (action.type === "submit_selection") {
      this.onSubmitSelection();
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const slots = this.slots;
    drawSceneBackground(ctx, rs, this.themeId);
    this.drawInteractive(rs, ctx, slots);
    this.drawFeedback(rs, ctx, timeMs);
  }

  private drawInteractive(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[]
  ): void {
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = slots[i];
      if (!(slot && item)) {
        continue;
      }
      const state = this.getItemState(item.item_id);
      const isSelected = state === "selected" || state === "correct";
      drawWoodenPlate(ctx, slot, isSelected);
      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: item.item_id,
          asset: item.asset,
          state,
        },
        "circle"
      );
      if (state === "selected") {
        drawCheckMark(ctx, slot);
      }
    }
  }

  private drawFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    _timeMs: number
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    this.particles = updateParticles(this.particles);
    rs.drawParticles(ctx, this.particles);
  }
}

export default GT002Session;
