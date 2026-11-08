import {
  formatNumberWord,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
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
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { coinDiameter, coinTierOf } from "#src/layout/coin-tiers";
import { resolveTouchFloor } from "#src/layout/constants";
import {
  findHitSlotIndex,
  isPointInSlot,
  TAP_TOLERANCE_PX,
} from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize, splitCaption } from "#src/layout/slot-fit";
import {
  computeStageTargetSlot,
  computeTraySourceSlots,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawMarketStall,
  drawMontessoriCoin,
  drawPiggyBank,
  drawProgressDots,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
  marketStallGeometry,
  piggyBounceScale,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  type GT031Content,
  type GT031Difficulty,
  pickCoinHint,
} from "./template";

/** Cạnh lớn nhất của thẻ giá / lợn đất giữa sân khấu. */
const PAYMENT_TARGET_MAX_PX = 160;
/** Nháy hổ phách ở ô tổng sau một lần trả sai (ms). */
const WRONG_PAY_MS = 1200;
/** Bỏ/gỡ xu: hợp lệ nhưng không báo đúng sai — chốt mới là lúc chấm. */
const QUIET_OK: ActionResult = Object.freeze({
  valid: true,
  feedback: "none",
});
const RE_DIGITS = /^[0-9]+$/;
/** Đệm hai bên thẻ giá trong sân khấu. */
const PAYMENT_TARGET_PAD_PX = 32;

/** Số chấm tối đa của hàng tiến độ. */
const MONEY_PROGRESS_MAX_DOTS = 12;

