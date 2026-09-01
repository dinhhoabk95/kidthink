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
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import type { DegradationState } from "#src/systems/degradation";
import { MirrorSystem } from "#src/systems/mirror-system";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawEmptyTargetSlot,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
  sceneBox,
  updateParticles,
} from "../shared-render.js";
import {
  drawButterflyWingsBoard,
  drawMirrorAxis,
} from "../shared-render-shapes.js";
import type { GT021Content, GT021Difficulty } from "./template.js";

export class GT021Session extends TemplateGameSession<
  GT021Content,
  GT021Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  readonly mirrorSystem = new MirrorSystem();
  private readonly placementMechanic = new PlacementMechanic();

  setupEntities(): void {
    this.isWon = false;
    this.placementMechanic.reset();

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

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("mirror-axis-split");
    this.slots = layoutFn({
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
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    drawButterflyWingsBoard(ctx, sceneBox(rs));
    drawMirrorAxis(ctx, rs, this.content.axis);
    drawWoodenTokenDock(ctx, rs);

    const targets = this.slots.filter((s) => s.role === "target");
    const sources = this.slots.filter((s) => s.role === "source");
    const neutral = this.slots.filter((s) => s.role === "neutral");
    const assetByRef = new Map(
      this.content.options.map((o) => [o.asset_ref, o.asset])
    );

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
