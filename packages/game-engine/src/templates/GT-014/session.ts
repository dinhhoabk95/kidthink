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
  drawBalanceScale,
  drawPanItems,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  insetBox,
  sceneBox,
  updateParticles,
} from "#src/render/index.js";
import {
  type BalanceState,
  computeTiltAngle,
  getBalanceState,
  sumWeights,
  type WeightedItem,
} from "#src/systems/balance-system";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT014Content, GT014Difficulty } from "./template.js";

function validateSelectSide(
  data: unknown,
  goal: GT014Content["goal"],
  leftW: number,
  rightW: number
): ActionResult {
  if (data !== "left" && data !== "right") {
    return ACTION_RETRY;
  }
  let expected: "left" | "right";
  if (goal === "pick_lighter") {
    expected = leftW < rightW ? "left" : "right";
  } else {
    expected = leftW > rightW ? "left" : "right";
  }
  return data === expected ? ACTION_CORRECT : ACTION_RETRY;
}

function validatePlaceItem(data: unknown): ActionResult {
  if (
    typeof data === "object" &&
    data !== null &&
    "item_id" in data &&
    "target_pan" in data
  ) {
    const pan = Reflect.get(data, "target_pan");
    if (pan === "left" || pan === "right") {
      return ACTION_CORRECT;
    }
  }
  return ACTION_RETRY;
}

function extractPlaceItemData(
  data: unknown
): { itemId: string; pan: "left" | "right" } | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "item_id" in data &&
    "target_pan" in data
  ) {
    const itemId = Reflect.get(data, "item_id");
    const pan = Reflect.get(data, "target_pan");
    if (typeof itemId === "string" && (pan === "left" || pan === "right")) {
      return { itemId, pan };
    }
  }
  return null;
}

function extractReturnItemData(
  data: unknown
): { itemId: string; pan: "left" | "right" } | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "item_id" in data &&
    "from_pan" in data
  ) {
    const itemId = Reflect.get(data, "item_id");
    const pan = Reflect.get(data, "from_pan");
    if (typeof itemId === "string" && (pan === "left" || pan === "right")) {
      return { itemId, pan };
    }
  }
  return null;
}

function isPointInSlot(x: number, y: number, slot: Slot, minSize = 0): boolean {
  const halfW = Math.max(slot.hitW ?? slot.w, slot.w, minSize) / 2 + 24;
  const halfH = Math.max(slot.hitH ?? slot.h, slot.h, minSize) / 2 + 24;
  return Math.abs(x - slot.x) <= halfW && Math.abs(y - slot.y) <= halfH;
}

function findTrayItemAt(
  x: number,
  y: number,
  trayItems: readonly WeightedItem[],
  sources: readonly Slot[]
): WeightedItem | null {
  for (let i = 0; i < trayItems.length; i++) {
    const slot = sources[i];
    const item = trayItems[i];
    if (slot && item && isPointInSlot(x, y, slot)) {
      return item;
    }
  }
  return null;
}

function findTargetPanAt(
  x: number,
  y: number,
  leftPanSlot: Slot | undefined,
  rightPanSlot: Slot | undefined
): "left" | "right" | null {
  if (leftPanSlot && isPointInSlot(x, y, leftPanSlot, 80)) {
    return "left";
  }
  if (rightPanSlot && isPointInSlot(x, y, rightPanSlot, 80)) {
    return "right";
  }
  return null;
}

