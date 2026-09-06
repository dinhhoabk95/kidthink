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
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  drawButterflyWingsBoard,
  drawEmptyTargetSlot,
  drawMirrorAxis,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
  sceneBox,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import { MirrorSystem } from "#src/systems/mirror-system";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT021Content, GT021Difficulty } from "./template.js";

function isPointInSlot(
  slot: Slot,
  x: number,
  y: number,
  tolerance = 24
): boolean {
  const hw = (slot.hitW ?? slot.w) / 2 + tolerance;
  const hh = (slot.hitH ?? slot.h) / 2 + tolerance;
  return Math.abs(x - slot.x) <= hw && Math.abs(y - slot.y) <= hh;
}

function findHitSourceOption(
  slots: readonly Slot[],
  options: readonly { item_id: string }[],
  x: number,
  y: number,
  tolerance = 24
): { option: { item_id: string }; index: number } | null {
  const sourceSlots = slots.filter((s) => s.role === "source");
  for (let i = 0; i < options.length; i++) {
    const slot = sourceSlots[i];
    const option = options[i];
    if (slot && option && isPointInSlot(slot, x, y, tolerance)) {
      return { option, index: i };
    }
  }
  return null;
}

function findHitTargetSlot(
  slots: readonly Slot[],
  targets: readonly { slot_id: string }[],
  x: number,
  y: number,
  tolerance = 24
): { target: { slot_id: string }; index: number } | null {
  const targetSlots = slots.filter((s) => s.role === "target");
  for (let i = 0; i < targets.length; i++) {
    const slot = targetSlots[i];
    const target = targets[i];
    if (slot && target && isPointInSlot(slot, x, y, tolerance)) {
      return { target, index: i };
    }
  }
  return null;
}

