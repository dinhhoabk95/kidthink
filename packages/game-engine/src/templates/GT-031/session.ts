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
import type { GT031Content, GT031Difficulty } from "./template.js";

export class GT031Session extends TemplateGameSession<
  GT031Content,
  GT031Difficulty
> {
  slots: Slot[] = [];
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
    this.resolveSlots("5-6");
    this.recordEvent("game_started", {
      template_code: "GT-031",
      target_amount: this.content.target_amount,
      coin_count: this.content.coins.length,
    });
  }

  resolveSlots(band: AgeBand): void {
    const layoutFn = resolveLayout("multi-bucket-bottom");
    this.slots = layoutFn({
      slotCount: this.content.coins.length,
      ageBand: band,
      targetCount: 1,
    });
  }

  private handleDepositCoin(coinId: string): ActionResult {
    const coin = this.content.coins.find((c) => c.coin_id === coinId);
    if (!coin) {
      return ACTION_IGNORED;
    }

    if (this.depositedCoinIds.includes(coinId)) {
      return ACTION_IGNORED;
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
      const targetSlot = this.slots[0];
      if (targetSlot) {
        this.particles.push(...spawnParticlesAtSlot(targetSlot, 16));
      }
      return ACTION_CORRECT;
    }

    if (this.currentTotal > this.content.target_amount) {
      return ACTION_RETRY;
    }

    return ACTION_CORRECT;
  }

  private handleRemoveCoin(coinId?: string): ActionResult {
    if (this.depositedCoinIds.length === 0) {
      return ACTION_IGNORED;
    }

    const targetId = coinId ?? this.depositedCoinIds.at(-1);
    if (!targetId) {
      return ACTION_IGNORED;
    }

    const coinIndex = this.depositedCoinIds.indexOf(targetId);
    if (coinIndex === -1) {
      return ACTION_IGNORED;
    }

    const coin = this.content.coins.find((c) => c.coin_id === targetId);
    if (!coin) {
      return ACTION_IGNORED;
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

    return ACTION_CORRECT;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (action.data as Record<string, unknown>) ?? {};

    if (
      type === "deposit_coin" ||
      type === "place_coin" ||
      type === "tap_coin" ||
      type === "select_coin" ||
      type === "drag_coin"
    ) {
      const coinId = (data.coin_id as string) || (data.id as string) || "";
      return this.handleDepositCoin(coinId);
    }

    if (
      type === "remove_coin" ||
      type === "undo_coin" ||
      type === "withdraw_coin"
    ) {
      const coinId = (data.coin_id as string) || (data.id as string);
      return this.handleRemoveCoin(coinId);
    }

    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    return this.isWin;
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
    drawWoodenTokenDock(ctx, rs);

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

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);

    const subPrompt =
      this.currentTotal === this.content.target_amount
        ? `Chính xác! Đã trả đủ ${this.content.target_amount} đồng.`
        : `Đã trả: ${this.currentTotal}/${this.content.target_amount} đồng`;
    drawSubPromptText(ctx, rs, subPrompt);

    this.renderTargetArea(ctx, rs);
    this.renderCoins(ctx, rs);

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