interface GT031ActionPayload {
  readonly coin_id?: string;
  readonly id?: string;
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E031-08`, `BR-FBK-16`). */
export const GT031_STORY_LINE =
  "Heo Đất đi chợ quê, bé gom xu bỏ vào bụng Heo cho đủ tiền mua nhé, gom xong thì bấm trả!";

/** Mascot động viên ngắn sau lần trả chưa đủ (`BR-E031-08`). */
export const GT031_ENCOURAGE_MS = 1500;

export class GT031Session extends TemplateGameSession<
  GT031Content,
  GT031Difficulty
> {
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.coins.length;
  }

  /** Giá xu / tên màu vẽ dưới thân vật: khay chừa dải nhãn (`BR-PSZ-13`). */
  override get trayHasLabels(): boolean {
    return true;
  }
  override readonly usesPromptZone = true;
  /** Trẻ tự bấm "trả tiền" để chốt; gom đủ tổng không tự thắng (`BR-E031-05`). */
  override readonly needsCommit = true;

  degradation: DegradationState | null = null;
  depositedCoinIds: string[] = [];
  currentTotal = 0;
  isWin = false;

  private particles: Particle[] = [];
  private lastFrameMs = 0;
  /** Đồng hồ khung lúc xu gần nhất rơi vào heo, cho nhịp nảy (`BR-E031-12`). */
  private lastDepositMs = Number.NEGATIVE_INFINITY;
  private wrongPayUntilMs = 0;
  private encourageRemainingMs = 0;
  /** Sàn chạm của band vòng này, để đo cỡ xu nhỏ nhất (`BR-E031-11`). */
  private coinTouchFloor = 0;

  override storyLine(): string {
    return GT031_STORY_LINE;
  }

  /**
   * Chỉ động viên sau lần trả chưa đủ. Bỏ hay gỡ xu không đổi dáng: dáng mascot
   * theo tổng tiền là báo đúng sai trước khi trẻ chốt (`BR-E031-05`).
   */
  override mascotMood(): MascotPose | null {
    return this.encourageRemainingMs > 0 && !this.isWon ? "encourage" : null;
  }

  /** Nút trả tiền sáng khi lợn đã có ít nhất một xu. */
  override canCommit(): boolean {
    return this.depositedCoinIds.length > 0;
  }

  update(deltaMs: number): void {
    if (this.encourageRemainingMs > 0) {
      this.encourageRemainingMs = Math.max(
        0,
        this.encourageRemainingMs - deltaMs
      );
    }
    this.lastFrameMs += deltaMs;
    if (this.wrongPayUntilMs > 0 && this.lastFrameMs >= this.wrongPayUntilMs) {
      this.wrongPayUntilMs = 0;
    }
  }

  setupEntities(): void {
    this.lastDepositMs = Number.NEGATIVE_INFINITY;
    this.wrongPayUntilMs = 0;
    this.encourageRemainingMs = 0;
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
    const hint = pickCoinHint(
      this.content.coins,
      this.depositedCoinIds,
      this.content.target_amount
    );
    // Vượt đích mà hint không chỉ xu nào: gỡ xu nạp gần nhất (`BR-E031-05`).
    const coinId =
      hint?.coin_id ??
      (this.currentTotal > this.content.target_amount
        ? this.depositedCoinIds.at(-1)
        : undefined);
    if (!coinId) {
      return null;
    }
    const coinIdx = this.content.coins.findIndex((c) => c.coin_id === coinId);
    const slot = this.sourceSlots[coinIdx];
    return slot ? slot.index : null;
  }

  /** Bước đúng là kéo xu gợi ý vào thẻ giá (slot đích luôn là slot 0). */
  override getHintDestinationIndex(): number | null {
    const index = this.getHintTargetIndex();
    const coinId =
      this.content.coins[
        this.sourceSlots.findIndex((slot) => slot.index === index)
      ]?.coin_id;
    // Gỡ xu ra chỉ là một cú chạm, không có đích để kéo tới.
    if (index === null || !coinId || this.depositedCoinIds.includes(coinId)) {
      return null;
    }
    return this.slots[0] ? 0 : null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    this.coinTouchFloor = resolveTouchFloor(band, this.cssPerLogic);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = this.coinTouchFloor;
      // Dải đầu sân khấu dành cho hàng chấm tiến độ; thẻ giá nằm ở phần thân.
      const { body } = splitCaption(zones.stage);
      const size = Math.max(
        touchFloor,
        Math.floor(
          Math.min(
            PAYMENT_TARGET_MAX_PX,
            body.w - PAYMENT_TARGET_PAD_PX,
            body.h - PAYMENT_TARGET_PAD_PX
          )
        )
      );
      const target = computeStageTargetSlot(body, size, touchFloor, 0);
      const coins = computeTraySourceSlots(
        this.content.coins.length,
        zones.tray,
        touchFloor,
        1,
        true
      );
      return insetDrawSize([target, ...coins], zones.stage);
    }
    const layoutFn = resolveLayout("multi-bucket-bottom");
    const laidOut = layoutFn({
      slotCount: this.content.coins.length,
      ageBand: band,
      targetCount: 1,
      logic: this.logicSpace,
    });
    // Session đọc slot 0 là thẻ giá, 1.. là xu; layout cũ để thẻ giá ở cuối.
    const target = laidOut.filter((slot) => slot.role === "target");
    const coins = laidOut.filter((slot) => slot.role !== "target");
    return [...target, ...coins].map((slot, index) => ({ ...slot, index }));
  }

  private validateDepositAction(coinId: string): ActionResult {
    const coin = this.content.coins.find((c) => c.coin_id === coinId);
    if (!coin) {
      return ACTION_IGNORED;
    }

    if (this.depositedCoinIds.includes(coinId)) {
      return ACTION_IGNORED;
    }

    // Vượt đích không bị chặn: báo đúng/sai chỉ khi trẻ bấm trả (`BR-E031-05`).
    return QUIET_OK;
  }

  private isPaymentEnough(): boolean {
    return this.difficulty.exact_change
      ? this.currentTotal === this.content.target_amount
      : this.currentTotal >= this.content.target_amount;
  }

  private validatePayAction(): ActionResult {
    if (!this.canCommit()) {
      return ACTION_IGNORED;
    }
    return this.isPaymentEnough() ? ACTION_CORRECT : ACTION_RETRY;
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

    return QUIET_OK;
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

    if (type === "pay") {
      return this.validatePayAction();
    }

    return ACTION_IGNORED;
  }

  private commitDepositCoin(coinId: string): void {
    const coin = this.content.coins.find((c) => c.coin_id === coinId);
    if (!coin || this.depositedCoinIds.includes(coinId)) {
      return;
    }

    this.depositedCoinIds.push(coinId);
    this.lastDepositMs = this.lastFrameMs;
    this.currentTotal += coin.value;
    this.queueSfx("coin_clink");

    this.recordEvent("coin_placed", {
      coin_id: coin.coin_id,
      value: coin.value,
      current_total: this.currentTotal,
      target_amount: this.content.target_amount,
    });
  }

  private commitPay(): void {
    if (!(this.canCommit() && this.isPaymentEnough())) {
      this.wrongPayUntilMs = this.lastFrameMs + WRONG_PAY_MS;
      this.encourageRemainingMs = GT031_ENCOURAGE_MS;
      this.recordEvent("payment_wrong", {
        current_total: this.currentTotal,
        target_amount: this.content.target_amount,
      });
      return;
    }
    this.isWin = true;
    this.isWon = true;
    const targetSlot = this.slots[0];
    if (targetSlot) {
      this.particles.push(...spawnParticlesAtSlot(targetSlot, 16));
    }
    this.recordEvent("game_completed", { score: 100 });
    this.winSession();
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
      return;
    }

    if (type === "pay") {
      this.commitPay();
    }
  }

  /** Kéo xu từ khay thả vào thẻ giá, hoặc kéo xu đã nộp ra ngoài (`BR-ENG-06`). */
  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const target = this.slots[0];
    if (!target) {
      return null;
    }

    // Kéo xu đã nộp từ khay/thẻ giá ra ngoài để rút lại
    const depositedIndex = this.content.coins.findIndex((coin, i) => {
      const slot = this.slots[1 + i];
      return (
        slot !== undefined &&
        this.depositedCoinIds.includes(coin.coin_id) &&
        this.isOnSlot(slot, gesture.fromX, gesture.fromY)
      );
    });
    if (depositedIndex >= 0) {
      const coin = this.content.coins[depositedIndex];
      if (coin) {
        return { type: "remove_coin", data: { coin_id: coin.coin_id } };
      }
    }

    // Kéo từ thẻ giá ra ngoài: rút đồng xu nộp gần nhất
    if (
      this.isOnSlot(target, gesture.fromX, gesture.fromY) &&
      !this.isOnSlot(target, gesture.toX, gesture.toY)
    ) {
      const lastDepositedId = this.depositedCoinIds.at(-1);
      if (lastDepositedId) {
        return { type: "remove_coin", data: { coin_id: lastDepositedId } };
      }
    }

    // Kéo xu chưa nộp thả vào thẻ giá để nộp
    if (this.isOnSlot(target, gesture.toX, gesture.toY)) {
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

    return null;
  }

  private isOnSlot(slot: Slot, x: number, y: number): boolean {
    return isPointInSlot(slot, x, y, "square", TAP_TOLERANCE_PX);
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "commit") {
      // Nút trả tiền đang mờ thì nuốt cử chỉ, không tính một lần sai.
      return this.canCommit() ? { type: "pay", data: {} } : null;
    }
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    if (gesture.type !== "tap") {
      return null;
    }

    const coinSlots = this.slots.slice(1, 1 + this.content.coins.length);
    const index = findHitSlotIndex(
      coinSlots,
      gesture.x,
      gesture.y,
      "circle",
      TAP_TOLERANCE_PX
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

  private buildPaymentTargetEntity(): ViewEntity | null {
    const targetSlot = this.slots[0];
    if (!targetSlot) {
      return null;
    }
    let state: EntityVisual = "idle";
    if (this.isWin) {
      state = "correct";
    } else if (this.wrongPayUntilMs > 0) {
      state = "incorrect";
    }
    const itemToBuy = this.content.item_to_buy;
    const targetAsset = itemToBuy?.asset ?? {
      kind: "emoji" as const,
      ref: "🪙",
    };
    const targetLabels = resolveAssetLabels(targetAsset);
    const targetAmountWord = formatNumberWord(this.content.target_amount);
    const targetSpoken = itemToBuy?.label
      ? formatSpokenLabel(`${itemToBuy.label} ${targetAmountWord} đồng`)
      : formatSpokenLabel(`cần trả ${targetAmountWord} đồng`);
    const targetId = this.content.coins.some(
      (c) => c.coin_id === "payment_target"
    )
      ? "target:payment_target"
      : "payment_target";
    return {
      id: targetId,
      slotIndex: 0,
      role: "target",
      state,
      x: targetSlot.x,
      y: targetSlot.y,
      w: targetSlot.w,
      h: targetSlot.h,
      hitShape: "square",
      glyph: targetLabels.glyph,
      label: String(this.content.target_amount),
      spokenLabel: targetSpoken ?? targetLabels.spokenLabel,
      spokenAudioPath: targetLabels.spokenAudioPath,
    };
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];

    const targetEntity = this.buildPaymentTargetEntity();
    if (targetEntity) {
      entities.push(targetEntity);
    }

    for (let i = 0; i < this.content.coins.length; i++) {
      const coin = this.content.coins[i];
      const slot = this.slots[1 + i];
      if (!(coin && slot)) {
        continue;
      }
      const isDeposited = this.depositedCoinIds.includes(coin.coin_id);
      const coinLabels = resolveAssetLabels(coin.asset);
      const coinSpoken =
        formatSpokenLabel(`${formatNumberWord(coin.value)} đồng`) ??
        coinLabels.spokenLabel;
      entities.push({
        id: coin.coin_id,
        slotIndex: 1 + i,
        role: "source",
        state: isDeposited ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "circle",
        glyph: coinLabels.glyph,
        label: String(coin.value),
        spokenLabel: coinSpoken,
        spokenAudioPath: coinLabels.spokenAudioPath,
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

    const targetPrice =
      (this.content as { target_price?: number }).target_price ??
      this.content.target_amount;
    const itemToBuy = this.content.item_to_buy;

    this.renderMarket(ctx, rs, targetSlot);

    let state: ItemVisualState = "idle";
    if (this.isWin) {
      state = "correct";
    } else if (this.wrongPayUntilMs > 0) {
      state = "wrong";
    }

    let displayAsset = itemToBuy?.asset ?? {
      kind: "emoji" as const,
      ref: "🪙",
    };
    if (displayAsset.kind === "emoji" && RE_DIGITS.test(displayAsset.ref)) {
      displayAsset = { kind: "emoji" as const, ref: "🎁" };
    } else if (
      displayAsset.kind === "text" &&
      RE_DIGITS.test(displayAsset.text)
    ) {
      displayAsset = { kind: "emoji" as const, ref: "🎁" };
    }

    drawSlotItem(
      ctx,
      rs,
      targetSlot,
      {
        id: "payment_target",
        asset: displayAsset,
        // Thẻ giá chỉ có chữ số; tên món chỉ đọc thành tiếng (`BR-E031-07`).
        label: String(targetPrice),
        state,
      },
      "square"
    );

    // Tiến độ là hàng chấm xu lấp dần ở dải đầu sân khấu, không chữ (`BR-E031-07`).
    drawProgressDots(
      ctx,
      rs,
      this.moneyProgress(targetPrice),
      this.stageRect ? splitCaption(this.stageRect).caption : undefined
    );
  }

  /**
   * Quầy chợ (mái sọc, quầy gỗ) quanh thẻ giá và heo đất cạnh bên; heo nảy khi
   * có xu rơi vào (`BR-E031-12`). Chỉ vẽ trong thân sân khấu, ngoài vùng chạm.
   */
  private renderMarket(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    targetSlot: Slot
  ): void {
    const stage = pickTrayZones(this.stageRect, this.trayRect)?.stage;
    if (!stage) {
      return;
    }
    const geometry = marketStallGeometry(targetSlot, splitCaption(stage).body);
    drawMarketStall(ctx, geometry);
    if (geometry.piggy) {
      drawPiggyBank(
        ctx,
        geometry.piggy.cx,
        geometry.piggy.cy,
        geometry.piggy.size,
        piggyBounceScale(
          this.lastFrameMs - this.lastDepositMs,
          rs.reducedMotion
        )
      );
    }
  }

  /** Mỗi chấm một đồng khi giá nhỏ; giá lớn hơn số chấm tối đa thì chia tỉ lệ. */
  private moneyProgress(targetPrice: number): {
    done: number;
    total: number;
  } {
    const total = Math.min(MONEY_PROGRESS_MAX_DOTS, Math.max(1, targetPrice));
    const done = Math.min(
      total,
      Math.floor((this.currentTotal / Math.max(1, targetPrice)) * total)
    );
    return { done, total };
  }

  private renderCoins(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    drawWoodenTokenDock(
      ctx,
      rs,
      pickTrayZones(this.stageRect, this.trayRect)?.tray
    );

    const values = this.content.coins.map((c) => c.value);
    for (let i = 0; i < this.content.coins.length; i++) {
      const coin = this.content.coins[i];
      const slot = this.slots[1 + i];
      if (!(coin && slot)) {
        continue;
      }

      const isDeposited = this.depositedCoinIds.includes(coin.coin_id);
      const tier = coinTierOf(values, coin.value);
      // Cạnh ngắn của ô chạm: đường tròn không bao giờ lọt ra ngoài ô.
      const hit = Math.min(slot.hitW, slot.hitH);
      drawMontessoriCoin(ctx, slot, coin.value, isDeposited, {
        diameter: coinDiameter(tier.rank, tier.count, hit, this.coinTouchFloor),
        rank: tier.rank,
      });
    }
  }

  private drawLegacySubPrompt(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    drawProgressDots(ctx, rs, this.moneyProgress(this.content.target_amount));
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (!zones) {
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