export class GT021Session extends TemplateGameSession<
  GT021Content,
  GT021Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  readonly mirrorSystem = new MirrorSystem();
  private readonly placementMechanic = new PlacementMechanic();
  neutralSlots: readonly Slot[] = [];
  private assetByRef: Map<string, GT021Content["options"][number]["asset"]> =
    new Map();

  protected override computeRoundDerived(): void {
    this.neutralSlots = this.slots.filter((s) => s.role === "neutral");
  }

  setupEntities(): void {
    this.isWon = false;
    this.placementMechanic.reset();
    this.assetByRef = new Map(
      this.content.options.map((o) => [o.asset_ref, o.asset])
    );

    const symmetricPairs = this.content.target_slots.map((t, idx) => ({
      referenceSlotId:
        this.content.reference_pattern[idx]?.slot_id ?? `ref-${idx}`,
      targetSlotId: t.slot_id,
      expectedAssetRef: t.expected_asset_ref,
    }));

    this.mirrorSystem.init(symmetricPairs);

    this.recordEvent("round_started", {
      round_index: 0,
      axis: this.content.axis,
      target_count: this.content.target_slots.length,
      option_count: this.content.options.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const data = action.data as
        | { item_id?: string; target_id?: string }
        | undefined;
      const itemId = data?.item_id;
      const targetId = data?.target_id;

      if (!(itemId && targetId)) {
        return ACTION_IGNORED;
      }

      const opt = this.content.options.find((o) => o.item_id === itemId);
      const target = this.content.target_slots.find(
        (t) => t.slot_id === targetId
      );

      if (!(opt && target)) {
        return ACTION_IGNORED;
      }

      return opt.asset_ref === target.expected_asset_ref
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  onPlaceOption(itemId: string, targetSlotId: string): ActionResult {
    const opt = this.content.options.find((o) => o.item_id === itemId);
    const target = this.content.target_slots.find(
      (t) => t.slot_id === targetSlotId
    );

    if (!(opt && target)) {
      return ACTION_IGNORED;
    }

    this.placementMechanic.place(itemId, targetSlotId);
    const isCorrect = this.mirrorSystem.place(targetSlotId, opt.asset_ref);

    this.recordEvent("item_placed", {
      item_id: itemId,
      target_slot_id: targetSlotId,
      asset_ref: opt.asset_ref,
      is_correct: isCorrect,
    });

    if (this.checkWinCondition()) {
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    return isCorrect ? ACTION_CORRECT : ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    return this.mirrorSystem.isComplete();
  }

  getStagedItemId(): string | null {
    return this.placementMechanic.getStagedItemId();
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.placementMechanic.getPlacements();
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const hitSource = findHitSourceOption(
      this.slots,
      this.content.options,
      gesture.fromX,
      gesture.fromY
    );
    if (!hitSource) {
      return null;
    }
    const hitTarget = findHitTargetSlot(
      this.slots,
      this.content.target_slots,
      gesture.toX,
      gesture.toY
    );
    if (!hitTarget) {
      return null;
    }
    return {
      type: "drop_item",
      data: {
        item_id: hitSource.option.item_id,
        target_id: hitTarget.target.slot_id,
      },
    };
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const hitTarget = findHitTargetSlot(
      this.slots,
      this.content.target_slots,
      gesture.x,
      gesture.y
    );
    if (hitTarget) {
      const stagedId = this.placementMechanic.getStagedItemId();
      if (stagedId) {
        return {
          type: "tap_tap_item",
          data: {
            item_id: stagedId,
            target_id: hitTarget.target.slot_id,
          },
        };
      }
      return null;
    }

    const hitSource = findHitSourceOption(
      this.slots,
      this.content.options,
      gesture.x,
      gesture.y
    );
    if (hitSource) {
      const stagedId = this.placementMechanic.getStagedItemId();
      if (stagedId === hitSource.option.item_id) {
        this.placementMechanic.stageItem(null);
      } else {
        this.placementMechanic.stageItem(hitSource.option.item_id);
      }
      return null;
    }

    this.placementMechanic.stageItem(null);
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture);
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const data = action.data as
        | { item_id?: string; target_id?: string }
        | undefined;
      const itemId = data?.item_id;
      const targetId = data?.target_id;
      if (itemId && targetId) {
        this.onPlaceOption(itemId, targetId);
        if (this.placementMechanic.getStagedItemId() === itemId) {
          this.placementMechanic.stageItem(null);
        }
      }
    }
  }

  override getView(): EngineView {
    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    const neutral = this.neutralSlots;
    const stagedId = this.placementMechanic.getStagedItemId();
    const entities: ViewEntity[] = [];

    neutral.forEach((slot, i) => {
      const ref = this.content.reference_pattern[i];
      if (ref) {
        entities.push({
          id: ref.slot_id,
          slotIndex: slot.index,
          role: "neutral",
          state: "idle",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
        });
      }
    });

    targets.forEach((slot, i) => {
      const target = this.content.target_slots[i];
      if (target) {
        const placedRef = this.mirrorSystem.getPlacement(target.slot_id);
        let state: EntityVisual = "idle";
        if (placedRef) {
          state =
            placedRef === target.expected_asset_ref ? "correct" : "incorrect";
        }
        entities.push({
          id: target.slot_id,
          slotIndex: slot.index,
          role: "target",
          state,
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
        });
      }
    });

    sources.forEach((slot, i) => {
      const opt = this.content.options[i];
      if (opt) {
        const isStaged = stagedId === opt.item_id;
        entities.push({
          id: opt.item_id,
          slotIndex: slot.index,
          role: "source",
          state: isStaged ? "selected" : "idle",
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

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("mirror-axis-split");
    return layoutFn({
      slotCount: this.content.options.length,
      targetCount: this.content.target_slots.length,
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
    drawSceneBackground(ctx, rs, this.themeId);
    drawPromptText(ctx, rs, this.content.prompt);
    drawButterflyWingsBoard(ctx, sceneBox(rs));
    drawMirrorAxis(ctx, rs, this.content.axis);
    drawWoodenTokenDock(ctx, rs);

    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    const neutral = this.neutralSlots;
    const assetByRef = this.assetByRef;

    // Mẫu tham chiếu nằm ở vùng neutral bên kia trục.
    this.content.reference_pattern.forEach((ref, i) => {
      const slot = neutral[i];
      if (!slot) {
        return;
      }
      drawSlotItem(
        ctx,
        rs,
        slot,
        { id: ref.slot_id, asset: ref.asset, state: "locked" },
        "square"
      );
    });

    this.content.target_slots.forEach((target, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const placedRef = this.mirrorSystem.getPlacement(target.slot_id);
      if (!placedRef) {
        drawEmptyTargetSlot(ctx, slot);
        return;
      }
      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: target.slot_id,
          asset: assetByRef.get(placedRef),
          state: placedRef === target.expected_asset_ref ? "correct" : "wrong",
        },
        "square"
      );
    });

    this.content.options.forEach((opt, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: opt.item_id,
        asset: opt.asset,
        state: this.getRenderItemState(opt.item_id),
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

export default GT021Session;
