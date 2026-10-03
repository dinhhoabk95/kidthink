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
import { resolveTouchFloor } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize } from "#src/layout/slot-fit";
import {
  computeStageTargetSlot,
  computeTraySourceSlots,
  findNearestHitSlot,
  pickTrayZones,
} from "#src/layout/tray-layout";
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
import type { GT031Content, GT031Difficulty } from "./template.js";

/** Cạnh lớn nhất của thẻ giá / lợn đất giữa sân khấu. */
const PAYMENT_TARGET_MAX_PX = 160;
/** Đệm hai bên thẻ giá trong sân khấu. */
const PAYMENT_TARGET_PAD_PX = 32;

const DROP_HIT_TOLERANCE_PX = 24;

interface GT031ActionPayload {
  readonly coin_id?: string;
  readonly id?: string;
}

export class GT031Session extends TemplateGameSession<
  GT031Content,
  GT031Difficulty
> {
  override readonly needsTray = true;
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;
  depositedCoinIds: string[] = [];
  currentTotal = 0;
  isWin = false;

  private particles: Particle[] = [];

  setupEntities(): void {
    this.depositedCoinIds = [];
    this.currentTotal = 0;
    this.isWin = false;
    this.particles = [];
    this.recordEvent("game_started", {
      template_code: "GT-031",
      target_amount: this.content.target_amount,
      coin_count: this.content.coins.length,
    });
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const remaining = this.content.target_amount - this.currentTotal;
    if (remaining <= 0) {
      return null;
    }
    const suitableCoinIdx = this.content.coins.findIndex(
      (c) => !this.depositedCoinIds.includes(c.coin_id) && c.value <= remaining
    );
    if (suitableCoinIdx >= 0) {
      const slot = this.sourceSlots[suitableCoinIdx];
      return slot ? slot.index : null;
    }
    return null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(band, this.cssPerLogic);
      const size = Math.max(
        touchFloor,
        Math.floor(
          Math.min(
            PAYMENT_TARGET_MAX_PX,
            zones.stage.w - PAYMENT_TARGET_PAD_PX,
            zones.stage.h - PAYMENT_TARGET_PAD_PX
          )
        )
      );
      const target = computeStageTargetSlot(zones.stage, size, touchFloor, 0);
      const coins = computeTraySourceSlots(
        this.content.coins.length,
        zones.tray,
        touchFloor,
        1
      );
      return insetDrawSize([target, ...coins], zones.stage);
    }
    const layoutFn = resolveLayout("multi-bucket-bottom");
    return layoutFn({
      slotCount: this.content.coins.length,
      ageBand: band,
      targetCount: 1,
      logic: this.logicSpace,
    });
  }

  private validateDepositAction(coinId: string): ActionResult {
    const coin = this.content.coins.find((c) => c.coin_id === coinId);
    if (!coin) {
      return ACTION_IGNORED;
    }

    if (this.depositedCoinIds.includes(coinId)) {
      return ACTION_IGNORED;
    }

    if (this.currentTotal + coin.value > this.content.target_amount) {
      return ACTION_RETRY;
    }

    return ACTION_CORRECT;
  }

  private validateRemoveAction(coinId?: string): ActionResult {
    if (this.depositedCoinIds.length === 0) {
      return ACTION_IGNORED;
    }

    const targetId = coinId ?? this.depositedCoinIds.at(-1);
    if (!targetId) {
      return ACTION_IGNORED;
    }

    if (!this.depositedCoinIds.includes(targetId)) {
      return ACTION_IGNORED;
    }

    return ACTION_CORRECT;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT031ActionPayload;

    if (
      type === "deposit_coin" ||
      type === "place_coin" ||
      type === "tap_coin" ||
      type === "select_coin" ||
      type === "drag_coin"
    ) {
      const coinId = data.coin_id ?? data.id ?? "";
      return this.validateDepositAction(coinId);
    }

    if (
      type === "remove_coin" ||
      type === "undo_coin" ||
      type === "withdraw_coin"
    ) {
      const coinId = data.coin_id ?? data.id;
      return this.validateRemoveAction(coinId);
    }

    return ACTION_IGNORED;
  }

  private commitDepositCoin(coinId: string): void {
    const coin = this.content.coins.find((c) => c.coin_id === coinId);
    if (!coin || this.depositedCoinIds.includes(coinId)) {
      return;
    }

    this.depositedCoinIds.push(coinId);
    this.currentTotal += coin.value;

    this.recordEvent("coin_placed", {
      coin_id: coin.coin_id,
      value: coin.value,
      current_total: this.currentTotal,
      target_amount: this.content.target_amount,
    });

    if (this.currentTotal === this.content.target_amount) {
      this.isWin = true;
      this.isWon = true;
      const targetSlot = this.slots[0];
      if (targetSlot) {
        this.particles.push(...spawnParticlesAtSlot(targetSlot, 16));
      }
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
    }
  }

  private commitRemoveCoin(coinId?: string): void {
    if (this.depositedCoinIds.length === 0) {
      return;
    }

    const targetId = coinId ?? this.depositedCoinIds.at(-1);
    if (!targetId) {
      return;
    }

    const coinIndex = this.depositedCoinIds.indexOf(targetId);
    if (coinIndex === -1) {
      return;
    }

    const coin = this.content.coins.find((c) => c.coin_id === targetId);
    if (!coin) {
      return;
    }

    this.depositedCoinIds.splice(coinIndex, 1);
    this.currentTotal -= coin.value;
    this.isWin = false;

    this.recordEvent("coin_removed", {
      coin_id: coin.coin_id,
      value: coin.value,
      current_total: this.currentTotal,
      target_amount: this.content.target_amount,
    });
  }

  override commit(action: GameAction): void {
    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT031ActionPayload;

    if (
      type === "deposit_coin" ||
      type === "place_coin" ||
      type === "tap_coin" ||
      type === "select_coin" ||
      type === "drag_coin"
    ) {
      const coinId = data.coin_id ?? data.id ?? "";
      this.commitDepositCoin(coinId);
      return;
    }

    if (
      type === "remove_coin" ||
      type === "undo_coin" ||
      type === "withdraw_coin"
    ) {
      const coinId = data.coin_id ?? data.id;
      this.commitRemoveCoin(coinId);
    }
  }

  /** Kéo xu từ khay thả vào thẻ giá (`BR-ENG-06`). */
  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const target = this.slots[0];
    if (!(target && this.isOnSlot(target, gesture.toX, gesture.toY))) {
      return null;
    }
    const index = this.content.coins.findIndex((coin, i) => {
      const slot = this.slots[1 + i];
      return (
        slot !== undefined &&
        !this.depositedCoinIds.includes(coin.coin_id) &&
        this.isOnSlot(slot, gesture.fromX, gesture.fromY)
      );
    });
    const coin = this.content.coins[index];
    return coin
      ? { type: "deposit_coin", data: { coin_id: coin.coin_id } }
      : null;
  }

  private isOnSlot(slot: Slot, x: number, y: number): boolean {
    const hw = (slot.hitW ?? slot.w) / 2 + DROP_HIT_TOLERANCE_PX;
    const hh = (slot.hitH ?? slot.h) / 2 + DROP_HIT_TOLERANCE_PX;
    return Math.abs(x - slot.x) <= hw && Math.abs(y - slot.y) <= hh;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    if (gesture.type !== "tap") {
      return null;
    }

    const coinSlots = this.slots.slice(1, 1 + this.content.coins.length);
    const index = findNearestHitSlot(
      coinSlots,
      gesture.x,
      gesture.y,
      DROP_HIT_TOLERANCE_PX
    );
    const coin = this.content.coins[index];
    if (!coin) {
      return null;
    }
    if (this.depositedCoinIds.includes(coin.coin_id)) {
      return { type: "remove_coin", data: { coin_id: coin.coin_id } };
    }
    return { type: "deposit_coin", data: { coin_id: coin.coin_id } };
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];

    const targetSlot = this.slots[0];
    if (targetSlot) {
      let state: EntityVisual = "idle";
      if (this.currentTotal === this.content.target_amount) {
        state = "correct";
      } else if (this.currentTotal > this.content.target_amount) {
        state = "incorrect";
      }
      entities.push({
        id: "payment_target",
        slotIndex: 0,
        role: "target",
        state,
        x: targetSlot.x,
        y: targetSlot.y,
        w: targetSlot.w,
        h: targetSlot.h,
      });
    }

    for (let i = 0; i < this.content.coins.length; i++) {
      const coin = this.content.coins[i];
      const slot = this.slots[1 + i];
      if (!(coin && slot)) {
        continue;
      }
      const isDeposited = this.depositedCoinIds.includes(coin.coin_id);
      entities.push({
        id: coin.coin_id,
        slotIndex: 1 + i,
        role: "source",
        state: isDeposited ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  getCurrentTotal(): number {
    return this.currentTotal;
  }

  getDepositedCoinIds(): readonly string[] {
    return this.depositedCoinIds;
  }

  private renderTargetArea(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const targetSlot = this.slots[0];
    if (!targetSlot) {
      return;
    }

    const itemToBuy = this.content.item_to_buy;
    let label = `Cần trả: ${this.content.target_amount}đ`;
    if (itemToBuy) {
      label = `${itemToBuy.label} (${this.content.target_amount}đ)`;
    }

    let state: ItemVisualState = "idle";
    if (this.currentTotal === this.content.target_amount) {
      state = "correct";
    } else if (this.currentTotal > this.content.target_amount) {
      state = "wrong";
    }

    drawSlotItem(
      ctx,
      rs,
      targetSlot,
      {
        id: "payment_target",
        asset: itemToBuy?.asset ?? { kind: "emoji", ref: "🪙" },
        label,
        state,
      },
      "square"
    );
  }

  private renderCoins(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    drawWoodenTokenDock(
      ctx,
      rs,
      pickTrayZones(this.stageRect, this.trayRect)?.tray
    );

    for (let i = 0; i < this.content.coins.length; i++) {
      const coin = this.content.coins[i];
      const slot = this.slots[1 + i];
      if (!(coin && slot)) {
        continue;
      }

      const isDeposited = this.depositedCoinIds.includes(coin.coin_id);
      let state: ItemVisualState = "idle";
      if (isDeposited) {
        state = "selected";
      }

      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: coin.coin_id,
          asset: coin.asset,
          label: `${coin.value}đ`,
          state,
        },
        "circle"
      );
    }
  }

  private drawLegacySubPrompt(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const subPrompt =
      this.currentTotal === this.content.target_amount
        ? `Chính xác! Đã trả đủ ${this.content.target_amount} đồng.`
        : `Đã trả: ${this.currentTotal}/${this.content.target_amount} đồng`;
    drawSubPromptText(ctx, rs, subPrompt);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (!zones) {
      drawPromptText(ctx, rs, this.content.prompt);
      this.drawLegacySubPrompt(ctx, rs);
    }

    this.renderTargetArea(ctx, rs);
    this.renderCoins(ctx, rs);

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