export class BalanceScaleSession extends TemplateGameSession<
  GT014Content,
  GT014Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private leftItems: WeightedItem[] = [];
  private rightItems: WeightedItem[] = [];
  private trayItems: WeightedItem[] = [];
  private selectedSide: "left" | "right" | null = null;
  private stagedItemId: string | null = null;

  setupEntities(): void {
    this.leftItems = [...this.content.left_pan];
    this.rightItems = [...this.content.right_pan];
    this.trayItems = [...this.content.tray];
    this.selectedSide = null;
    this.stagedItemId = null;
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

  getStagedItemId(): string | null {
    return this.stagedItemId;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "place_item") {
      return validatePlaceItem(action.data);
    }
    if (action.type === "return_item") {
      return ACTION_CORRECT;
    }
    if (action.type === "select_side") {
      return validateSelectSide(
        action.data,
        this.content.goal,
        this.getLeftWeight(),
        this.getRightWeight()
      );
    }
    return ACTION_IGNORED;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    leftPanSlot: Slot | undefined,
    rightPanSlot: Slot | undefined,
    sources: readonly Slot[]
  ): GameAction | null {
    const dragged = findTrayItemAt(
      gesture.fromX,
      gesture.fromY,
      this.trayItems,
      sources
    );
    if (!dragged) {
      return null;
    }
    const targetPan = findTargetPanAt(
      gesture.toX,
      gesture.toY,
      leftPanSlot,
      rightPanSlot
    );
    if (!targetPan) {
      return null;
    }
    return {
      type: "place_item",
      data: { item_id: dragged.item_id, target_pan: targetPan },
    };
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    leftPanSlot: Slot | undefined,
    rightPanSlot: Slot | undefined,
    sources: readonly Slot[]
  ): GameAction | null {
    if (
      this.content.goal === "pick_heavier" ||
      this.content.goal === "pick_lighter"
    ) {
      const side = findTargetPanAt(
        gesture.x,
        gesture.y,
        leftPanSlot,
        rightPanSlot
      );
      return side ? { type: "select_side", data: side } : null;
    }

    if (this.stagedItemId) {
      const targetPan = findTargetPanAt(
        gesture.x,
        gesture.y,
        leftPanSlot,
        rightPanSlot
      );
      if (targetPan) {
        return {
          type: "place_item",
          data: { item_id: this.stagedItemId, target_pan: targetPan },
        };
      }
    }

    const tappedItem = findTrayItemAt(
      gesture.x,
      gesture.y,
      this.trayItems,
      sources
    );
    if (tappedItem) {
      this.stagedItemId =
        this.stagedItemId === tappedItem.item_id ? null : tappedItem.item_id;
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    const targets = this.slots
      .filter((s) => s.role === "target")
      .slice()
      .sort((a, b) => a.x - b.x);
    const sources = this.slots.filter((s) => s.role === "source");
    const leftPanSlot = targets[0];
    const rightPanSlot = targets[1];

    if (gesture.type === "drop") {
      return this.toDropAction(gesture, leftPanSlot, rightPanSlot, sources);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, leftPanSlot, rightPanSlot, sources);
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "place_item") {
      const place = extractPlaceItemData(action.data);
      if (place) {
        this.placeItem(place.itemId, place.pan);
        this.stagedItemId = null;
      }
      return;
    }
    if (action.type === "select_side") {
      if (action.data === "left" || action.data === "right") {
        this.selectSide(action.data);
      }
      return;
    }
    if (action.type === "return_item") {
      const ret = extractReturnItemData(action.data);
      if (ret) {
        this.returnItemToTray(ret.itemId, ret.pan);
      }
    }
  }

  override getView(): EngineView {
    const targets = this.slots
      .filter((s) => s.role === "target")
      .slice()
      .sort((a, b) => a.x - b.x);
    const sources = this.slots.filter((s) => s.role === "source");
    const entities: ViewEntity[] = [];

    const leftPanSlot = targets[0];
    if (leftPanSlot) {
      entities.push({
        id: "left_pan",
        slotIndex: 0,
        role: "target",
        state: this.selectedSide === "left" ? "selected" : "idle",
        x: leftPanSlot.x,
        y: leftPanSlot.y,
        w: leftPanSlot.w,
        h: leftPanSlot.h,
      });
    }

    const rightPanSlot = targets[1];
    if (rightPanSlot) {
      entities.push({
        id: "right_pan",
        slotIndex: 1,
        role: "target",
        state: this.selectedSide === "right" ? "selected" : "idle",
        x: rightPanSlot.x,
        y: rightPanSlot.y,
        w: rightPanSlot.w,
        h: rightPanSlot.h,
      });
    }

    this.trayItems.forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      entities.push({
        id: item.item_id,
        slotIndex: 2 + i,
        role: "source",
        state: this.stagedItemId === item.item_id ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
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

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("split-columns");
    return layoutFn({
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
