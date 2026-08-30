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
import {
  type BalanceState,
  computeTiltAngle,
  getBalanceState,
  sumWeights,
  type WeightedItem,
} from "#src/systems/balance-system";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  sceneBox,
  updateParticles,
} from "../shared-render.js";
import {
  drawBalanceScale,
  drawPanItems,
  insetBox,
} from "../shared-render-shapes.js";
import type { GT014Content, GT014Difficulty } from "./template.js";

export class BalanceScaleSession extends TemplateGameSession<
  GT014Content,
  GT014Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private leftItems: WeightedItem[] = [];
  private rightItems: WeightedItem[] = [];
  private trayItems: WeightedItem[] = [];
  private selectedSide: "left" | "right" | null = null;

  setupEntities(): void {
    this.leftItems = [...this.content.left_pan];
    this.rightItems = [...this.content.right_pan];
    this.trayItems = [...this.content.tray];
    this.selectedSide = null;
    this.isWon = false;

    this.recordEvent("game_started", {
      template_code: "GT-014",
      goal: this.content.goal,
      initial_tilt: this.getTiltAngle(),
    });
  }

  getLeftItems(): readonly WeightedItem[] {
    return this.leftItems;
  }

  getRightItems(): readonly WeightedItem[] {
    return this.rightItems;
  }

  getTrayItems(): readonly WeightedItem[] {
    return this.trayItems;
  }

  getLeftWeight(): number {
    return sumWeights(this.leftItems);
  }

  getRightWeight(): number {
    return sumWeights(this.rightItems);
  }

  getTiltAngle(): number {
    return computeTiltAngle(this.getLeftWeight(), this.getRightWeight());
  }

  getBalanceState(): BalanceState {
    return getBalanceState(this.getLeftWeight(), this.getRightWeight());
  }

  placeItem(itemId: string, targetPan: "left" | "right"): boolean {
    const idx = this.trayItems.findIndex((t) => t.item_id === itemId);
    if (idx === -1) {
      return false;
    }

    const item = this.trayItems.splice(idx, 1)[0];
    if (!item) {
      return false;
    }
    if (targetPan === "left") {
      this.leftItems.push(item);
    } else {
      this.rightItems.push(item);
    }

    this.recordEvent("item_placed", {
      item_id: itemId,
      pan: targetPan,
    });

    this.recordEvent("balance_changed", {
      tilt_angle: this.getTiltAngle(),
      state: this.getBalanceState(),
    });

    if (this.checkWinCondition()) {
      this.winSession();
    }

    return true;
  }

  returnItemToTray(itemId: string, fromPan: "left" | "right"): boolean {
    const pan = fromPan === "left" ? this.leftItems : this.rightItems;
    const idx = pan.findIndex((t) => t.item_id === itemId);
    if (idx === -1) {
      return false;
    }

    const item = pan.splice(idx, 1)[0];
    if (!item) {
      return false;
    }
    this.trayItems.push(item);

    this.recordEvent("balance_changed", {
      tilt_angle: this.getTiltAngle(),
      state: this.getBalanceState(),
    });

    return true;
  }

  selectSide(side: "left" | "right"): void {
    this.selectedSide = side;
    if (this.checkWinCondition()) {
      this.winSession();
    }
  }

  getSelectedSide(): "left" | "right" | null {
    return this.selectedSide;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "place_item" || action.type === "return_item") {
      return ACTION_IGNORED;
    }
    if (action.type === "select_side") {
      if (action.data !== "left" && action.data !== "right") {
        return ACTION_RETRY;
      }
      const side = action.data;
      const leftW = this.getLeftWeight();
      const rightW = this.getRightWeight();
      const expected = leftW > rightW ? "left" : "right";
      return side === expected ? ACTION_CORRECT : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    const leftW = this.getLeftWeight();
    const rightW = this.getRightWeight();

    if (this.content.goal === "balance") {
      return leftW === rightW && leftW > 0;
    }
    if (this.content.goal === "pick_heavier") {
      if (!this.selectedSide) {
        return false;
      }
      return this.selectedSide === (leftW > rightW ? "left" : "right");
    }
    if (this.content.goal === "pick_lighter") {
      if (!this.selectedSide) {
        return false;
      }
      return this.selectedSide === (leftW < rightW ? "left" : "right");
    }
    return false;
  }

  override destroy(): void {
    super.destroy();
    this.leftItems = [];
    this.rightItems = [];
    this.trayItems = [];
    this.selectedSide = null;
  }

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("split-columns");
    this.slots = layoutFn({
      slotCount: this.trayItems.length,
      targetCount: 2,
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
    const sources = this.slots.filter((s) => s.role === "source");
    // `WeightedItem` chỉ mang id + khối lượng; asset nằm ở content.
    const assetById = new Map(
      [
        ...this.content.left_pan,
        ...this.content.right_pan,
        ...this.content.tray,
      ].map((i) => [i.item_id, i.asset])
    );
    const positioned = (items: readonly { item_id: string }[]) =>
      items.map((i) => ({ id: i.item_id, asset: assetById.get(i.item_id) }));

    const scaleBox = insetBox(sceneBox(rs), 0.12);
    const { leftPan, rightPan } = drawBalanceScale(
      ctx,
      scaleBox,
      this.leftItems,
      this.rightItems
    );
    drawPanItems(ctx, rs, leftPan, positioned(this.leftItems));
    drawPanItems(ctx, rs, rightPan, positioned(this.rightItems));

    this.trayItems.forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: assetById.get(item.item_id),
        label: String(item.weight),
        state: this.getRenderItemState(item.item_id),
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

export const GT014Session = BalanceScaleSession;
export default BalanceScaleSession;
